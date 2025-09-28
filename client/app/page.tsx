import Header from '@/components/Header'
import ReportCard from '@/components/ReportCard'
import { ReportFinishedCard } from '@/components/ReportFinishedCard'
import SearchBar from '@/components/SearchBar'
import StatusesCard from '@/components/StatusesCard'
import { getReports, getReportsFinished } from '@/functions/reports/get_reports'
import { getStatuses } from '@/functions/reports/get_statistics'
import { Report } from '@/types/Report'
import React from 'react'

export type statusRaw = {
  items: {
    id: number
    code: string
    gradient?: string
    badge_ring?: string
    badge_bg?: string
    icon?: string
    text_color?: string
    label: string
    count: number
    percent: number
  }[]
  summary: {
    id: number,
    code: string,
    label: string,
    count: number,
    percent: number
  }
}

export default async function Home(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const reports: { items: Report[] } = await getReports(search)
  const reportsFinished: { items: Report[] } = await getReportsFinished()
  const statuses: statusRaw = await getStatuses()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <section>
          <span className="
    inline-block 
    text-green-800 
    font-semibold 
    mb-3
">
            ภูเขียว รับแจ้งไปทั้งหมด
            <span className="mx-1 text-emerald-600 font-bold">
              {reports.items.length}
            </span>
            เรื่อง
          </span>

          {reportsFinished.items && reportsFinished.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportsFinished.items.map((r) => (
                <ReportFinishedCard key={r.id} report={r} />
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
        {/* Summary Stats */}
        <div className="my-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-green-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 font-medium">
                  รายงานทั้งหมด: {statuses.summary?.count || 0} รายการ
                </span>
              </div>
              <div className="text-sm text-green-600">
                อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
              </div>
            </div>

            {/* Status Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statuses.items?.map((status) => (
                <StatusesCard key={status.id} status={status} />
              ))}
            </div>
          </div>
        </div>
        <div>
          <SearchBar />
        </div>

        {/* Reports Grid */}
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
      </div>
    </div>
  )
}