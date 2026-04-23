import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getFeeComponents = async (req: Request, res: Response) => {
  try {
    const components = await prisma.feeComponent.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { structureComponents: true } }
      }
    });
    res.json({ success: true, data: components });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fee components' });
  }
};

export const createFeeComponent = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || name.trim().length < 2) return res.status(422).json({ success: false, message: 'Name must be min 2 chars' });

  try {
    const existing = await prisma.feeComponent.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    if (existing) return res.status(409).json({ success: false, message: 'Component with this name already exists' });

    const newComp = await prisma.feeComponent.create({
      data: { name, description }
    });
    res.status(201).json({ success: true, data: newComp });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating component' });
  }
};

export const updateFeeComponent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  try {
    if (name) {
       const existing = await prisma.feeComponent.findFirst({
         where: { name: { equals: name, mode: 'insensitive' }, id: { not: id } }
       });
       if (existing) return res.status(409).json({ success: false, message: 'Another component uses this name' });
    }

    const updated = await prisma.feeComponent.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating component' });
  }
};
