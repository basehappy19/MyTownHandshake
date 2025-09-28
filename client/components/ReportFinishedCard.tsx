import { Report } from '@/types/Report'
import { CheckCircle2, Clock, Code } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { formatThaiDate, timeAgo } from './ReportCard'

export const ReportFinishedCard = ({ report }: { report: Report }) => {
    return (
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100 overflow-hidden">
            {/* Image Section */}
            <div className="flex">
                <div>
                    <Image
                        width={100}
                        height={200}
                        quality={80}
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/report/image/${report.id}?history_id=${report.last_finished_history?.id}&side=after`}
                        alt='รูปภาพรายงาน'
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                </div>

                {/* Content Section */}
                <div className="p-6 space-y-4">
                    {/* Date and Time Info */}
                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-black">
                            <Clock className='w-4 h-4 mr-2 text-black' />
                            <span className="font-medium">แจ้งเมื่อ:</span>
                            <span className="ml-1">{formatThaiDate(report.created_at)}</span>
                        </div>
                        <div className="flex items-center text-sm text-black">
                            <Code className='w-4 h-4 mr-2 text-black' />
                            <span className="font-medium">รหัสเรื่อง:</span>
                            <span className="ml-1">{report.code}</span>
                        </div>

                        {/* {report.histories[0] && (
                        <div className="flex items-center text-sm text-black">
                            <CheckCircle2 className='w-4 h-4 mr-2 text-black' />
                            <span>อัปเดต {timeAgo(report.histories[0].changed_at)}</span>
                        </div>
                    )} */}
                    </div>

                    
                    
                </div>
            </div>

        </div>
    )
}
