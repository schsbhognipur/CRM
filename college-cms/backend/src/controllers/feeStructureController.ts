import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';

export const getFeeStructures = async (req: Request, res: Response) => {
  const { courseId, academicYearId } = req.query;
  try {
    const structures = await prisma.feeStructure.findMany({
      where: {
        ...(courseId && { courseId: String(courseId) }),
        ...(academicYearId && { academicYearId: String(academicYearId) })
      },
      include: {
        course: { select: { name: true } },
        academicYear: { select: { label: true } },
        components: {
           include: { feeComponent: { select: { name: true } } }
        }
      },
      orderBy: [{ courseId: 'asc' }, { yearOfStudy: 'asc' }]
    });
    res.json({ success: true, data: structures });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching structures' });
  }
};

const structureSchema = z.object({
  courseId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  yearOfStudy: z.number().int().min(1).max(4),
  components: z.array(z.object({
     feeComponentId: z.string().uuid(),
     amount: z.number().positive()
  })).min(1, "At least 1 component required")
}).superRefine((data, ctx) => {
  const ids = data.components.map(c => c.feeComponentId);
  if (new Set(ids).size !== ids.length) {
     ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicate fee components detected" });
  }
});

export const createFeeStructure = async (req: Request, res: Response) => {
  try {
    const validation = structureSchema.safeParse(req.body);
    if (!validation.success) return res.status(422).json({ success: false, message: validation.error.issues[0].message });

    const { courseId, academicYearId, yearOfStudy, components } = validation.data;

    const existing = await prisma.feeStructure.findUnique({
      where: { courseId_academicYearId_yearOfStudy: { courseId, academicYearId, yearOfStudy } }
    });
    if (existing) return res.status(409).json({ success: false, message: 'Fee structure already exists for this mapping' });

    const totalAmount = components.reduce((acc, curr) => acc + curr.amount, 0);

    const result = await prisma.$transaction(async (tx) => {
       const structure = await tx.feeStructure.create({
          data: {
             courseId,
             academicYearId,
             yearOfStudy,
             totalAmount,
             components: {
                create: components.map(c => ({ feeComponentId: c.feeComponentId, amount: c.amount }))
             }
          },
          include: { components: true }
       });
       return structure;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating structure' });
  }
};

const updateSchema = z.object({
  components: z.array(z.object({
     feeComponentId: z.string().uuid(),
     amount: z.number().nonnegative()
  })).min(1)
});

export const updateFeeStructure = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) return res.status(422).json({ success: false, message: "Invalid components mapped" });
    
    // Filter out 0 amounts
    const validComponents = validation.data.components.filter(c => c.amount > 0);
    const totalAmount = validComponents.reduce((acc, curr) => acc + curr.amount, 0);

    const updated = await prisma.$transaction(async (tx) => {
      // Clear old components
      await tx.feeStructureComponent.deleteMany({ where: { feeStructureId: id } });
      
      // Update structure and insert new components
      const struct = await tx.feeStructure.update({
         where: { id },
         data: {
            totalAmount,
            components: {
               create: validComponents.map(c => ({ feeComponentId: c.feeComponentId, amount: c.amount }))
            }
         },
         include: { components: { include: { feeComponent: true } } }
      });

      // Update PENDING Student Fees mapped to this structure
      const pendingFees = await tx.studentFee.findMany({
         where: { feeStructureId: id, status: 'PENDING' }
      });
      
      for (const fee of pendingFees) {
         await tx.studentFee.update({
            where: { id: fee.id },
            data: { totalAmount, balance: totalAmount } // balance = totalAmount since PAID = 0 on PENDING
         });
      }

      return struct;
    });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating structure' });
  }
};

