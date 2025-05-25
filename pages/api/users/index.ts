import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../utils/auth';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Kiểm tra quyền admin
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return; // requireAdmin đã gửi response lỗi
    }

    // Lấy danh sách users với thông tin licenses
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        licenses: {
          select: {
            id: true,
            key: true,
            status: true,
            type: true,
            expirationDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách users' });
  }
} 