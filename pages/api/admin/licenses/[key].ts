import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../../../utils/auth';
import { revokeLicense, resetHardwareId } from '../../../utils/license';

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

  // Lấy key từ query
  const { key } = req.query;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'License key không hợp lệ' });
  }

  // Xử lý các phương thức HTTP
  switch (req.method) {
    case 'GET':
      return getLicense(req, res, key);
    case 'PUT':
      return updateLicense(req, res, key);
    case 'DELETE':
      return deleteLicense(req, res, key);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Lấy thông tin license
async function getLicense(req: NextApiRequest, res: NextApiResponse, key: string) {
  try {
    const license = await prisma.license.findUnique({
      where: { key },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        instances: true
      }
    });

    if (!license) {
      return res.status(404).json({ error: 'License không tồn tại' });
    }

    return res.status(200).json({
      success: true,
      data: license
    });
  } catch (error) {
    console.error('Get license error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// Cập nhật license
async function updateLicense(req: NextApiRequest, res: NextApiResponse, key: string) {
  try {
    const { userId, status, action } = req.body;

    // Kiểm tra license tồn tại
    const license = await prisma.license.findUnique({
      where: { key }
    });

    if (!license) {
      return res.status(404).json({ error: 'License không tồn tại' });
    }

    // Xử lý các action đặc biệt
    if (action === 'revoke') {
      const result = await revokeLicense(key);
      
      if (!result) {
        return res.status(400).json({ error: 'Không thể thu hồi license' });
      }
      
      return res.status(200).json({
        success: true,
        message: 'License đã được thu hồi'
      });
    }

    if (action === 'reset_hwid') {
      const result = await resetHardwareId(key);
      
      if (!result) {
        return res.status(400).json({ error: 'Không thể reset HWID' });
      }
      
      return res.status(200).json({
        success: true,
        message: 'HWID đã được reset'
      });
    }

    // Cập nhật thông tin license
    const data: any = {};

    if (userId) {
      // Kiểm tra user tồn tại
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(400).json({ error: 'User không tồn tại' });
      }

      data.userId = userId;
    }

    if (status && ['UNACTIVATED', 'ACTIVE', 'EXPIRED', 'REVOKED'].includes(status)) {
      data.status = status;
    }

    // Cập nhật license
    const updatedLicense = await prisma.license.update({
      where: { id: license.id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        instances: true
      }
    });

    return res.status(200).json({
      success: true,
      data: updatedLicense
    });
  } catch (error) {
    console.error('Update license error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}

// Xóa license
async function deleteLicense(req: NextApiRequest, res: NextApiResponse, key: string) {
  try {
    // Kiểm tra license tồn tại
    const license = await prisma.license.findUnique({
      where: { key }
    });

    if (!license) {
      return res.status(404).json({ error: 'License không tồn tại' });
    }

    // Xóa tất cả instances
    await prisma.licenseInstance.deleteMany({
      where: { licenseId: license.id }
    });

    // Xóa license
    await prisma.license.delete({
      where: { id: license.id }
    });

    return res.status(200).json({
      success: true,
      message: 'License đã được xóa'
    });
  } catch (error) {
    console.error('Delete license error:', error);
    return res.status(500).json({ error: 'Lỗi server' });
  }
}
