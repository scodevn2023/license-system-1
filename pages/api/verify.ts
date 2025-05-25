import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'License key is required' });
    }

    const license = await prisma.license.findUnique({
      where: { key },
      include: { user: true }
    });

    if (!license) {
      return res.status(404).json({ error: 'Invalid license key' });
    }

    // Check if license is active
    if (license.status !== 'active') {
      return res.status(403).json({ error: 'License is not active' });
    }

    // Check if license has expired
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'License has expired' });
    }

    res.status(200).json({
      valid: true,
      license: {
        id: license.id,
        key: license.key,
        status: license.status,
        expiresAt: license.expiresAt,
        user: license.user
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify license' });
  }
} 