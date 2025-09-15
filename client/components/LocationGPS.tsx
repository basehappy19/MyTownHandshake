'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

type Props = {
    onChange?: (loc: { lat?: number; lng?: number } | null) => void
    auto?: boolean
}

export default function LocationGPS({ onChange, auto = true }: Props) {
    const [status, setStatus] = useState<'idle' | 'getting' | 'success' | 'error'>('idle')
    const [error, setError] = useState('')
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

    const onChangeRef = useRef<Props['onChange']>(null)
    onChangeRef.current = onChange

    const getLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus('error')
            setError('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง')
            setLocation(null)
            onChangeRef.current?.(null)
            return
        }

        setStatus('getting')
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }

                setLocation((prev) => {
                    if (prev && prev.lat === loc.lat && prev.lng === loc.lng) return prev
                    return loc
                })

                setStatus('success')
                setError('')
                onChangeRef.current?.(loc)
            },
            (err) => {
                setStatus('error')
                setError(err.message || 'ไม่สามารถดึงตำแหน่งได้')
                setLocation(null)
                onChangeRef.current?.(null)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        )
    }, [])

    // รันตอน mount หรือเมื่อ auto เปลี่ยนเท่านั้น
    useEffect(() => {
        if (auto) getLocation()
    }, [auto, getLocation])

    return (
        <div className="space-y-6">
            <label className="flex items-center text-sm font-bold text-gray-700">
                <MapPin className="h-4 w-4 mr-2 text-red-500" />
                ตำแหน่งที่เกิดเหตุ
            </label>

            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200">
                {status === 'success' && location ? (
                    <div className="space-y-4">
                        <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                            <iframe
                                title="แผนที่ตำแหน่งที่เกิดเหตุ"
                                width="100%"
                                height="400"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                src={`https://www.google.com/maps?q=${location.lat},${location.lng}&z=17&output=embed`}
                            />
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-700">
                            <span>ละติจูด: {location.lat.toFixed(6)} | ลองจิจูด: {location.lng.toFixed(6)}</span>
                            <button
                                type="button"
                                onClick={getLocation}
                                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                            >
                                รีเฟรชตำแหน่ง
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        {status === 'getting' ? (
                            <>
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">กำลังค้นหาตำแหน่งของคุณ...</p>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-600 font-medium">{error || 'ยังไม่ได้ดึงตำแหน่ง'}</p>
                                <button
                                    type="button"
                                    onClick={getLocation}
                                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    ลองใหม่
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
