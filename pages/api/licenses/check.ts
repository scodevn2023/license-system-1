import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

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

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ message: 'License key is required' });
    }

    // Find license
    const license = await prisma.license.findUnique({
      where: { key },
      include: {
        user: true
      }
    });

    if (!license) {
      return res.status(404).json({ message: 'License not found' });
    }

    // Return license status and hardware ID if activated
    return res.status(200).json({
      success: true,
      isActivated: !!license.hardwareId,
      hardwareId: license.hardwareId,
      status: license.status,
      type: license.type,
      expiresAt: license.expirationDate,
      userId: license.userId,
      userEmail: license.user?.email
    });

  } catch (error) {
    console.error('Error checking license:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 