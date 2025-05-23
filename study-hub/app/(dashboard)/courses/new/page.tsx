"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Course = {
  course_name: string
}

export default function SelectCoursePage() {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("course_name")
        .order("course_name")

      if (error) throw error
      setCourses(data || [])
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError('Failed to load courses')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCourse) {
      setError("Please select a course")
      return
    }

    try {
      setIsLoading(true)
      
      // Get the current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error:', authError)
        setError("Authentication error: " + authError.message)
        return
      }
      if (!user) {
        setError("Please sign in to select a course")
        return
      }

      // Simple insert into selected_courses
      const { error: insertError } = await supabase
        .from('selected_courses')
        .insert([{
          user_id: user.id,
          course_name: selectedCourse
        }])

      if (insertError) {
        console.error('Insert error:', insertError)
        setError('Failed to select course: ' + insertError.message)
        return
      }

      router.push(`/courses/${encodeURIComponent(selectedCourse)}`)
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Select Course</h1>

      <Card>
        <CardHeader>
          <CardTitle>Course Selection</CardTitle>
          <CardDescription>Select a course to manage its questions</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="courseName">Course</Label>
              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem 
                      key={course.course_name} 
                      value={course.course_name}
                    >
                      {course.course_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading || !selectedCourse}>
              {isLoading ? "Loading..." : "Select Course"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 