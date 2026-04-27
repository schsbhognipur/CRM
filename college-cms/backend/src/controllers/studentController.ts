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
  status: z.enum(['ACTIVE', 'INACTIVE', 'CANCELLED', 'PASSED_OUT']).optional(),
  discount: z.number().optional().default(0),
  discountType: z.enum(['FLAT', 'PERCENT']).optional().default('FLAT'),
  discountReason: z.string().optional().or(z.literal('')),
});

import multer from 'multer';
const storage = multer.memoryStorage();
export const upload = multer({ storage });


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
              id: true,
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
          { fatherName: { contains: String(q), mode: 'insensitive' } },
          // Predictive word-boundary logic: match if query is part of name or starts with query
          { name: { startsWith: String(q), mode: 'insensitive' } }
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
            academicYear: true,
            feeStructure: {
              include: { components: { include: { feeComponent: true } } }
            }
          },
          orderBy: { academicYear: { startDate: 'desc' } }
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

        const total = Number(feeStructure.totalAmount);
        let discountAmt = 0;
        if (data.discountType === 'PERCENT') {
          discountAmt = (total * (data.discount || 0)) / 100;
        } else {
          discountAmt = data.discount || 0;
        }

        const payable = total - discountAmt;

        studentFee = await tx.studentFee.create({
          data: {
            studentId: student.id,
            feeStructureId: feeStructure.id,
            academicYearId: data.academicYearId,
            totalAmount: feeStructure.totalAmount,
            discount: data.discount || 0,
            discountType: data.discountType || "FLAT",
            discountReason: data.discountReason || null,
            payableAmount: payable,
            paidAmount: 0,
            balance: payable,
            status: 'PENDING',
            dueDate
          } as any,
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
    
    const currentStudent = await prisma.student.findUnique({ where: { id } });
    if (!currentStudent) return res.status(404).json({ message: 'Student not found' });

    // Strip fee-related fields which don't exist on Student model
    const { 
      discount, 
      discountType, 
      discountReason, 
      ...studentData 
    } = validatedData;

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...studentData as any,
        dob: validatedData.dob ? new Date(validatedData.dob) : undefined,
      }
    });

    // If discount was provided, update the active fee record for this student
    if (discount !== undefined || discountType !== undefined) {
       const activeFee = await prisma.studentFee.findFirst({
          where: { studentId: id, academicYearId: currentStudent.academicYearId }
       });

       if (activeFee) {
          const fee = activeFee as any;
          const total = Number(fee.totalAmount);
          const dType = discountType || fee.discountType;
          const dVal = discount !== undefined ? discount : Number(fee.discount);
          
          let discountAmt = 0;
          if (dType === 'PERCENT') {
            discountAmt = (total * dVal) / 100;
          } else {
            discountAmt = dVal;
          }

          const payable = total - discountAmt;

          await prisma.studentFee.update({
             where: { id: fee.id },
             data: {
                discount: dVal,
                discountType: dType as any,
                discountReason: discountReason || fee.discountReason,
                payableAmount: payable,
                balance: payable - Number(fee.paidAmount)
             } as any
          });
       }
    }

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_STUDENT',
      entity: 'Student',
      entityId: id,
      oldValue: currentStudent,
      newValue: updatedStudent,
      ipAddress: req.ip
    });

    res.json(updatedStudent);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Error updating student identity' });
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

