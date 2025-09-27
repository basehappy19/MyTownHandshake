'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FileText, Send, AlertCircle } from 'lucide-react'
import ImageUpload from './ImageUpload'
import LocationGPS from './LocationGPS'
import { submitOfficialReport } from '@/action/report'

/** ---------- Types ---------- */
type FormValues = {
    detail: string
    lat?: number
    lng?: number
    photo: File | null
    user_agent?: string
}

/** ชนิด User-Agent Client Hints (รองรับ TS/DOM บางเวอร์ชันที่ยังไม่มี) */
type UADataBrand = { brand: string; version: string }
interface NavigatorUAData {
    brands: UADataBrand[]
    mobile?: boolean
    platform: string
    getHighEntropyValues: (
        hints: ReadonlyArray<
            | 'architecture'
            | 'model'
            | 'platform'
            | 'platformVersion'
            | 'uaFullVersion'
            | 'bitness'
            | 'fullVersionList'
        >
    ) => Promise<{
        architecture?: string
        model?: string
        platform?: string
        platformVersion?: string
        uaFullVersion?: string
        bitness?: string
        fullVersionList?: UADataBrand[]
    }>
}

/** ให้ navigator รองรับ field userAgentData แบบ optional โดยไม่ใช้ any */
type NavigatorWithUA = Navigator & { userAgentData?: NavigatorUAData }

/** ---------- Component ---------- */
export default function FormReport() {
    const {
        register,
        handleSubmit,
        setValue,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
        watch,
        reset,
    } = useForm<FormValues>({
        defaultValues: { detail: '', lat: undefined, lng: undefined, photo: null, user_agent: '' },
        mode: 'onBlur',
        reValidateMode: 'onBlur',
    })

    // เก็บ UA จากฝั่ง client (ไม่มี any)
    useEffect(() => {
        const setUA = async () => {
            try {
                const nav = (navigator as NavigatorWithUA)
                let ua = nav.userAgent || ''

                const uad = nav.userAgentData
                if (uad?.getHighEntropyValues) {
                    const hi = await uad.getHighEntropyValues([
                        'platform',
                        'platformVersion',
                        'architecture',
                        'model',
                        'uaFullVersion',
                        'bitness',
                        'fullVersionList',
                    ])

                    const brandsArr: UADataBrand[] = uad.brands ?? []
                    const brands = brandsArr.map((b) => `${b.brand}/${b.version}`).join(', ')

                    ua = [
                        ua,
                        brands ? ` | brands: ${brands}` : '',
                        hi.platform ? ` | platform: ${hi.platform} ${hi.platformVersion ?? ''}` : '',
                        hi.architecture ? ` | arch: ${hi.architecture}` : '',
                        hi.model ? ` | model: ${hi.model}` : '',
                        hi.uaFullVersion ? ` | full: ${hi.uaFullVersion}` : '',
                        hi.bitness ? ` | bits: ${hi.bitness}` : '',
                    ]
                        .filter(Boolean)
                        .join('')
                }

                setValue('user_agent', ua, { shouldValidate: false })
            } catch {
                // ignore
            }
        }
        void setUA()
    }, [setValue])

    const detail = watch('detail', '')

    const handlePhoto = (file: File | null) => {
        setValue('photo', file, { shouldValidate: true })
        if (file) clearErrors('photo')
    }

    const handleLocChange = (loc: { lat?: number; lng?: number } | null) => {
        if (loc?.lat != null) setValue('lat', loc.lat, { shouldValidate: true })
        if (loc?.lng != null) setValue('lng', loc.lng, { shouldValidate: true })
        if (loc?.lat != null || loc?.lng != null) clearErrors(['lat', 'lng'])
    }

    const [uploadKey, setUploadKey] = useState(0)

    const onSubmit = async (data: FormValues) => {
        if (!data.photo) {
            setError('photo', { type: 'manual', message: 'กรุณาแนบรูป 1 รูป' })
            return
        }

        const fd = new FormData()
        fd.append('detail', data.detail)
        if (data.lat != null) fd.append('lat', String(data.lat))
        if (data.lng != null) fd.append('lng', String(data.lng))
        fd.append('img', data.photo)
        if (data.user_agent) fd.append('user_agent', data.user_agent)

        const res = await submitOfficialReport(fd)
        if (!res.ok) {
            alert('ส่งไม่สำเร็จ: กรุณาตรวจสอบข้อมูลอีกครั้ง')
            return
        }
        alert('ส่งรายงานเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมง')
        reset()
        setValue('photo', null, { shouldValidate: false })
        setUploadKey(k => k + 1)
    }

    return (
        <main className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-green-600 px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">แบบฟอร์มแจ้งเหตุการณ์</h2>
                            <p className="text-green-100 text-sm mt-2">กรุณากรอกข้อมูลให้ครบถ้วนและแนบหลักฐานประกอบ</p>
                        </div>
                        <div className="hidden md:block">
                            <AlertCircle className="h-12 w-12 text-green-200" />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 lg:p-12 space-y-8">
                    {/* เก็บ UA ไว้แบบ hidden */}
                    <input type="hidden" {...register('user_agent')} />

                    <div className="space-y-2">
                        <label htmlFor="detail" className="flex items-center text-sm font-bold text-gray-700">
                            <FileText className="h-4 w-4 mr-2 text-green-500" />
                            รายละเอียดเหตุการณ์ <span className="text-red-500 ml-1">*</span>
                        </label>
                        <textarea
                            id="detail"
                            rows={6}
                            maxLength={1000}
                            {...register('detail', {
                                required: 'กรุณากรอกรายละเอียด',
                                minLength: { value: 10, message: 'กรุณากรอกอย่างน้อย 10 ตัวอักษร' },
                                maxLength: { value: 1000, message: 'รายละเอียดไม่เกิน 1000 ตัวอักษร' },
                                setValueAs: (v) => (typeof v === 'string' ? v.trim() : v),
                            })}
                            className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 transition-all duration-200 bg-gray-50 hover:bg-white resize-none
                ${errors.detail ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-green-500 focus:border-green-500'}`}
                            placeholder="กรุณาอธิบายรายละเอียดเหตุการณ์ที่เกิดขึ้น เวลา สถานที่ และผู้เกี่ยวข้อง..."
                        />
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-red-500">{errors.detail?.message}</span>
                            <span className="text-gray-500">{detail.length}/1000 ตัวอักษร</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <ImageUpload key={uploadKey} onChange={(files) => handlePhoto(files[0] ?? null)} />
                        {errors.photo && <p className="text-xs text-red-500">{errors.photo.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <LocationGPS onChange={handleLocChange} />
                        {(errors.lat || errors.lng) && (
                            <p className="text-xs text-red-500 mt-2">
                                {errors.lat?.message || errors.lng?.message}
                            </p>
                        )}
                    </div>

                    <div className="pt-8 border-t-2 border-gray-200">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center px-8 py-6 bg-green-600 text-white font-bold text-lg rounded-2xl hover:bg-green-700 focus:ring-4 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3" />
                                    กำลังส่งรายงาน...
                                </>
                            ) : (
                                <>
                                    <Send className="h-6 w-6 mr-3" />
                                    ส่งรายงานเหตุการณ์
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
