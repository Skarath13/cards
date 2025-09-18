'use client'

import { createClient } from './supabase'

export class PinAuth {
  private static readonly USER_ID_KEY = 'user_id'
  private static readonly USER_DATA_KEY = 'user_data'
  private static readonly SESSION_KEY = 'session_active'
  private static readonly LAST_ACTIVITY_KEY = 'last_activity'
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

  static async setPin(pin: string): Promise<string | null> {
    const supabase = createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, role, timezone, session_start_time, session_end_time')
      .eq('pin_code', pin)
      .single()

    if (error || !user) {
      return null
    }

    localStorage.setItem(this.USER_ID_KEY, user.id)
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user))
    localStorage.setItem(this.SESSION_KEY, 'true')
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString())
    return user.id
  }

  static async verifyPin(pin: string): Promise<boolean> {
    const supabase = createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, role, timezone, session_start_time, session_end_time')
      .eq('pin_code', pin)
      .single()

    if (error || !user) {
      return false
    }

    localStorage.setItem(this.USER_ID_KEY, user.id)
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user))
    localStorage.setItem(this.SESSION_KEY, 'true')
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString())
    return true
  }

  static isAuthenticated(): boolean {
    const sessionActive = localStorage.getItem(this.SESSION_KEY)
    const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY)

    if (!sessionActive || !lastActivity) return false

    const now = Date.now()
    const lastActivityTime = parseInt(lastActivity)

    if (now - lastActivityTime > this.SESSION_TIMEOUT) {
      this.logout()
      return false
    }

    // Update last activity
    localStorage.setItem(this.LAST_ACTIVITY_KEY, now.toString())
    return true
  }

  static getUserId(): string | null {
    if (!this.isAuthenticated()) return null
    return localStorage.getItem(this.USER_ID_KEY)
  }

  static hasPin(): boolean {
    return true // Always allow PIN entry since users exist in database
  }

  static logout(): void {
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.LAST_ACTIVITY_KEY)
  }

  static clearAll(): void {
    localStorage.removeItem(this.USER_ID_KEY)
    localStorage.removeItem(this.USER_DATA_KEY)
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.LAST_ACTIVITY_KEY)
  }

  static getUserData(): { id: string; name: string; role: string; timezone: string } | null {
    if (!this.isAuthenticated()) return null
    const userData = localStorage.getItem(this.USER_DATA_KEY)
    return userData ? JSON.parse(userData) : null
  }
}