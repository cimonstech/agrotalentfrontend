export type UserRole = 'farm' | 'graduate' | 'student' | 'skilled' | 'admin'

export interface Profile {
  id: string
  email: string
  role: UserRole
  full_name?: string | null
  phone?: string | null
  created_at?: string | null
  updated_at?: string | null
  farm_name?: string | null
  farm_logo_url?: string | null
  farm_type?: string | null
  farm_location?: string | null
  farm_address?: string | null
  institution_name?: string | null
  institution_type?: string | null
  qualification?: string | null
  specialization?: string | null
  graduation_year?: number | null
  preferred_region?: string | null
  nss_status?: string | null
  is_verified?: boolean | null
  verified_at?: string | null
  verified_by?: string | null
  certificate_url?: string | null
  transcript_url?: string | null
  cv_url?: string | null
  nss_letter_url?: string | null
  years_of_experience?: number | null
  experience_description?: string | null
  crops_experience?: string[] | null
  livestock_experience?: string[] | null
  skills?: string | null
  previous_employer?: string | null
  reference_name?: string | null
  reference_phone?: string | null
  reference_relationship?: string | null
}

export interface Job {
  id: string
  farm_id: string
  title: string
  description: string
  job_type: 'farm_hand' | 'farm_manager' | 'intern' | 'nss' | 'data_collector'
  location: string
  address?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  required_qualification?: string
  required_institution_type?: 'university' | 'training_college' | 'any'
  required_experience_years?: number
  required_specialization?: string
  status: 'draft' | 'active' | 'paused' | 'filled' | 'closed'
  status_changed_at?: string | null
  created_at: string
  updated_at: string
  expires_at?: string
  max_applications?: number
  application_count: number
}

export interface Application {
  id: string
  job_id: string
  applicant_id: string
  cover_letter?: string
  status:
    | 'pending'
    | 'reviewing'
    | 'reviewed'
    | 'shortlisted'
    | 'accepted'
    | 'rejected'
    | 'withdrawn'
  match_score: number
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  updated_at: string
}

export interface Placement {
  id: string
  application_id: string
  job_id: string
  farm_id: string
  graduate_id: string
  start_date?: string
  end_date?: string
  status: 'pending' | 'active' | 'completed' | 'terminated'
  training_completed: boolean
  training_completed_at?: string
  zoom_session_attended: boolean
  recruitment_fee_paid: boolean
  recruitment_fee_amount: number
  recruitment_fee_paid_at?: string
  payment_reference?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  placement_id: string
  farm_id: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_reference?: string
  paystack_reference?: string
  payment_method?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

export interface TrainingSession {
  id: string
  title: string
  description?: string
  session_type: 'orientation' | 'pre_employment' | 'quarterly' | 'custom'
  category?: string | null
  region?: string | null
  trainer_name?: string | null
  trainer_type?: string | null
  attendance_method?: string | null
  zoom_link?: string
  zoom_meeting_id?: string
  zoom_password?: string
  scheduled_at: string
  duration_minutes: number
  created_by?: string
  created_at: string
}

export interface TrainingParticipant {
  id: string
  session_id: string
  participant_id: string
  assigned_by?: string | null
  assigned_at?: string | null
  attendance_status?: string | null
  checked_in_at?: string | null
  notes?: string | null
}

export interface Document {
  id: string
  user_id: string
  document_type: string
  file_name: string
  file_url: string
  file_size?: number | null
  mime_type?: string | null
  uploaded_at?: string | null
  created_at: string
  updated_at: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string | null
  reviewed_at?: string | null
  rejection_reason?: string | null
}

export interface Notice {
  id: string
  title: string
  body_html: string
  link?: string | null
  audience: 'all' | 'farm' | 'graduate' | 'student' | 'skilled'
  created_by: string
  created_at: string
  attachments: { name: string; url: string }[]
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  phone?: string | null
  subject: string
  message: string
  status: string
  replied_at?: string | null
  created_at: string
}

export interface CommunicationLog {
  id: string
  type: string
  recipients: string
  subject?: string | null
  message: string
  recipient_count: number
  success_count: number
  failure_count: number
  status: string
  error_details?: unknown
  created_by?: string | null
  created_at: string
}

export interface EmailLog {
  id: string
  recipient_email: string
  recipient_name: string | null
  subject: string
  type: string
  status: 'sent' | 'failed'
  error_message: string | null
  metadata: Record<string, unknown>
  sent_at: string
  created_at: string
}

export interface SystemSetting {
  id: string
  key: string
  value: Record<string, unknown>
  updated_by?: string | null
  updated_at: string
}

export interface MatchResult {
  applicant_id: string
  job_id: string
  match_score: number
  reasons?: string[]
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
