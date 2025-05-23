"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff, Plus, Search, XCircle, X } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type Course = {
  course_name: string
}

type Question = {
  id: string
  question: string
  answer: string | null
  category: string | null
  year: number | null
  professor: string | null
}

type PageParams = {
  course_name: string
}

type QuestionWithState = Question & {
  isAnswerVisible: boolean
  done: boolean | null
}

export default function CoursePage() {
  const params = useParams<PageParams>()
  const router = useRouter()
  const courseName = params?.course_name
  
  const [course, setCourse] = useState<Course | null>(null)
  const [questions, setQuestions] = useState<QuestionWithState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAnswered, setShowAnswered] = useState(false)

  // Filter states
  const [categories, setCategories] = useState<string[]>([])
  const [professors, setProfessors] = useState<string[]>([])
  const [years, setYears] = useState<number[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedProfessors, setSelectedProfessors] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!courseName) return

      setIsLoading(true)
      setError(null)

      try {
        // First check if the user has selected this course
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          setError('Please sign in to view course details')
          return
        }

        const { data: selectedCourse } = await supabase
          .from('selected_courses')
          .select('course_name')
          .eq('user_id', userData.user.id)
          .eq('course_name', courseName)
          .single()

        if (!selectedCourse) {
          setError('You have not selected this course')
          return
        }

        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('course_name', courseName)
          .single()

        if (courseError) {
          console.error('Error fetching course:', courseError)
          setError('Failed to load course details')
          return
        }

        setCourse(courseData)

        // First get the categories for this course
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('category')
          .eq('course', courseName)

        if (!categoriesData?.length) {
          setQuestions([])
          setCategories([])
          setProfessors([])
          setYears([])
          return
        }

        // Fetch questions for these categories
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select(`
            id,
            question,
            answer,
            category,
            year,
            professor,
            done
          `)
          .in('category', categoriesData.map(c => c.category))

        if (questionsError) {
          console.error('Error fetching questions:', questionsError)
          setError('Failed to load questions')
          return
        }

        setQuestions((questionsData || []).map(q => ({
          ...q,
          isAnswerVisible: false,
          done: q.done || false
        })))

        // Extract unique categories, professors, and years from the questions
        const uniqueCategories = [...new Set(questionsData?.map(q => q.category).filter(Boolean))]
        const uniqueProfessors = [...new Set(questionsData?.map(q => q.professor).filter(Boolean))]
        const uniqueYears = [...new Set(questionsData?.map(q => q.year).filter(Boolean))].sort((a, b) => b - a) // Sort years in descending order

        setCategories(uniqueCategories)
        setProfessors(uniqueProfessors)
        setYears(uniqueYears)

      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [courseName])

  // Filter questions based on search query and selected filters
  const filteredQuestions = questions.filter((question) => {
    // Show/Hide answered questions
    if (!showAnswered && question.done === true) {
      return false
    }

    // Text search
    const matchesSearch = 
      question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.answer?.toLowerCase().includes(searchQuery.toLowerCase())

    // Category filter
    const matchesCategory = selectedCategories.length === 0 || 
      (question.category && selectedCategories.includes(question.category))

    // Professor filter
    const matchesProfessor = selectedProfessors.length === 0 || 
      (question.professor && selectedProfessors.includes(question.professor))

    // Year filter
    const matchesYear = selectedYears.length === 0 || 
      (question.year && selectedYears.includes(question.year.toString()))

    return matchesSearch && matchesCategory && matchesProfessor && matchesYear
  })

  const toggleAnswer = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, isAnswerVisible: !q.isAnswerVisible }
        : q
    ))
  }

  const markQuestionStatus = async (questionId: string, status: boolean | null) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ done: status })
        .eq('id', questionId)

      if (error) throw error

      // Update local state
      setQuestions(questions.map(q =>
        q.id === questionId
          ? { ...q, done: status }
          : q
      ))

      const statusMessage = status === true ? 'correct' : status === false ? 'incorrect/partial' : 'unanswered'
      toast.success(`Question marked as ${statusMessage}!`)
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('Failed to update question status')
    }
  }

  // Helper function to render selected items
  const renderSelectedItems = (
    items: string[],
    allItems: string[],
    onRemove: (value: string) => void
  ) => {
    return items.map((item) => (
      <Badge
        key={item}
        variant="secondary"
        className="mr-1 mb-1"
      >
        {item}
        <button
          className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onRemove(item)
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={() => onRemove(item)}
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </button>
      </Badge>
    ))
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="h-[60vh] flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse font-light">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="container">
        <Card className="border-red-100 bg-red-50/30">
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-red-500/70 font-light">{error || 'Course not found'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container space-y-8 py-4">
      <Card className="border-0 shadow-sm gradient-blue">
        <CardHeader className="space-y-4">
          <CardTitle className="text-3xl font-light tracking-tight text-primary">
            {course.course_name}
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex items-center flex-1 gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={showAnswered}
                      onChange={(e) => setShowAnswered(e.target.checked)}
                    />
                    Show answered questions
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-[200px] justify-between"
                      >
                        {selectedCategories.length === 0 ? (
                          <span>Select categories</span>
                        ) : (
                          <span>{selectedCategories.length} selected</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((category) => (
                            <CommandItem
                              key={category}
                              onSelect={() => {
                                setSelectedCategories((prev) =>
                                  prev.includes(category)
                                    ? prev.filter((item) => item !== category)
                                    : [...prev, category]
                                )
                              }}
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  selectedCategories.includes(category)
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}
                              >
                                <CheckCircle2 className={cn("h-4 w-4")} />
                              </div>
                              {category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-1">
                    {renderSelectedItems(
                      selectedCategories,
                      categories,
                      (category) =>
                        setSelectedCategories((prev) =>
                          prev.filter((item) => item !== category)
                        )
                    )}
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-[200px] justify-between"
                      >
                        {selectedProfessors.length === 0 ? (
                          <span>Select professors</span>
                        ) : (
                          <span>{selectedProfessors.length} selected</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search professors..." />
                        <CommandEmpty>No professor found.</CommandEmpty>
                        <CommandGroup>
                          {professors.map((professor) => (
                            <CommandItem
                              key={professor}
                              onSelect={() => {
                                setSelectedProfessors((prev) =>
                                  prev.includes(professor)
                                    ? prev.filter((item) => item !== professor)
                                    : [...prev, professor]
                                )
                              }}
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  selectedProfessors.includes(professor)
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}
                              >
                                <CheckCircle2 className={cn("h-4 w-4")} />
                              </div>
                              {professor}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-1">
                    {renderSelectedItems(
                      selectedProfessors,
                      professors,
                      (professor) =>
                        setSelectedProfessors((prev) =>
                          prev.filter((item) => item !== professor)
                        )
                    )}
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-[200px] justify-between"
                      >
                        {selectedYears.length === 0 ? (
                          <span>Select years</span>
                        ) : (
                          <span>{selectedYears.length} selected</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search years..." />
                        <CommandEmpty>No year found.</CommandEmpty>
                        <CommandGroup>
                          {years.map((year) => (
                            <CommandItem
                              key={year}
                              onSelect={() => {
                                setSelectedYears((prev) =>
                                  prev.includes(year.toString())
                                    ? prev.filter((item) => item !== year.toString())
                                    : [...prev, year.toString()]
                                )
                              }}
                            >
                              <div
                                className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  selectedYears.includes(year.toString())
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}
                              >
                                <CheckCircle2 className={cn("h-4 w-4")} />
                              </div>
                              {year}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-1">
                    {renderSelectedItems(
                      selectedYears,
                      years.map(y => y.toString()),
                      (year) =>
                        setSelectedYears((prev) =>
                          prev.filter((item) => item !== year)
                        )
                    )}
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-light text-primary mb-4 px-1">
                Questions
                <span className="text-sm text-primary/80 ml-2">
                  {filteredQuestions.length === 0 
                    ? 'No questions match the filters' 
                    : `${filteredQuestions.length} question${filteredQuestions.length === 1 ? '' : 's'}`}
                </span>
              </h2>

              {filteredQuestions.length === 0 ? (
                <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
                  <CardContent className="py-12">
                    <p className="text-center text-primary/80 font-light">
                      No questions match your search criteria.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredQuestions.map((question, index) => (
                    <Card 
                      key={question.id}
                      className={cn(
                        "border-0 shadow-sm transition-all duration-200 hover:shadow-md",
                        question.done === true && "opacity-60",
                        index % 3 === 0 && "gradient-blue",
                        index % 3 === 1 && "gradient-pink",
                        index % 3 === 2 && "gradient-purple"
                      )}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg font-medium text-gray-800/90">
                          {question.question}
                        </CardTitle>
                        <div className="flex gap-2 mt-2">
                          {question.category && (
                            <Badge variant="secondary">{question.category}</Badge>
                          )}
                          {question.year && (
                            <Badge variant="secondary">{question.year}</Badge>
                          )}
                          {question.professor && (
                            <Badge variant="secondary">{question.professor}</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {question.answer && (
                          <div className="space-y-4">
                            <div className="flex justify-end">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => toggleAnswer(question.id)}
                              >
                                {question.isAnswerVisible ? (
                                  <EyeOff className="h-4 w-4 mr-2" />
                                ) : (
                                  <Eye className="h-4 w-4 mr-2" />
                                )}
                                {question.isAnswerVisible ? 'Hide Answer' : 'Show Answer'}
                              </Button>
                            </div>
                            {question.isAnswerVisible && (
                              <div className="space-y-4">
                                <p className="font-light text-gray-600/90 leading-relaxed">
                                  {question.answer}
                                </p>
                                <div className="flex items-center justify-end gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={question.done === false}
                                    className={cn(
                                      "text-red-500 hover:text-red-600 hover:bg-red-50",
                                      question.done === false && "opacity-50 cursor-not-allowed",
                                    )}
                                    onClick={() => markQuestionStatus(question.id, false)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Wrong/Partial
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={question.done === true}
                                    className={cn(
                                      "text-green-500 hover:text-green-600 hover:bg-green-50",
                                      question.done === true && "opacity-50 cursor-not-allowed",
                                    )}
                                    onClick={() => markQuestionStatus(question.id, true)}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Correct
                                  </Button>
                                  {question.done !== null && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                                      onClick={() => markQuestionStatus(question.id, null)}
                                    >
                                      Reset
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="practice">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Practice Test</CardTitle>
                <CardDescription>
                  Take a practice test with random questions from different categories.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StartTestDialog categories={categories} router={router} courseName={courseName || ''} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="review">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Incorrect Questions</CardTitle>
                <CardDescription>
                  Review questions you marked as incorrect or partially correct.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {questions.filter(q => q.done === false).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No questions to review. Questions you mark as incorrect or partial will appear here.
                    </div>
                  ) : (
                    questions
                      .filter(q => q.done === false)
                      .map((question, index) => (
                        <Card 
                          key={question.id}
                          className={cn(
                            "border-0 shadow-sm transition-all duration-200 hover:shadow-md",
                            index % 3 === 0 && "gradient-blue",
                            index % 3 === 1 && "gradient-pink",
                            index % 3 === 2 && "gradient-purple"
                          )}
                        >
                          <CardHeader>
                            <CardTitle className="text-lg font-medium text-gray-800/90">
                              {question.question}
                            </CardTitle>
                            <div className="flex gap-2 mt-2">
                              {question.category && (
                                <Badge variant="secondary">{question.category}</Badge>
                              )}
                              {question.year && (
                                <Badge variant="secondary">{question.year}</Badge>
                              )}
                              {question.professor && (
                                <Badge variant="secondary">{question.professor}</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {question.answer && (
                              <div className="space-y-4">
                                <div className="flex justify-end">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-muted-foreground hover:text-primary"
                                    onClick={() => toggleAnswer(question.id)}
                                  >
                                    {question.isAnswerVisible ? (
                                      <EyeOff className="h-4 w-4 mr-2" />
                                    ) : (
                                      <Eye className="h-4 w-4 mr-2" />
                                    )}
                                    {question.isAnswerVisible ? 'Hide Answer' : 'Show Answer'}
                                  </Button>
                                </div>
                                {question.isAnswerVisible && (
                                  <div className="space-y-4">
                                    <p className="font-light text-gray-600/90 leading-relaxed">
                                      {question.answer}
                                    </p>
                                    <div className="flex items-center justify-end gap-2 pt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                                        onClick={() => markQuestionStatus(question.id, null)}
                                      >
                                        Reset
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-green-500 hover:text-green-600 hover:bg-green-50"
                                        onClick={() => markQuestionStatus(question.id, true)}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Mark as Correct
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StartTestDialog({ categories, router, courseName }: { 
  categories: string[], 
  router: any,
  courseName: string 
}) {
  const [open, setOpen] = useState(false)
  const [questionCount, setQuestionCount] = useState<string>("3")
  const [isStarting, setIsStarting] = useState(false)

  const startTest = async () => {
    setIsStarting(true)
    try {
      // Get random questions from different categories
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .in('category', categories)
        .limit(50) // Get a pool of questions to randomly select from

      if (error) throw error

      if (!questions || questions.length === 0) {
        toast.error('No questions available')
        return
      }

      // Group questions by category
      const questionsByCategory = questions.reduce((acc: { [key: string]: any[] }, question) => {
        if (!acc[question.category]) {
          acc[question.category] = []
        }
        acc[question.category].push(question)
        return acc
      }, {})

      // Randomly select categories
      const availableCategories = Object.keys(questionsByCategory)
      const shuffledCategories = availableCategories.sort(() => Math.random() - 0.5)
      const selectedCategories = shuffledCategories.slice(0, parseInt(questionCount))

      if (selectedCategories.length < parseInt(questionCount)) {
        toast.error(`Not enough categories available. Only ${availableCategories.length} categories exist.`)
        return
      }

      // Select one random question from each selected category
      const selectedQuestions = selectedCategories.map(category => {
        const categoryQuestions = questionsByCategory[category]
        const randomIndex = Math.floor(Math.random() * categoryQuestions.length)
        return categoryQuestions[randomIndex]
      })

      // Store the selected questions in localStorage for the test session
      localStorage.setItem('currentTest', JSON.stringify({
        questions: selectedQuestions,
        course_name: courseName,
        startTime: new Date().toISOString()
      }))

      // Navigate to the test taking page
      router.push(`/courses/${courseName}/tests/take`)
    } catch (error) {
      console.error('Error starting test:', error)
      toast.error('Failed to start test')
    } finally {
      setIsStarting(false)
      setOpen(false)
    }
  }

  return (
    <>
      <div className="flex justify-center">
        <Button 
          size="lg"
          onClick={() => setOpen(true)}
        >
          Start Practice Test
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Practice Test</DialogTitle>
            <DialogDescription>
              Select how many questions you want in your practice test.
              Each question will be randomly selected from a different category.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <RadioGroup
              value={questionCount}
              onValueChange={setQuestionCount}
              className="flex flex-col space-y-3"
            >
              {[3, 4, 5, 6].map((count) => (
                <div key={count} className="flex items-center space-x-2">
                  <RadioGroupItem value={count.toString()} id={`q-${count}`} />
                  <Label htmlFor={`q-${count}`}>{count} questions</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={startTest}
              disabled={isStarting}
            >
              {isStarting ? 'Starting...' : 'Start Test'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 