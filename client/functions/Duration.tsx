import { Duration } from "@/types/Report"


export const formatDuration = (duration: Duration | undefined) => {
    if (!duration) return "ไม่ระบุ"

    // คำนวณจาก milliseconds เพื่อให้คงลำดับ remainder
    const totalMs = duration.milliseconds
    if (totalMs < 60 * 1000) return "น้อยกว่า 1 นาที"

    let remaining = totalMs
    const msPerMinute = 60 * 1000
    const msPerHour = 60 * msPerMinute
    const msPerDay = 24 * msPerHour
    const msPerWeek = 7 * msPerDay
    const msPerMonth = 30 * msPerDay   
    const msPerYear = 365 * msPerDay

    const years = Math.floor(remaining / msPerYear)
    remaining %= msPerYear
    const months = Math.floor(remaining / msPerMonth)
    remaining %= msPerMonth
    const weeks = Math.floor(remaining / msPerWeek)
    remaining %= msPerWeek
    const days = Math.floor(remaining / msPerDay)
    remaining %= msPerDay
    const hours = Math.floor(remaining / msPerHour)
    remaining %= msPerHour
    const minutes = Math.floor(remaining / msPerMinute)

    const parts: string[] = []
    if (years) parts.push(`${years} ปี`)
    if (months) parts.push(`${months} เดือน`)
    if (weeks) parts.push(`${weeks} สัปดาห์`)
    if (days) parts.push(`${days} วัน`)
    if (hours) parts.push(`${hours} ชั่วโมง`)
    if (minutes) parts.push(`${minutes} นาที`)

    return parts.length ? parts.slice(0, 2).join(" ") : "น้อยกว่า 1 นาที"
}

export const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffMs = end.getTime() - start.getTime()

    const minutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    return {
        milliseconds: diffMs,
        minutes,
        hours,
        days,
        weeks,
        months,
        years
    }
}