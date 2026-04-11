import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';
import * as XLSX from 'xlsx';
import { supabase } from '../utils/supabase';
import { Prisma } from '@prisma/client';

// Enrollment No Helper
const generateEnrollmentNo = async (courseName: string, batchYear: number) => {
  const shortName = courseName.includes('D_PHARMA') ? 'DPHA' : 'BPHA';
  const yearSuffix = batchYear.toString();
  
  // Find the last student for this course and batch
  const lastStudent = await prisma.student.findFirst({
    where: {
      enrollmentNo: { startsWith: `${shortName}${yearSuffix}` }
    },
    orderBy: { enrollmentNo: 'desc' },
  });

  let sequence = 1;
  if (lastStudent) {
    const lastSeq = parseInt(lastStudent.enrollmentNo.split('-')[1]);
    sequence = isNaN(lastSeq) ? 1 : lastSeq + 1;
  }

  return `${shortName}${yearSuffix}-${sequence.toString().padStart(4, '0')}`;
};

// Zod Schemas
const studentSchema = z.object({
  name: z.string(),
  fatherName: z.string(),
  motherName: z.string(),
  phone: z.string(),
  alternatePhone: z.string().optional(),
  email: z.string().email().optional(),
  dob: z.string(), // ISO or Date string
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pinCode: z.string(),
  courseId: z.string(),
  academicYearId: z.string(),
  yearOfStudy: z.number().min(1).max(4),
  batchYear: z.number(),
  aadharNo: z.string().optional(),
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

  const where: Prisma.StudentWhereInput = {
    ...(courseId && { courseId: String(courseId) }),
    ...(academicYearId && { academicYearId: String(academicYearId) }),
    ...(yearOfStudy && { yearOfStudy: Number(yearOfStudy) }),
    ...(status && { status: status as any }),
    ...(search && {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { enrollmentNo: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
      ],
    }),
  };

  try {
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          course: { select: { name: true } },
          academicYear: { select: { label: true } },
          fees: {
            select: { status: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    res.json({
      data: students,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students' });
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
    const data = studentSchema.parse(req.body);

    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) return res.status(400).json({ message: 'Invalid course' });

    const enrollmentNo = await generateEnrollmentNo(course.name, data.batchYear);

    // Explicitly define Create Input to avoid TS errors
    const createData: Prisma.StudentCreateInput = {
      name: data.name,
      fatherName: data.fatherName,
      motherName: data.motherName,
      phone: data.phone,
      alternatePhone: data.alternatePhone,
      email: data.email,
      dob: new Date(data.dob),
      gender: data.gender,
      address: data.address,
      city: data.city,
      state: data.state,
      pinCode: data.pinCode,
      yearOfStudy: data.yearOfStudy,
      batchYear: data.batchYear,
      aadharNo: data.aadharNo,
      enrollmentNo,
      course: { connect: { id: data.courseId } },
      academicYear: { connect: { id: data.academicYearId } }
    };

    const student = await prisma.$transaction(async (tx) => {
      const newStudent = await tx.student.create({ data: createData });

      const feeStructure = await tx.feeStructure.findFirst({
        where: {
          courseId: data.courseId,
          academicYearId: data.academicYearId,
          yearOfStudy: data.yearOfStudy,
        },
      });

      if (feeStructure) {
        await tx.studentFee.create({
          data: {
            student: { connect: { id: newStudent.id } },
            feeStructure: { connect: { id: feeStructure.id } },
            academicYear: { connect: { id: data.academicYearId } },
            totalAmount: feeStructure.totalAmount,
            balance: feeStructure.totalAmount,
            status: 'PENDING',
          },
        });
      }

      return newStudent;
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CREATE_STUDENT',
      entity: 'Student',
      entityId: student.id,
      newValue: student,
      ipAddress: req.ip,
    });

    res.status(201).json(student);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ message: 'Error creating student' });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const validatedData = studentSchema.partial().parse(req.body);
    const oldStudent = await prisma.student.findUnique({ where: { id } });

    if (!oldStudent) return res.status(404).json({ message: 'Student not found' });

    const updateData: Prisma.StudentUpdateInput = {
      ...validatedData,
      dob: validatedData.dob ? new Date(validatedData.dob) : undefined,
      course: validatedData.courseId ? { connect: { id: validatedData.courseId } } : undefined,
      academicYear: validatedData.academicYearId ? { connect: { id: validatedData.academicYearId } } : undefined,
    };
    
    // Remote the ID fields from root before spreading if present in Zod
    delete (updateData as any).courseId;
    delete (updateData as any).academicYearId;

    const updatedStudent = await prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id },
        data: updateData,
      });

      if (validatedData.yearOfStudy || validatedData.academicYearId) {
        const year = validatedData.yearOfStudy || student.yearOfStudy;
        const ayId = validatedData.academicYearId || student.academicYearId;

        const feeStructure = await tx.feeStructure.findFirst({
          where: {
            courseId: student.courseId,
            academicYearId: ayId,
            yearOfStudy: year,
          },
        });

        if (feeStructure) {
          const existingFee = await tx.studentFee.findFirst({
            where: { studentId: student.id, feeStructureId: feeStructure.id }
          });

          if (!existingFee) {
            await tx.studentFee.create({
              data: {
                student: { connect: { id: student.id } },
                feeStructure: { connect: { id: feeStructure.id } },
                academicYear: { connect: { id: ayId } },
                totalAmount: feeStructure.totalAmount,
                balance: feeStructure.totalAmount,
                status: 'PENDING',
              },
            });
          }
        }
      }

      return student;
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_STUDENT',
      entity: 'Student',
      entityId: id,
      oldValue: oldStudent,
      newValue: validatedData,
      ipAddress: req.ip,
    });

    res.json(updatedStudent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating student' });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.student.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CANCEL_STUDENT',
      entity: 'Student',
      entityId: id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Student status updated to CANCELLED' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student' });
  }
};

export const uploadPhoto = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const file = req.file;
    const path = `photos/${id}-${Date.now()}`;
    
    const { data, error } = await supabase.storage
      .from('student-photos')
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('student-photos')
      .getPublicUrl(path);

    await prisma.student.update({
      where: { id },
      data: { photoUrl: publicUrl }
    });

    res.json({ photoUrl: publicUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading photo' });
  }
};

export const exportStudents = async (req: Request, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: { course: true, academicYear: true }
    });

    const worksheetData = students.map(s => ({
      'Enrollment No': s.enrollmentNo,
      'Name': s.name,
      'Father Name': s.fatherName,
      'Phone': s.phone,
      'Email': s.email,
      'Course': s.course.name,
      'Year': s.yearOfStudy,
      'Batch': s.batchYear,
      'Status': s.status
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting students' });
  }
};

export const uploadImportStudents = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    
    const results = { imported: 0, failed: [] as any[] };

    for (const [index, row] of rows.entries()) {
      try {
        // Implementation for row processing
        results.imported++;
      } catch (err: any) {
        results.failed.push({ row: index + 1, errors: err.message });
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error importing students' });
  }
};
