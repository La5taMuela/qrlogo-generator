import { NextApiRequest, NextApiResponse } from 'next';
import QRCode from 'qrcode';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb' // Set the body parser limit to 4MB
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { link, logo } = req.body;

    if (!link) {
      return res.status(400).json({ error: 'Link is required' });
    }

    try {
      // Generate the QR code
      const qrCodeBuffer = await QRCode.toBuffer(link, {
        errorCorrectionLevel: 'H',
        margin: 1,
        scale: 12,
      });

      let finalQR = qrCodeBuffer;

      if (logo) {
        const qrImage = sharp(qrCodeBuffer);
        const qrMetadata = await qrImage.metadata();
        const logoSize = Math.floor(qrMetadata.width / 4.5);
        
        // Decode base64 logo
        const logoBuffer = Buffer.from(logo.split(',')[1], 'base64');
        const resizedLogo = await sharp(logoBuffer)
          .resize(logoSize, logoSize)
          .png()
          .toBuffer();

        // Create white square for logo background
        const whiteSquare = await sharp({
          create: {
            width: logoSize,
            height: logoSize,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        }).png().toBuffer();

        // Combine QR and logo
        finalQR = await qrImage
          .composite([
            { input: whiteSquare, top: Math.floor((qrMetadata.height - logoSize) / 2), left: Math.floor((qrMetadata.width - logoSize) / 2) },
            { input: resizedLogo, top: Math.floor((qrMetadata.height - logoSize) / 2), left: Math.floor((qrMetadata.width - logoSize) / 2) },
          ])
          .toBuffer();
      }

      // Set response headers
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'attachment; filename="qr-code.png"');
      
      // Send the QR code image
      res.send(finalQR);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error generating QR code' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

