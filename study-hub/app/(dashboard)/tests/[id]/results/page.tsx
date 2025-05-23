"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

type Question = {
  id: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
}

type TestResult = {
  id: string
  title: string
  description: string
  subject: string
  completedAt: string
  score: {
    correct: number
    total: number
    percentage: number
  }
  questions: Question[]
}

export default function TestResultsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchTestResult = async () => {
      try {
        // For demonstration, we'll create mock data
        const mockTestResult: TestResult = {
          id: params.id,
          title: "Mathematics Final Exam",
          description: "Comprehensive test covering algebra, geometry, and calculus",
          subject: "Mathematics",
          completedAt: new Date().toISOString(),
          score: {
            correct: 4,
            total: 5,
            percentage: 80,
          },
          questions: [
            {
              id: "q1",
              question: "What is the solution to the equation 2x + 5 = 15?",
              userAnswer: "x = 5",
              correctAnswer: "x = 5",
              isCorrect: true,
            },
            {
              id: "q2",
              question: "What is the derivative of f(x) = x² + 3x?",
              userAnswer: "f'(x) = 2x + 3",
              correctAnswer: "f'(x) = 2x + 3",
              isCorrect: true,
            },
            {
              id: "q3",
              question: "What is the area of a circle with radius 5?",
              userAnswer: "25π",
              correctAnswer: "25π",
              isCorrect: true,
            },
            {
              id: "q4",
              question: "Solve for x: log₁₀(x) = 2",
              userAnswer: "x = 10",
              correctAnswer: "x = 100",
              isCorrect: false,
            },
            {
              id: "q5",
              question: "What is the value of sin(90°)?",
              userAnswer: "1",
              correctAnswer: "1",
              isCorrect: true,
            },
          ],
        }

        setTestResult(mockTestResult)
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTestResult()
  }, [user, router, params.id])

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/tests")}>
          Back to Tests
        </Button>
      </div>
    )
  }

  if (!testResult) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Test Result Not Found</AlertTitle>
          <AlertDescription>
            The test result you're looking for doesn't exist or you don't have access to it.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/tests")}>
          Back to Tests
        </Button>
      </div>
    )
  }

  const pieData = [
    { name: "Correct", value: testResult.score.correct, color: "#22c55e" },
    { name: "Incorrect", value: testResult.score.total - testResult.score.correct, color: "#ef4444" },
  ]

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" className="mr-4" onClick={() => router.push("/tests")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tests
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Test Results</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{testResult.title}</CardTitle>
          <CardDescription>{testResult.subject}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{testResult.score.percentage}%</div>
              <p className="text-muted-foreground">
                You got {testResult.score.correct} out of {testResult.score.total} questions correct
              </p>
            </div>
            <Progress value={testResult.score.percentage} className="h-2 mt-2" />
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mb-4">Question Review</h2>

      <div className="space-y-4">
        {testResult.questions.map((question, index) => (
          <Card key={question.id} className={question.isCorrect ? "border-green-500" : "border-red-500"}>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2">
                {question.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                )}
                <div>
                  <CardTitle className="text-base">Question {index + 1}</CardTitle>
                  <CardDescription className="text-sm font-medium mt-1">{question.question}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Your Answer:</p>
                  <div
                    className={`p-2 rounded-md ${
                      question.isCorrect ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {question.isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">{question.userAnswer}</span>
                    </div>
                  </div>
                </div>

                {!question.isCorrect && (
                  <div>
                    <p className="text-sm font-medium">Correct Answer:</p>
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-md">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{question.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
