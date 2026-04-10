import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';

export const getFeeComponents = async (req: Request, res: Response) => {
  try {
    const components = await prisma.feeComponent.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(components);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fee components' });
  }
};

export const createFeeComponent = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  try {
    const component = await prisma.feeComponent.create({
      data: { name, description }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_FEE_COMPONENT',
      entity: 'FeeComponent',
      entityId: component.id,
      newValue: component,
      ipAddress: req.ip
    });

    res.status(201).json(component);
  } catch (error) {
    res.status(500).json({ message: 'Error creating fee component' });
  }
};

export const updateFeeComponent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;
  try {
    const component = await prisma.feeComponent.update({
      where: { id },
      data: { name, description, isActive }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_FEE_COMPONENT',
      entity: 'FeeComponent',
      entityId: id,
      newValue: { name, description, isActive },
      ipAddress: req.ip
    });

    res.json(component);
  } catch (error) {
    res.status(500).json({ message: 'Error updating fee component' });
  }
};
