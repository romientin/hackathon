"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PageParams = {
  course_name: string
}

type Question = {
  id: string
  question: string
  answer: string
  category: string | null
  year: number | null
  professor: string | null
}

export default function NewTestPage() {
  const params = useParams<PageParams>()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [category, setCategory] = useState<string>("")
  const [year, setYear] = useState<string>("")
  const [professor, setProfessor] = useState<string>("")
  const [categories, setCategories] = useState<string[]>([])
  const [years, setYears] = useState<number[]>([])
  const [professors, setProfessors] = useState<string[]>([])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Fetch categories for this course
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('category')
          .eq('course', params.course_name)
        
        if (categoriesData) {
          setCategories(categoriesData.map(c => c.category))
        }

        // Fetch years
        const { data: yearsData } = await supabase
          .from('years')
          .select('year')
          .order('year', { ascending: false })
        
        if (yearsData) {
          setYears(yearsData.map(y => y.year))
        }

        // Fetch professors for this course
        const { data: professorsData } = await supabase
          .from('professors')
          .select('professor')
          .eq('course', params.course_name)
        
        if (professorsData) {
          setProfessors(professorsData.map(p => p.professor))
        }
      } catch (error) {
        console.error('Error fetching filters:', error)
        toast({
          title: "Error",
          description: "Failed to load filters",
          variant: "destructive",
        })
      }
    }

    fetchFilters()
  }, [params.course_name])

  const handleStartTest = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to start a test",
          variant: "destructive",
        })
        return
      }

      // Build the query to fetch questions based on selected filters
      let query = supabase
        .from('questions')
        .select('*')

      if (category) {
        query = query.eq('category', category)
      }
      if (year) {
        query = query.eq('year', parseInt(year))
      }
      if (professor) {
        query = query.eq('professor', professor)
      }

      // Add course filter through categories or professors
      query = query.or(
        `category.in.(${
          supabase
            .from('categories')
            .select('category')
            .eq('course', params.course_name)
            .toString()
        }),professor.in.(${
          supabase
            .from('professors')
            .select('professor')
            .eq('course', params.course_name)
            .toString()
        })`
      )

      // Limit to 5 random questions
      const { data: questions, error } = await query
        .limit(5)
        .order('RANDOM()')

      if (error) throw error

      if (!questions || questions.length === 0) {
        toast({
          title: "No questions found",
          description: "No questions match your selected criteria",
          variant: "destructive",
        })
        return
      }

      // Store the selected questions in localStorage for the test session
      localStorage.setItem('currentTest', JSON.stringify({
        questions,
        course_name: params.course_name,
        category,
        year,
        professor,
        startTime: new Date().toISOString()
      }))

      // Navigate to the test taking page
      router.push(`/courses/${params.course_name}/tests/take`)
    } catch (error) {
      console.error('Error starting test:', error)
      toast({
        title: "Error",
        description: "Failed to start test. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create New Test</CardTitle>
          <CardDescription>
            Select filters to generate a test from {params.course_name} questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-medium">
                Year
              </label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="professor" className="text-sm font-medium">
                Professor
              </label>
              <Select value={professor} onValueChange={setProfessor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a professor" />
                </SelectTrigger>
                <SelectContent>
                  {professors.map((prof) => (
                    <SelectItem key={prof} value={prof}>
                      {prof}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="button" 
              onClick={handleStartTest} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Creating..." : "Start Test"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 