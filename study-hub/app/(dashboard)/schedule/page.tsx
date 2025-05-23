"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, CheckCircle2, Clock, Plus } from "lucide-react"
import { format, addDays, isSameDay, subDays, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type StudySession = {
  id: string
  date: Date
  subject: string
  duration: number
  focusArea: string
  completed: boolean
}

type ExamDate = {
  course_name: string
  exam_date: string
}

type CategoryPerformance = {
  category: string
  course_name: string
  total: number
  incorrect: number
  percentage: number
}

type QuestionWithCourse = {
  category: string
  done: boolean | null
  course: {
    course: string
  }
}

type StudyRecommendation = {
  course_name: string
  exam_date: string
  categories: {
    name: string
    performance: number
    recommendedMinutes: number
  }[]
}

type TimeSlot = {
  startTime: string
  endTime: string
  subject?: string
  category?: string
  questionCount?: number
  type?: 'general' | 'specific' | 'blocked'
  blockReason?: string
}

type DaySchedule = {
  date: Date
  slots: TimeSlot[]
}

export default function SchedulePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [date, setDate] = useState<Date>(new Date())
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [examDates, setExamDates] = useState<ExamDate[]>([])
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newSession, setNewSession] = useState({
    subject: "",
    duration: 60,
    focusArea: "",
    date: new Date(),
  })
  const [studyRecommendations, setStudyRecommendations] = useState<StudyRecommendation[]>([])
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([])
  const [isBlockingTime, setIsBlockingTime] = useState(false)
  const [blockingSlot, setBlockingSlot] = useState<{
    day: Date,
    startTime: string,
    endTime: string,
    reason: string
  }>({
    day: new Date(),
    startTime: '',
    endTime: '',
    reason: ''
  })

  const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 to 19:00
  const MINUTES_PER_QUESTION = 45 // 45 minutes per question average

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        // Get today's date at midnight for comparison
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        console.log('Starting fetchData, today is:', today.toISOString())

        // Log the current user ID
        console.log('Current user ID:', user?.id)

        // Fetch exam dates from selected_courses
        const { data: examDatesData, error: examError } = await supabase
          .from('selected_courses')
          .select('course_name, exam_date, after_exam')
          .eq('user_id', user.id)

        // Log raw database response
        console.log('Complete database response:', {
          data: examDatesData,
          error: examError
        })

        if (examError) {
          console.error('Error fetching exam dates:', examError)
          throw examError
        }

        // Log all courses, including those without exam dates
        console.log('All courses from DB:', examDatesData)

        // Filter for courses with exam dates and not after exam
        const coursesWithExams = (examDatesData || []).filter(course => 
          course.exam_date && !course.after_exam
        )
        
        console.log('Courses with valid exams:', coursesWithExams)

        if (!coursesWithExams.length) {
          console.log('No valid exam dates found')
          setExamDates([])
          return
        }

        // Convert exam dates to proper format and filter future dates
        const formattedExamDates = coursesWithExams
          .map(exam => ({
            course_name: exam.course_name,
            exam_date: format(new Date(exam.exam_date), 'yyyy-MM-dd')
          }))
          .filter(exam => new Date(exam.exam_date + 'T00:00:00') >= today)

        console.log('Final formatted exam dates:', formattedExamDates)
        setExamDates(formattedExamDates)

        // Get all categories for the user's selected courses
        const { data: selectedCourses } = await supabase
          .from('selected_courses')
          .select('course_name')
          .eq('user_id', user.id)

        if (!selectedCourses?.length) return

        // Get all categories for these courses
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('category, course')
          .in('course', selectedCourses.map(c => c.course_name))

        if (!categoriesData?.length) return

        // Fetch questions with their status for each category
        const { data: questions } = await supabase
          .from('questions')
          .select('category, done, course:categories!inner(course)')
          .in('category', categoriesData.map(c => c.category))

        if (!questions) return

        // Calculate performance by category
        const performanceByCategory = (questions as unknown as QuestionWithCourse[]).reduce((acc: Record<string, CategoryPerformance>, q) => {
          const key = `${q.course.course}-${q.category}`
          if (!acc[key]) {
            acc[key] = {
              category: q.category,
              course_name: q.course.course,
              total: 0,
              incorrect: 0,
              percentage: 0
            }
          }
          acc[key].total++
          if (q.done === false) acc[key].incorrect++
          acc[key].percentage = ((acc[key].total - acc[key].incorrect) / acc[key].total) * 100
          return acc
        }, {})

        setCategoryPerformance(Object.values(performanceByCategory))
        
        // First set the initial schedule
        const initialSchedule = examDates.length > 0 ? generateWeeklySchedule() : []
        setWeeklySchedule(initialSchedule)

        // Then generate recommendations
        const recommendations = generateStudyRecommendations()
        setStudyRecommendations(recommendations)
      } catch (error) {
        console.error('Error in fetchData:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      setNewSession(prev => ({ ...prev, date: newDate }))
    }
  }

  const handleAddSession = () => {
    const newSessionObj: StudySession = {
      id: `session-new-${Date.now()}`,
      date: newSession.date,
      subject: newSession.subject,
      duration: newSession.duration,
      focusArea: newSession.focusArea,
      completed: false,
    }

    setStudySessions([...studySessions, newSessionObj])
    setIsDialogOpen(false)
    setNewSession({
      subject: "",
      duration: 60,
      focusArea: "",
      date: new Date(),
    })
  }

  const toggleSessionCompletion = (sessionId: string) => {
    setStudySessions(
      studySessions.map((session) =>
        session.id === sessionId ? { ...session, completed: !session.completed } : session,
      ),
    )
  }

  const sessionsForSelectedDate = studySessions.filter((session) => isSameDay(session.date, date))

  const upcomingSessions = studySessions
    .filter((session) => !session.completed && session.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  const getExamDateStyle = (date: Date) => {
    return examDates.some(exam => {
      const examDate = new Date(exam.exam_date)
      return isSameDay(examDate, date)
    })
  }

  const getExamsForDate = (date: Date) => {
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0) // Normalize time to midnight
    return examDates.filter(exam => {
      const examDate = new Date(exam.exam_date)
      examDate.setHours(0, 0, 0, 0) // Normalize time to midnight
      return examDate.getTime() === compareDate.getTime()
    })
  }

  const getPracticeRecommendations = () => {
    return categoryPerformance
      .filter(cat => cat.percentage < 80)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5)
  }

  const isDateBooked = (date: Date) => {
    return studySessions.some((session) => isSameDay(session.date, date))
  }

  const isExamDate = (date: Date) => {
    return examDates.some(exam => {
      const examDate = new Date(exam.exam_date)
      examDate.setHours(0, 0, 0, 0) // Normalize time to midnight
      const compareDate = new Date(date)
      compareDate.setHours(0, 0, 0, 0) // Normalize time to midnight
      return examDate.getTime() === compareDate.getTime()
    })
  }

  const generateStudyRecommendations = () => {
    const recommendations: StudyRecommendation[] = []
    
    examDates.forEach(exam => {
      const examDate = new Date(exam.exam_date)
      const weekBefore = subDays(examDate, 7)
      
      // If the current date is within a week of the exam
      if (isWithinInterval(new Date(), { start: weekBefore, end: examDate })) {
        // Get categories for this course
        const courseCategories = categoryPerformance
          .filter(cat => cat.course_name === exam.course_name)
          .sort((a, b) => a.percentage - b.percentage) // Sort by performance, worst first
          
        if (courseCategories.length > 0) {
          // Calculate recommended study time based on performance
          const categoriesWithTime = courseCategories.map(cat => ({
            name: cat.category,
            performance: cat.percentage,
            // More study time for lower performance categories
            recommendedMinutes: Math.round((100 - cat.percentage) * 1.2)
          }))

          recommendations.push({
            course_name: exam.course_name,
            exam_date: exam.exam_date,
            categories: categoriesWithTime
          })
        }
      }
    })

    return recommendations
  }

  const generateWeeklySchedule = () => {
    // Get all exam weeks
    const examWeeks = examDates.map(exam => {
      const examDate = new Date(exam.exam_date)
      // Only show 7 days before the exam
      const weekStart = subDays(examDate, 7)
      const weekEnd = subDays(examDate, 1)
      return {
        course: exam.course_name,
        examDate,
        weekStart,
        weekEnd
      }
    }).filter(week => {
      // Only include weeks that haven't passed yet
      return week.weekEnd >= new Date()
    })

    // If no exam weeks, show current week
    if (examWeeks.length === 0) {
      const today = new Date()
      return [
        {
          date: today,
          slots: []
        }
      ]
    }

    // Get the closest exam week
    const nextExamWeek = examWeeks[0]
    const weekDays = eachDayOfInterval({ 
      start: nextExamWeek.weekStart, 
      end: nextExamWeek.weekEnd 
    })
    
    const schedule = weekDays.map(day => {
      const daySchedule: DaySchedule = {
        date: day,
        slots: []
      }

      // Get categories that need work for this exam
      const categoriesNeedingWork = categoryPerformance
        .filter(cat => cat.course_name === nextExamWeek.course)
        .filter(cat => cat.percentage < 80)
        .sort((a, b) => a.percentage - b.percentage)

      if (categoriesNeedingWork.length > 0) {
        // Define default study slots
        const defaultSlots: TimeSlot[] = [
          {
            startTime: "09:00",
            endTime: "12:00",
            subject: nextExamWeek.course,
            questionCount: Math.floor((3 * 60) / MINUTES_PER_QUESTION),
            type: 'general' as const
          },
          ...(categoriesNeedingWork[0] ? [{
            startTime: "13:30",
            endTime: "15:00",
            subject: nextExamWeek.course,
            category: categoriesNeedingWork[0].category,
            questionCount: Math.floor((1.5 * 60) / MINUTES_PER_QUESTION),
            type: 'specific' as const
          }] : []),
          ...(categoriesNeedingWork[1] ? [{
            startTime: "15:30",
            endTime: "17:00",
            subject: nextExamWeek.course,
            category: categoriesNeedingWork[1].category,
            questionCount: Math.floor((1.5 * 60) / MINUTES_PER_QUESTION),
            type: 'specific' as const
          }] : [])
        ]

        // Check for blocked times and adjust study slots
        const blockedSlots = weeklySchedule
          .find(ws => isSameDay(ws.date, day))
          ?.slots.filter(s => s.type === 'blocked') || []

        defaultSlots.forEach(studySlot => {
          const conflictingBlock = blockedSlots.find(blocked => {
            const studyStart = parseInt(studySlot.startTime.split(':')[0])
            const studyEnd = parseInt(studySlot.endTime.split(':')[0])
            const blockStart = parseInt(blocked.startTime.split(':')[0])
            const blockEnd = parseInt(blocked.endTime.split(':')[0])
            
            return (
              (blockStart <= studyStart && blockEnd > studyStart) ||
              (blockStart < studyEnd && blockEnd >= studyEnd) ||
              (blockStart >= studyStart && blockEnd <= studyEnd)
            )
          })

          if (conflictingBlock) {
            // If morning session is blocked, move to afternoon if possible
            if (studySlot.type === 'general' && studySlot.startTime === "09:00") {
              const afternoonSlot = {
                ...studySlot,
                startTime: "14:00",
                endTime: "17:00"
              }
              // Check if afternoon is free
              const afternoonBlocked = blockedSlots.some(blocked => {
                const blockStart = parseInt(blocked.startTime.split(':')[0])
                const blockEnd = parseInt(blocked.endTime.split(':')[0])
                return blockStart < 17 && blockEnd > 14
              })
              if (!afternoonBlocked) {
                daySchedule.slots.push(afternoonSlot)
              }
            }
            // For category practice, try to find any 1.5 hour slot that's free
            else if (studySlot.type === 'specific') {
              const possibleSlots = [
                { start: "10:30", end: "12:00" },
                { start: "13:30", end: "15:00" },
                { start: "15:30", end: "17:00" },
                { start: "17:00", end: "18:30" }
              ]
              
              for (const slot of possibleSlots) {
                const slotBlocked = blockedSlots.some(blocked => {
                  const blockStart = parseInt(blocked.startTime.split(':')[0])
                  const blockEnd = parseInt(blocked.endTime.split(':')[0])
                  const slotStart = parseInt(slot.start.split(':')[0])
                  const slotEnd = parseInt(slot.end.split(':')[0])
                  return blockStart < slotEnd && blockEnd > slotStart
                })
                
                if (!slotBlocked) {
                  daySchedule.slots.push({
                    ...studySlot,
                    startTime: slot.start,
                    endTime: slot.end,
                    type: 'specific' as const
                  })
                  break
                }
              }
            }
          } else {
            // No conflict, use original slot
            daySchedule.slots.push(studySlot)
          }
        })

        // Add blocked slots with their reasons
        daySchedule.slots.push(...blockedSlots)
      }

      return daySchedule
    })

    return schedule
  }

  const handleBlockTimeSlot = () => {
    const updatedSchedule = weeklySchedule.map(day => {
      if (isSameDay(day.date, blockingSlot.day)) {
        return {
          ...day,
          slots: [
            ...day.slots.filter(slot => 
              slot.startTime !== blockingSlot.startTime || 
              slot.endTime !== blockingSlot.endTime
            ),
            {
              startTime: blockingSlot.startTime,
              endTime: blockingSlot.endTime,
              type: 'blocked' as const,
              blockReason: blockingSlot.reason
            } as TimeSlot
          ]
        }
      }
      return day
    })

    setWeeklySchedule(updatedSchedule)
    setIsBlockingTime(false)
    setBlockingSlot({
      day: new Date(),
      startTime: '',
      endTime: '',
      reason: ''
    })
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Study Schedule</h1>
        <Button onClick={() => setIsBlockingTime(true)} variant="outline">
          Block Time Slot
        </Button>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border text-left">Time</th>
                  {weeklySchedule.map((day, index) => (
                    <th key={index} className="p-2 border text-left">
                      <div className="font-medium">{format(day.date, 'EEEE')}</div>
                      <div className="text-sm text-muted-foreground">{format(day.date, 'MMM d')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour}>
                    <td className="p-2 border text-sm">
                      {hour.toString().padStart(2, '0')}:00
                    </td>
                    {weeklySchedule.map((day, dayIndex) => {
                      const slot = day.slots.find(s => {
                        const slotHour = parseInt(s.startTime.split(':')[0])
                        return hour >= slotHour && hour < parseInt(s.endTime.split(':')[0])
                      })

                      return (
                        <td key={dayIndex} className="p-2 border">
                          {slot && hour === parseInt(slot.startTime.split(':')[0]) && (
                            <div 
                              className={cn(
                                "p-2 rounded-md space-y-1",
                                slot.type === 'general' && "bg-primary/10",
                                slot.type === 'specific' && "bg-secondary/10",
                                slot.type === 'blocked' && "bg-muted"
                              )}
                            >
                              {slot.type === 'blocked' ? (
                                <>
                                  <div className="font-medium text-sm">Blocked: {slot.blockReason}</div>
                                  <div className="text-xs">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="font-medium text-sm">{slot.subject}</div>
                                  {slot.category && (
                                    <div className="text-sm text-muted-foreground">{slot.category}</div>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    {slot.type === 'general' ? 'Full Exam Practice' : 'Category Focus'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {slot.questionCount} questions
                                  </div>
                                  <div className="text-xs">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>View your exam dates and study sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              defaultMonth={date}
              className="rounded-md border"
              modifiers={{
                exam: (date) => {
                  const formattedDate = format(date, 'yyyy-MM-dd')
                  console.log('Checking date:', {
                    calendarDate: formattedDate,
                    examDates: examDates.map(e => e.exam_date)
                  })
                  return examDates.some(exam => exam.exam_date === formattedDate)
                },
                booked: isDateBooked
              }}
              modifiersStyles={{
                exam: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--destructive) / 0.7)",
                  color: "white",
                  border: "2px solid hsl(var(--destructive))"
                },
                booked: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                  color: "hsl(var(--primary))",
                }
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{format(date, "MMMM d, yyyy")}</CardTitle>
              <CardDescription>
                {getExamsForDate(date).length > 0 ? "Exam day!" : 
                 sessionsForSelectedDate.length === 0 ? "No study sessions scheduled" :
                 `${sessionsForSelectedDate.length} session${sessionsForSelectedDate.length > 1 ? "s" : ""} scheduled`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getExamsForDate(date).length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-destructive mb-2">Exams Today:</h3>
                  {getExamsForDate(date).map((exam, index) => (
                    <div key={index} className="p-2 bg-destructive/10 rounded-md mb-2">
                      <p className="text-sm font-medium">{exam.course_name}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {sessionsForSelectedDate.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-4">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No sessions for this day</p>
                  <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                    Add Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionsForSelectedDate.map((session) => (
                    <div key={session.id} className="flex items-start space-x-4 p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{session.subject}</h4>
                          <Badge variant="outline">
                            {session.completed ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{session.focusArea}</p>
                        <div className="flex items-center mt-2 text-sm">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-muted-foreground">{session.duration} minutes</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => toggleSessionCompletion(session.id)}>
                        <CheckCircle2
                          className={`h-5 w-5 ${session.completed ? "text-primary" : "text-muted-foreground"}`}
                        />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Practice Recommendations</CardTitle>
              <CardDescription>Based on your performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getPracticeRecommendations().map((category, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{category.course_name}</h4>
                        <p className="text-sm text-muted-foreground">{category.category}</p>
                      </div>
                      <Badge variant="secondary" className="bg-red-50">
                        {Math.round(category.percentage)}% correct
                      </Badge>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Practice needed: {category.incorrect} questions to review
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {studyRecommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Exam Preparation Recommendations</CardTitle>
                <CardDescription>Focused study plan for upcoming exams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {studyRecommendations.map((rec, index) => {
                    const daysToExam = Math.ceil(
                      (new Date(rec.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                    
                    return (
                      <div key={index} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{rec.course_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Exam in {daysToExam} {daysToExam === 1 ? 'day' : 'days'}
                            </p>
                          </div>
                          <Badge variant="destructive">Priority</Badge>
                        </div>
                        
                        <div className="space-y-3">
                          {rec.categories.map((cat, catIndex) => (
                            <div key={catIndex} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{cat.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {Math.round(cat.performance)}% mastery
                                </span>
                              </div>
                              <Progress value={cat.performance} className="h-2" />
                              <p className="text-sm text-muted-foreground">
                                Recommended: {cat.recommendedMinutes} minutes today
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isBlockingTime} onOpenChange={setIsBlockingTime}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Time Slot</DialogTitle>
            <DialogDescription>Block out time for other activities</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Day</Label>
              <Calendar
                mode="single"
                selected={blockingSlot.day}
                onSelect={(date) => date && setBlockingSlot(prev => ({ ...prev, day: date }))}
                className="rounded-md border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Time</Label>
                <Select
                  value={blockingSlot.startTime}
                  onValueChange={(value) => setBlockingSlot(prev => ({ ...prev, startTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>End Time</Label>
                <Select
                  value={blockingSlot.endTime}
                  onValueChange={(value) => setBlockingSlot(prev => ({ ...prev, endTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                        {hour.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Reason</Label>
              <Input
                value={blockingSlot.reason}
                onChange={(e) => setBlockingSlot(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Work, Lunch, Meeting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockingTime(false)}>
              Cancel
            </Button>
            <Button onClick={handleBlockTimeSlot}>Block Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
