'use client'
import { Camera, Upload, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
    onChange?: (files: File[]) => void
    maxSizeMB?: number
}

export default function ImageUpload({ onChange, maxSizeMB = 10 }: Props) {
    const [images, setImages] = useState<string[]>([])
    const [files, setFiles] = useState<File[]>([])
    const [showCamera, setShowCamera] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const emit = (next: File[]) => {
        setFiles(next)
        onChange?.(next)
    }

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setShowCamera(true)
            }
        } catch (err) {
            console.error('Error accessing camera:', err)
            alert('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตใช้กล้อง')
        }
    }

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(track => track.stop())
        }
        setShowCamera(false)
    }

    // cleanup เมื่อคอมโพเนนต์ unmount
    useEffect(() => {
        return () => stopCamera()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const dataURLtoFile = async (dataUrl: string, filename: string) => {
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        return new File([blob], filename, { type: blob.type })
    }

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return
        const canvas = canvasRef.current
        const video = videoRef.current

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setImages(prev => [...prev, imageData])

        // แปลงเป็นไฟล์แล้วส่งออก
        const file = await dataURLtoFile(imageData, `camera_${Date.now()}.jpg`)
        const next = [...files, file]
        emit(next)

        stopCamera()
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || [])
        const valid: File[] = []
        selected.forEach(file => {
            const isImage = file.type.startsWith('image/')
            const underSize = file.size <= maxSizeMB * 1024 * 1024
            if (isImage && underSize) {
                valid.push(file)
                // สำหรับ preview
                const reader = new FileReader()
                reader.onload = (e) => {
                    const fr = e.currentTarget as FileReader
                    if (fr.result) {
                        setImages(prev => [...prev, fr.result as string])
                    }
                }
                reader.readAsDataURL(file)
            } else {
                alert(`กรุณาเลือกไฟล์รูปภาพที่มีขนาดไม่เกิน ${maxSizeMB}MB`)
            }
        })
        if (valid.length) emit([...files, ...valid])
        // reset input เพื่อให้อัพโหลดไฟล์เดิมซ้ำได้ถ้าต้องการ
        e.currentTarget.value = ''
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
        const nextFiles = files.filter((_, i) => i !== index)
        emit(nextFiles)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <label className="flex items-center text-sm font-bold text-gray-700">
                    <Camera className="h-4 w-4 mr-2 text-orange-500" />
                    แนบหลักฐาน/รูปภาพ
                </label>
                <span className="text-xs text-gray-500">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน {maxSizeMB}MB</span>
            </div>

            <div className="flex flex-wrap gap-4">
                <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                    <Camera className="h-5 w-5 mr-2" />
                    เปิดกล้องถ่ายรูป
                </button>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                    <Upload className="h-5 w-5 mr-2" />
                    อัพโหลดไฟล์
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/jpeg,image/png,image/jpg"
                multiple
                className="hidden"
            />

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">ถ่ายภาพหลักฐาน</h3>
                            <button type="button" onClick={stopCamera} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl mb-6 shadow-lg" style={{ maxHeight: '60vh' }} />
                        <div className="flex justify-center space-x-4">
                            <button type="button" onClick={capturePhoto} className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg">
                                <Camera className="inline h-5 w-5 mr-2" />
                                ถ่ายภาพ
                            </button>
                            <button type="button" onClick={stopCamera} className="px-8 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-lg">
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Image Preview */}
            {images.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">รูปภาพที่แนบ ({images.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                            <div key={index} className="relative group">
                                <img src={image} alt={`หลักฐาน ${index + 1}`} className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 group-hover:border-blue-400 transition-colors shadow-md" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:bg-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
                                    {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
