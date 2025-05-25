import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../../../../utils/auth';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Xác thực người dùng
  const user = await authenticateUser(req, res);

  if (!user) {
    return res.status(401).json({ error: 'Chưa đăng nhập' });
  }

  // Kiểm tra quyền admin
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Lấy tất cả license
    const licenses = await prisma.license.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Tạo CSV
    const headers = [
      'Mã giấy phép',
      'Loại',
      'Trạng thái',
      'Người dùng',
      'Email',
      'Ngày kích hoạt',
      'Ngày hết hạn',
      'HWID',
      'Ngày tạo'
    ].join(',');

    const rows = licenses.map(license => [
      license.key,
      license.type,
      license.status,
      license.user?.name || '',
      license.user?.email || '',
      license.activatedAt ? format(new Date(license.activatedAt), 'dd/MM/yyyy HH:mm') : '',
      license.expiresAt ? format(new Date(license.expiresAt), 'dd/MM/yyyy HH:mm') : '',
      license.hardwareId || '',
      format(new Date(license.createdAt), 'dd/MM/yyyy HH:mm')
    ].join(','));

    const csv = [headers, ...rows].join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=licenses-${format(new Date(), 'yyyy-MM-dd')}.csv`);

    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
} 