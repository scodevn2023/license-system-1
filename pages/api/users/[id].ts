import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../utils/auth';
import { prisma } from '../../../lib/prisma';
import { hash } from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Kiểm tra quyền admin
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }

  // Kiểm tra user tồn tại
  const user = await prisma.user.findUnique({
    where: { id: String(id) }
  });

  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy user' });
  }

  switch (req.method) {
    case 'PUT':
      try {
        const { name, email, role } = req.body;

        // Validate input
        if (!name || !email) {
          return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }

        // Kiểm tra email trùng lặp
        if (email !== user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email }
          });
          if (existingUser) {
            return res.status(400).json({ error: 'Email đã tồn tại' });
          }
        }

        // Cập nhật user
        const updatedUser = await prisma.user.update({
          where: { id: String(id) },
          data: {
            name,
            email,
            role: role || user.role
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        });

        return res.status(200).json({
          message: 'Cập nhật user thành công',
          user: updatedUser
        });
      } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ error: 'Lỗi khi cập nhật user' });
      }

    case 'DELETE':
      try {
        // Không cho phép xóa admin
        if (user.role === 'ADMIN') {
          return res.status(400).json({ error: 'Không thể xóa tài khoản admin' });
        }

        // Xóa user
        await prisma.user.delete({
          where: { id: String(id) }
        });

        return res.status(200).json({
          message: 'Xóa user thành công'
        });
      } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ error: 'Lỗi khi xóa user' });
      }

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 