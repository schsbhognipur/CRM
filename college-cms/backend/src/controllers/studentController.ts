import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';
import * as XLSX from 'xlsx';
import { supabase } from '../utils/supabase';
import { Prisma } from '@prisma/client';

// Zod Schemas
const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().optional().or(z.literal('')),
  phone: z.string().length(10, "Phone must be exactly 10 digits"),
  alternatePhone: z.string().length(10, "Alternate phone must be 10 digits").optional().or(z.literal('')),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  dob: z.string().refine((val) => {
    const date = new Date(val);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      return age - 1 >= 15;
    }
    return age >= 15;
  }, "Student must be at least 15 years old"),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pinCode: z.string().min(6, "Invalid Pin Code"),
  courseId: z.string().uuid("Invalid Course ID"),
  academicYearId: z.string().uuid("Invalid Academic Year ID"),
  yearOfStudy: z.number().int().min(1).max(4),
  batchYear: z.number().int().max(new Date().getFullYear(), "Batch year cannot be in the future"),
  aadharNo: z.string().length(12, "Aadhar must be 12 digits").optional().or(z.literal('')),
});

export const getStudents = async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 20, 
    courseId, 
    academicYearId, 
    yearOfStudy, 
    status, 
    search 
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const where: Prisma.StudentWhereInput = {};

  if (courseId) where.courseId = String(courseId);
  if (academicYearId) where.academicYearId = String(academicYearId);
  if (yearOfStudy) where.yearOfStudy = Number(yearOfStudy);
  if (status) where.status = status as any;
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { enrollmentNo: { contains: String(search), mode: 'insensitive' } },
      { phone: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  try {
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          enrollmentNo: true,
          phone: true,
          status: true,
          yearOfStudy: true,
          course: { select: { name: true } },
          academicYear: { select: { label: true } },
          fees: {
            select: {
              totalAmount: true,
              paidAmount: true,
              balance: true
            }
          }
        }
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      students,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students registry' });
  }
};

export const searchStudents = async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || String(q).length < 2) {
    return res.json([]);
  }

  try {
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { enrollmentNo: { contains: String(q), mode: 'insensitive' } },
          { name: { contains: String(q), mode: 'insensitive' } },
          { phone: { contains: String(q) } },
        ],
      },
      take: 8,
      select: {
        id: true,
        enrollmentNo: true,
        name: true,
        fatherName: true,
        phone: true,
        yearOfStudy: true,
        academicYearId: true,
        course: { select: { name: true } },
        fees: {
          where: {
            status: { in: ['PENDING', 'PARTIAL'] }
          },
          include: {
            feeStructure: true,
            academicYear: { select: { label: true } }
          },
          orderBy: { academicYear: { startDate: 'desc' } }
        }
      }
    });

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error searching students' });
  }
};

export const getStudent = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        course: true,
        academicYear: true,
        fees: {
          include: {
            feeStructure: {
              include: { components: { include: { feeComponent: true } } }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
          include: { recordedBy: { select: { name: true } } }
        }
      }
    });

    if (!student) return res.status(404).json({ message: 'Student not found' });

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student details' });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const validation = studentSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues.map(i => ({
          field: i.path[0],
          message: i.message
        }))
      });
    }

    const data = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({ where: { id: data.courseId } });
      if (!course) throw new Error("Course not found");

      const academicYear = await tx.academicYear.findUnique({ where: { id: data.academicYearId } });
      if (!academicYear) throw new Error("Academic Year not found");

      const studentCount = await tx.student.count({
        where: { courseId: data.courseId, batchYear: data.batchYear }
      });

      const prefix = course.name === 'D_PHARMA' ? 'DPHA' : 'BPHA';
      const enrollmentNo = `${prefix}${data.batchYear}-${(studentCount + 1).toString().padStart(4, '0')}`;

      const student = await tx.student.create({
        data: {
          name: data.name,
          fatherName: data.fatherName,
          motherName: data.motherName || '',
          phone: data.phone,
          alternatePhone: data.alternatePhone || null,
          email: data.email || null,
          dob: new Date(data.dob),
          gender: data.gender,
          address: data.address,
          city: data.city,
          state: data.state,
          pinCode: data.pinCode,
          yearOfStudy: data.yearOfStudy,
          batchYear: data.batchYear,
          aadharNo: data.aadharNo || null,
          enrollmentNo,
          course: { connect: { id: data.courseId } },
          academicYear: { connect: { id: data.academicYearId } }
        },
        include: { course: { select: { name: true } } }
      });

      const feeStructure = await tx.feeStructure.findFirst({
        where: {
          courseId: data.courseId,
          academicYearId: data.academicYearId,
          yearOfStudy: data.yearOfStudy,
        },
      });

      let studentFee = null;
      let warning = undefined;

      if (feeStructure) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        studentFee = await tx.studentFee.create({
          data: {
            studentId: student.id,
            feeStructureId: feeStructure.id,
            academicYearId: data.academicYearId,
            totalAmount: feeStructure.totalAmount,
            paidAmount: 0,
            balance: feeStructure.totalAmount,
            status: 'PENDING',
            dueDate
          },
        });
      } else {
        warning = "No fee structure found for this course/year combination. Please assign fee manually.";
      }

      return { student, studentFee, warning };
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_STUDENT',
      entity: 'Student',
      entityId: result.student.id,
      newValue: result.student,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        student: result.student,
        studentFee: result.studentFee,
        warning: result.warning
      }
    });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: "A student with this Aadhar number already exists" });
    }
    if (error.message === "Course not found" || error.message === "Academic Year not found") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const syncStudentFee = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in registry' });
    }

    const feeStructure = await prisma.feeStructure.findFirst({
      where: {
        courseId: student.courseId,
        academicYearId: student.academicYearId,
        yearOfStudy: student.yearOfStudy,
      },
    });

    if (!feeStructure) {
      return res.status(404).json({ success: false, message: 'No Master Fee Matrix exists for this timeline configuration' });
    }

    const existingFee = await prisma.studentFee.findFirst({
      where: { studentId: id, feeStructureId: feeStructure.id }
    });

    if (existingFee) {
      return res.status(400).json({ success: false, message: 'Ledger already actively synced' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const studentFee = await prisma.studentFee.create({
      data: {
        studentId: student.id,
        feeStructureId: feeStructure.id,
        academicYearId: student.academicYearId,
        totalAmount: feeStructure.totalAmount,
        paidAmount: 0,
        balance: feeStructure.totalAmount,
        status: 'PENDING',
        dueDate
      },
    });

    res.status(201).json({ success: true, data: studentFee });

  } catch (error: any) {
    console.error('[syncStudentFee]', error);
    res.status(500).json({ success: false, message: 'Server failed to synchronize ledger' });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const validatedData = studentSchema.partial().parse(req.body);
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...validatedData as any,
        dob: validatedData.dob ? new Date(validatedData.dob) : undefined,
      }
    });
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: 'Error updating student' });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.student.update({ where: { id }, data: { status: 'CANCELLED' } });
    res.json({ message: 'Student status updated to CANCELLED' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student' });
  }
};

export const uploadPhoto = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const exportStudents = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const uploadImportStudents = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};
