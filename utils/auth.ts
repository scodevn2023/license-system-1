import { NextApiRequest, NextApiResponse } from 'next';
import jwt, { verify } from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import { prisma } from '../lib/prisma';
import { GetServerSidePropsContext } from 'next';

// Đảm bảo JWT_SECRET được cấu hình
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;

// Hàm tạo JWT token
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

// Mã hóa mật khẩu với bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const hashedPassword = await hash(password, 10);
  return hashedPassword;
};

// Kiểm tra mật khẩu
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  try {
    const isValid = await compare(plainPassword, hashedPassword);
    return isValid;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

// Xác thực token
export const verifyToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Xác thực user
export async function authenticateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Parse cookies từ header
    const cookies = req.headers.cookie?.split(';').reduce((acc: any, cookie: string) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    const token = cookies?.token;
    if (!token) {
      return null;
    }

    // Verify token
    const decoded = verify(token, JWT_SECRET) as { userId: string };
    if (!decoded || !decoded.userId) {
      return null;
    }

    // Tìm user trong database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export const requireAuth = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await authenticateUser(req, res);
  
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  return user;
};

// Middleware kiểm tra quyền admin
export async function requireAdmin(req: NextApiRequest, res: NextApiResponse) {
  const user = await authenticateUser(req, res);
  
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return user;
}

// Tạo session mới
export const createSession = async (userId: string) => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
  
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  
  return session;
};

// Hàm đăng xuất (xóa session)
export const logout = async (token: string): Promise<void> => {
  await prisma.session.deleteMany({
    where: {
      token
    }
  });
};
