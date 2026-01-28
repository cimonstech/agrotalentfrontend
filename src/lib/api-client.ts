// API Client for making requests to backend
// Always use Next.js proxy (/api/*) for client-side requests to ensure auth works
// The proxy handles forwarding requests to the backend with proper auth headers
export class ApiClient {
  private baseUrl: string;
  private getAuthToken: () => Promise<string | null>;
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor() {
    // Always use relative URLs to go through Next.js proxy
    // This ensures authentication tokens are properly forwarded
    this.baseUrl = '';
    // Get auth token from Supabase session
    this.getAuthToken = async () => {
      // 1) Try auth-helpers client (cookie-based). In some setups this will be empty.
      try {
        const { createSupabaseClient } = await import('@/lib/supabase/client')
        const supabase = createSupabaseClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.warn('[ApiClient] Error getting session:', error)
        }
        
        if (session?.access_token) {
          return session.access_token
        }
      } catch (err) {
        console.warn('[ApiClient] Failed to get token from auth-helpers:', err)
      }

      // 2) Fallback: vanilla supabase-js client (localStorage-based)
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.warn('[ApiClient] Error getting session from fallback:', error)
        }
        
        if (session?.access_token) {
          return session.access_token
        }
      } catch (err) {
        console.warn('[ApiClient] Failed to get token from fallback:', err)
      }
      
      return null
    };
  }

  private async request(endpoint: string, options: RequestInit = {}, providedToken?: string | null, useCache: boolean = true) {
    // Check cache for GET requests
    const cacheKey = `${options.method || 'GET'}:${endpoint}`
    if (useCache && (options.method === 'GET' || !options.method)) {
      const cached = this.requestCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data
      }
    }

    // Deduplicate concurrent requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)
    }

    const requestPromise = this._executeRequest(endpoint, options, providedToken, cacheKey)
    this.pendingRequests.set(cacheKey, requestPromise)
    
    try {
      const result = await requestPromise
      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  private async _executeRequest(endpoint: string, options: RequestInit = {}, providedToken?: string | null, cacheKey?: string) {
    let token = providedToken;
    
    // If no token provided, try to get it
    if (!token) {
      token = await this.getAuthToken();
      
      // If still no token, try one more time with a small delay (sometimes session needs a moment)
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 100))
        token = await this.getAuthToken()
      }
    }
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    // Only set JSON content-type when sending a non-FormData body
    const hasBody = options.body !== undefined && options.body !== null
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
    if (hasBody && !isFormData && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers: headers as HeadersInit,
        signal: controller.signal,
      });

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || 'Request failed' };
        }
        
        // If 401 and we had a token, session is invalid - trigger sign out
        if (response.status === 401 && token) {
          console.warn('[ApiClient] Got 401 with token, session is invalid - triggering sign out');
          try {
            const { createSupabaseClient } = await import('@/lib/supabase/client');
            const supabase = createSupabaseClient();
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('[ApiClient] Failed to sign out on 401:', signOutError);
          }
        }
        
        throw new Error(error.error || `HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Cache GET requests
      if (cacheKey && (options.method === 'GET' || !options.method)) {
        this.requestCache.set(cacheKey, { data, timestamp: Date.now() })
      }
      
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Ignore abort errors silently
      if (error?.name === 'AbortError') {
        throw error
      }
      
      throw error
    }
  }

  // Clear cache (useful after mutations)
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.requestCache.keys()) {
        if (key.includes(pattern)) {
          this.requestCache.delete(key)
        }
      }
    } else {
      this.requestCache.clear()
    }
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
    const result = await this.request('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, undefined, false);
    this.clearCache('/api/profile');
    return result;
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
    const result = await this.request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }, undefined, false);
    this.clearCache('/api/jobs');
    return result;
  }

  async updateJob(id: string, data: any) {
    const result = await this.request(`/api/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, undefined, false);
    this.clearCache('/api/jobs');
    return result;
  }

  // Applications endpoints
  async getApplications(token?: string | null) {
    // If token is provided, use it directly; otherwise get it from session
    if (token) {
      return this.request('/api/applications', {}, token);
    }
    return this.request('/api/applications');
  }

  async getApplicants(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
      });
    }
    const qs = params.toString();
    return this.request(`/api/applicants${qs ? `?${qs}` : ''}`);
  }

  async createApplication(data: any) {
    // Validate required fields
    if (!data || !data.job_id) {
      throw new Error('Job ID is required');
    }
    
    return this.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        job_id: data.job_id,
        cover_letter: data.cover_letter || null
      }),
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

  async getAdminJobs(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
      });
    }
    return this.request(`/api/admin/jobs?${params.toString()}`);
  }

  async getAdminApplications(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }
    return this.request(`/api/admin/applications?${params.toString()}`);
  }

  async getPlacements(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
      });
    }
    const qs = params.toString();
    return this.request(`/api/placements${qs ? `?${qs}` : ''}`);
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

  async getAdminDocuments(filters?: any) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value))
      })
    }
    return this.request(`/api/admin/documents?${params.toString()}`)
  }

  async approveAdminDocument(docId: string) {
    return this.request(`/api/admin/documents/${docId}/approve`, {
      method: 'POST',
    })
  }

  async rejectAdminDocument(docId: string, reason: string) {
    return this.request(`/api/admin/documents/${docId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
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

  async confirmPayment(paymentId: string) {
    return this.request(`/api/admin/payments/${paymentId}/confirm`, {
      method: 'POST',
    })
  }
}

export const apiClient = new ApiClient();
