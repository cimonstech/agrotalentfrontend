'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import Link from 'next/link'

export default function AdminVerificationPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    document_type: '',
    status: '',
    search: ''
  })

  useEffect(() => {
    fetchDocuments()
  }, [filters])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      // Note: This endpoint needs to be created in backend
      const response = await fetch('/api/admin/documents?' + new URLSearchParams({
        ...(filters.document_type && { document_type: filters.document_type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      }))
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (docId: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${docId}/approve`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error('Failed to approve document:', error)
    }
  }

  const handleReject = async (docId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${docId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (response.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error('Failed to reject document:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Verification & Documents</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage certificates, IDs, and farm registration documents</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-background-dark p-4 rounded-lg border border-gray-200 dark:border-white/10 mb-6">
          <input
            type="text"
            placeholder="Search by user name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          />
          <select
            value={filters.document_type}
            onChange={(e) => setFilters({ ...filters, document_type: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">All Document Types</option>
            <option value="certificate">Certificate</option>
            <option value="student_id">Student ID</option>
            <option value="nss_document">NSS Document</option>
            <option value="farm_registration">Farm Registration</option>
            <option value="cv">CV/Resume</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-background-dark text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => setFilters({ document_type: '', status: '', search: '' })}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <i className="fas fa-file-alt text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p className="text-gray-600 dark:text-gray-400">No documents found</p>
              </div>
            ) : (
              documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                        {doc.document_type?.replace('_', ' ')}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <Link href={`/dashboard/admin/users/${doc.user_id}`} className="hover:text-primary">
                          {doc.user_name || 'Unknown User'}
                        </Link>
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      doc.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                      doc.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {doc.status || 'pending'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{doc.file_name}</p>
                  
                  <div className="flex gap-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-center hover:bg-primary/90 transition-colors"
                    >
                      <i className="fas fa-eye mr-2"></i>
                      View
                    </a>
                    {doc.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(doc.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    )}
                    {doc.status !== 'rejected' && (
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:')
                          if (reason) handleReject(doc.id, reason)
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                  
                  {doc.rejection_reason && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                      Rejected: {doc.rejection_reason}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
