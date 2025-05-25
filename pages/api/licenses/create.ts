import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verify } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin token
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Validate input
    const { userId, type, notes } = req.body;
    if (!userId || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Calculate expiration date
    const expirationDate = new Date();
    if (type === 'ONE_MONTH') {
      expirationDate.setMonth(expirationDate.getMonth() + 1);
    } else if (type === 'ONE_YEAR') {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    } else {
      return res.status(400).json({ message: 'Invalid license type' });
    }

    // Generate unique license key
    const licenseKey = uuidv4();

    // Create license
    const license = await prisma.license.create({
      data: {
        key: licenseKey,
        userId,
        type,
        expirationDate,
        notes,
        creatorId: decoded.userId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: 'License created successfully',
      license,
    });
  } catch (error) {
    console.error('Create license error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 