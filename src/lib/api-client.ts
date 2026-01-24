// API Client for making requests to backend
// - If NEXT_PUBLIC_API_URL is a full URL, use it (e.g. http://localhost:3001)
// - Otherwise use same-origin (Next.js rewrites/proxies handle /api/*)
const RAW_API_URL = (process.env.NEXT_PUBLIC_API_URL || '').trim()
const API_URL = RAW_API_URL.startsWith('http') ? RAW_API_URL : ''

export class ApiClient {
  private baseUrl: string;
  private getAuthToken: () => Promise<string | null>;

  constructor() {
    this.baseUrl = API_URL;
    // Get auth token from Supabase session
    this.getAuthToken = async () => {
      // 1) Try auth-helpers client (cookie-based). In some setups this will be empty.
      try {
        const { createSupabaseClient } = await import('@/lib/supabase/client')
        const supabase = createSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) return session.access_token
      } catch {
        // ignore and fall back
      }

      // 2) Fallback: vanilla supabase-js client (localStorage-based)
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token || null
      } catch {
        return null
      }
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set JSON content-type when sending a non-FormData body
    const hasBody = options.body !== undefined && options.body !== null
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
    if (hasBody && !isFormData && !('Content-Type' in (headers as any)) && !('content-type' in (headers as any))) {
      headers['Content-Type'] = 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async signup(data: any) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signin(email: string, password: string) {
    return this.request('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signout() {
    return this.request('/api/auth/signout', {
      method: 'POST',
    });
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(password: string) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async verifyEmail(email: string) {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Profile endpoints
  async getProfile() {
    return this.request('/api/profile');
  }

  async updateProfile(data: any) {
    return this.request('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async uploadDocument(file: File, type: string) {
    const token = await this.getAuthToken();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${this.baseUrl}/api/profile/upload-document`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  // Jobs endpoints
  async getJobs(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return this.request(`/api/jobs?${params.toString()}`);
  }

  async createJob(data: any) {
    return this.request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Applications endpoints
  async getApplications() {
    return this.request('/api/applications');
  }

  async createApplication(data: any) {
    return this.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApplication(id: string, data: any) {
    return this.request(`/api/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Matches endpoint
  async getMatches(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return this.request(`/api/matches?${params.toString()}`);
  }

  // Notifications endpoints
  async getNotifications(unreadOnly?: boolean) {
    const params = unreadOnly ? '?unread=true' : '';
    return this.request(`/api/notifications${params}`);
  }

  async markNotificationsRead(notificationIds?: string[], markAll?: boolean) {
    return this.request('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        notification_ids: notificationIds,
        mark_all_read: markAll,
      }),
    });
  }

  // Messages endpoints
  async getMessages(conversationId?: string) {
    const params = conversationId ? `?conversation_id=${conversationId}` : '';
    return this.request(`/api/messages${params}`);
  }

  async sendMessage(data: any) {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Training endpoints
  async getTrainingSessions(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return this.request(`/api/training?${params.toString()}`);
  }

  // Admin Training (control + proof)
  async getAdminTrainings(filters?: any) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.append(key, String(value))
      })
    }
    return this.request(`/api/admin/trainings?${params.toString()}`)
  }

  async createAdminTraining(data: any) {
    return this.request('/api/admin/trainings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getAdminTraining(trainingId: string) {
    return this.request(`/api/admin/trainings/${trainingId}`)
  }

  async assignTrainingParticipants(trainingId: string, payload: any) {
    return this.request(`/api/admin/trainings/${trainingId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async updateTrainingAttendance(trainingId: string, updates: any[]) {
    return this.request(`/api/admin/trainings/${trainingId}/attendance`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    })
  }

  // Stats endpoint
  async getStats() {
    return this.request('/api/stats');
  }

  // Contact endpoint
  async submitContact(data: any) {
    return this.request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin endpoints
  async getAdminUsers(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return this.request(`/api/admin/users?${params.toString()}`);
  }

  async getAdminUser(userId: string) {
    return this.request(`/api/admin/users/${userId}`);
  }

  async createUser(data: any) {
    return this.request('/api/admin/users/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyUser(userId: string, verified: boolean) {
    return this.request(`/api/admin/verify/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ verified }),
    });
  }

  async getAdminPlacements(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return this.request(`/api/admin/placements?${params.toString()}`);
  }

  async getAdminReports(type?: string, filters?: { start_date?: string; end_date?: string }) {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)
    const qs = params.toString()
    return this.request(`/api/admin/reports${qs ? `?${qs}` : ''}`)
  }

  async getAdminContact(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return this.request(`/api/admin/contact?${params.toString()}`);
  }

  async getAdminSettings() {
    return this.request('/api/admin/settings', { method: 'GET' })
  }

  async updateAdminSettings(settings: any) {
    return this.request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async getCommunicationLogs(limit: number = 50) {
    const params = new URLSearchParams()
    params.append('limit', String(limit))
    return this.request(`/api/admin/communications/logs?${params.toString()}`)
  }

  async sendCommunication(payload: {
    type: 'email' | 'sms'
    recipients: 'all' | 'farms' | 'graduates' | 'students' | 'single'
    subject?: string
    message: string
    userId?: string
    email?: string
  }) {
    return this.request('/api/admin/communications/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async getAdminPayments(filters?: any) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.append(key, String(value))
      })
    }
    return this.request(`/api/admin/payments?${params.toString()}`)
  }
}

export const apiClient = new ApiClient();
