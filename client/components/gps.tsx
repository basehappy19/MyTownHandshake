'use client'
import { useEffect, useState } from 'react'

export default function GPS() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ไม่รองรับการดึงพิกัด')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (err) => {
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )
  }, [])

  return (
    <div>
      <h1>GPS Location</h1>
      {location ? (
        <p>
          Lat: {location.lat}, Lng: {location.lng}
        </p>
      ) : (
        <p>{error || 'กำลังดึงข้อมูล...'}</p>
      )}
    </div>
  )
}
