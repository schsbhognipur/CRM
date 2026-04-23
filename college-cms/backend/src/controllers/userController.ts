import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';
import { Prisma, Role } from '@prisma/client';

export const getUsers = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search, role, isActive } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (role && ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF'].includes(String(role))) {
    where.role = role as Role;
  }

  if (isActive !== undefined && isActive !== '') {
    where.isActive = isActive === 'true';
  }

  if (search && String(search).trim() !== '') {
    const s = String(search).trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } }
    ];
  }

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { auditLogs: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users registry' });
  }
};

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character (@$!%*?&)"),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF'])
});

export const createUser = async (req: Request, res: Response) => {
  try {
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues
      });
    }

    const { name, email, password, role } = validation.data;
    const currentUserRole = req.user!.role;

    if (currentUserRole !== 'SUPER_ADMIN') {
      if (['SUPER_ADMIN', 'ADMIN'].includes(role)) {
        return res.status(403).json({ success: false, message: 'Admins can only create Accountant or Staff roles' });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: newUser.id,
      newValue: { name, email, role },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, role } = req.body;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.user!.id === id && role && role !== targetUser.role) {
      return res.status(403).json({ success: false, message: 'You cannot downgrade/change your own role' });
    }

    if (req.user!.role !== 'SUPER_ADMIN' && role) {
      if (['SUPER_ADMIN', 'ADMIN'].includes(targetUser.role) || ['SUPER_ADMIN', 'ADMIN'].includes(role)) {
         return res.status(403).json({ success: false, message: 'Admins cannot modify Admin/Super Admin roles' });
      }
    }
    
    // In order to only update allowed fields
    const dataToUpdate: any = {};
    if (name && name.length >= 2) dataToUpdate.name = name;
    if (role && ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'STAFF'].includes(role)) dataToUpdate.role = role as Role;

    if (Object.keys(dataToUpdate).length === 0) {
       return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      oldValue: { name: targetUser.name, role: targetUser.role },
      newValue: { name: updatedUser.name, role: updatedUser.role },
      ipAddress: req.ip
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
};

export const toggleActive = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.user!.id === id) {
      return res.status(403).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate a SUPER_ADMIN account' });
    }

    const newStatus = !targetUser.isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: newStatus },
      select: { id: true, isActive: true }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: newStatus ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling user status' });
  }
};

const passwordSchema = z.string().min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[@$!%*?&]/, "Password must contain at least one special character (@$!%*?&)");

export const resetPassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    let unhashedPassword = newPassword;
    let autoGenerated = false;

    if (!newPassword || newPassword.trim() === '') {
      unhashedPassword = crypto.randomBytes(8).toString('base64').slice(0, 10) + 'A1!'; // ensures required rules are met
      autoGenerated = true;
    } else {
      const pValidation = passwordSchema.safeParse(newPassword);
      if (!pValidation.success) {
         return res.status(422).json({ success: false, message: pValidation.error.issues[0].message });
      }
    }

    const passwordHash = await bcrypt.hash(unhashedPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        message: "Password reset successful",
        ...(autoGenerated ? { generatedPassword: unhashedPassword } : {})
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const targetUser = await prisma.user.findUnique({ where: { id, deletedAt: null } });
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.user!.id === id) {
      return res.status(403).json({ success: false, message: 'You cannot delete your own account' });
    }

    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });

    await createAuditLog({
       userId: req.user!.id,
       action: 'USER_DELETED',
       entity: 'User',
       entityId: id,
       ipAddress: req.ip
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
};
