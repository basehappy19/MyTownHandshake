'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FileText, Send, AlertCircle } from 'lucide-react'
import ImageUpload from './ImageUpload'
import LocationGPS from './LocationGPS'
import { submitOfficialReport } from '@/action/report'

type FormValues = {
    detail: string
    lat?: number
    lng?: number
    photos: File[]
}

export default function OfficialReportForm() {
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
        defaultValues: { detail: '', lat: undefined, lng: undefined, photos: [] },
        mode: 'onBlur',
        reValidateMode: 'onBlur',
    })

    const detail = watch('detail', '')

    const [photos, setPhotos] = useState<File[]>([])
    const handlePhotos = (files: File[]) => {
        setPhotos(files)
        setValue('photos', files, { shouldValidate: true })
        if (files.length > 0) clearErrors('photos')
    }

    const handleLocChange = (loc: { lat?: number; lng?: number } | null) => {
        if (loc?.lat != null) setValue('lat', loc.lat, { shouldValidate: true })
        if (loc?.lng != null) setValue('lng', loc.lng, { shouldValidate: true })
        if (loc?.lat != null || loc?.lng != null) clearErrors(['lat', 'lng'])
    }

    const onSubmit = (data: FormValues) => {
        if (!photos.length) {
            setError('photos', { type: 'manual', message: 'กรุณาแนบรูปอย่างน้อย 1 รูป' })
            return
        }

        const fd = new FormData()
        fd.append('detail', data.detail)
        if (data.lat != null) fd.append('lat', String(data.lat))
        if (data.lng != null) fd.append('lng', String(data.lng))
        photos.forEach(f => fd.append('photos', f))

            ; (async () => {
                const res = await submitOfficialReport(fd)
                if (!res.ok) {
                    alert('ส่งไม่สำเร็จ: กรุณาตรวจสอบข้อมูลอีกครั้ง')
                    return
                }
                alert('ส่งรายงานเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมง')
                reset()
                setPhotos([])
            })()
    }

    return (
        <main className="max-w-6xl mx-auto px-4 py-8">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">แบบฟอร์มแจ้งเหตุการณ์</h2>
                            <p className="text-blue-100 text-sm mt-2">กรุณากรอกข้อมูลให้ครบถ้วนและแนบหลักฐานประกอบ</p>
                        </div>
                        <div className="hidden md:block">
                            <AlertCircle className="h-12 w-12 text-blue-200" />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 lg:p-12 space-y-8">
                    {/* รายละเอียดเหตุการณ์ */}
                    <div className="space-y-2">
                        <label htmlFor="detail" className="flex items-center text-sm font-bold text-gray-700">
                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
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
                ${errors.detail ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                            placeholder="กรุณาอธิบายรายละเอียดเหตุการณ์ที่เกิดขึ้น เวลา สถานที่ และผู้เกี่ยวข้อง..."
                        />
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-red-500">{errors.detail?.message}</span>
                            <span className="text-gray-500">{detail.length}/1000 ตัวอักษร</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <ImageUpload onChange={handlePhotos} />
                        {errors.photos && <p className="text-xs text-red-500">{errors.photos.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <LocationGPS onChange={handleLocChange} />
                        {(errors.lat || errors.lng) && (
                            <p className="text-xs text-red-500 mt-2">
                                {errors.lat?.message || errors.lng?.message}
                            </p>
                        )}
                    </div>

                    {/* hidden inputs สำหรับ RHF rules ของ lat/lng (กรณีอยากบังคับ) */}
                    {/* ตัวอย่าง: บังคับให้ต้องมี lat/lng */}
                    {/* 
          <input type="hidden" {...register('lat', { required: 'กรุณาอนุญาตตำแหน่ง' })} />
          <input type="hidden" {...register('lng', { required: 'กรุณาอนุญาตตำแหน่ง' })} />
          */}

                    {/* ปุ่มส่ง */}
                    <div className="pt-8 border-t-2 border-gray-200">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center px-8 py-6 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white font-bold text-lg rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none"
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