export const copyFeeStructure = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { targetAcademicYearId } = req.body;
  if (!targetAcademicYearId) return res.status(422).json({ success: false, message: 'Target year required' });

  try {
    const sourceStruct = await prisma.feeStructure.findUnique({
       where: { id },
       include: { components: true }
    });
    if (!sourceStruct) return res.status(404).json({ success: false, message: 'Source structure not found' });

    const existingCheck = await prisma.feeStructure.findUnique({
       where: {
          courseId_academicYearId_yearOfStudy: {
             courseId: sourceStruct.courseId,
             academicYearId: targetAcademicYearId,
             yearOfStudy: sourceStruct.yearOfStudy
          }
       }
    });

    if (existingCheck) return res.status(409).json({ success: false, message: 'Structure already exists in target year' });

    const newStruct = await prisma.feeStructure.create({
       data: {
          courseId: sourceStruct.courseId,
          academicYearId: targetAcademicYearId,
          yearOfStudy: sourceStruct.yearOfStudy,
          totalAmount: sourceStruct.totalAmount,
          components: {
             create: sourceStruct.components.map(c => ({
                feeComponentId: c.feeComponentId,
                amount: c.amount
             }))
          }
       }
    });

    res.json({ success: true, data: newStruct });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error copying structure' });
  }
};

export const bulkUpdateFeeStructures = async (req: Request, res: Response) => {
   const { updates, academicYearId } = req.body;
   
   if (!Array.isArray(updates) || !academicYearId) {
      return res.status(400).json({ success: false, message: 'Invalid bulk payload' });
   }

   try {
      await prisma.$transaction(async (tx) => {
         for (const update of updates) {
            const { courseId, yearOfStudy, components } = update;
            
            // 1. Find or Create Structure
            let structure = await tx.feeStructure.findUnique({
               where: { courseId_academicYearId_yearOfStudy: { courseId, academicYearId, yearOfStudy } }
            });

            if (!structure) {
               if (components.length === 0) continue;
               
               const totalAmount = components.reduce((acc: number, curr: any) => acc + curr.amount, 0);
               structure = await tx.feeStructure.create({
                  data: {
                     courseId,
                     academicYearId,
                     yearOfStudy,
                     totalAmount,
                     components: {
                        create: components.map((c: any) => ({ feeComponentId: c.feeComponentId, amount: c.amount }))
                     }
                  }
               });
            } else {
               // 2. Update existing structure
               const validComponents = components.filter((c: any) => c.amount > 0);
               const totalAmount = validComponents.reduce((acc: number, curr: any) => acc + curr.amount, 0);

               // Clear old components
               await tx.feeStructureComponent.deleteMany({ where: { feeStructureId: structure.id } });
               
               // Update structure and insert new components
               await tx.feeStructure.update({
                  where: { id: structure.id },
                  data: {
                     totalAmount,
                     components: {
                        create: validComponents.map((c: any) => ({ feeComponentId: c.feeComponentId, amount: c.amount }))
                     }
                  }
               });

               // 3. Update PENDING Student Fees mapped to this structure
               await tx.studentFee.updateMany({
                  where: { feeStructureId: structure.id, status: 'PENDING' },
                  data: { totalAmount, balance: totalAmount }
               });
            }
         }
      }, {
         timeout: 20000 // 20 seconds for bulk operations
      });

      res.json({ success: true, message: 'Omni-Matrix synchronized' });
   } catch (error: any) {
      console.error('[bulkUpdateFeeStructures]', error);
      res.status(500).json({ success: false, message: error.message || 'Bulk sync failed' });
   }
};

export const deleteFeeStructure = async (req: Request, res: Response) => {
   const { id } = req.params;
   try {
      const studentCount = await prisma.studentFee.count({ where: { feeStructureId: id } });
      if (studentCount > 0) return res.status(400).json({ success: false, message: 'Cannot delete: students are already linked to this structure.' });

      await prisma.$transaction([
         prisma.feeStructureComponent.deleteMany({ where: { feeStructureId: id } }),
         prisma.feeStructure.delete({ where: { id } })
      ]);
      res.json({ success: true, message: 'Structure deleted' });
   } catch (error) {
      res.status(500).json({ success: false, message: 'Delete failed' });
   }
};
