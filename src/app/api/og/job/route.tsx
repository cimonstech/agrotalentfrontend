import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

function getFallbackImage(jobType: string, spec: string): string {
  if (spec.toLowerCase().includes('livestock')) {
    return 'https://files.agrotalenthub.com/og/farm-livestock.jpg'
  }
  if (jobType === 'farm_manager') {
    return 'https://files.agrotalenthub.com/og/farm-manager.jpg'
  }
  if (jobType === 'intern' || jobType === 'nss') {
    return 'https://files.agrotalenthub.com/og/farm-intern.jpg'
  }
  return 'https://files.agrotalenthub.com/og/farm-crop.jpg'
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? 'Agricultural Job'
  const location = searchParams.get('location') ?? 'Ghana'
  const jobType = searchParams.get('job_type') ?? ''
  const salary = searchParams.get('salary') ?? ''
  const city = searchParams.get('city') ?? ''
  const imageUrlRaw = searchParams.get('image_url')
  const imageUrl =
    imageUrlRaw && imageUrlRaw.trim() !== '' ? imageUrlRaw.trim() : ''
  const specialization = searchParams.get('specialization') ?? ''

  const locationText = city ? city + ', ' + location : location

  const jobTypeLabel: Record<string, string> = {
    farm_hand: 'Farm Hand',
    farm_manager: 'Farm Manager',
    intern: 'Internship',
    nss: 'NSS Placement',
    data_collector: 'Data Collector',
  }
  const typeLabel = jobTypeLabel[jobType] ?? jobType

  const bgImage = imageUrl || getFallbackImage(jobType, specialization)

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        <img
          src={bgImage}
          alt=''
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '630px',
            objectFit: 'cover',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '630px',
            background:
              'linear-gradient(135deg, rgba(13,51,32,0.92) 0%, rgba(13,51,32,0.75) 60%, rgba(13,51,32,0.5) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '60px',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '48px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#C8963E',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              {'🌱'}
            </div>
            <span style={{ color: '#ffffff', fontSize: '24px', fontWeight: '700' }}>
              AgroTalent Hub
            </span>
          </div>
          {typeLabel ? (
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: '#C8963E',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                padding: '8px 20px',
                borderRadius: '100px',
                marginBottom: '24px',
                width: 'fit-content',
              }}
            >
              {typeLabel}
            </div>
          ) : null}
          <div
            style={{
              color: '#ffffff',
              fontSize: title.length > 40 ? '52px' : '64px',
              fontWeight: '800',
              lineHeight: '1.1',
              marginBottom: '32px',
              maxWidth: '800px',
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#C8963E', fontSize: '20px' }}>{'📍'}</span>
              <span style={{ color: '#ffffff', fontSize: '22px', opacity: 0.9 }}>
                {locationText}
              </span>
            </div>
            {salary ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#C8963E', fontSize: '20px' }}>{'💰'}</span>
                <span style={{ color: '#ffffff', fontSize: '22px', opacity: 0.9 }}>
                  {salary}
                </span>
              </div>
            ) : null}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '60px',
              right: '60px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#ffffff', fontSize: '18px', opacity: 0.7 }}>
              {`Ghana's Agricultural Talent Platform`}
            </span>
            <div
              style={{
                backgroundColor: '#1A6B3C',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: '700',
                padding: '12px 28px',
                borderRadius: '100px',
              }}
            >
              Apply Now
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
