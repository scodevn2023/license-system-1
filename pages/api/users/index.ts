import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../utils/auth';
import prisma from '../../../utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Kiểm tra quyền admin
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    // Lấy danh sách người dùng
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng' });
  }
} 