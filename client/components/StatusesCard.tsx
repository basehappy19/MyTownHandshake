import { statusRaw } from '@/app/page'
import { getStatusIconFromDB } from '@/functions/status_icon'
import React from 'react'

type StatusItem = statusRaw['items'][number]

export const StatusesCard = ({ status }: { status: StatusItem }) => {

    return (
        <div key={status.id} className="relative overflow-hidden">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${status.badge_bg} text-white ${status.badge_ring}`}>
                        {getStatusIconFromDB({
                            icon: status.icon,
                            className: "w-5 h-5 text-white"
                        })}
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${status.text_color}`}>{status.count}</div>
                        <div className="text-xs text-gray-500">{status.percent}%</div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 leading-tight">
                        {status.label}
                    </h3>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full ${status.badge_bg} transition-all duration-500 ease-out`}
                            style={{ width: `${status.percent}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatusesCard
