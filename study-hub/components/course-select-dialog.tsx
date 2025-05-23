"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

type Course = {
  course_name: string
}

export function CourseSelectDialog() {
  const router = useRouter()
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [testDate, setTestDate] = useState<Date | undefined>()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

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

  const handleSelectCourse = async () => {
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

      // Insert into selected_courses
      const { error: insertError } = await supabase
        .from('selected_courses')
        .insert({
          user_id: user.id,
          course_name: selectedCourse,
          exam_date: testDate?.toISOString().split('T')[0] || null
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        setError('Failed to select course: ' + insertError.message)
        return
      }

      toast({
        title: "Success",
        description: testDate 
          ? `Course added with exam scheduled for ${format(testDate, "MMMM d, yyyy")}` 
          : "Course added successfully",
      })

      router.push(`/courses/${encodeURIComponent(selectedCourse)}`)
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add Course</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Course</DialogTitle>
          <DialogDescription>Choose a course to manage its questions</DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Course</Label>
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

          <div className="space-y-2">
            <Label>Test Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !testDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {testDate ? format(testDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={testDate}
                  onSelect={setTestDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSelectCourse} 
            disabled={isLoading || !selectedCourse}
          >
            {isLoading ? "Loading..." : "Select Course"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 