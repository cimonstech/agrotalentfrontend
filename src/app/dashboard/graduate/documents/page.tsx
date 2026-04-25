'use client'

import Image from 'next/image'
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader'
import { DocumentsManager } from '@/components/dashboard/DocumentsManager'

export default function GraduateDocumentsPage() {
  return (
    <div className='p-6'>
      <DashboardPageHeader greeting='My Documents' subtitle='Upload and manage your verification documents' />
      <div className='relative mb-6 overflow-hidden rounded-2xl'>
        <Image src='/greenhouse1.jpg' alt='' fill className='object-cover object-center' sizes='100vw' />
        <div className='absolute inset-0 bg-brand/85 backdrop-blur-sm' />
        <div className='relative z-10 p-6'>
          <h2 className='text-base font-semibold text-white'>Upload a Document</h2>
          <p className='mt-2 text-sm text-white/90'>
            Accepted formats: PDF, JPG, PNG. Keep files clear and under practical 10MB size.
          </p>
        </div>
      </div>
      <DocumentsManager audienceLine='Upload certificates and supporting files for admin verification.' />
    </div>
  )
}
