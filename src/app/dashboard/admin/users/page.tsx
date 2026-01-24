'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import CreateUserModal from './CreateUserModal'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({
    role: '',
    verified: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchUsers()
  }, [filters, pagination.page])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const queryFilters: any = {}
      if (pagination.page) queryFilters.page = pagination.page
      if (pagination.limit) queryFilters.limit = pagination.limit
      if (filters.role) queryFilters.role = filters.role
      if (filters.verified) queryFilters.verified = filters.verified
      if (filters.search) queryFilters.search = filters.search

      const data = await apiClient.getAdminUsers(queryFilters)

      setUsers(data.users || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      }))
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      setError(error.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (userId: string, verified: boolean) => {
    try {
      await apiClient.verifyUser(userId, verified)
      fetchUsers()
    } catch (error: any) {
      console.error('Failed to verify user:', error)
      alert(error.message || 'Failed to verify user')
    }
  }

  const handleUserCreated = () => {
    setShowCreateModal(false)
    fetchUsers()
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage all users, verify profiles, and view user details</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Create User
              </button>
            </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-background-dark p-4 rounded-lg border border-gray-200 dark:border-white/10">
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            />
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="farm">Farm</option>
              <option value="graduate">Graduate</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={filters.verified}
              onChange={(e) => setFilters({ ...filters, verified: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
            <button
              onClick={() => setFilters({ role: '', verified: '', search: '' })}
              className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="text-gray-400 dark:text-gray-500">
                            <i className="fas fa-users text-4xl mb-4"></i>
                            <p className="text-lg font-medium">No users found</p>
                            <p className="text-sm mt-2">Users will appear here once they register</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name || 'No name'}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {user.farm_name || user.institution_name || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary capitalize">
                              {user.role === 'farm' ? 'Employer/Farm' : user.role === 'worker' ? 'Worker' : user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.is_verified ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Verified
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                Pending Approval
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              {!user.is_verified && (
                                <button
                                  onClick={() => handleVerify(user.id, true)}
                                  className="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition-colors"
                                  title="Approve this user"
                                >
                                  <i className="fas fa-check mr-1"></i>
                                  Approve
                                </button>
                              )}
                              {user.is_verified && (
                                <button
                                  onClick={() => handleVerify(user.id, false)}
                                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                  title="Revoke verification"
                                >
                                  <i className="fas fa-times mr-1"></i>
                                  Revoke
                                </button>
                              )}
                              <Link
                                href={`/dashboard/admin/users/${user.id}`}
                                className="px-3 py-1 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                title="View full details"
                              >
                                <i className="fas fa-eye mr-1"></i>
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <CreateUserModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleUserCreated}
          />
        )}
      </div>
    </div>
  )
}
