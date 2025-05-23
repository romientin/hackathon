"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

type Category = {
  id: string
  name: string
  description: string
}

export default function CreateTestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [subSubject, setSubSubject] = useState("")
  const [difficulty, setDifficulty] = useState(3)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
      
      if (data) {
        setCategories(data)
        // If subject ID is provided in URL, set it as selected
        const categoryId = searchParams.get('category')
        if (categoryId) {
          setCategory(categoryId)
        }
      }
    }

    fetchCategories()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push("/login")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create the test
      const { data: test, error: testError } = await supabase
        .from("user_tests")
        .insert([
          {
            user_id: user.id,
            title,
            description,
            subject_id: subject,
            sub_subject: subSubject,
            difficulty,
            scheduled_date: date,
            completed: false,
          },
        ])
        .select("id")
        .single()

      if (testError) throw testError

      // Redirect to the test page
      router.push(`/tests/${test.id}`)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Create Personalized Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
          <CardDescription>Create a new personalized test based on your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-destructive/15 text-destructive text-sm p-2 rounded-md mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Test Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Math Final Prep"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this test for?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subSubject">Sub-subject (Optional)</Label>
              <Input
                id="subSubject"
                value={subSubject}
                onChange={(e) => setSubSubject(e.target.value)}
                placeholder="e.g., Algebra, Geometry, Calculus"
              />
            </div>

            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <div className="pt-2">
                <Slider
                  value={[difficulty]}
                  onValueChange={([value]) => setDifficulty(value)}
                  max={5}
                  min={1}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Beginner</span>
                  <span>Advanced</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scheduled Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Test"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
