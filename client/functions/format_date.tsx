export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export function timeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    const minutes = Math.floor(diff / 60)
    const hours = Math.floor(diff / 3600)
    const days = Math.floor(diff / 86400)
    const weeks = Math.floor(diff / (86400 * 7))
    const months = Math.floor(diff / (86400 * 30))
    const years = Math.floor(diff / (86400 * 365))

    if (diff < 60) return `ไม่กี่วินาทีที่แล้ว`
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
    if (days < 7) return `${days} วันที่แล้ว`
    if (weeks < 5) return `${weeks} สัปดาห์ที่แล้ว`
    if (months < 12) return `${months} เดือนที่แล้ว`
    return `${years} ปีที่แล้ว`
}

export function formatThaiDate(dateString: string): string {
    const date = new Date(dateString)

    const buddhistYear = date.getFullYear() + 543
    const monthNames = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ]

    const day = date.getDate()
    const month = monthNames[date.getMonth()]
    const year = buddhistYear
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${day} ${month} ${year}, ${hours}:${minutes} น.`
}

