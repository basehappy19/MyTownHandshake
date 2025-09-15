import { FileText } from 'lucide-react'
import React from 'react'

export default function Header() {
    return (
        <header className="bg-white shadow-xl border-b-4 border-blue-600">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                            <FileText className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">แพลตฟอร์มแจ้งปัญหา อำเภอภูเขียว</h1>
                            <p className="text-sm text-gray-600 mt-1">MyTown Handshake</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
