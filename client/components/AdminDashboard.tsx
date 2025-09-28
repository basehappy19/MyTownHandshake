'use client'
import Header from "@/components/Header"
import { Report } from "@/types/Report"
import {
    Building2,
    Clock,
    CheckCircle,
    AlertCircle,
    Filter,
    Search,
} from "lucide-react"
import { useState } from "react"
import Image from "next/image"

// Mock data - ในการใช้งานจริงจะดึงจาก API
const mockInstitutions = [
    { id: "1", display_name: "องค์การบริหารส่วนตำบลผักปัง", email: "phakphang_299@hotmail.com" },
    { id: "2", display_name: "เทศบาลตำบลภูเขียว", email: "phukhieo@pkcity.go.th" },
    { id: "3", display_name: "การไฟฟ้าส่วนภูมิภาค", email: "1129@pea.co.th" },
    { id: "4", display_name: "การประปาส่วนภูมิภาค", email: "bma@bangkok.go.th" },
    { id: "5", display_name: "สถานีตำรวจในพื้นที่", email: "pr@pwa.co.th" },
    { id: "6", display_name: "ตำรวจจราจร", email: "-" },
    { id: "7", display_name: "กองสาธารณสุข", email: "phdb@moph.mail.go.th" },
    { id: "8", display_name: "กองสาธารณสุขและสิ่งแวดล้อม", email: "bangpla.sk@gmail.com" },
    { id: "9", display_name: "ศูนย์บรรเทาสาธารณภัย", email: "saraban_center@disaster.go.th" },
]

const mockStatuses = [
    { id: 1, code: "pending", label: "รอรับเรื่อง", sort_order: 1, is_active: true, icon: "CircleDot" },
    { id: 2, code: "forwarded", label: "ส่งต่อเรื่อง", sort_order: 2, is_active: true, icon: "Send" },
    { id: 3, code: "in_progress", label: "กำลังดำเนินการ", sort_order: 3, is_active: true, icon: "Loader" },
    { id: 4, code: "resolved", label: "แก้ไขเสร็จสิ้น", sort_order: 4, is_active: true, icon: "CircleCheck" },
]

interface AdminReportCardProps {
    report: Report
    onAssignInstitution: (reportId: string, institutionId: string) => void
    onUpdateStatus: (reportId: string, statusId: number, note?: string, file?: File) => void
}

