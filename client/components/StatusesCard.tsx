const getStatusColor = (code: string) => {
    switch (code) {
        case 'pending':
            return 'from-yellow-400 to-yellow-500'
        case 'forwarded':
            return 'from-blue-400 to-blue-500'
        case 'in_progress':
            return 'from-orange-400 to-orange-500'
        case 'resolved':
            return 'from-green-400 to-green-500'
        default:
            return 'from-gray-400 to-gray-500'
    }
}

const getStatusIcon = (code: string) => {
    switch (code) {
        case 'pending':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        case 'forwarded':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            )
        case 'in_progress':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        case 'resolved':
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        default:
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
    }
}

import { statusRaw } from '@/app/page'
import React from 'react'

type StatusItem = statusRaw['items'][number]

export const StatusesCard = ({ status }: { status: StatusItem }) => {
    return (
        <div key={status.id} className="relative overflow-hidden">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getStatusColor(status.code)} text-white`}>
                        {getStatusIcon(status.code)}
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">{status.count}</div>
                        <div className="text-xs text-gray-500">{status.percent}%</div>
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 leading-tight">
                        {status.label}
                    </h3>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full bg-gradient-to-r ${getStatusColor(status.code)} transition-all duration-500 ease-out`}
                            style={{ width: `${status.percent}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatusesCard