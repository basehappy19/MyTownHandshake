import { Report } from '@/types/Report'
import { CheckCircle } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import Link from 'next/link'
import { formatDuration } from '@/functions/Duration'
import { formatThaiDate } from '@/functions/format_date'
import { renderStars } from './ReportCard'


export const ReportFinishedCard = ({ report }: { report: Report }) => {
    const durationText = formatDuration(report.duration)
    const isFinished = !!report.last_history?.finished
    
    return (
        <Link href={`/detail/${report.id}`}>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100 overflow-hidden">
                {/* Image Section */}
                <div className="flex">
                    <div className='w-2/4 relative'>
                        <Image
                            width={400}
                            height={200}
                            quality={80}
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/report/image/${report.id}?history_id=${report.last_history?.id}&side=after`}
                            alt='รูปภาพรายงาน'
                            className="w-full h-full object-cover"
                        />

                        {/* Status Badge บนรูปภาพ */}
                        <div className="absolute top-3 left-3">
                            <div className="flex items-center bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                เสร็จสิ้น
                            </div>
                        </div>


                    </div>

                    {/* Content Section */}
                    <div className="w-2/4 p-6 flex flex-col justify-between">
                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {report.detail}
                                </h1>
                                <div className="mt-2 flex items-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.category?.name === 'ประปา' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {report.category?.name}
                                    </span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2">


                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="font-medium">เสร็จสิ้น:</span>
                                    <span className="ml-1">{formatThaiDate(report.finished_at || "")}</span>
                                </div>

                                <div className="flex items-center text-sm">
                                    <span className="font-medium text-gray-600">ใช้เวลา:</span>
                                    <span className={`ml-1 font-semibold text-green-600`}>
                                        {durationText}
                                    </span>
                                </div>
                                {isFinished && (
                                    <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                {renderStars(report.rate)}
                                            </div>
                                            <span className="text-sm text-yellow-700">
                                                {report.rate != null && !isNaN(parseFloat(report.rate as string))
                                                    ? `${parseFloat(report.rate as string).toFixed(1)} / 5.0`
                                                    : 'ยังไม่ประเมิน'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Address (ถ้ามี) */}
                        {report.address?.address_major_streets && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="text-xs text-gray-500">
                                    <span className="font-medium">สถานที่:</span>
                                    <span className="ml-1">
                                        {report.address.address_major_streets}, {report.address.address_neighbourhood}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}