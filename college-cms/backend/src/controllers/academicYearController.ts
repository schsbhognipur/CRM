import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import cache from '../utils/cache';

export const getAcademicYears = async (req: Request, res: Response) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data: years });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching academic years' });
  }
};

export const getActiveAcademicYear = async (req: Request, res: Response) => {
  try {
    const active = await prisma.academicYear.findFirst({
      where: { isActive: true }
    });
    if (!active) return res.status(404).json({ success: false, message: 'No active academic year found' });
    res.json({ success: true, data: active });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching active academic year' });
  }
};

const academicYearSchema = z.object({
  label: z.string().min(4),
  startDate: z.string(),
  endDate: z.string()
}).refine(data => new Date(data.startDate) < new Date(data.endDate), { message: "End Date must be after Start Date" });

export const createAcademicYear = async (req: Request, res: Response) => {
  try {
    const validation = academicYearSchema.safeParse(req.body);
    if (!validation.success) return res.status(422).json({ success: false, message: validation.error.issues[0].message });

    const existing = await prisma.academicYear.findUnique({ where: { label: validation.data.label } });
    if (existing) return res.status(409).json({ success: false, message: 'Academic Year label must be unique' });

    const newYear = await prisma.academicYear.create({
      data: {
        label: validation.data.label,
        startDate: new Date(validation.data.startDate),
        endDate: new Date(validation.data.endDate),
        isActive: false
      }
    });
    res.status(201).json({ success: true, data: newYear });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating academic year' });
  }
};

export const updateAcademicYear = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { label, startDate, endDate } = req.body;
  try {
    const updated = await prisma.academicYear.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) })
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating academic year' });
  }
};

export const activateAcademicYear = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.academicYear.updateMany({ where: { isActive: true }, data: { isActive: false } });
      return await tx.academicYear.update({ where: { id }, data: { isActive: true } });
    });
    cache.flushAll(); // Dump cache when root timeline changes
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error activating academic year' });
  }
};
