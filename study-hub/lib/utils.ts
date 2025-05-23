import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Predefined color combinations for courses
const courseColors = [
  { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20" },
  { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
  { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
  { bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/20" },
  { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/20" },
  { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" },
  { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/20" },
]

export function getCourseColor(courseName: string) {
  // Use a simple hash function to get a consistent index for each course name
  const hash = courseName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  // Get a positive index within the courseColors array length
  const index = Math.abs(hash) % courseColors.length
  return courseColors[index]
}
