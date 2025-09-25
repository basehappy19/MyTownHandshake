'use client'
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePathname } from 'next/navigation'

const SearchBar = () => {
    const pathname = usePathname()
    const router = useRouter();
    const searchParams = useSearchParams();
    const [text, setText] = useState('');

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (text && text.trim() !== '') {
                params.set('search', text);
            } else {
                params.delete('search');
            }

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [text, router, pathname, searchParams]);

    return (
        <div className="relative mb-6">
            <div className="relative group">
                {/* Search Icon */}
                <div className="absolute z-30 inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-search"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
                </div>

                {/* Input Field */}
                <Input
                    type="text"
                    placeholder="ค้นหารายงาน, ที่อยู่, หรือผู้รับผิดชอบ..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white/80 backdrop-blur-sm border-2 border-green-200 rounded-2xl text-gray-700 placeholder-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:bg-white transition-all duration-300 shadow-lg hover:shadow-xl group-focus-within:shadow-2xl"
                />

                {/* Clear Button */}
                {text && (
                    <button
                        onClick={() => setText('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-green-50 rounded-r-2xl transition-colors duration-200 group"
                    >
                        <svg className="h-5 w-5 text-green-400 hover:text-green-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Search Results Counter (แสดงเมื่อมีการค้นหา) */}
            {text && (
                <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-lg inline-block">
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    กำลังค้นหา: {text}
                </div>
            )}
        </div>
    )
}

export default SearchBar