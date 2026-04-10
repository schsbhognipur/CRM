import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';

export const getAcademicYears = async (req: Request, res: Response) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' }
    });
    res.json(years);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching academic years' });
  }
};

export const createAcademicYear = async (req: Request, res: Response) => {
  const { label, startDate, endDate } = req.body;
  try {
    const year = await prisma.academicYear.create({
      data: {
        label,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      }
    });
    
    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_ACADEMIC_YEAR',
      entity: 'AcademicYear',
      entityId: year.id,
      newValue: year,
      ipAddress: req.ip
    });

    res.status(201).json(year);
  } catch (error) {
    res.status(500).json({ message: 'Error creating academic year' });
  }
};

export const activateAcademicYear = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const activatedYear = await prisma.$transaction(async (tx) => {
      // Deactivate all
      await tx.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
      
      // Activate target
      return tx.academicYear.update({
        where: { id },
        data: { isActive: true }
      });
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'ACTIVATE_ACADEMIC_YEAR',
      entity: 'AcademicYear',
      entityId: id,
      ipAddress: req.ip
    });

    res.json(activatedYear);
  } catch (error) {
    res.status(500).json({ message: 'Error activating academic year' });
  }
};

export const getActiveYear = async (req: Request, res: Response) => {
  try {
    const year = await prisma.academicYear.findFirst({
      where: { isActive: true }
    });
    res.json(year);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active year' });
  }
};
