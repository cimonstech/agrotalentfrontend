'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SkilledTrainingPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-accent mb-4"></i>
          <p className="text-gray-600 dark:text-gray-400">Loading training...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/skilled" className="text-accent hover:text-accent/80 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Training & Development</h1>
          <p className="text-gray-600 dark:text-gray-400">Enhance your skills and grow your career</p>
        </div>

        {/* Coming Soon Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-xl p-12 text-center"
        >
          <i className="fas fa-graduation-cap text-6xl text-accent mb-6"></i>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Training Programs Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            We're developing specialized training programs for skilled workers including modern farming techniques, 
            equipment operation, safety certifications, and more. These programs will help you advance your career 
            and command better opportunities.
          </p>
          <div className="bg-white dark:bg-background-dark rounded-lg p-6 max-w-2xl mx-auto mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Planned Training Areas:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-check-circle text-accent"></i>
                Modern Farming Techniques
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-check-circle text-accent"></i>
                Equipment Operation
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-check-circle text-accent"></i>
                Safety Certifications
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-check-circle text-accent"></i>
                Sustainable Agriculture
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-check-circle text-accent"></i>
                Crop Management
              </li>
              <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <i className="fas fa-check-circle text-accent"></i>
                Livestock Care
              </li>
            </ul>
          </div>
          <Link
            href="/dashboard/skilled"
            className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
