import { NextResponse } from 'next/server';

// Thông tin phiên bản mới nhất
const LATEST_VERSION = "1.0.1";
const RELEASE_NOTES = `
- Cải thiện hiệu suất và độ ổn định
- Thêm tính năng giám sát mới
- Sửa lỗi và tối ưu hóa
`;

export async function GET() {
    try {
        // Trả về thông tin phiên bản mới nhất
        return NextResponse.json({
            version: LATEST_VERSION,
            releaseNotes: RELEASE_NOTES.trim(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /api/updates:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
} 