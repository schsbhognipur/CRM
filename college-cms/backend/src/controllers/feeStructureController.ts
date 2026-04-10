import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';

export const getFeeStructures = async (req: Request, res: Response) => {
  const { courseId, academicYearId } = req.query;
  try {
    const structures = await prisma.feeStructure.findMany({
      where: {
        ...(courseId && { courseId: String(courseId) }),
        ...(academicYearId && { academicYearId: String(academicYearId) }),
      },
      include: {
        components: { include: { feeComponent: true } },
        course: { select: { name: true } },
        academicYear: { select: { label: true } }
      },
      orderBy: { yearOfStudy: 'asc' }
    });
    res.json(structures);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fee structures' });
  }
};

export const createFeeStructure = async (req: Request, res: Response) => {
  const { courseId, academicYearId, yearOfStudy, components } = req.body;
  
  const totalAmount = components.reduce((sum: number, c: any) => sum + Number(c.amount), 0);

  try {
    const structure = await prisma.$transaction(async (tx) => {
      const newStructure = await tx.feeStructure.create({
        data: {
          courseId,
          academicYearId,
          yearOfStudy,
          totalAmount,
          components: {
            create: components.map((c: any) => ({
              feeComponentId: c.feeComponentId,
              amount: c.amount
            }))
          }
        }
      });
      return newStructure;
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_FEE_STRUCTURE',
      entity: 'FeeStructure',
      entityId: structure.id,
      newValue: structure,
      ipAddress: req.ip
    });

    res.status(201).json(structure);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating fee structure' });
  }
};

export const updateFeeStructure = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { components } = req.body; // Array of { feeComponentId, amount }

  const totalAmount = components.reduce((sum: number, c: any) => sum + Number(c.amount), 0);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete old components
      await tx.feeStructureComponent.deleteMany({ where: { feeStructureId: id } });

      // 2. Update structure and add new components
      const updatedStructure = await tx.feeStructure.update({
        where: { id },
        data: {
          totalAmount,
          components: {
            create: components.map((c: any) => ({
              feeComponentId: c.feeComponentId,
              amount: c.amount
            }))
          }
        }
      });

      // 3. Update PENDING/PARTIAL StudentFees linked to this structure
      const studentFees = await tx.studentFee.findMany({
        where: { 
          feeStructureId: id,
          status: { in: ['PENDING', 'PARTIAL'] }
        }
      });

      for (const fee of studentFees) {
        const newBalance = Number(totalAmount) - Number(fee.paidAmount);
        await tx.studentFee.update({
          where: { id: fee.id },
          data: {
            totalAmount,
            balance: newBalance,
            status: newBalance <= 0 ? 'PAID' : fee.status
          }
        });
      }

      return updatedStructure;
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_FEE_STRUCTURE',
      entity: 'FeeStructure',
      entityId: id,
      newValue: { components, totalAmount },
      ipAddress: req.ip
    });

    res.json({ message: 'Fee structure and linked student fees updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating fee structure' });
  }
};

export const copyFeeStructure = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { targetAcademicYearId } = req.body;

  try {
    const source = await prisma.feeStructure.findUnique({
      where: { id },
      include: { components: true }
    });

    if (!source) return res.status(404).json({ message: 'Source structure not found' });

    const newStructure = await prisma.$transaction(async (tx) => {
      return tx.feeStructure.create({
        data: {
          courseId: source.courseId,
          yearOfStudy: source.yearOfStudy,
          academicYearId: targetAcademicYearId,
          totalAmount: source.totalAmount,
          components: {
            create: source.components.map(c => ({
              feeComponentId: c.feeComponentId,
              amount: c.amount
            }))
          }
        }
      });
    });

    res.status(201).json(newStructure);
  } catch (error) {
    res.status(500).json({ message: 'Error copying fee structure' });
  }
};
