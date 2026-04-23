import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';

export const getStudentFees = async (req: Request, res: Response) => {
  try {
    const fees = await prisma.studentFee.findMany({
      include: {
        student: { select: { name: true, enrollmentNo: true } },
        feeStructure: { select: { yearOfStudy: true } },
        academicYear: { select: { label: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student fees' });
  }
};

export const getStudentFeesByStudent = async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { all } = req.query;

  try {
    const where: any = { studentId };
    if (all !== 'true') {
      where.status = { in: ['PENDING', 'PARTIAL'] };
    }

    const fees = await prisma.studentFee.findMany({
      where,
      include: {
        academicYear: { select: { label: true, startDate: true } },
        feeStructure: {
          include: {
            course: { select: { name: true } },
            components: {
              include: { feeComponent: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { academicYear: { startDate: 'desc' } }
    });

    res.json(fees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching student fees' });
  }
};

export const getDefaulters = async (req: Request, res: Response) => {
  try {
    const defaulters = await prisma.studentFee.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: new Date() }
      },
      include: {
        student: { select: { name: true, enrollmentNo: true, phone: true } },
        academicYear: { select: { label: true } }
      }
    });
    res.json(defaulters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching defaulters' });
  }
};

export const waiveFee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const fee = await prisma.studentFee.update({
      where: { id },
      data: {
        status: 'WAIVED',
        balance: 0
      }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'WAIVE_FEE',
      entity: 'StudentFee',
      entityId: id,
      newValue: { status: 'WAIVED', remarks },
      ipAddress: req.ip
    });

    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: 'Error waiving fee' });
  }
};
