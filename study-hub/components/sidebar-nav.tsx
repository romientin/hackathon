import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn, getCourseColor } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen } from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    href: string
    title: string
  }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <ScrollArea className="h-full">
      <div className={cn("space-y-2", className)} {...props}>
        {items?.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          const courseColor = getCourseColor(item.title)
          
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive && courseColor.bg,
                isActive && courseColor.text
              )}
              asChild
            >
              <Link href={item.href}>
                <BookOpen className={cn(
                  "mr-2 h-4 w-4",
                  isActive ? courseColor.text : "text-muted-foreground"
                )} />
                <span className={cn(
                  isActive ? courseColor.text : "text-muted-foreground"
                )}>
                  {item.title}
                </span>
              </Link>
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
} 