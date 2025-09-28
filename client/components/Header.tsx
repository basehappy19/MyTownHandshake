'use client'
import { FileText, Home, AlertTriangle, User, Menu, X } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between py-4">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="relative">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                <FileText className="h-7 w-7 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                        </div>
                        <div className="hidden md:block">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                แพลตฟอร์มแจ้งปัญหา อำเภอภูเขียว
                            </h1>
                            <p className="text-sm text-gray-500 font-medium">MyTown Handshake</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/"
                            className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors duration-200 font-medium group"
                        >
                            <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            <span>หน้าหลัก</span>
                        </Link>
                        <Link
                            href="/report"
                            className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors duration-200 font-medium group"
                        >
                            <AlertTriangle className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            <span>รายงานปัญหา</span>
                        </Link>
                    </nav>

                    {/* Login Button & Mobile Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Login Button */}
                        <Link
                            href="/auth"
                            className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                            <User className="w-4 h-4" />
                            <span>เข้าสู่ระบบ</span>
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6 text-gray-600" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="py-4 border-t border-gray-200 space-y-2">
                        {/* Mobile Logo for smaller screens */}
                        <div className="md:hidden mb-4">
                            <h1 className="text-lg font-bold text-gray-800">
                                แพลตฟอร์มแจ้งปัญหา อำเภอภูเขียว
                            </h1>
                            <p className="text-xs text-gray-500">MyTown Handshake</p>
                        </div>

                        {/* Mobile Navigation Links */}
                        <Link
                            href="/"
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                                <Home className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-medium text-gray-700">หน้าหลัก</span>
                        </Link>

                        <Link
                            href="/report"
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-200">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="font-medium text-gray-700">รายงานปัญหา</span>
                        </Link>

                        {/* Mobile Login Button */}
                        <Link
                            href="/auth"
                            className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md group"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div className="p-2 bg-white/20 rounded-lg">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="font-medium">เข้าสู่ระบบ</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}