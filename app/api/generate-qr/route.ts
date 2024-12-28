import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const link = formData.get('link')
    const logo = formData.get('logo')

    if (!link || typeof link !== 'string') {
      return NextResponse.json({ error: 'Link is required' }, { status: 400 })
    }

    // Generate QR Code
    const qrCodeBuffer = await QRCode.toBuffer(link, {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 12,
    })

    let finalQR = qrCodeBuffer

    if (logo && logo instanceof Blob) {
      const logoBuffer = Buffer.from(await logo.arrayBuffer())
      const qrImage = sharp(qrCodeBuffer)
      const qrMetadata = await qrImage.metadata()
      const logoSize = Math.floor(qrMetadata.width! / 4.5)

      // Resize logo
      const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize, logoSize)
        .toBuffer()

      // Create white background for logo
      const whiteSquare = await sharp({
        create: {
          width: logoSize,
          height: logoSize,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer()

      // Calculate position for logo
      const position = {
        top: Math.floor((qrMetadata.height! - logoSize) / 2),
        left: Math.floor((qrMetadata.width! - logoSize) / 2),
      }

      // Composite QR code with logo
      finalQR = await qrImage
        .composite([
          {
            input: whiteSquare,
            ...position,
          },
          {
            input: resizedLogo,
            ...position,
          },
        ])
        .toBuffer()
    }

    // Return the QR code as a PNG image
    return new NextResponse(finalQR, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="qr-code.png"',
      },
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Error generating QR code' },
      { status: 500 }
    )
  }
}
