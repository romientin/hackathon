import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle, LineChart, Calendar } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center justify-center">
          <BookOpen className="h-6 w-6 mr-2" />
          <span className="font-bold">Study Hub</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
            Log In
          </Link>
          <Link href="/register" className="text-sm font-medium hover:underline underline-offset-4">
            Sign Up
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Master Your Exams with Personalized Study Tests
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Create customized tests, track your progress, and optimize your study schedule all in one place.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="w-full">
                      Log In
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto flex items-center justify-center">
                <div className="rounded-lg border bg-background p-8 shadow-lg">
                  <div className="flex items-center gap-4">
                    <BookOpen className="h-10 w-10 text-primary" />
                    <div>
                      <h3 className="text-xl font-bold">Math Final Exam</h3>
                      <p className="text-sm text-muted-foreground">Personalized Test</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-md border p-3">
                      <p className="font-medium">Question 1</p>
                      <p className="text-sm text-muted-foreground">Solve for x: 2x + 5 = 15</p>
                      <div className="mt-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <p className="text-sm">x = 5</p>
                      </div>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="font-medium">Question 2</p>
                      <p className="text-sm text-muted-foreground">Find the derivative of f(x) = x² + 3x</p>
                      <div className="mt-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <p className="text-sm">f'(x) = 2x + 3</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Features</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to excel in your studies
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Personalized Tests</h3>
                <p className="text-center text-muted-foreground">
                  Create custom tests based on your needs and track your success or failure on each question.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Progress Tracking</h3>
                <p className="text-center text-muted-foreground">
                  Visualize your progress over time and identify areas that need improvement.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg p-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Study Schedule</h3>
                <p className="text-center text-muted-foreground">
                  Get a personalized study schedule leading up to your exam day.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">© 2023 Study Hub. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
