'use client'

export class PinAuth {
  private static readonly PIN_KEY = 'user_pin'
  private static readonly USER_ID_KEY = 'user_id'
  private static readonly SESSION_KEY = 'session_active'
  private static readonly LAST_ACTIVITY_KEY = 'last_activity'
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

  static setPin(pin: string): string {
    const userId = crypto.randomUUID()
    localStorage.setItem(this.PIN_KEY, pin)
    localStorage.setItem(this.USER_ID_KEY, userId)
    localStorage.setItem(this.SESSION_KEY, 'true')
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString())
    return userId
  }

  static verifyPin(pin: string): boolean {
    const storedPin = localStorage.getItem(this.PIN_KEY)
    if (storedPin === pin) {
      localStorage.setItem(this.SESSION_KEY, 'true')
      localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString())
      return true
    }
    return false
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
    return !!localStorage.getItem(this.PIN_KEY)
  }

  static logout(): void {
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.LAST_ACTIVITY_KEY)
  }

  static clearAll(): void {
    localStorage.removeItem(this.PIN_KEY)
    localStorage.removeItem(this.USER_ID_KEY)
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.LAST_ACTIVITY_KEY)
  }
}