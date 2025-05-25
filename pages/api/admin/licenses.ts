import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../../../utils/auth';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, addYears } from 'date-fns';

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

  // Xử lý các phương thức HTTP
  switch (req.method) {
    case 'GET':
      return getLicenses(req, res);
    case 'POST':
      return createLicense(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Lấy danh sách license
async function getLicenses(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status, search, page = '1', limit = '10' } = req.query;
    
    // Xây dựng điều kiện tìm kiếm
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { key: { contains: search as string } },
        { user: { email: { contains: search as string } } }
      ];
    }
    
    // Phân trang
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Lấy danh sách license
    const licenses = await prisma.license.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      skip,
      take: limitNumber,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Đếm tổng số license
    const total = await prisma.license.count({ where });
    
    return res.status(200).json({
      success: true,
      data: licenses,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Get licenses error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// Tạo license mới
async function createLicense(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type, count = 1 } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Loại license là bắt buộc' });
    }

    // Tính ngày hết hạn
    let expiresAt = new Date();
    switch (type) {
      case 'ONE_MONTH':
        expiresAt = addMonths(expiresAt, 1);
        break;
      case 'THREE_MONTHS':
        expiresAt = addMonths(expiresAt, 3);
        break;
      case 'SIX_MONTHS':
        expiresAt = addMonths(expiresAt, 6);
        break;
      case 'ONE_YEAR':
        expiresAt = addYears(expiresAt, 1);
        break;
      default:
      return res.status(400).json({ error: 'Loại license không hợp lệ' });
    }
    
    // Tạo nhiều license nếu count > 1
    const licenses = [];
    for (let i = 0; i < count; i++) {
      const license = await prisma.license.create({
        data: {
          key: uuidv4(),
          type,
          status: 'UNACTIVATED',
          expiresAt
        }
      });
      licenses.push(license);
    }

    return res.status(200).json({
      success: true,
      data: count === 1 ? licenses[0] : licenses
    });
  } catch (error) {
    console.error('Create license error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}
