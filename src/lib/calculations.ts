import { RepaymentFrequency } from '@prisma/client'
import { addWeeks, addMonths, addDays, differenceInWeeks, differenceInMonths, isAfter, isBefore } from 'date-fns'

interface RepaymentScheduleInput {
  amount: number
  interestRate: number
  repaymentFrequency: RepaymentFrequency
  startDate: Date
  endDate: Date
}

export interface ScheduledPayment {
  dueDate: Date
  amountDue: number
  principal: number
  interest: number
  remainingBalance: number
}

/**
 * Calculates a flat repayment schedule with simple interest.
 * Total = Principal + (Principal × Rate / 100 × Term in years)
 * Each payment = Total / Number of periods
 */
export function calculateRepaymentSchedule(input: RepaymentScheduleInput): ScheduledPayment[] {
  const { amount, interestRate, repaymentFrequency, startDate, endDate } = input

  // Calculate number of payment periods
  const periods = getNumberOfPeriods(startDate, endDate, repaymentFrequency)
  if (periods <= 0) return []

  // Calculate total interest (simple interest)
  const termInYears = differenceInDays(endDate, startDate) / 365
  const totalInterest = amount * (interestRate / 100) * termInYears
  const totalAmount = amount + totalInterest

  // Calculate per-period amounts
  const paymentAmount = Math.round((totalAmount / periods) * 100) / 100
  const principalPerPayment = Math.round((amount / periods) * 100) / 100
  const interestPerPayment = Math.round((totalInterest / periods) * 100) / 100

  const schedule: ScheduledPayment[] = []
  let currentDate = new Date(startDate)
  let remainingBalance = totalAmount

  for (let i = 0; i < periods; i++) {
    currentDate = getNextPaymentDate(currentDate, repaymentFrequency)

    // Adjust last payment for rounding differences
    const isLastPayment = i === periods - 1
    const thisPayment = isLastPayment ? remainingBalance : paymentAmount
    const thisPrincipal = isLastPayment ? amount - (principalPerPayment * (periods - 1)) : principalPerPayment
    const thisInterest = isLastPayment ? totalInterest - (interestPerPayment * (periods - 1)) : interestPerPayment

    remainingBalance = Math.round((remainingBalance - thisPayment) * 100) / 100

    schedule.push({
      dueDate: new Date(currentDate),
      amountDue: Math.round(thisPayment * 100) / 100,
      principal: Math.round(thisPrincipal * 100) / 100,
      interest: Math.round(thisInterest * 100) / 100,
      remainingBalance: Math.max(0, remainingBalance),
    })
  }

  return schedule
}

function getNumberOfPeriods(start: Date, end: Date, frequency: RepaymentFrequency): number {
  switch (frequency) {
    case 'WEEKLY':
      return Math.max(1, differenceInWeeks(end, start))
    case 'BIWEEKLY':
      return Math.max(1, Math.floor(differenceInWeeks(end, start) / 2))
    case 'MONTHLY':
      return Math.max(1, differenceInMonths(end, start))
    case 'QUARTERLY':
      return Math.max(1, Math.floor(differenceInMonths(end, start) / 3))
    case 'CUSTOM':
      return Math.max(1, differenceInMonths(end, start))
    default:
      return differenceInMonths(end, start)
  }
}

function getNextPaymentDate(current: Date, frequency: RepaymentFrequency): Date {
  switch (frequency) {
    case 'WEEKLY':
      return addWeeks(current, 1)
    case 'BIWEEKLY':
      return addWeeks(current, 2)
    case 'MONTHLY':
      return addMonths(current, 1)
    case 'QUARTERLY':
      return addMonths(current, 3)
    case 'CUSTOM':
      return addMonths(current, 1)
    default:
      return addMonths(current, 1)
  }
}

function differenceInDays(end: Date, start: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Calculates statistics for a loan given its payments
 */
export function calculateLoanStats(payments: { amountDue: number; amountPaid: number; status: string }[]) {
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amountDue), 0)
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid), 0)
  const remainingBalance = totalAmount - totalPaid
  const completedPayments = payments.filter(p => p.status === 'PAID').length
  const latePayments = payments.filter(p => p.status === 'LATE' || p.status === 'MISSED').length
  const progressPercent = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    remainingBalance: Math.round(remainingBalance * 100) / 100,
    completedPayments,
    totalPayments: payments.length,
    latePayments,
    progressPercent,
  }
}
