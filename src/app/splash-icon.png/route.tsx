import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const size = 512
const logoSize = 140

export async function GET() {
  let logoSrc: string
  try {
    const publicDir = path.join(process.cwd(), 'public', 'agrotalent-logo.webp')
    const buf = await readFile(publicDir)
    const base64 = buf.toString('base64')
    logoSrc = `data:image/webp;base64,${base64}`
  } catch {
    logoSrc = ''
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        {logoSrc ? (
          <img
            src={logoSrc}
            width={logoSize}
            height={logoSize}
            alt="AgroTalent Hub"
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: 32, color: '#2d5016', fontWeight: 700 }}>
            AgroTalent Hub
          </span>
        )}
      </div>
    ),
    {
      width: size,
      height: size,
    }
  )
}
