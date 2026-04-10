import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';

export const getExpenseCategories = async (req: Request, res: Response) => {
  const { all } = req.query;
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: {
        ...(all !== 'true' && { isActive: true })
      },
      include: {
        _count: { select: { transactions: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expense categories' });
  }
};

export const createExpenseCategory = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  try {
    const category = await prisma.expenseCategory.create({
      data: { name, description }
    });
    
    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_EXPENSE_CATEGORY',
      entity: 'ExpenseCategory',
      entityId: category.id,
      newValue: category,
      ipAddress: req.ip
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error creating expense category' });
  }
};

export const updateExpenseCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const category = await prisma.expenseCategory.update({
      where: { id },
      data: { name, description }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_EXPENSE_CATEGORY',
      entity: 'ExpenseCategory',
      entityId: id,
      newValue: { name, description },
      ipAddress: req.ip
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense category' });
  }
};

export const toggleExpenseCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const current = await prisma.expenseCategory.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ message: 'Category not found' });

    const category = await prisma.expenseCategory.update({
      where: { id },
      data: { isActive: !current.isActive }
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling expense category' });
  }
};
