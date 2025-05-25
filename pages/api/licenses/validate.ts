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

        // Check if license belongs to user
        if (license.userId !== decoded.userId) {
            return res.status(403).json({ message: 'This license does not belong to you' });
        }

        // Check if license is expired
        if (new Date(license.expirationDate) < new Date()) {
            await prisma.license.update({
                where: { id: license.id },
                data: { status: 'EXPIRED' }
            });
            return res.status(400).json({ message: 'License has expired' });
        }

        // Check if hardware ID matches
        if (license.hardwareId && license.hardwareId !== hardwareId) {
            return res.status(403).json({ 
                message: 'License is activated on another device',
                existingHardwareId: license.hardwareId
            });
        }

        // Update last validated timestamp
        await prisma.license.update({
            where: { id: license.id },
            data: { lastValidatedAt: new Date() }
        });

        return res.status(200).json({
            success: true,
            message: 'License is valid',
            data: {
                id: license.id,
                key: license.key,
                status: license.status,
                type: license.type,
                expiresAt: license.expirationDate,
                hardwareId: license.hardwareId,
                activatedAt: license.activatedAt,
                lastValidatedAt: new Date(),
                user: {
                    id: license.user.id,
                    email: license.user.email,
                    name: license.user.name
                }
            }
        });

    } catch (error) {
        console.error('Error validating license:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
