// User Types
export type UserRole = 'farm' | 'graduate' | 'student' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  full_name?: string
  phone?: string
  created_at: string
  updated_at: string
}

// Profile Types (extends User)
export interface Profile extends User {
  // Farm-specific
  farm_name?: string
  farm_type?: 'small' | 'medium' | 'large' | 'agro_processing' | 'research'
  farm_location?: string
  farm_address?: string
  
  // Graduate/Student-specific
  institution_name?: string
  institution_type?: 'university' | 'training_college'
  qualification?: string
  specialization?: 'crop' | 'livestock' | 'agribusiness' | 'other'
  graduation_year?: number
  preferred_region?: string
  nss_status?: 'not_applicable' | 'pending' | 'active' | 'completed'
  
  // Verification
  is_verified: boolean
  verified_at?: string
  verified_by?: string
  
  // Documents
  certificate_url?: string
  transcript_url?: string
  cv_url?: string
  nss_letter_url?: string
}

// Job Types
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
  created_at: string
  updated_at: string
  expires_at?: string
  max_applications?: number
  application_count: number
}

// Application Types
export interface Application {
  id: string
  job_id: string
  applicant_id: string
  cover_letter?: string
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn'
  match_score: number
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  updated_at: string
}

// Placement Types
export interface Placement {
  id: string
  application_id: string
  job_id: string
  farm_id: string
  graduate_id: string
  start_date?: string
  end_date?: string
  status: 'pending' | 'training' | 'active' | 'completed' | 'terminated'
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

// Training Session Types
export interface TrainingSession {
  id: string
  title: string
  description?: string
  session_type: 'orientation' | 'pre_employment' | 'quarterly' | 'custom'
  zoom_link?: string
  zoom_meeting_id?: string
  zoom_password?: string
  scheduled_at: string
  duration_minutes: number
  created_by?: string
  created_at: string
}

export interface TrainingAttendance {
  id: string
  session_id: string
  participant_id: string
  attended: boolean
  joined_at?: string
  left_at?: string
  attendance_duration_minutes?: number
  created_at: string
}

// Notification Types
export interface Notification {
  id: string
  user_id: string
  type: 'job_posted' | 'application_received' | 'application_status' | 'match_found' | 'training_scheduled' | 'payment_required' | 'placement_confirmed'
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

// Message Types
export interface Conversation {
  id: string
  farm_id: string
  graduate_id: string
  job_id?: string
  last_message_at: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
}

// Payment Types
export interface Payment {
  id: string
  placement_id: string
  farm_id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  payment_reference?: string
  paystack_reference?: string
  payment_method?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

// Match Types
export interface MatchResult {
  applicant_id: string
  job_id: string
  match_score: number
  reasons?: string[]
}
