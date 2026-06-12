import { describe, it, expect } from 'vitest'
import { getCurrentBillingCycle, formatDateLabel } from './billingCycle'

describe('formatDateLabel', () => {
  it('should format a date in es-CL locale', () => {
    const date = new Date(2026, 5, 15)
    const result = formatDateLabel(date)
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })
})

describe('getCurrentBillingCycle', () => {
  it('should return the correct structure', () => {
    const result = getCurrentBillingCycle(new Date(2026, 5, 15))
    expect(result).toHaveProperty('cycleStart')
    expect(result).toHaveProperty('renewalDate')
    expect(result).toHaveProperty('totalDays')
    expect(result).toHaveProperty('elapsedDays')
    expect(result).toHaveProperty('remainingDays')
    expect(result).toHaveProperty('progressPct')
    expect(result).toHaveProperty('renewalDateLabel')
    expect(result).toHaveProperty('lastPaymentDateLabel')
    expect(result).toHaveProperty('previousPaymentDateLabel')
  })

  it('should start cycle on the 1st of the month', () => {
    const result = getCurrentBillingCycle(new Date(2026, 5, 15))
    expect(result.cycleStart.getDate()).toBe(1)
    expect(result.cycleStart.getMonth()).toBe(5)
    expect(result.cycleStart.getFullYear()).toBe(2026)
  })

  it('should set renewal date as the 1st of next month', () => {
    const result = getCurrentBillingCycle(new Date(2026, 5, 15))
    expect(result.renewalDate.getDate()).toBe(1)
    expect(result.renewalDate.getMonth()).toBe(6)
    expect(result.renewalDate.getFullYear()).toBe(2026)
  })

  it('should handle December to January transition', () => {
    const result = getCurrentBillingCycle(new Date(2026, 11, 15))
    expect(result.renewalDate.getMonth()).toBe(0)
    expect(result.renewalDate.getFullYear()).toBe(2027)
  })

  it('should calculate elapsed days correctly', () => {
    const result = getCurrentBillingCycle(new Date(2026, 5, 1))
    expect(result.elapsedDays).toBe(0)
  })

  it('should cap progressPct between 0 and 100', () => {
    const midCycle = new Date(2026, 5, 15)
    const result = getCurrentBillingCycle(midCycle)
    expect(result.progressPct).toBeGreaterThanOrEqual(0)
    expect(result.progressPct).toBeLessThanOrEqual(100)
  })

  it('should cap progressPct at 0 for before cycle start', () => {
    const beforeStart = new Date(2026, 4, 31)
    const result = getCurrentBillingCycle(beforeStart)
    expect(result.progressPct).toBeGreaterThanOrEqual(0)
  })

  it('totalDays should equal elapsedDays + remainingDays', () => {
    const result = getCurrentBillingCycle(new Date(2026, 5, 15))
    expect(result.elapsedDays + result.remainingDays).toBe(result.totalDays)
  })
})
