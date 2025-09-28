import Header from '@/components/Header'
import { renderStars } from '@/components/ReportCard'
import { calculateDuration, formatDuration } from '@/functions/Duration'
import { formatDate, formatThaiDate } from '@/functions/format_date'
import { getReport } from '@/functions/reports/get_reports'
import { getStatusIconFromDB } from '@/functions/status_icon'
import { getStatusStyle, StatusCode } from '@/functions/status_style'
import { Report } from '@/types/Report'
import { ArrowRight, Calendar, Clock, FileText, MapPin } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

export default async function DetailReport({
    params,
}: {
    params: { slug: string }
}) {
    const { slug } = params
    const { item }: { item: Report } = await getReport(slug)
    const report: Report = item

    const latest = report?.histories?.[0]
    const latestLabel = latest?.to?.label ?? 'ไม่ทราบสถานะ'
    const latestChangedAt = latest?.changed_at
    const latestNote = latest?.note ?? ''
    const latestFinished = latest?.finished === true

    // ใช้ style จาก code (fallback เป็น 'pending')
    const latestCode = (latest?.to?.code ?? 'pending') as StatusCode
    const latestStyle = getStatusStyle(latestCode)
    const durationText = formatDuration(report.duration)
    const isFinished = !!report.last_history?.finished

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header />

            <div className="container mx-auto px-4 py-6">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">สถานะปัจจุบัน</h2>
                                <div
                                    className={`px-3 py-1 rounded-full border text-sm font-medium text-white ${latestStyle.badge_ring} ${latestStyle.gradient}`}
                                >
                                    {latestLabel}
                                </div>
                            </div>
                            {report.last_history?.finished && (
                                <div className="mb-4">
                                    <div className="flex font-bold items-center text-sm text-green-600">
                                        <span>เสร็จสิ้น:</span>
                                        <span className="ml-1">{formatThaiDate(report.finished_at || "")}</span>
                                    </div>
                                    <div className="flex font-bold items-center text-sm text-green-600">
                                        <span>ใช้เวลา:</span>
                                        <span className={`ml-1`}>
                                            {durationText}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        {getStatusIconFromDB({
                                            icon: latest?.to?.icon ?? latestStyle.icon,
                                            className: 'w-5 h-5 text-black',
                                        })}
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-green-800 font-medium">
                                            อัปเดตล่าสุด: {latestChangedAt ? formatDate(latestChangedAt) : '-'}
                                        </p>
                                        {latestNote && (
                                            <p className="text-sm text-green-700 mt-1">
                                                {latestNote}
                                            </p>
                                        )}
                                    </div>
                                </div>
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

                        {/* Report Details */}


                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-green-600" />
                                รายละเอียดปัญหา
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 me-3">หมวดหมู่</label>
                                    <p className="mt-1 bg-green-100 text-green-800 px-3 py-1 rounded-full inline-block text-sm">
                                        {report?.category?.name ?? '-'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">รายละเอียด</label>
                                    <p className="text-gray-800 mt-1">{report?.detail ?? '-'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">รหัสเรื่อง</label>
                                    <p className="text-gray-600 mt-1 font-mono text-sm">{report?.code ?? '-'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">วันที่แจ้ง</label>
                                    <p className="text-gray-800 mt-1">
                                        {report?.created_at ? formatDate(report.created_at) : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Report Images - Before/After */}
                            <div className="mt-6">
                                <label className="text-sm font-medium text-gray-500 mb-2 block">รูปภาพประกอบ</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* รูปภาพเริ่มต้น (ก่อน) */}
                                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                                        <div className="bg-gray-200 px-3 py-2 text-xs font-medium text-gray-700">
                                            ก่อนแก้ไข
                                        </div>
                                        <div className="relative w-full h-48">
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/report/image/${report?.id}`}
                                                alt={`ก่อนแก้ไข - ${report?.detail || 'report image'}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>

                                    {/* รูปภาพหลังแก้ไข (ถ้ามี) */}
                                    {report?.last_history && report.last_history.finished && (
                                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                                            <div className="bg-green-200 px-3 py-2 text-xs font-medium text-green-700">
                                                หลังแก้ไข
                                            </div>
                                            <div className="relative w-full h-48">
                                                <Image
                                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/report/image/${report?.id}?history_id=${report.last_history.id}&side=after`}
                                                    alt={`หลังแก้ไข - ${report?.detail || 'report image'}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-green-600" />
                                ประวัติการดำเนินการ
                            </h2>

                            <div className="space-y-6">
                                {report?.histories?.map((history, index) => {
                                    const fromLabel = history?.from?.label
                                    const toLabel = history?.to?.label
                                    const isDone = latestFinished ? true : index > 0

                                    const fromCode = (history?.from?.code ?? 'pending') as StatusCode
                                    const toCode = (history?.to?.code ?? 'pending') as StatusCode
                                    const fromStyle = getStatusStyle(fromCode)
                                    const toStyle = getStatusStyle(toCode)

                                    let stepDuration: ReturnType<typeof calculateDuration> | null = null

                                    // คำนวณเฉพาะช่วงเวลาระหว่าง "สถานะก่อนหน้า" → "สถานะนี้"
                                    // (ไม่คำนวณให้รายการแรกสุดในประวัติ)
                                    if (
                                        index < (report?.histories?.length ?? 0) - 1 &&
                                        report?.histories?.[index + 1]?.changed_at &&
                                        history?.changed_at
                                    ) {
                                        stepDuration = calculateDuration(report.histories[index + 1].changed_at, history.changed_at)
                                    }


                                    return (
                                        <div key={history?.id ?? index} className="relative">
                                            {/* Timeline Line */}
                                            {index < (report?.histories?.length ?? 0) - 1 && (
                                                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                                            )}

                                            <div className="flex items-start">
                                                {/* Timeline Icon */}
                                                <div
                                                    className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${isDone ? 'bg-green-100 border-green-500' : 'bg-orange-100 border-orange-500'
                                                        }`}
                                                >
                                                    {getStatusIconFromDB({
                                                        icon: history?.to?.icon ?? toStyle.icon,
                                                        className: 'w-5 h-5',
                                                        done: isDone,
                                                    })}
                                                </div>

                                                {/* Timeline Content */}
                                                <div className="ml-4 flex-grow">
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center text-sm text-gray-600">
                                                                {fromLabel && (
                                                                    <>
                                                                        <span
                                                                            className={`px-2 py-1 rounded text-xs text-white ${fromStyle.badge_ring} ${fromStyle.gradient}`}
                                                                        >
                                                                            {fromLabel}
                                                                        </span>
                                                                        <ArrowRight className="w-4 h-4 mx-2" />
                                                                    </>
                                                                )}
                                                                <span
                                                                    className={`px-2 py-1 rounded text-xs text-white ${toStyle.badge_ring} ${toStyle.gradient}`}
                                                                >
                                                                    {toLabel}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Duration Information - เฉพาะเวลาแต่ละสถานะ */}
                                                        {stepDuration && (
                                                            <div className="mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-xs text-gray-500">ใช้เวลา:</span>
                                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium`}>
                                                                        {formatDuration(stepDuration)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {history?.note && (
                                                            <p className="text-gray-800 font-medium mb-1">
                                                                {history.note}
                                                            </p>
                                                        )}

                                                        <p className="text-sm text-gray-500">
                                                            {history?.changed_at ? formatDate(history.changed_at) : '-'}
                                                        </p>

                                                        {/* Images */}
                                                        {(history?.img_before || history?.img_after) && (
                                                            <div className="mt-3 flex gap-2">
                                                                {history?.img_before && (
                                                                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                                        <div className="mb-1">ก่อน</div>
                                                                        <Image
                                                                            width={300}
                                                                            height={300}
                                                                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/report/image/${report?.id}?history_id=${history?.id}&side=before`}
                                                                            alt={`ก่อน - ${toLabel ?? 'ภาพ'}`}
                                                                            className="rounded"
                                                                        />
                                                                    </div>
                                                                )}
                                                                {history?.img_after && (
                                                                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                                        <div className="mb-1">หลัง</div>
                                                                        <Image
                                                                            width={300}
                                                                            height={300}
                                                                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/report/image/${report?.id}?history_id=${history?.id}&side=after`}
                                                                            alt={`หลัง - ${toLabel ?? 'ภาพ'}`}
                                                                            className="rounded"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Location Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                                สถานที่
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">ที่อยู่</label>
                                    <p className="text-gray-800 mt-1 text-sm">
                                        {report?.address?.address_full ?? '-'}
                                    </p>
                                </div>

                                {/* Map */}
                                <div className="bg-gray-100 rounded-lg text-center mt-4">
                                    <iframe
                                        title="แผนที่ตำแหน่งที่เกิดเหตุ"
                                        width="100%"
                                        height="400"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        src={`https://www.google.com/maps?q=${report?.address?.lat ?? 0},${report?.address?.lng ?? 0}&z=17&output=embed`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
