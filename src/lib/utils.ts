import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return ""
  return amount.toFixed(2)
}

export function getCurrentBusinessDate(): string {
  const now = new Date()
  const pstDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }))
  return pstDate.toISOString().split('T')[0]
}

export function formatTime(time: string | undefined): string {
  if (!time) return ""
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}