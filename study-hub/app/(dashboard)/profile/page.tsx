"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Clock, Medal, Star } from "lucide-react"

type UserStats = {
  testsCompleted: number
  questionsAnswered: number
  correctAnswers: number
  studyHours: number
  averageScore: number
  subjects: {
    name: string
    testsCompleted: number
    averageScore: number
  }[]
  recentTests: {
    id: string
    title: string
    date: string
    score: number
  }[]
  achievements: {
    id: string
    title: string
    description: string
    icon: string
    date: string
  }[]
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchUserStats = async () => {
      try {
        // For demonstration, we'll use mock data
        const mockStats: UserStats = {
          testsCompleted: 24,
          questionsAnswered: 342,
          correctAnswers: 289,
          studyHours: 48,
          averageScore: 84,
          subjects: [
            { name: 'Mathematics', testsCompleted: 10, averageScore: 87 },
            { name: 'Science', testsCompleted: 8, averageScore: 75 },
            { name: 'History', testsCompleted: 4, averageScore: 92 },
            { name: 'English', testsCompleted: 2, averageScore: 83 }
          ],
          recentTests: [
            { id: '1', title: 'Math Final Exam', date: '2023-11-15', score: 92 },
            { id: '2', title: 'Science Quiz #3', date: '2023-11-10', score: 85 },
            { id: '3', title: 'History Midterm', date: '2023-11-05', score: 78 },
            { id: '4', title: 'English Literature Test', date: '2023-10-28', score: 88 }
          ],
          achievements: [
            { 
              id: '1', 
              title: 'First Perfect Score', 
              description: 'Achieved 100% on a test', 
              icon: 'medal', 
              date: '2023-10-15' 
            },
            { 
              id: '2', 
              title: 'Study Streak', 
              description: 'Completed 7 consecutive days of study sessions', 
              icon: 'fire', 
              date: '2023-11-01' 
            },
            { 
              id: '3', 
              title: 'Subject Master', 
              description: 'Completed 10 tests in Mathematics', 
              icon: 'star', 
              date: '2023-11-12' 
            }
          ]
        };

        setStats(mockStats);
      } catch (err) {
        console.error('Error fetching user stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user, router]);

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  if (!stats) {
    return <div>Error loading profile data</div>;
  }

  const accuracy = Math.round((stats.correctAnswers / stats.questionsAnswered) * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg" alt={user?.email || ''} />
                <AvatarFallback>
                  {user?.email?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-bold">John Doe</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div className="flex space-x-2">
                <Badge variant="outline" className="text-xs">
                  <Star className="mr-1 h-3 w-3" /> Advanced
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Medal className="mr-1 h-3 w-3" /> 3 Achievements
                </Badge>
              </div>
              <Button variant="outline" className="w-full" onClick={() => router.push('/settings')}>
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Your study performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tests Completed</span>
                  </div>
                  <span className="font-bold">{stats.testsCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Average Score</span>
                  </div>
                  <span className="font-bold">{stats.averageScore}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Study Hours</span>
                  </div>
                  <span className="font-bold">{stats.studyHours} hrs</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Accuracy Rate</p>
                <div className="flex items-center justify-between">
                  <Progress value={accuracy} className="h-2" />
                  <span className="ml-2 text-sm font-bold">{accuracy}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.correctAnswers} correct out of {stats.questionsAnswered} questions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="recent">Recent Tests</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Your performance across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.subjects.map((subject) => (
                  <div key={subject.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{subject.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {subject.testsCompleted} tests completed
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={subject.averageScore} className="h-2" />
                      <span className="text-sm font-medium">{subject.averageScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tests</CardTitle>
              <CardDescription>Your most recently completed tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <h4 className="font-medium">{test.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(test.date).toLocaleDate
