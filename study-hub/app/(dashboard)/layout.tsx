"use client";

import type React from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import { 
  Sidebar, 
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { CourseSelectDialog } from "@/components/course-select-dialog"
import { CourseSidebarList } from "@/components/course-sidebar-list"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-w-[100dvw]">
        <Sidebar className="border-r">
          <div className="flex h-[56px] items-center justify-center border-b">
            <Link 
              href="/" 
              className="flex items-center gap-2 font-semibold"
            >
              <BookOpen className="h-6 w-6" />
              <span>Study Hub</span>
            </Link>
          </div>
          <SidebarContent>
            <div className="flex flex-col gap-4 py-4">
              <div className="px-4 py-2">
                <div className="mb-4 flex items-center gap-2 px-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Courses
                  </h2>
                  <CourseSelectDialog />
                </div>
                <CourseSidebarList />
              </div>
            </div>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex w-full flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-1">
              <MainNav />
              <div className="ml-auto flex items-center gap-4">
                <ModeToggle />
                <UserNav />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="w-full px-6 py-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
