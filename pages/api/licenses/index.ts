import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, addYears } from 'date-fns';
import { authenticateUser, requireAdmin } from '../../../utils/auth';
import prisma from '../../../utils/prisma';

const prismaClient = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Kiểm tra quyền admin
      const admin = await requireAdmin(req, res);
      if (!admin) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
      }

      // Lấy danh sách license
      const licenses = await prismaClient.license.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json({ licenses });
    } catch (error) {
      console.error('Get licenses error:', error);
      return res.status(500).json({ error: 'Lỗi khi lấy danh sách license' });
    }
  } else if (req.method === 'POST') {
    try {
      const { type, email, name } = req.body;
      
      if (!type || !email) {
        return res.status(400).json({ error: 'Type and email are required' });
      }

      // Tìm user theo email
      let user = await prismaClient.user.findUnique({
        where: { email }
      });

      // Nếu không tìm thấy user, tạo mới
      if (!user) {
        user = await prismaClient.user.create({
          data: {
            email,
            name: name || email,
            password: 'default_password',
            role: 'USER'
          }
        });
      }

      // Tạo license mới
      const license = await prismaClient.license.create({
        data: {
          key: uuidv4(),
          type,
          status: 'UNACTIVATED',
          userId: user.id,
          expiresAt: calculateExpirationDate(type)
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      return res.status(201).json({ success: true, data: license });
    } catch (error) {
      console.error('Create license error:', error);
      return res.status(500).json({ error: 'Lỗi server' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Hàm tính ngày hết hạn
function calculateExpirationDate(type: string): Date {
  const now = new Date();
  switch (type) {
    case 'ONE_MONTH':
      return addMonths(now, 1);
    case 'THREE_MONTHS':
      return addMonths(now, 3);
    case 'SIX_MONTHS':
      return addMonths(now, 6);
    case 'ONE_YEAR':
      return addYears(now, 1);
    default:
      throw new Error('Invalid license type');
  }
} 