import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const license = await prisma.license.findUnique({
        where: { id: String(id) },
        include: { user: true }
      });
      
      if (!license) {
        return res.status(404).json({ error: 'License not found' });
      }
      
      res.status(200).json(license);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch license' });
    }
  }
  else if (req.method === 'PUT') {
    try {
      const { status, expiresAt } = req.body;
      
      const license = await prisma.license.update({
        where: { id: String(id) },
        data: {
          status,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined
        },
        include: { user: true }
      });
      
      res.status(200).json(license);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update license' });
    }
  }
  else if (req.method === 'DELETE') {
    try {
      await prisma.license.delete({
        where: { id: String(id) }
      });
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete license' });
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 