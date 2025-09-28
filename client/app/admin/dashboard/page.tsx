import AdminDashboard from '@/components/AdminDashboard'
import { getReports } from '@/functions/reports/get_reports'
import React from 'react'

export default async function Dashboard() {
    const reports = await getReports()
    return (
        <AdminDashboard reports={reports} />
    )
}
