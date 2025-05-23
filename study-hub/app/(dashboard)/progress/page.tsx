"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { supabase } from "@/lib/supabase"
import { useEffect } from "react"
import { getCourseColor } from "@/lib/utils"
import { cn } from "@/lib/utils"

type CourseProgress = {
  course_name: string
  total_questions: number
  completed_questions: number
  progress: number
  categories: CategoryProgress[]
}

type CategoryProgress = {
  category: string
  total_questions: number
  completed_questions: number
  progress: number
}

export default function ProgressPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [selectedCourse, setSelectedCourse] = useState<CourseProgress | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchProgress = async () => {
      // First get all courses the user has selected
      const { data: selectedCourses } = await supabase
        .from("selected_courses")
        .select("course_name")
        .eq("user_id", user.id)

      if (!selectedCourses) return

      const progress: CourseProgress[] = []

      // For each course, get the questions and their completion status
      for (const { course_name } of selectedCourses) {
        // Get all questions for this course through categories
        const { data: categories } = await supabase
          .from("categories")
          .select("category")
          .eq("course", course_name)

        if (!categories) continue

        const categoryProgress: CategoryProgress[] = []
        let courseTotalQuestions = 0
        let courseCompletedQuestions = 0

        // For each category, get question counts
        for (const { category } of categories) {
          const { data: questions } = await supabase
            .from("questions")
            .select("done")
            .eq("category", category)

          if (!questions) continue

          const totalQuestions = questions.length
          const completedQuestions = questions.filter(q => q.done).length

          categoryProgress.push({
            category,
            total_questions: totalQuestions,
            completed_questions: completedQuestions,
            progress: totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0
          })

          courseTotalQuestions += totalQuestions
          courseCompletedQuestions += completedQuestions
        }

        progress.push({
          course_name,
          total_questions: courseTotalQuestions,
          completed_questions: courseCompletedQuestions,
          progress: courseTotalQuestions > 0 ? (courseCompletedQuestions / courseTotalQuestions) * 100 : 0,
          categories: categoryProgress
        })
      }

      setCourseProgress(progress)
    }

    fetchProgress()
  }, [user])

  const filteredProgress = courseProgress.filter(course =>
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRowClick = (course: CourseProgress) => {
    setSelectedCourse(course)
    setIsSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Questions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProgress.map((course) => {
              const courseColor = getCourseColor(course.course_name)
              return (
                <TableRow
                  key={course.course_name}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(course)}
                >
                  <TableCell className="font-medium">
                    <span className={courseColor.text}>{course.course_name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Progress
                        value={course.progress}
                        className={cn("h-2", courseColor.bg)}
                      />
                      <p className="text-sm text-muted-foreground">
                        {course.progress.toFixed(1)}% complete
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {course.completed_questions} / {course.total_questions}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {selectedCourse && (
                <span className={getCourseColor(selectedCourse.course_name).text}>
                  {selectedCourse.course_name}
                </span>
              )}
            </SheetTitle>
            <SheetDescription>
              Progress by category
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Input
              placeholder="Search categories..."
              className="mb-4"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="space-y-4">
              {selectedCourse?.categories
                .filter(cat => cat.category.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((category) => {
                  const courseColor = getCourseColor(selectedCourse.course_name)
                  return (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">{category.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.completed_questions} / {category.total_questions}
                        </p>
                      </div>
                      <Progress
                        value={category.progress}
                        className={cn("h-2", courseColor.bg)}
                      />
                    </div>
                  )
                })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
