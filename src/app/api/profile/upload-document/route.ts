import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/profile/upload-document - Upload document (certificate, transcript, CV, NSS letter)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('type') as string // 'certificate', 'transcript', 'cv', 'nss_letter'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    if (!['certificate', 'transcript', 'cv', 'nss_letter'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPEG, and PNG are allowed' },
        { status: 400 }
      )
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`
    const bucketName = documentType === 'nss_letter' ? 'nss-letters' : `${documentType}s`
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)
    
    const publicUrl = urlData.publicUrl
    
    // Update profile with document URL
    const fieldName = `${documentType}_url`
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [fieldName]: publicUrl })
      .eq('id', user.id)
    
    if (updateError) throw updateError
    
    return NextResponse.json(
      {
        url: publicUrl,
        message: 'Document uploaded successfully'
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    )
  }
}