const AdminReportCard = ({ report, onAssignInstitution, onUpdateStatus }: AdminReportCardProps) => {
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<number | null>(null)
    const [statusNote, setStatusNote] = useState("")
    const [statusFile, setStatusFile] = useState<File | null>(null)

    const currentStatus = report.histories?.[0]?.to
    const isFinished = report.histories?.[0]?.finished || false

    const getStatusColor = (code: string) => {
        switch (code) {
            case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "forwarded": return "bg-blue-100 text-blue-800 border-blue-200"
            case "in_progress": return "bg-orange-100 text-orange-800 border-orange-200"
            case "resolved": return "bg-green-100 text-green-800 border-green-200"
            default: return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const handleAssignInstitution = (institutionId: string) => {
        onAssignInstitution(report.id, institutionId)
        setShowAssignModal(false)
    }

    const handleUpdateStatus = () => {
        if (selectedStatus) {
            onUpdateStatus(report.id, selectedStatus, statusNote || undefined, statusFile || undefined)
            setShowStatusModal(false)
            setSelectedStatus(null)
            setStatusNote("")
            setStatusFile(null)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* รูปภาพ */}
            <div className="relative h-48 bg-gray-100">
                <Image
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/report/image/${report.id}`}
                    alt={report.detail || 'Report image'}
                    fill
                    className="object-cover"
                />
                <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(currentStatus?.code || "pending")}`}>
                        {currentStatus?.label || "รอรับเรื่อง"}
                    </span>
                </div>
            </div>

            {/* เนื้อหา */}
            <div className="p-4">
                <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 mb-1">{report.detail}</h3>
                    <p className="text-sm text-gray-500">รหัส: {report.code}</p>
                </div>

                {/* ข้อมูลผู้รับผิดชอบ */}
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                            <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-gray-600">หน่วยงาน:</span>
                        </div>
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            {report.responsible ? "เปลี่ยน" : "เลือก"}
                        </button>
                    </div>
                    <p className="text-sm font-medium mt-1">
                        {report.responsible?.display_name || "ยังไม่ได้มอบหมาย"}
                    </p>
                </div>

                {/* ปุ่มจัดการ */}
                <div className="space-y-2">
                    <button
                        onClick={() => setShowStatusModal(true)}
                        disabled={isFinished}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isFinished
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                    >
                        {isFinished ? "เสร็จสิ้นแล้ว" : "อัพเดทสถานะ"}
                    </button>
                </div>
            </div>

            {/* Modal เลือกหน่วยงาน */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">เลือกหน่วยงาน</h3>
                        <div className="space-y-2 mb-4">
                            {mockInstitutions.map((institution) => (
                                <button
                                    key={institution.id}
                                    onClick={() => handleAssignInstitution(institution.id)}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                >
                                    <div className="font-medium">{institution.display_name}</div>
                                    <div className="text-sm text-gray-500">{institution.email}</div>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal อัพเดทสถานะ */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">อัพเดทสถานะ</h3>

                        {/* เลือกสถานะ */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                สถานะใหม่
                            </label>
                            <select
                                value={selectedStatus || ""}
                                onChange={(e) => setSelectedStatus(Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">เลือกสถานะ</option>
                                {mockStatuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* หมายเหตุ */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                หมายเหตุ
                            </label>
                            <textarea
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                                placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* อัพโหลดรูปภาพ */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                รูปภาพประกอบ (ไม่บังคับ)
                            </label>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => setStatusFile(e.target.files?.[0] || null)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={!selectedStatus}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                อัพเดท
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function AdminDashboard({ reports }: { reports: { items: Report[] } }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [institutionFilter, setInstitutionFilter] = useState("")


    const handleAssignInstitution = async (reportId: string, institutionId: string) => {
        try {
            const response = await fetch('/admin/choose-institution', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    report_id: reportId,
                    institution_id: institutionId
                })
            })

            if (response.ok) {
                // Refresh page or update state
                window.location.reload()
            } else {
                alert('เกิดข้อผิดพลาดในการมอบหมายหน่วยงาน')
            }
        } catch (error) {
            console.error('Error assigning institution:', error)
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
        }
    }

    const handleUpdateStatus = async (reportId: string, statusId: number, note?: string, file?: File) => {
        try {
            const formData = new FormData()
            formData.append('to_status_id', statusId.toString())
            if (note) formData.append('note', note)
            if (file) formData.append('img_after', file)

            // Check if it's the final status
            const isLastStatus = statusId === Math.max(...mockStatuses.map(s => s.sort_order))
            if (isLastStatus) {
                formData.append('finished', 'true')
            }

            const response = await fetch(`/admin/report/status/${reportId}`, {
                method: 'PUT',
                body: formData
            })

            if (response.ok) {
                // Refresh page or update state
                window.location.reload()
            } else {
                alert('เกิดข้อผิดพลาดในการอัพเดทสถานะ')
            }
        } catch (error) {
            console.error('Error updating status:', error)
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
        }
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <Header />

            <section className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">ระบบจัดการรายงาน (Admin)</h1>
                    <p className="text-gray-600">จัดการและติดตามสถานะรายงานทั้งหมด</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-gray-600">รอดำเนินการ</p>
                                <p className="text-lg font-semibold">
                                    {reports.items.filter(r => !r.histories?.[0]?.finished).length}

                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-gray-600">เสร็จสิ้น</p>
                                <p className="text-lg font-semibold">
                                    {reports.items.filter(r => r.histories?.[0]?.finished).length}

                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Building2 className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-gray-600">ไม่มีหน่วยงาน</p>
                                <p className="text-lg font-semibold">
                                    {reports.items.filter(r => !r.responsible).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-gray-600">รวมทั้งหมด</p>
                                <p className="text-lg font-semibold">{reports.items.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="ค้นหารายละเอียดหรือรหัส..."
                                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">ทุกสถานะ</option>
                                {mockStatuses.map((status) => (
                                    <option key={status.code} value={status.code}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">หน่วยงาน</label>
                            <select
                                value={institutionFilter}
                                onChange={(e) => setInstitutionFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">ทุกหน่วยงาน</option>
                                <option value="unassigned">ยังไม่มอบหมาย</option>
                                {mockInstitutions.map((institution) => (
                                    <option key={institution.id} value={institution.id}>
                                        {institution.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Reports Grid */}
                {reports.items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.items.map((report) => (
                            <AdminReportCard
                                key={report.id}
                                report={report}
                                onAssignInstitution={handleAssignInstitution}
                                onUpdateStatus={handleUpdateStatus}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center max-w-md">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Filter className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                ไม่พบรายงาน
                            </h3>
                            <p className="text-gray-600">
                                ลองปรับเงื่อนไขการค้นหาใหม่
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </main>
    )
}