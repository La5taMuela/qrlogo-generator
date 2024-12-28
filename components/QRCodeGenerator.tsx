'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import Image from 'next/image'

export default function QRCodeGenerator() {
  const [link, setLink] = useState('')
  const [logo, setLogo] = useState<File | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value)
    setError(null)
  }

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('link', link)
      if (logo) {
        formData.append('logo', logo)
      }

      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setQrCode(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating QR code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="link" className="block text-sm font-medium text-gray-700">
            Enter URL
          </label>
          <input
            type="url"
            id="link"
            value={link}
            onChange={handleLinkChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
            Logo (optional)
          </label>
          <input
            type="file"
            id="logo"
            onChange={handleLogoChange}
            accept="image/*"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate QR Code'}
        </button>
      </form>

      {qrCode && (
        <div className="mt-6 text-center">
          <div className="relative w-64 h-64 mx-auto">
            <Image
              src={qrCode}
              alt="Generated QR Code"
              fill
              className="object-contain"
            />
          </div>
          <a
            href={qrCode}
            download="qr-code.png"
            className="mt-4 inline-block py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Download QR Code
          </a>
        </div>
      )}
    </div>
  )
}

