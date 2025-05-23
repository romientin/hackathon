"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

type TestResults = {
  course_name: string
  category: string | null
  year: string | null
  professor: string | null
  startTime: string
  endTime: string
  answers: Array<{
    questionId: string
    isCorrect: boolean
  }>
}

type PageParams = {
  course_name: string
}

export default function TestResultsPage() {
  const params = useParams<PageParams>()
  const router = useRouter()
  const [results, setResults] = useState<TestResults | null>(null)

  useEffect(() => {
    const loadResults = () => {
      const resultsData = localStorage.getItem('lastTestResults')
      if (!resultsData) {
        router.push(`/courses/${params.course_name}`)
        return
      }

      try {
        const parsedResults = JSON.parse(resultsData)
        if (parsedResults.course_name !== params.course_name) {
          throw new Error('Results are for a different course')
        }
        setResults(parsedResults)
      } catch (error) {
        console.error('Error loading results:', error)
        router.push(`/courses/${params.course_name}`)
      }
    }

    loadResults()
  }, [])

  if (!results) {
    return (
      <div className="container">
        <Card className="border-red-100 bg-red-50/30">
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-red-500/70 font-light">
                No test results found. Please take a test first.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const correctAnswers = results.answers.filter(a => a.isCorrect).length
  const totalQuestions = results.answers.length
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100)
  const duration = new Date(results.endTime).getTime() - new Date(results.startTime).getTime()
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            {results.category && `Category: ${results.category}`}
            {results.year && ` • Year: ${results.year}`}
            {results.professor && ` • Professor: ${results.professor}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">
                  {accuracy}%
                </CardTitle>
                <CardDescription>Accuracy</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">
                  {correctAnswers}/{totalQuestions}
                </CardTitle>
                <CardDescription>Questions Correct</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="flex justify-center">
            <Badge variant="outline" className="text-lg">
              Time Taken: {minutes}m {seconds}s
            </Badge>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/courses/${params.course_name}/tests/new`)}
            >
              Take Another Test
            </Button>
            <Button
              onClick={() => router.push(`/courses/${params.course_name}`)}
            >
              Back to Course
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 