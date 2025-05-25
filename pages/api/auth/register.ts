import { NextApiRequest, NextApiResponse } from 'next';
import { hashPassword, createSession } from '../../../utils/auth';
import prisma from '../../../utils/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== Register API Debug ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', { ...req.body, password: req.body.password ? '[REDACTED]' : undefined });

  if (req.method !== 'POST') {
    console.log('Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    console.log('Validating input:', { 
      email: !!email, 
      passwordLength: password?.length, 
      name: !!name 
    });

    if (!email || !password || !name) {
      console.log('Missing required fields:', { 
        email: !!email, 
        password: !!password, 
        name: !!name 
      });
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Kiểm tra email đã tồn tại chưa
    console.log('Checking existing email:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    console.log('Hashing password...');
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed successfully');

    // Tạo user mới
    console.log('Creating new user...');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    console.log('User created successfully:', { 
      id: user.id, 
      email: user.email,
      name: user.name,
      role: user.role
    });

    // Tạo session mới
    console.log('Creating session...');
    const session = await createSession(user.id);
    console.log('Session created successfully');
    
    // Set cookie với token
    const cookieString = `token=${session.token}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    console.log('Setting cookie:', cookieString);
    res.setHeader('Set-Cookie', cookieString);

    console.log('=== Register API Success ===');
    return res.status(201).json({ user });
  } catch (error) {
    console.error('=== Register API Error ===');
    console.error('Error details:', error);
    return res.status(500).json({ error: 'Lỗi đăng ký' });
  }
}
