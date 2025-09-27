import ReportCard from "@/components/ReportCard"
import { getReports } from "@/functions/reports/get_reports"
import { Report } from "@/types/Report"

export default async function Dashboard() {
    const reports: { items: Report[] } = await getReports()

    return (
        <section>
            {reports.items && reports.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.items.map((r) => (
                        <ReportCard key={r.id} report={r} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-green-100 p-12 text-center max-w-md">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-green-800 mb-2">
                            ยังไม่มีรายงาน
                        </h3>
                        <p className="text-green-600">
                            เมื่อมีการสร้างรายงานใหม่จะแสดงที่นี่
                        </p>
                    </div>
                </div>
            )}
        </section>
    )
}
