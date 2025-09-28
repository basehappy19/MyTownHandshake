'use client'
import { useState } from 'react'
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
    const [adminCode, setAdminCode] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        await new Promise(resolve => setTimeout(resolve, 1000))

        if (adminCode === '1234') {
            alert('เข้าสู่ระบบสำเร็จ! กำลังนำทางไปหน้า Admin Dashboard')
            router.push('/admin/dashboard')
            setIsLoading(false)
        } else {
            setError('รหัส Admin ไม่ถูกต้อง')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center px-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 2px, transparent 2px),
                                     radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 2px, transparent 2px)`,
                    backgroundSize: '60px 60px'
                }} />
            </div>

            <div className="w-full max-w-md relative">
                {/* Login Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-green-600 px-8 py-6 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">
                            Admin Panel
                        </h1>
                        <p className="text-green-100 text-sm">
                            เข้าสู่ระบบจัดการ
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-8">
                        <div className="space-y-6">
                            {/* Admin Code Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    รหัส Admin
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={adminCode}
                                        onChange={(e) => setAdminCode(e.target.value)}
                                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        placeholder="กรอกรหัส Admin"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-red-400 rounded-full mr-3"></div>
                                        <p className="text-red-700 text-sm font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Demo Info */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-start">
                                    <User className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-green-700 text-sm font-medium mb-1">
                                            Demo Account
                                        </p>
                                        <p className="text-green-600 text-xs">
                                            รหัส Admin: <span className="font-mono bg-green-100 px-1 py-0.5 rounded">1234</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || !adminCode}
                                className="w-full bg-gradient-to-r from-green-600 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        กำลังเข้าสู่ระบบ...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <Shield className="w-5 h-5 mr-2" />
                                        เข้าสู่ระบบ
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            ระบบจัดการรายงานปัญหา v1.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}