export const importStudents = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    // Pre-fetch all courses and academic years for lookup
    const [courses, academicYears] = await Promise.all([
      prisma.course.findMany(),
      prisma.academicYear.findMany()
    ]);

    for (const [index, row] of data.entries()) {
      try {
        await prisma.$transaction(async (tx) => {
          // Map labels to IDs
          const course = courses.find(c => c.name === row['Course'] || c.id === row['Course']);
          const academicYear = academicYears.find(ay => ay.label === row['Academic Year'] || ay.id === row['Academic Year']);

          if (!course) throw new Error(`Course not found: ${row['Course']}`);
          if (!academicYear) throw new Error(`Academic Year not found: ${row['Academic Year']}`);

          // Enrollment No logic (same as createStudent)
          const batchYear = Number(row['Batch Year']);
          const studentCount = await tx.student.count({
            where: { courseId: course.id, batchYear }
          });

          const prefix = course.name === 'D_PHARMA' ? 'DPHA' : 'BPHA';
          const enrollmentNo = `${prefix}${batchYear}-${(studentCount + 1).toString().padStart(4, '0')}`;

          const student = await tx.student.create({
            data: {
              name: String(row['Name']),
              fatherName: String(row['Father Name']),
              motherName: String(row['Mother Name'] || ''),
              phone: String(row['Phone']),
              alternatePhone: row['Alternate Phone'] ? String(row['Alternate Phone']) : null,
              email: row['Email'] ? String(row['Email']) : null,
              dob: new Date(row['DOB']),
              gender: String(row['Gender'] || 'MALE').toUpperCase() as any,
              address: String(row['Address']),
              city: String(row['City']),
              state: String(row['State']),
              pinCode: String(row['Pin Code']),
              yearOfStudy: Number(row['Year of Study']),
              batchYear: batchYear,
              aadharNo: row['Aadhar Number'] ? String(row['Aadhar Number']) : null,
              enrollmentNo,
              courseId: course.id,
              academicYearId: academicYear.id,
              status: 'ACTIVE'
            }
          });

          // Fee Sync logic (same as createStudent)
          const feeStructure = await tx.feeStructure.findFirst({
            where: {
              courseId: course.id,
              academicYearId: academicYear.id,
              yearOfStudy: Number(row['Year of Study']),
            },
          });

          if (feeStructure) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            const total = Number(feeStructure.totalAmount);
            const discValue = Number(row['Discount'] || 0);
            const discType = row['Discount Type'] === 'PERCENT' ? 'PERCENT' : 'FLAT';
            
            const discountAmt = discType === 'PERCENT' ? (total * discValue) / 100 : discValue;
            const payable = total - discountAmt;

            await tx.studentFee.create({
              data: {
                studentId: student.id,
                feeStructureId: feeStructure.id,
                academicYearId: academicYear.id,
                totalAmount: feeStructure.totalAmount,
                discount: discValue,
                discountType: discType as any,
                discountReason: row['Discount Reason'] || 'Bulk Import',
                payableAmount: payable,
                paidAmount: 0,
                balance: payable,
                status: 'PENDING',
                dueDate
              } as any
            });
          }
        });
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: index + 2, error: err.message, student: row['Name'] });
      }
    }

    res.json({
      message: `Import completed. ${results.success} students added, ${results.failed} failed.`,
      results
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Critical error during import', error: error.message });
  }
};
export const importStudentFees = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const actorId = (req as any).user.id;

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[]
    };

    const coursesList = await prisma.course.findMany();

    for (const [index, row] of data.entries()) {
      try {
        const studentName = String(row['Student Name'] || row['Name'] || '').trim();
        const enrollmentNo = String(row['Enrollment No'] || '').trim();
        const courseName = String(row['Branch'] || row['Course'] || '').trim();
        const yearOfStudy = Number(row['Year of Study'] || row['Year'] || 1);
        const discountedPrice = Number(row['Discounted Price'] || row['Total Fee'] || 0);
        const amountPaid = Number(row['Amount Paid'] || row['Paid'] || 0);

        if (!studentName && !enrollmentNo) {
          throw new Error("Missing Student Name or Enrollment No");
        }

        await prisma.$transaction(async (tx) => {
          // 1. Precise Identification
          let student = null;
          if (enrollmentNo) {
            student = await tx.student.findUnique({ where: { enrollmentNo } });
          } else {
            const normalizedInput = courseName.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const course = coursesList.find(c => {
               const normalizedCourse = c.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
               return normalizedCourse === normalizedInput || c.name === courseName;
            });
            
            if (!course) throw new Error(`Invalid Branch/Course: ${courseName}`);

            student = await tx.student.findFirst({
              where: {
                name: { equals: studentName, mode: 'insensitive' },
                courseId: course.id,
                yearOfStudy: yearOfStudy
              }
            });
          }

          if (!student) throw new Error(`Registration not found for: ${studentName || enrollmentNo}`);

          // 2. Ledger Fetching
          const activeFee = await tx.studentFee.findFirst({
            where: { studentId: student.id, academicYearId: student.academicYearId }
          });

          if (!activeFee) throw new Error(`Fee record not initialized for ${student.name}. Please sync ledger first.`);

          // 3. Auditing & Flagging Previous Data (Soft-delete old import transactions)
          const oldTransactions = await tx.transaction.findMany({
            where: {
               studentFeeId: activeFee.id,
               description: { contains: 'Legacy Import Sync' },
               deletedAt: null
            }
          });

          if (oldTransactions.length > 0) {
             await tx.transaction.updateMany({
                where: { id: { in: oldTransactions.map(t => t.id) } },
                data: {
                   deletedAt: new Date(),
                   deletedReason: `Flagged/Overwritten by fresh legacy import by User ID: ${actorId}`
                }
             });
          }

          // 4. Institutional Calculations
          const masterStructureAmount = Number(activeFee.totalAmount);
          const computedDiscount = Math.max(0, masterStructureAmount - discountedPrice);
          const computedBalance = Math.max(0, discountedPrice - amountPaid);

          // 5. Update Core Ledger
          const updatedFee = await tx.studentFee.update({
            where: { id: activeFee.id },
            data: {
              payableAmount: discountedPrice,
              paidAmount: amountPaid,
              balance: computedBalance,
              discount: computedDiscount,
              discountReason: `Institutional Bulk Import Update (User ${actorId})`,
              status: amountPaid >= discountedPrice ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'PENDING')
            } as any
          });

          // 6. Record Singular Dynamic Transaction
          if (amountPaid > 0) {
            const currentCount = await tx.transaction.count();
            const receiptPrefix = `IMP-${new Date().getFullYear()}`;
            const receiptNo = `${receiptPrefix}-${(currentCount + 1).toString().padStart(6, '0')}`;

            await tx.transaction.create({
              data: {
                type: 'CREDIT',
                subType: 'FEE_PAYMENT',
                amount: amountPaid,
                paymentMode: 'CASH', 
                receiptNo,
                description: `Legacy Import Sync: Multi-phase ledger update. Verified by SCHS Staff.`,
                remarks: `Imported by User ${actorId} at ${new Date().toISOString()}`,
                studentId: student.id,
                studentFeeId: activeFee.id,
                recordedById: actorId,
                transactionDate: new Date()
              }
            });
          }

          // 7. Traceability Log
          await createAuditLog({
            userId: actorId,
            action: 'LEGACY_FEE_IMPORT_SYNC',
            entity: 'StudentFee',
            entityId: activeFee.id,
            oldValue: activeFee,
            newValue: updatedFee,
            ipAddress: req.ip
          });
        });

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ 
          row: index + 2, 
          error: err.message, 
          student: row['Student Name'] || row['Name'] || 'Unknown Identity' 
        });
      }
    }

    res.json({
      message: `Import synchronization complete. ${results.success} ledgers refined, ${results.failed} errors encountered.`,
      results
    });
  } catch (error: any) {
    console.error('[importStudentFees] Critical Fault:', error);
    res.status(500).json({ message: 'Critical error during institutional import', error: error.message });
  }
};
