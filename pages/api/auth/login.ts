import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';

// Đảm bảo JWT_SECRET được cấu hình
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured in environment variables');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== Login API Debug ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', { ...req.body, password: req.body.password ? '[REDACTED]' : undefined });

  if (req.method !== 'POST') {
    console.log('Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    console.log('Validating input:', { 
      email: !!email, 
      passwordLength: password?.length 
    });

    if (!email || !password) {
      console.log('Missing required fields:', { 
        email: !!email, 
        password: !!password 
      });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Tìm user theo email
    console.log('Finding user by email:', email);
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true
      }
    });

    console.log('User query result:', user);

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('User found:', { 
      id: user.id, 
      email: user.email,
      name: user.name,
      role: user.role
    });

    // Kiểm tra mật khẩu
    console.log('Verifying password...');
    const isValidPassword = await compare(password, user.password);
    console.log('Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    console.log('Password verified successfully');

    // Tạo JWT token
    const token = sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    // Set cookie
    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`);

    // Trả về thông tin user (không bao gồm password)
    const { password: _, ...userWithoutPassword } = user;
    console.log('=== Login API Success ===');
    return res.status(200).json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('=== Login API Error ===');
    console.error('Error details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
