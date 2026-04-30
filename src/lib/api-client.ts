// API Client for making requests to backend
// Always use Next.js proxy (/api/*) for client-side requests to ensure auth works
// The proxy handles forwarding requests to the backend with proper auth headers
/** CSRF secret is bound to getSessionIdentifier on the API, which uses Authorization when present. */
let csrfTokenCache: { accessToken: string; token: string } | null = null

function isNetworkFailureMessage(value: string): boolean {
  const text = value.toLowerCase()
  return (
    text.includes('fetch failed') ||
    text.includes('connect timeout') ||
    text.includes('und_err_connect_timeout') ||
    text.includes('failed to fetch')
  )
}

function toUserSafeErrorMessage(value: string, fallback = 'Service is temporarily unavailable. Please try again.'): string {
  if (isNetworkFailureMessage(value)) {
    return fallback
  }
  return value
}

function getApiUrl(): string {
  return ''
}

function clearCsrfTokenCache() {
  csrfTokenCache = null
}

async function getCsrfToken(accessToken: string | null): Promise<string> {
  const key = accessToken ?? ''
  if (csrfTokenCache?.accessToken === key && csrfTokenCache.token) {
    return csrfTokenCache.token
  }
  const headers: Record<string, string> = {}
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  let res: Response
  try {
    res = await fetch(getApiUrl() + '/api/csrf-token', {
      credentials: 'include',
      headers: Object.keys(headers).length ? headers : undefined,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch failed'
    throw new Error(toUserSafeErrorMessage(msg, 'Unable to start your request right now. Please try again.'))
  }
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string }
    const detail =
      typeof errBody.error === 'string' && errBody.error
        ? errBody.error
        : `CSRF token request failed (${res.status})`
    throw new Error(toUserSafeErrorMessage(detail))
  }
  const data = (await res.json().catch(() => ({}))) as { token?: string }
  if (typeof data.token !== 'string' || !data.token) {
    throw new Error('Invalid CSRF token response from API')
  }
  csrfTokenCache = { accessToken: key, token: data.token }
  return data.token
}

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
      const { isInvalidRefreshTokenError } = await import('@/lib/auth-utils')
      const clearIfInvalidRefresh = (supabaseClient: { auth: { signOut: (opts?: { scope?: 'local' | 'global' | 'others' }) => Promise<{ error: unknown }> } }, err: unknown) => {
        if (isInvalidRefreshTokenError(err)) {
          supabaseClient.auth.signOut({ scope: 'local' }).catch(() => {})
        }
      }
      // 1) Try auth-helpers client (cookie-based). In some setups this will be empty.
      try {
        const { createSupabaseClient } = await import('@/lib/supabase/client')
        const supabase = createSupabaseClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          clearIfInvalidRefresh(supabase, error)
          if (!isInvalidRefreshTokenError(error)) {
            console.warn('[ApiClient] Error getting session:', error)
          }
          return null
        }
        if (session?.access_token) {
          return session.access_token
        }
      } catch (err) {
        try {
          const { createSupabaseClient } = await import('@/lib/supabase/client')
          clearIfInvalidRefresh(createSupabaseClient(), err)
        } catch (_) {}
        if (!isInvalidRefreshTokenError(err)) {
          console.warn('[ApiClient] Failed to get token from auth-helpers:', err)
        }
      }

      return null
    };
  }

  protected async request(endpoint: string, options: RequestInit = {}, providedToken?: string | null, useCache: boolean = true) {
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
    const method = String(options.method || 'GET').toUpperCase()
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      const csrf = await getCsrfToken(token ?? null)
      headers['x-csrf-token'] = csrf
    }

    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers: headers as HeadersInit,
        signal: controller.signal,
        credentials: 'include',
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

        const errMsg =
          (typeof error.error === 'string' && error.error) ||
          (typeof error.message === 'string' && error.message) ||
          ''
        if (response.status === 403 && /csrf/i.test(errMsg)) {
          clearCsrfTokenCache()
        }
        
        // If 401 and we had a token, session is invalid - clear local session only (scope: 'local' avoids Supabase 403 on invalid token)
        if (response.status === 401 && token) {
          import('@/lib/supabase/client').then(({ createSupabaseClient }) => {
            createSupabaseClient().auth.signOut({ scope: 'local' }).catch(() => {});
          });
        }
        
        const rawMessage = error.error || `HTTP ${response.status}: ${errorText}`
        throw new Error(toUserSafeErrorMessage(rawMessage))
      }

      // 204 No Content has no body - don't parse as JSON
      if (response.status === 204 || response.status === 205) {
        return null;
      }

      const data = await response.json();
      
      // Cache GET requests
      if (cacheKey && (options.method === 'GET' || !options.method)) {
        this.requestCache.set(cacheKey, { data, timestamp: Date.now() })
      }
      
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error?.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.')
      }

      if (error instanceof Error) {
        throw new Error(toUserSafeErrorMessage(error.message))
      }

      throw new Error('Service is temporarily unavailable. Please try again.')
    }
  }

  // Clear cache (useful after mutations)
  clearCache(pattern?: string) {
    if (pattern) {
      const keys = Array.from(this.requestCache.keys())
      for (const key of keys) {
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
    this.clearCache('/api/profile')
    return this.request('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, undefined, false);
  }

  async getDocuments(documentType?: string) {
    const params = new URLSearchParams();
    if (documentType) {
      params.append('document_type', documentType);
    }
    const qs = params.toString();
    return this.request(`/api/documents${qs ? `?${qs}` : ''}`);
  }

  async uploadDocument(file: File, type: string) {
    const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
    const ALLOWED_TYPES = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp']
    if (file.size > MAX_SIZE) throw new Error('File is too large. Maximum size is 10 MB.')
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error('File type not allowed. Upload a PDF, Word document, or image.')

    const token = await this.getAuthToken();
    const csrf = await getCsrfToken(token)

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch(`${this.baseUrl}/api/profile/upload-document`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'x-csrf-token': csrf,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async uploadDocumentToDocumentsTable(file: File, documentType: string, description?: string) {
    const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
    const ALLOWED_TYPES = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp']
    if (file.size > MAX_SIZE) throw new Error('File is too large. Maximum size is 10 MB.')
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error('File type not allowed. Upload a PDF, Word document, or image.')

    const token = await this.getAuthToken();
    const csrf = await getCsrfToken(token)

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(`${this.baseUrl}/api/documents`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'x-csrf-token': csrf,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async deleteDocument(documentId: string) {
    return this.request(`/api/documents/${documentId}`, {
      method: 'DELETE',
    }, undefined, false);
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
    this.clearCache('/api/jobs')
    return this.request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }, undefined, false);
  }

  async updateJob(id: string, data: any) {
    this.clearCache('/api/jobs')
    return this.request(`/api/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, undefined, false);
  }

  async deleteJob(id: string) {
    this.clearCache('/api/jobs')
    await this.request(`/api/jobs/${id}`, { method: 'DELETE' }, undefined, false);
  }

  async deleteAllJobs() {
    this.clearCache('/api/jobs')
    this.clearCache('/api/admin/jobs')
    await this.request('/api/admin/jobs', { method: 'DELETE' }, undefined, false);
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

  async updateApplication(id: string, data: Record<string, unknown>) {
    return this.request('/api/applications/' + id, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /** Get documents for an applicant (farm only, when viewing an application). */
  async getApplicantDocuments(applicationId: string) {
    return this.request(`/api/applications/${applicationId}/documents`);
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

  async getNotice(id: string) {
    return this.request(`/api/notices/${id}`);
  }

  async getNoticeByNotificationId(notificationId: string) {
    return this.request(`/api/notifications/${notificationId}/notice`);
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

  async ensureUnknownFarm(): Promise<{ profile: { id: string; farm_name?: string } }> {
    return this.request('/api/admin/ensure-unknown-farm', { method: 'POST' });
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
    recipients:
      | 'all'
      | 'farms'
      | 'graduates'
      | 'students'
      | 'skilled'
      | 'single'
      | 'custom'
    subject?: string
    message: string
    userId?: string
    email?: string
    /** Comma-separated emails when recipients is custom */
    customRecipients?: string
  }) {
    return this.request('/api/admin/communications/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async getAdminNotices() {
    return this.request('/api/admin/notices');
  }

  async createNotice(payload: {
    title: string
    body_html: string
    link?: string
    audience: string
    attachments?: { url: string; file_name: string }[]
  }) {
    return this.request('/api/admin/notices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async uploadNoticeImage(file: File): Promise<{ url: string; file_name: string }> {
    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (file.size > MAX_SIZE) throw new Error('Image is too large. Maximum size is 5 MB.')
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error('File type not allowed. Upload a JPEG, PNG, WebP, or GIF image.')

    const token = await this.getAuthToken();
    const csrf = await getCsrfToken(token)
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/admin/notices/upload-image`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-csrf-token': csrf,
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    return response.json();
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
