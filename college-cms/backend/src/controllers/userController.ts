import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF']),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
});

export const getUsers = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      }),
      prisma.user.count(),
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      newValue: { name: user.name, email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    }
    res.status(500).json({ message: 'Error creating user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const updates = updateUserSchema.parse(req.body);
    const oldUser = await prisma.user.findUnique({ where: { id } });

    if (!oldUser) return res.status(404).json({ message: 'User not found' });

    // Restriction: ADMIN cannot delete/modify SUPER_ADMIN or other ADMIN roles if specified?
    // User requested: "ADMIN: everything except deleting other admins"
    // For now, simple check:
    if (req.user!.role === 'ADMIN' && updates.role && updates.role === 'SUPER_ADMIN') {
        return res.status(403).json({ message: 'Admins cannot promote to Super Admin' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updates,
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
      oldValue: { name: oldUser.name, role: oldUser.role, isActive: oldUser.isActive },
      newValue: updates,
      ipAddress: req.ip,
    });

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    }
    res.status(500).json({ message: 'Error updating user' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Valid password required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) return res.status(404).json({ message: 'User not found' });

    // Restriction: ADMIN cannot delete other ADMINS
    if (req.user!.role === 'ADMIN' && (userToDelete.role === 'ADMIN' || userToDelete.role === 'SUPER_ADMIN')) {
        return res.status(403).json({ message: 'Admins cannot deactivate other Admins or Super Admins' });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'DEACTIVATE_USER',
      entity: 'User',
      entityId: id,
      oldValue: { isActive: true },
      newValue: { isActive: false },
      ipAddress: req.ip,
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating user' });
  }
};
