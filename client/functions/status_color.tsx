export const getStatusColor = (status: string) => {
    switch (status) {
        case 'แก้ไขเสร็จสิ้น':
            return 'text-green-700 bg-green-100 border-green-200';
        case 'กำลังดำเนินการ':
            return 'text-orange-700 bg-orange-100 border-orange-200';
        case 'ส่งต่อเรื่องให้หน่วยงานที่เกี่ยวข้อง':
            return 'text-blue-700 bg-blue-100 border-blue-200';
        case 'รอรับเรื่อง':
            return 'text-gray-700 bg-gray-100 border-gray-200';
        default:
            return 'text-gray-700 bg-gray-100 border-gray-200';
    }
};