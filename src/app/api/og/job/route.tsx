import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? 'Agricultural Job'
  const location = searchParams.get('location') ?? 'Ghana'
  const jobType = searchParams.get('job_type') ?? ''
  const salary = searchParams.get('salary') ?? ''
  const city = searchParams.get('city') ?? ''

  const locationText = city ? city + ', ' + location : location

  const jobTypeLabel: Record<string, string> = {
    farm_hand: 'Farm Hand',
    farm_manager: 'Farm Manager',
    intern: 'Internship',
    nss: 'NSS Placement',
    data_collector: 'Data Collector',
  }
  const typeLabel = jobTypeLabel[jobType] ?? jobType

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0D3320',
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            height: '630px',
            background: 'linear-gradient(135deg, #1A6B3C 0%, #0D3320 100%)',
            opacity: 0.4,
          }}
        />

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
              fontSize: '24px',
            }}
          >
            {'🌱'}
          </div>
          <span style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700 }}>
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
              fontWeight: 600,
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
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '32px',
            maxWidth: '900px',
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
          <span style={{ color: '#ffffff', fontSize: '18px', opacity: 0.6 }}>
            {`Ghana's Agricultural Talent Platform`}
          </span>
          <div
            style={{
              backgroundColor: '#1A6B3C',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 700,
              padding: '12px 28px',
              borderRadius: '100px',
            }}
          >
            Apply Now
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
