import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(
  date: string | null | undefined,
  pattern: string = 'dd MMM yyyy'
): string {
  if (date == null || date === '') return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date)
    if (Number.isNaN(d.getTime())) return '-'
    return format(d, pattern)
  } catch {
    return '-'
  }
}

export function timeAgo(date: string): string {
  try {
    const d = parseISO(date)
    if (Number.isNaN(d.getTime())) return '-'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '-'
  }
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'GHS'
): string {
  if (amount == null || Number.isNaN(amount)) return '-'
  const formatted = new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  return `${currency} ${formatted}`
}

export function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string = 'GHS'
): string {
  if (min == null && max == null) return 'Salary negotiable'
  if (min != null && max != null) {
    const fmt = new Intl.NumberFormat('en-GH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    return `${currency} ${fmt.format(min)} - ${fmt.format(max)}`
  }
  if (min != null) return `${formatCurrency(min, currency)}+`
  return `Up to ${formatCurrency(max, currency)}`
}

export function getInitials(name: string | null | undefined): string {
  if (name == null || name.trim() === '') return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function truncate(str: string, length: number = 120): string {
  if (str.length <= length) return str
  return `${str.slice(0, length).trim()}...`
}

export { GHANA_REGIONS } from './locations'

export const JOB_TYPES: { value: string; label: string }[] = [
  { value: 'farm_hand', label: 'Farm Hand' },
  { value: 'farm_manager', label: 'Farm Manager' },
  { value: 'intern', label: 'Internship' },
  { value: 'nss', label: 'NSS' },
  { value: 'data_collector', label: 'Data Collector' },
]

export const ROLE_LABELS: Record<string, string> = {
  farm: 'Farm / Employer',
  graduate: 'Graduate',
  student: 'Student',
  skilled: 'Skilled Worker',
  admin: 'Administrator',
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  terminated: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-700',
  closed: 'bg-gray-100 text-gray-700',
  paused: 'bg-gray-100 text-gray-700',
  filled: 'bg-gray-100 text-gray-700',
  completed: 'bg-blue-100 text-blue-800',
}
