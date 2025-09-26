import { Report } from '@/types/Report'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const ReportCard = ({ report }: { report: Report }) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
            case 'รอดำเนินการ':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'in_progress':
            case 'กำลังดำเนินการ':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'resolved':
            case 'แก้ไขเสร็จสิ้น':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'forwarded':
            case 'ส่งต่อ':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100 overflow-hidden">
            {/* Image Section */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100">
                <Image
                    width={400}
                    height={200}
                    quality={80}
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/report/${report.id}/image`}
                    alt='รูปภาพรายงาน'
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.histories[0]?.to.label || 'unknown')}`}>
                        {report.histories[0]?.to.label || 'ไม่ทราบสถานะ'}
                    </span>
                </div>                
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-4">
                {/* Date and Time Info */}
                <div className="space-y-2">
                    <div className="flex items-center text-sm text-green-700">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">แจ้งเมื่อ:</span>
                        <span className="ml-2">{formatThaiDate(report.created_at)}</span>
                    </div>

                    {report.histories[0] && (
                        <div className="flex items-center text-sm text-green-600">
                            <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>อัปเดต {timeAgo(report.histories[0].changed_at)}</span>
                        </div>
                    )}
                </div>

                {/* Location */}
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <div className="flex items-start">
                        <svg className="w-4 h-4 mt-0.5 mr-2 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-green-800 leading-relaxed">
                            {report.address.address_full}
                        </span>
                    </div>
                </div>

                {/* Problem Details */}
                <div className="space-y-3">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                        <div className="flex items-start">
                            <svg className="w-4 h-4 mt-0.5 mr-2 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-emerald-800 mb-1">รายละเอียดปัญหา</h4>
                                <p className="text-sm text-emerald-700 leading-relaxed">
                                    {report.detail || "ไม่ได้ระบุรายละเอียด"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div className="flex-1">
                                <span className="text-sm font-medium text-green-800">ผู้รับผิดชอบ: </span>
                                <span className="text-sm text-green-700">
                                    {report.responsible || "ยังไม่ได้มอบหมาย"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Footer */}
            <div className="px-6 pb-6">
                <Link href={`/detail/${report.id}`} className="inline-block text-center w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                    ดูรายละเอียด
                </Link>
            </div>
        </div>
    )
}

function timeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    const minutes = Math.floor(diff / 60)
    const hours = Math.floor(diff / 3600)
    const days = Math.floor(diff / 86400)
    const weeks = Math.floor(diff / (86400 * 7))
    const months = Math.floor(diff / (86400 * 30))
    const years = Math.floor(diff / (86400 * 365))

    if (diff < 60) return `ไม่กี่วินาทีที่แล้ว`
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
    if (days < 7) return `${days} วันที่แล้ว`
    if (weeks < 5) return `${weeks} สัปดาห์ที่แล้ว`
    if (months < 12) return `${months} เดือนที่แล้ว`
    return `${years} ปีที่แล้ว`
}

function formatThaiDate(dateString: string): string {
    const date = new Date(dateString)

    const buddhistYear = date.getFullYear() + 543
    const monthNames = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ]

    const day = date.getDate()
    const month = monthNames[date.getMonth()]
    const year = buddhistYear
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${day} ${month} ${year}, ${hours}:${minutes} น.`
}

export default ReportCard