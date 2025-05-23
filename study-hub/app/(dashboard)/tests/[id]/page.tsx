"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Question = {
  id: string
  question: string
  answers: {
    id: string
    text: string
    isCorrect: boolean
  }[]
}

type Test = {
  id: string
  title: string
  description: string
  subject: string
}

export default function TestPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchTest = async () => {
      try {
        // For demonstration, we'll create mock data
        const mockTest: Test = {
          id: params.id,
          title: "Mathematics Final Exam",
          description: "Comprehensive test covering algebra, geometry, and calculus",
          subject: "Mathematics",
        }

        const mockQuestions: Question[] = [
          {
            id: "q1",
            question: "What is the solution to the equation 2x + 5 = 15?",
            answers: [
              { id: "a1", text: "x = 5", isCorrect: true },
              { id: "a2", text: "x = 7", isCorrect: false },
              { id: "a3", text: "x = 10", isCorrect: false },
              { id: "a4", text: "x = 3", isCorrect: false },
            ],
          },
          {
            id: "q2",
            question: "What is the derivative of f(x) = x² + 3x?",
            answers: [
              { id: "a5", text: "f'(x) = 2x", isCorrect: false },
              { id: "a6", text: "f'(x) = 2x + 3", isCorrect: true },
              { id: "a7", text: "f'(x) = x² + 3", isCorrect: false },
              { id: "a8", text: "f'(x) = 2x² + 3", isCorrect: false },
            ],
          },
          {
            id: "q3",
            question: "What is the area of a circle with radius 5?",
            answers: [
              { id: "a9", text: "25π", isCorrect: true },
              { id: "a10", text: "10π", isCorrect: false },
              { id: "a11", text: "5π", isCorrect: false },
              { id: "a12", text: "15π", isCorrect: false },
            ],
          },
          {
            id: "q4",
            question: "Solve for x: log₁₀(x) = 2",
            answers: [
              { id: "a13", text: "x = 10", isCorrect: false },
              { id: "a14", text: "x = 20", isCorrect: false },
              { id: "a15", text: "x = 100", isCorrect: true },
              { id: "a16", text: "x = 1000", isCorrect: false },
            ],
          },
          {
            id: "q5",
            question: "What is the value of sin(90°)?",
            answers: [
              { id: "a17", text: "0", isCorrect: false },
              { id: "a18", text: "1", isCorrect: true },
              { id: "a19", text: "-1", isCorrect: false },
              { id: "a20", text: "√2/2", isCorrect: false },
            ],
          },
        ]

        setTest(mockTest)
        setQuestions(mockQuestions)
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTest()
  }, [user, router, params.id])

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerId,
    })
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowResults(true)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const calculateScore = () => {
    let correctCount = 0
    questions.forEach((question) => {
      const selectedAnswerId = selectedAnswers[question.id]
      if (selectedAnswerId) {
        const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId)
        if (selectedAnswer?.isCorrect) {
          correctCount++
        }
      }
    })
    return {
      correct: correctCount,
      total: questions.length,
      percentage: Math.round((correctCount / questions.length) * 100),
    }
  }

  const isAnswerCorrect = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    const selectedAnswerId = selectedAnswers[questionId]
    if (!question || !selectedAnswerId) return false

    const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId)
    return selectedAnswer?.isCorrect || false
  }

  const getCorrectAnswer = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    if (!question) return ""

    const correctAnswer = question.answers.find((a) => a.isCorrect)
    return correctAnswer?.text || ""
  }

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

  if (!test) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Test Not Found</AlertTitle>
          <AlertDescription>The test you're looking for doesn't exist or you don't have access to it.</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/tests")}>
          Back to Tests
        </Button>
      </div>
    )
  }

  if (showResults) {
    const score = calculateScore()

    return (
      <div className="max-w-2xl mx-auto py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Test Results</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{test.title}</CardTitle>
            <CardDescription>{test.subject}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{score.percentage}%</div>
              <p className="text-muted-foreground">
                You got {score.correct} out of {score.total} questions correct
              </p>
            </div>
            <Progress value={score.percentage} className="h-2 mt-2" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/tests")}>
              Back to Tests
            </Button>
            <Button onClick={() => router.push("/progress")}>View Progress</Button>
          </CardFooter>
        </Card>

        <h2 className="text-xl font-bold mb-4">Question Review</h2>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className={isAnswerCorrect(question.id) ? "border-green-500" : "border-red-500"}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  {isAnswerCorrect(question.id) ? (
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
                <div className="space-y-2">
                  {question.answers.map((answer) => {
                    const isSelected = selectedAnswers[question.id] === answer.id
                    const isCorrect = answer.isCorrect

                    return (
                      <div
                        key={answer.id}
                        className={`p-2 rounded-md ${
                          isSelected && isCorrect
                            ? "bg-green-100 dark:bg-green-900/20"
                            : isSelected && !isCorrect
                              ? "bg-red-100 dark:bg-red-900/20"
                              : !isSelected && isCorrect
                                ? "bg-green-100 dark:bg-green-900/20"
                                : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSelected && isCorrect && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-500" />}
                          {!isSelected && isCorrect && <CheckCircle className="h-4 w-4 text-green-500" />}
                          <span
                            className={`text-sm ${
                              isSelected && isCorrect
                                ? "font-medium"
                                : isSelected && !isCorrect
                                  ? "font-medium"
                                  : !isSelected && isCorrect
                                    ? "font-medium"
                                    : ""
                            }`}
                          >
                            {answer.text}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!isAnswerCorrect(question.id) && (
                  <div className="mt-4 p-2 bg-muted rounded-md">
                    <p className="text-sm font-medium">Correct Answer:</p>
                    <p className="text-sm">{getCorrectAnswer(question.id)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{test.title}</h1>
        <Button variant="outline" onClick={() => setShowResults(true)}>
          Finish Test
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedAnswers[currentQuestion.id] || ""}
            onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
            className="space-y-3"
          >
            {currentQuestion.answers.map((answer) => (
              <div key={answer.id} className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value={answer.id} id={answer.id} />
                <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                  {answer.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button onClick={handleNextQuestion} disabled={!selectedAnswers[currentQuestion.id]}>
            {currentQuestionIndex < questions.length - 1 ? (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Finish"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
