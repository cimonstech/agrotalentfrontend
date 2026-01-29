'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function SkilledDocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/signin')
        return
      }

      const data = await apiClient.getDocuments()
      setDocuments(data.documents || [])
    } catch (error: any) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(documentType)
      await apiClient.uploadDocumentToDocumentsTable(file, documentType)
      await fetchDocuments() // Refresh list
      alert('Document uploaded successfully!')
    } catch (error: any) {
      alert(`Failed to upload document: ${error.message}`)
    } finally {
      setUploading(null)
      e.target.value = '' // Reset input
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await apiClient.deleteDocument(documentId)
      await fetchDocuments() // Refresh list
      alert('Document deleted successfully!')
    } catch (error: any) {
      alert(`Failed to delete document: ${error.message}`)
    }
  }

  const documentTypes = [
    { value: 'certificate', label: 'Certificate', icon: 'certificate' },
    { value: 'transcript', label: 'Transcript', icon: 'file-alt' },
    { value: 'cv', label: 'CV/Resume', icon: 'file-pdf' },
    { value: 'nss_letter', label: 'NSS Letter', icon: 'file-signature' },
  ]

  const filteredDocuments = selectedType
    ? documents.filter(doc => doc.document_type === selectedType)
    : documents

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Documents</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload and manage your documents</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload New Document</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {documentTypes.map((type) => (
              <div key={type.value} className="p-4 border border-gray-200 dark:border-white/10 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <i className={`fas fa-${type.icon} mr-2`}></i>
                  {type.label}
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, type.value)}
                  disabled={uploading === type.value}
                  className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent/10 file:text-accent hover:file:bg-accent/20 disabled:opacity-50"
                />
                {uploading === type.value && (
                  <p className="text-xs text-gray-500 mt-2">
                    <i className="fas fa-spinner fa-spin mr-1"></i>
                    Uploading...
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-background-dark text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All Document Types</option>
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-background-dark rounded-xl border border-gray-200 dark:border-white/10">
            <i className="fas fa-file-alt text-6xl text-gray-300 dark:text-gray-700 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">No documents uploaded yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Upload documents using the form above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white dark:bg-background-dark rounded-xl p-6 border border-gray-200 dark:border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <i className={`fas fa-${documentTypes.find(t => t.value === doc.document_type)?.icon || 'file'} text-accent`}></i>
                      <h3 className="font-bold text-gray-900 dark:text-white capitalize">
                        {doc.document_type?.replace('_', ' ')}
                      </h3>
                      {doc.status && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                          doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{doc.file_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                    {doc.rejection_reason && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        Reason: {doc.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-center text-sm"
                  >
                    <i className="fas fa-download mr-2"></i>
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
