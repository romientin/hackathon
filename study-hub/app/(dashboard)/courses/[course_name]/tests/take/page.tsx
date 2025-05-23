"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type Question = {
  id: string
  question: string
  answer: string
  category: string | null
  year: number | null
  professor: string | null
}

type CurrentTest = {
  questions: Question[]
  course_name: string
  category: string | null
  year: string | null
  professor: string | null
  startTime: string
}

type PageParams = {
  course_name: string
}

export default function TakeTestPage() {
  const params = useParams<PageParams>()
  const router = useRouter()
  const { toast } = useToast()
  const [currentTest, setCurrentTest] = useState<CurrentTest | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTest = () => {
      const testData = localStorage.getItem('currentTest')
      if (!testData) {
        router.push(`/courses/${params.course_name}`)
        return
      }

      try {
        const test = JSON.parse(testData)
        if (test.course_name !== params.course_name) {
          throw new Error('Test is for a different course')
        }
        setCurrentTest(test)
      } catch (error) {
        console.error('Error loading test:', error)
        toast({
          title: "Error",
          description: "Failed to load test. Please try again.",
          variant: "destructive",
        })
        router.push(`/courses/${params.course_name}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadTest()
  }, [])

  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true)
  }

  const handleAnswerResponse = async (isCorrect: boolean) => {
    if (!currentTest) return

    const currentQuestion = currentTest.questions[currentQuestionIndex]
    
    // Update local state
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: isCorrect
    }))

    // Update question status in database
    try {
      const { error } = await supabase
        .from('questions')
        .update({ done: isCorrect })
        .eq('id', currentQuestion.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating question status:', error)
      toast({
        variant: "destructive",
        title: "Failed to update question status"
      })
    }

    // Move to next question or finish test
    if (currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setIsAnswerRevealed(false)
    } else {
      // Calculate final score
      const correctAnswers = Object.values(answers).filter(answer => answer === true).length
      const totalQuestions = currentTest.questions.length
      const score = Math.round((correctAnswers / totalQuestions) * 100)

      // Save test results to localStorage
      const results = {
        course_name: currentTest.course_name,
        startTime: currentTest.startTime,
        endTime: new Date().toISOString(),
        answers: Object.entries(answers).map(([questionId, isCorrect]) => ({
          questionId,
          isCorrect
        })),
        score
      }
      localStorage.setItem('lastTestResults', JSON.stringify(results))

      // Show score toast
      toast({
        title: "Test completed!",
        description: `Score: ${score}%`
      })

      // Navigate to results
      router.push(`/courses/${params.course_name}/tests/results`)
    }
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="h-[60vh] flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse font-light">Loading test...</p>
        </div>
      </div>
    )
  }

  if (!currentTest || currentTest.questions.length === 0) {
    return (
      <div className="container">
        <Card className="border-red-100 bg-red-50/30">
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-red-500/70 font-light">
                No test in progress. Please start a new test.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = currentTest.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / currentTest.questions.length) * 100
  const correctAnswers = Object.values(answers).filter(Boolean).length
  const accuracy = Object.keys(answers).length > 0
    ? Math.round((correctAnswers / Object.keys(answers).length) * 100)
    : 0

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.push(`/courses/${params.course_name}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Question {currentQuestionIndex + 1} of {currentTest.questions.length}
          </Badge>
          <Badge variant="outline">
            Score: {accuracy}%
          </Badge>
        </div>
      </div>

      <Progress value={progress} className="w-full" />

      <Card>
        <CardHeader>
          <CardTitle>Practice Test</CardTitle>
          <CardDescription>
            {currentTest.category && `Category: ${currentTest.category}`}
            {currentTest.year && ` • Year: ${currentTest.year}`}
            {currentTest.professor && ` • Professor: ${currentTest.professor}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {currentQuestion.question}
            </h3>
            {currentQuestion.category && (
              <Badge variant="secondary">
                {currentQuestion.category}
              </Badge>
            )}
            {currentQuestion.year && (
              <Badge variant="secondary">
                {currentQuestion.year}
              </Badge>
            )}
            {currentQuestion.professor && (
              <Badge variant="secondary">
                {currentQuestion.professor}
              </Badge>
            )}
          </div>

          {isAnswerRevealed ? (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{currentQuestion.answer}</p>
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  className={cn(
                    answers[currentQuestion.id] === false 
                      ? "bg-red-900 hover:bg-red-900 text-white"
                      : "hover:bg-red-100"
                  )}
                  onClick={() => handleAnswerResponse(false)}
                >
                  Incorrect
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    answers[currentQuestion.id] === true 
                      ? "bg-green-900 hover:bg-green-900 text-white"
                      : "hover:bg-green-100"
                  )}
                  onClick={() => handleAnswerResponse(true)}
                >
                  Correct
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleRevealAnswer}
              >
                Reveal Answer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 