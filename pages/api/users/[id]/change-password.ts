import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '../../../../utils/auth';
import { prisma } from '../../../../lib/prisma';
import { hash } from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  // Kiểm tra quyền admin
  const admin = await requireAdmin(req, res);
  if (!admin) {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }

  try {
    const { newPassword } = req.body;

    // Validate input
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra user tồn tại
    const user = await prisma.user.findUnique({
      where: { id: String(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    // Hash mật khẩu mới
    const hashedPassword = await hash(newPassword, 10);

    // Cập nhật mật khẩu
    await prisma.user.update({
      where: { id: String(id) },
      data: { password: hashedPassword }
    });

    return res.status(200).json({
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Lỗi khi đổi mật khẩu' });
  }
} 