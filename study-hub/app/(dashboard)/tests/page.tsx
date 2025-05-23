"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, Plus, Search } from "lucide-react"
import { format } from "date-fns"

interface Test {
  id: string
  title: string
  description: string
  difficulty: number
  scheduled_date: string | null
  completed: boolean
  subject: {
    name: string
  }
}

interface DatabaseTest {
  id: string
  title: string
  description: string
  difficulty: number
  scheduled_date: string | null
  completed: boolean
  subject: string
}

export default function TestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchTests = async () => {
      try {
        const { data, error: supabaseError } = await supabase
          .from("user_tests")
          .select(`
            id,
            title,
            description,
            difficulty,
            scheduled_date,
            completed,
            subject:subject_id(name)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (supabaseError) {
          setError(supabaseError.message)
          return
        }

        if (data) {
          const formattedTests: Test[] = data.map(test => ({
            ...test,
            subject: {
              name: typeof test.subject === 'string' ? test.subject : 'Unknown Subject'
            }
          }))
          setTests(formattedTests)
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching tests")
        if (err instanceof Error) {
          console.error("Error fetching tests:", err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTests()
  }, [user, router])

  const filteredTests = tests.filter(
    (test) =>
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.subject.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const pendingTests = filteredTests.filter((test) => !test.completed)
  const completedTests = filteredTests.filter((test) => test.completed)

  if (!mounted) {
    return null
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>
  }

  const formatScheduledDate = (date: string) => {
    try {
      return format(new Date(date), "PPP")
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tests</h1>
        <Button onClick={() => router.push("/tests/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create Test
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingTests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTests.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-4">
          {pendingTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No pending tests</p>
              <Button variant="outline" onClick={() => router.push("/tests/create")}>
                Create a Test
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingTests.map((test) => (
                <Card key={test.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{test.title}</CardTitle>
                        <CardDescription className="mt-1">{test.subject.name}</CardDescription>
                      </div>
                      <Badge variant="outline">Difficulty: {test.difficulty}/5</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {test.description || "No description provided."}
                    </p>
                    {test.scheduled_date && (
                      <div className="flex items-center mt-2 text-sm">
                        <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Scheduled for {formatScheduledDate(test.scheduled_date)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="default" className="w-full" onClick={() => router.push(`/tests/${test.id}`)}>
                      Start Test
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          {completedTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No completed tests</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedTests.map((test) => (
                <Card key={test.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{test.title}</CardTitle>
                        <CardDescription className="mt-1">{test.subject.name}</CardDescription>
                      </div>
                      <Badge variant="outline">Difficulty: {test.difficulty}/5</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {test.description || "No description provided."}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/tests/${test.id}/results`)}
                    >
                      View Results
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
