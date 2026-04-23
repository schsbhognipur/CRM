import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getExpenseCategories = async (req: Request, res: Response) => {
  const { all } = req.query;
  const where = all === 'true' ? {} : { isActive: true };

  try {
    const categories = await prisma.expenseCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching expense categories' });
  }
};

export const createExpenseCategory = async (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name || name.length < 2 || name.length > 80) {
    return res.status(422).json({ success: false, message: 'Name must be between 2 and 80 characters' });
  }

  try {
    const existing = await prisma.expenseCategory.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' }
      }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Expense category with this name already exists' });
    }

    const newCategory = await prisma.expenseCategory.create({
      data: {
        name,
        description,
        isActive: true
      }
    });

    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating expense category' });
  }
};

export const updateExpenseCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  try {
    if (name) {
      const existing = await prisma.expenseCategory.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          id: { not: id } // exclude self
        }
      });

      if (existing) {
        return res.status(409).json({ success: false, message: 'Another category with this name already exists' });
      }
    }

    const updatedCategory = await prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({ success: true, data: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating expense category' });
  }
};
