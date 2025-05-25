import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'admin@example.com';
    const password = 'admin123';
    const name = 'Admin';

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('Email đã được sử dụng');
      return;
    }

    // Mã hóa mật khẩu
    const hashedPassword = await hashPassword(password);

    // Tạo user admin
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN'
      }
    });

    console.log('Tạo tài khoản admin thành công:', admin);
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 