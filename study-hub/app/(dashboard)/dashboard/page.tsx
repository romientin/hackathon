"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, Clock, LineChart, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { getCourseColor } from "@/lib/utils"
import { cn } from "@/lib/utils"

type SelectedCourse = {
  course_name: string
  exam_date: string | null
  after_exam: boolean
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    testsCompleted: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    upcomingTests: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([])
  const [upcomingTests, setUpcomingTests] = useState<Array<{ title: string; scheduled_date: string; course_name: string }>>([])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchStats = async () => {
      try {
        console.log('Starting data fetch for user:', user.id)

        // Get tests completed (count courses where after_exam is true)
        const { count: testsCompleted } = await supabase
          .from("selected_courses")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .eq("after_exam", true)

        if (testsCompleted === 0) {
          console.log('Completed tests:', { count: testsCompleted, tests: [] })
        } else {
          console.log('Completed tests:', { count: testsCompleted, tests: [] })
        }

        // Get questions answered
        const { data: answeredQuestions } = await supabase
          .from("questions")
          .select("*")
          .eq("done", true)

        if (answeredQuestions === null) {
          console.error('Error fetching questions:', answeredQuestions)
        }

        // Get selected courses
        const today = new Date().toISOString().split('T')[0]
        console.log('Today:', today)
        
        // Update after_exam for courses where exam date has passed
        await supabase
          .from("selected_courses")
          .update({ after_exam: true })
          .eq("user_id", user.id)
          .eq("after_exam", false)
          .lt("exam_date", today)

        if (testsCompleted === 0) {
          console.log('Completed tests:', { count: testsCompleted, tests: [] })
        } else {
          console.log('Completed tests:', { count: testsCompleted, tests: [] })
        }

        // Fetch all active courses with their exam dates
        const { data: courses, error: coursesError } = await supabase
          .from("selected_courses")
          .select("course_name, exam_date, after_exam")
          .eq("user_id", user.id)

        if (coursesError && coursesError.message) {
          console.error('Error fetching courses:', coursesError)
          return
        }

        console.log('All fetched courses:', courses)
        
        // Filter for active courses (not after exam)
        const activeCourses = courses?.filter(course => !course.after_exam) || []
        console.log('Active courses:', activeCourses)

        // Filter for upcoming exams
        const upcomingExams = activeCourses.filter(course => 
          course.exam_date && 
          new Date(course.exam_date) >= new Date(today)
        )
        console.log('Upcoming exams:', upcomingExams)

        const questionsAnswered = answeredQuestions?.length || 0

        setStats({
          testsCompleted: testsCompleted || 0,
          questionsAnswered,
          correctAnswers: questionsAnswered, // Since done=true means it was answered correctly
          upcomingTests: upcomingExams.length,
        })

        setSelectedCourses(activeCourses)
        console.log('Setting selected courses:', activeCourses)

      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user, router])

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>
  }

  const accuracy = stats.questionsAnswered > 0 ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={() => router.push("/tests/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create Test
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {stats.testsCompleted > 0 ? "+1 from last week" : "Start your first test!"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracy}%</div>
            <Progress value={accuracy} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.questionsAnswered}</div>
            <p className="text-xs text-muted-foreground">{stats.correctAnswers} correct answers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Your Courses</CardTitle>
            <CardDescription>Courses you're currently studying</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedCourses.length > 0 ? (
                <>
                  {selectedCourses.map((course, index) => {
                    const courseColor = getCourseColor(course.course_name)
                    const daysToExam = course.exam_date 
                      ? differenceInDays(new Date(course.exam_date), new Date())
                      : null
                    
                    return (
                      <div key={index} className={cn(
                        "flex items-center p-3 rounded-lg border",
                        courseColor.border
                      )}>
                        <div className={cn("mr-4 rounded-full p-2", courseColor.bg)}>
                          <BookOpen className={cn("h-4 w-4", courseColor.text)} />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={cn("text-sm font-medium", courseColor.text)}>
                              {course.course_name}
                            </p>
                            {daysToExam !== null && !course.after_exam && daysToExam >= 0 && (
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                courseColor.bg,
                                courseColor.text
                              )}>
                                {daysToExam === 0 ? "Today!" : `${daysToExam} days`}
                              </span>
                            )}
                          </div>
                          <Button 
                            variant="link" 
                            className="h-auto p-0 text-sm text-muted-foreground hover:text-primary"
                            onClick={() => router.push(`/courses/${encodeURIComponent(course.course_name)}`)}
                          >
                            View course
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 space-y-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No courses selected</p>
                  <Button variant="outline" size="sm" onClick={() => router.push("/courses")}>
                    Add Course
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
            <CardDescription>Your scheduled exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedCourses.filter(course => course.exam_date && !course.after_exam && differenceInDays(new Date(course.exam_date), new Date()) >= 0).length > 0 ? (
                <>
                  {selectedCourses
                    .filter(course => course.exam_date && !course.after_exam && differenceInDays(new Date(course.exam_date), new Date()) >= 0)
                    .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime())
                    .map((course, index) => {
                      const courseColor = getCourseColor(course.course_name)
                      const daysToExam = differenceInDays(new Date(course.exam_date!), new Date())
                      
                      return (
                        <div key={index} className={cn(
                          "flex items-center p-3 rounded-lg border",
                          courseColor.border
                        )}>
                          <div className={cn("mr-4 rounded-full p-2", courseColor.bg)}>
                            <Calendar className={cn("h-4 w-4", courseColor.text)} />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <p className={cn("text-sm font-medium", courseColor.text)}>
                                {course.course_name}
                              </p>
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                courseColor.bg,
                                courseColor.text
                              )}>
                                {daysToExam === 0 ? "Today!" : `${daysToExam} days`}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(course.exam_date!), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 space-y-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No upcoming exams</p>
                  <Button variant="outline" size="sm" onClick={() => router.push("/courses")}>
                    Add Course
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
