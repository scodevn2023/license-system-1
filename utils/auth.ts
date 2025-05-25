import { NextApiRequest, NextApiResponse } from 'next';
import jwt, { verify } from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import { prisma } from './prisma';
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
  console.log('=== Hash Password Debug ===');
  console.log('Password length:', password.length);
  
  const hashedPassword = await hash(password, 10);
  console.log('Password hashed successfully');
  
  return hashedPassword;
};

// Kiểm tra mật khẩu
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  console.log('=== Verify Password Debug ===');
  console.log('Plain password length:', plainPassword.length);
  console.log('Hashed password length:', hashedPassword.length);
  
  try {
    const isValid = await compare(plainPassword, hashedPassword);
    console.log('Password verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

// Xác thực token
export const verifyToken = async (token: string) => {
  console.log('=== Verify Token Debug ===');
  console.log('Token length:', token.length);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Xác thực user
export async function authenticateUser(req: any) {
  try {
    console.log('=== Authenticate User Debug ===');
    console.log('Headers:', req.headers);

    // Parse cookies
    const cookies = req.headers.cookie?.split(';').reduce((acc: any, cookie: string) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    console.log('Parsed cookies:', cookies);

    const token = cookies?.token;
    if (!token) {
      console.log('No token found');
      return null;
    }

    console.log('Token found, verifying...');
    const decoded = verify(token, JWT_SECRET);
    console.log('Token verified successfully:', decoded);

    if (!decoded || typeof decoded === 'string') {
      console.log('Invalid token format');
      return null;
    }

    console.log('Token verified, finding user...');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      console.log('User not found for token');
      return null;
    }

    console.log('User found:', user);
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export const requireAuth = async (context: GetServerSidePropsContext) => {
  const { req, res } = context;
  const user = await authenticateUser(req);

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

// Middleware kiểm tra quyền admin
export const requireAdmin = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await authenticateUser(req);

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return user;
};

// Tạo session mới
export const createSession = async (userId: string) => {
  console.log('=== Create Session Debug ===');
  console.log('User ID:', userId);
  
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
  console.log('Token generated');
  
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('Session created in database');
  
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
