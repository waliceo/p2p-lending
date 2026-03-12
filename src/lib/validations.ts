import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const loanSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100).default(0),
  repaymentFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  gracePeriodDays: z.number().int().min(0).default(0),
  lateFeeAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  counterpartyEmail: z.string().email('Please enter a valid email'),
  initiatorRole: z.enum(['BORROWER', 'LENDER']),
})

export const recordPaymentSchema = z.object({
  amountPaid: z.number().positive('Amount must be greater than 0'),
  paidDate: z.string().min(1, 'Payment date is required'),
  method: z.enum(['MANUAL', 'BANK_TRANSFER', 'OTHER']).default('MANUAL'),
  notes: z.string().optional(),
})

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type LoanInput = z.infer<typeof loanSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
export type ProfileInput = z.infer<typeof profileSchema>
