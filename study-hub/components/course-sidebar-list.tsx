"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GraduationCap, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

type Course = {
  course_name: string
}

export function CourseSidebarList() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchSelectedCourses()
  }, [pathname, user])

  const fetchSelectedCourses = async () => {
    try {
      setIsLoading(true)
      if (!user) {
        setCourses([])
        return
      }

      // Get selected courses
      const { data: selectedCourses, error: selectError } = await supabase
        .from("selected_courses")
        .select("course_name")
        .eq('user_id', user.id)

      if (selectError) {
        console.error('Error fetching selected courses:', selectError)
        return
      }

      if (!selectedCourses?.length) {
        setCourses([])
        return
      }

      // Get course details
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("course_name")
        .in('course_name', selectedCourses.map(c => c.course_name))

      if (coursesError) {
        console.error('Error fetching courses:', coursesError)
        return
      }

      setCourses(coursesData || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const removeCourse = async (courseName: string) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to remove courses",
          variant: "destructive",
        })
        return
      }

      const { error: deleteError } = await supabase
        .from('selected_courses')
        .delete()
        .eq('user_id', user.id)
        .eq('course_name', courseName)

      if (deleteError) {
        console.error('Error removing course:', deleteError)
        toast({
          title: "Error",
          description: "Failed to remove course",
          variant: "destructive",
        })
        return
      }

      // Refresh the list
      await fetchSelectedCourses()

      // If we're on the removed course's page, redirect to home
      if (pathname === `/courses/${courseName}`) {
        router.push('/')
      }

      toast({
        title: "Course removed",
        description: `${courseName} has been removed from your courses`,
      })
    } catch (err) {
      console.error('Error:', err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="space-y-1 p-2">
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-10rem)]">
      <div className="space-y-1 p-2">
        {courses.map((course) => {
          const isActive = pathname === `/courses/${course.course_name}`
          return (
            <div key={course.course_name} className="flex items-center gap-1">
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-muted"
                )}
                onClick={() => router.push(`/courses/${encodeURIComponent(course.course_name)}`)}
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                {course.course_name}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeCourse(course.course_name)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove {course.course_name}</span>
              </Button>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
} 