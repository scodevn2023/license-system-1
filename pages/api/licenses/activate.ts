import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify token
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Validate input
    const { key, hardwareId } = req.body;
    if (!key || !hardwareId) {
      return res.status(400).json({ message: 'License key and hardware ID are required' });
    }

    console.log('Activating license:', { 
      key, 
      hardwareId, 
      requestUserId: decoded.userId,
      requestUserEmail: decoded.email 
    });

    // Find license
    const license = await prisma.license.findUnique({
      where: { key },
      include: {
        user: true
      }
    });

    if (!license) {
      console.log('License not found:', key);
      return res.status(404).json({ message: 'License not found' });
    }

    // Check if license belongs to user
    if (license.userId !== decoded.userId) {
      console.log('License belongs to different user:', {
        licenseUserId: license.userId,
        licenseUserEmail: license.user.email,
        requestUserId: decoded.userId,
        requestUserEmail: decoded.email
      });
      return res.status(403).json({ 
        message: 'This license does not belong to you',
        details: {
          licenseOwner: license.user.email,
          currentUser: decoded.email
        }
      });
    }

    // Check if license is already activated on another device
    if (license.hardwareId && license.hardwareId !== hardwareId) {
      console.log('License already activated on different device:', {
        existingHardwareId: license.hardwareId,
        newHardwareId: hardwareId
      });
      return res.status(403).json({ 
        message: 'License is already activated on another device',
        existingHardwareId: license.hardwareId
      });
    }

    // Check if license is expired
    if (new Date(license.expirationDate) < new Date()) {
      console.log('License expired:', {
        expirationDate: license.expirationDate,
        currentDate: new Date()
      });
      await prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' }
      });
      return res.status(400).json({ message: 'License has expired' });
    }

    // Activate license
    const now = new Date();
    const updatedLicense = await prisma.license.update({
      where: { id: license.id },
      data: {
        hardwareId,
        status: 'ACTIVE',
        activatedAt: now,
        lastValidatedAt: now
      },
      include: {
        user: true
      }
    });

    console.log('License activated successfully:', {
      licenseId: updatedLicense.id,
      hardwareId: updatedLicense.hardwareId,
      status: updatedLicense.status,
      activatedAt: updatedLicense.activatedAt,
      userId: updatedLicense.userId,
      userEmail: updatedLicense.user.email
    });

    return res.status(200).json({
      success: true,
      message: 'License activated successfully',
      data: {
        id: updatedLicense.id,
        key: updatedLicense.key,
        status: updatedLicense.status,
        type: updatedLicense.type,
        expiresAt: updatedLicense.expirationDate,
        hardwareId: updatedLicense.hardwareId,
        activatedAt: updatedLicense.activatedAt,
        lastValidatedAt: updatedLicense.lastValidatedAt,
        user: {
          id: updatedLicense.user.id,
          email: updatedLicense.user.email,
          name: updatedLicense.user.name
        }
      }
    });

  } catch (error) {
    console.error('Error activating license:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
