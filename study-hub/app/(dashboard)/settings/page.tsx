"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Bell, Lock, User } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Profile settings
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [testReminders, setTestReminders] = useState(true)
  const [studyReminders, setStudyReminders] = useState(true)
  const [progressUpdates, setProgressUpdates] = useState(true)

  // Password settings
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchUserData = async () => {
      try {
        // For demonstration, we'll use mock data
        setEmail(user.email || "")
        setFullName("John Doe") // In a real app, fetch this from profiles table
        setLoading(false)
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred")
        console.error(err)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // In a real app, update the profile in the database
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      setSuccess("Profile updated successfully")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setSaving(false)
      return
    }

    try {
      // In a real app, update the password using Supabase Auth
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      setSuccess("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // In a real app, update notification preferences in the database
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
      setSuccess("Notification preferences updated successfully")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-500/15">
          <AlertCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-500">Success</AlertTitle>
          <AlertDescription className="text-green-500">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" /> Profile Information
              </CardTitle>
              <CardDescription>Update your account profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">Your email cannot be changed</p>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="mr-2 h-5 w-5" /> Change Password
              </CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" /> Notification Settings
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="testReminders">Test Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminders about upcoming tests</p>
                  </div>
                  <Switch
                    id="testReminders"
                    checked={testReminders}
                    onCheckedChange={setTestReminders}
                    disabled={!emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="studyReminders">Study Session Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminders about scheduled study sessions</p>
                  </div>
                  <Switch
                    id="studyReminders"
                    checked={studyReminders}
                    onCheckedChange={setStudyReminders}
                    disabled={!emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="progressUpdates">Progress Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive weekly progress reports</p>
                  </div>
                  <Switch
                    id="progressUpdates"
                    checked={progressUpdates}
                    onCheckedChange={setProgressUpdates}
                    disabled={!emailNotifications}
                  />
                </div>
              </div>

              <Button onClick={handleNotificationUpdate} disabled={saving}>
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
