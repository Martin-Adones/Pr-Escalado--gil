export type BillingCycle = {
  cycleStart: Date
  renewalDate: Date
  totalDays: number
  elapsedDays: number
  remainingDays: number
  progressPct: number
  renewalDateLabel: string
  lastPaymentDateLabel: string
  previousPaymentDateLabel: string
}

const DAY_MS = 1000 * 60 * 60 * 24

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function formatDateLabel(date: Date) {
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function addMonths(date: Date, months: number) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function getCurrentBillingCycle(now = new Date()): BillingCycle {
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const totalDays = Math.max(1, Math.ceil((renewalDate.getTime() - cycleStart.getTime()) / DAY_MS))
  const elapsedDays = clamp(Math.floor((now.getTime() - cycleStart.getTime()) / DAY_MS), 0, totalDays)
  const remainingDays = clamp(Math.ceil((renewalDate.getTime() - now.getTime()) / DAY_MS), 0, totalDays)
  const progressPct = clamp((elapsedDays / totalDays) * 100, 0, 100)
  const lastPaymentDate = cycleStart
  const previousPaymentDate = addMonths(cycleStart, -1)

  return {
    cycleStart,
    renewalDate,
    totalDays,
    elapsedDays,
    remainingDays,
    progressPct,
    renewalDateLabel: formatDateLabel(renewalDate),
    lastPaymentDateLabel: formatDateLabel(lastPaymentDate),
    previousPaymentDateLabel: formatDateLabel(previousPaymentDate),
  }
}
