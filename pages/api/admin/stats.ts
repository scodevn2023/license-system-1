import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../../../utils/auth';

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
    // Lấy thống kê
    const [total, active, unactivated, expired, revoked] = await Promise.all([
      prisma.license.count(),
      prisma.license.count({ where: { status: 'ACTIVE' } }),
      prisma.license.count({ where: { status: 'UNACTIVATED' } }),
      prisma.license.count({ where: { status: 'EXPIRED' } }),
      prisma.license.count({ where: { status: 'REVOKED' } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        active,
        unactivated,
        expired,
        revoked
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
} 