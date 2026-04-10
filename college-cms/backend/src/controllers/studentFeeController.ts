import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';

export const getStudentFees = async (req: Request, res: Response) => {
  const { courseId, academicYearId, status } = req.query;
  try {
    const fees = await prisma.studentFee.findMany({
      where: {
        ...(academicYearId && { academicYearId: String(academicYearId) }),
        ...(status && { status: status as any }),
        student: {
          ...(courseId && { courseId: String(courseId) }),
        }
      },
      include: {
        student: { select: { name: true, enrollmentNo: true } },
        feeStructure: { include: { course: true } }
      },
      orderBy: { student: { name: 'asc' } }
    });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student fees' });
  }
};

export const getDefaulters = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const defaulters = await prisma.studentFee.findMany({
      where: {
        balance: { gt: 0 },
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: today }
      },
      include: {
        student: { include: { course: true } },
      }
    });

    // Grouping by course
    const grouped = defaulters.reduce((acc: any, fee) => {
      const courseName = fee.student.course.name;
      if (!acc[courseName]) acc[courseName] = [];
      acc[courseName].push(fee);
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching defaulters' });
  }
};

export const waiveFee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { remarks } = req.body;

  try {
    const updated = await prisma.studentFee.update({
      where: { id },
      data: {
        status: 'WAIVED',
        balance: 0,
        // Using a custom field or remarks system if available, 
        // using updatedAt and AuditLog as primary tracking.
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

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error waiving fee' });
  }
};
