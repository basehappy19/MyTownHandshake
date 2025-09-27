// functions/statusStyle.ts
export type StatusCode = string | 'pending' | 'forwarded' | 'in_progress' | 'resolved'

interface StatusStyle {
    badge_bg: string
    badge_ring: string
    gradient: string
    text_color: string
    icon: string
}

/**
 * คืนค่ากลุ่ม class สำหรับตกแต่ง component ตามรหัสสถานะ
 * @param code 'pending' | 'forwarded' | 'in_progress' | 'resolved'
 */
export function getStatusStyle(code: StatusCode): StatusStyle {
    switch (code) {
        case 'forwarded':
            return {
                badge_bg: 'bg-blue-500',
                badge_ring: 'ring-1 ring-blue-200',
                gradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
                text_color: 'text-blue-700',
                icon: 'Send',
            }
        case 'in_progress':
            return {
                badge_bg: 'bg-orange-500',
                badge_ring: 'ring-1 ring-orange-200',
                gradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
                text_color: 'text-orange-700',
                icon: 'Clock',
            }
        case 'resolved':
            return {
                badge_bg: 'bg-green-500',
                badge_ring: 'ring-1 ring-green-200',
                gradient: 'bg-gradient-to-r from-green-500 to-green-600',
                text_color: 'text-green-700',
                icon: 'CheckCircle',
            }
        case 'pending':
        default:
            return {
                badge_bg: 'bg-gray-500',
                badge_ring: 'ring-1 ring-gray-200',
                gradient: 'bg-gradient-to-r from-gray-400 to-gray-500',
                text_color: 'text-green-700',
                icon: 'CircleDot',
            }
    }
}
