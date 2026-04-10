import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';
import PDFDocument from 'pdfkit';
import cache from '../utils/cache';

// Receipt Number Helper
const generateReceiptNo = async (tx: any) => {
  const currentYear = new Date().getFullYear().toString();
  
  // Find the last receipt for this year
  const lastTransaction = await tx.transaction.findFirst({
    where: {
      receiptNo: { startsWith: `RCP-${currentYear}` }
    },
    orderBy: { receiptNo: 'desc' },
  });

  let sequence = 1;
  if (lastTransaction) {
    const lastSeq = parseInt(lastTransaction.receiptNo.split('-')[2]);
    sequence = lastSeq + 1;
  }

  return `RCP-${currentYear}-${sequence.toString().padStart(5, '0')}`;
};

export const getTransactions = async (req: Request, res: Response) => {
  const { 
    type, 
    subType, 
    studentId, 
    dateFrom, 
    dateTo, 
    paymentMode, 
    page = 1, 
    limit = 20 
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    ...(type && { type: type as any }),
    ...(subType && { subType: subType as any }),
    ...(studentId && { studentId: String(studentId) }),
    ...(paymentMode && { paymentMode: paymentMode as any }),
    ...(dateFrom || dateTo ? {
      transactionDate: {
        ...(dateFrom && { gte: new Date(String(dateFrom)) }),
        ...(dateTo && { lte: new Date(String(dateTo)) }),
      }
    } : {})
  };

  try {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: Number(limit),
        include: { 
          student: { select: { name: true, enrollmentNo: true } },
          recordedBy: { select: { name: true } }
        },
        orderBy: { transactionDate: 'desc' }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
        data: transactions,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

const feePaymentSchema = z.object({
  studentFeeId: z.string(),
  amount: z.number().positive(),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'DD']),
  referenceNo: z.string().optional(),
  transactionDate: z.string().optional(),
  remarks: z.string().optional(),
});

export const recordFeePayment = async (req: Request, res: Response) => {
  try {
    const data = feePaymentSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Student Fee
      const studentFee = await tx.studentFee.findUnique({
        where: { id: data.studentFeeId },
        include: { student: true }
      });

      if (!studentFee) throw new Error('Student fee record not found');
      if (data.amount > Number(studentFee.balance)) {
        throw new Error(`Amount ₹${data.amount} exceeds pending balance ₹${studentFee.balance}`);
      }

      const receiptNo = await generateReceiptNo(tx);

      // 2. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          type: 'CREDIT',
          subType: 'FEE_PAYMENT',
          amount: data.amount,
          studentId: studentFee.studentId,
          studentFeeId: data.studentFeeId,
          paymentMode: data.paymentMode,
          referenceNo: data.referenceNo,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          receiptNo,
          recordedById: req.user!.id,
          remarks: data.remarks
        }
      });

      // 3. Update StudentFee
      const newPaidAmount = Number(studentFee.paidAmount) + data.amount;
      const newBalance = Number(studentFee.totalAmount) - newPaidAmount;
      const newStatus = newBalance <= 0 ? 'PAID' : (newPaidAmount > 0 ? 'PARTIAL' : 'PENDING');

      const updatedFee = await tx.studentFee.update({
        where: { id: data.studentFeeId },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus
        }
      });

      // 4. Create Receipt
      const receipt = await tx.receipt.create({
        data: {
          transactionId: transaction.id,
          receiptNo: transaction.receiptNo,
          issuedTo: studentFee.student.name,
          amount: data.amount
        }
      });

      return { transaction, receipt, updatedFee };
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'FEE_PAYMENT',
      entity: 'Transaction',
      entityId: result.transaction.id,
      newValue: result.transaction,
      ipAddress: req.ip
    });

    cache.del(['dashboard_summary', 'dashboard_monthly_chart']);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

const expenseSchema = z.object({
  expenseCategoryId: z.string(),
  amount: z.number().positive(),
  description: z.string(),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'DD']),
  referenceNo: z.string().optional(),
  transactionDate: z.string().optional(),
  remarks: z.string().optional(),
});

export const recordExpense = async (req: Request, res: Response) => {
  try {
    const data = expenseSchema.parse(req.body);

    const receiptNo = `EXP-${Date.now()}`; // Just a unique marker for internal tracking

    const transaction = await prisma.transaction.create({
      data: {
        type: 'DEBIT',
        subType: 'EXPENSE',
        amount: data.amount,
        description: data.description,
        expenseCategoryId: data.expenseCategoryId,
        paymentMode: data.paymentMode,
        referenceNo: data.referenceNo,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
        receiptNo, // Every transaction in schema needs a unique receiptNo
        recordedById: req.user!.id,
        remarks: data.remarks,
      }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'RECORD_EXPENSE',
      entity: 'Transaction',
      entityId: transaction.id,
      newValue: transaction,
      ipAddress: req.ip
    });

    cache.del(['dashboard_summary', 'dashboard_monthly_chart']);

    res.status(201).json(transaction);
  } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: error.issues });
      res.status(500).json({ message: 'Error recording expense' });
  }
};

export const getExpenseSummary = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [thisMonthTotal, lastMonthTotal, byCategory] = await Promise.all([
            prisma.transaction.aggregate({
                where: { type: 'DEBIT', subType: 'EXPENSE', transactionDate: { gte: startOfMonth } },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: { type: 'DEBIT', subType: 'EXPENSE', transactionDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
                _sum: { amount: true }
            }),
            prisma.transaction.groupBy({
                by: ['expenseCategoryId'],
                where: { type: 'DEBIT', subType: 'EXPENSE' },
                _sum: { amount: true },
                _count: { id: true }
            })
        ]);

        // Get category names
        const categories = await prisma.expenseCategory.findMany();
        const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

        const byCategoryFormatted = byCategory.map(bc => ({
            categoryName: categoryMap[bc.expenseCategoryId!] || 'Other',
            total: bc._sum.amount,
            count: bc._count.id
        }));

        res.json({
            thisMonth: thisMonthTotal._sum.amount || 0,
            lastMonth: lastMonthTotal._sum.amount || 0,
            byCategory: byCategoryFormatted
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching expense summary' });
    }
};

export const voidTransaction = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const original = await tx.transaction.findUnique({
                where: { id },
                include: { studentFee: true }
            });

            if (!original) throw new Error('Transaction not found');
            if (original.type === 'DEBIT' && original.subType === 'EXPENSE') {
                 return tx.transaction.update({
                     where: { id },
                     data: { remarks: `VOIDED: ${reason}` }
                 });
            }

            if (original.subType === 'FEE_PAYMENT' && original.studentFee) {
                const newPaid = Number(original.studentFee.paidAmount) - Number(original.amount);
                const newBalance = Number(original.studentFee.balance) + Number(original.amount);
                
                await tx.studentFee.update({
                    where: { id: original.studentFeeId! },
                    data: {
                        paidAmount: newPaid,
                        balance: newBalance,
                        status: newPaid <= 0 ? 'PENDING' : 'PARTIAL'
                    }
                });

                return tx.transaction.update({
                    where: { id },
                    data: { remarks: `VOIDED: ${reason}` }
                });
            }
        });

        res.json({ message: 'Transaction voided successfully', result });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const generateReceiptPDF = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { 
        student: { include: { course: true } },
        recordedBy: true
      }
    });

    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-${tx.receiptNo}.pdf`);
    
    doc.pipe(res);

    doc.fontSize(20).text('SANSKRITI COLLEGE', { align: 'center' });
    doc.fontSize(10).text('College Code: 1234 • Affiliated to Example University', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(14).text('PAYMENT RECEIPT', { align: 'center', underline: true });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Receipt No: ${tx.receiptNo}`, 50, doc.y);
    doc.text(`Date: ${new Date(tx.transactionDate).toLocaleDateString()}`, 400, doc.y);
    doc.moveDown();

    doc.rect(50, doc.y, 500, 150).stroke();
    const startY = doc.y + 10;
    doc.text(`Received with thanks from:`, 60, startY);
    doc.fontSize(14).font('Helvetica-Bold').text(tx.student?.name.toUpperCase() || 'N/A', 60, startY + 20);
    doc.fontSize(12).font('Helvetica').text(`Enrollment No: ${tx.student?.enrollmentNo}`, 60, startY + 40);
    doc.text(`Course: ${tx.student?.course.name}`, 60, startY + 60);
    
    doc.moveDown(4);
    doc.fontSize(16).text(`AMOUNT RECEIVED: ₹${tx.amount}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Payment Mode: ${tx.paymentMode}`);
    if (tx.referenceNo) doc.text(`Reference No: ${tx.referenceNo}`);
    doc.moveDown(2);

    doc.text('--------------------------------', 400, doc.y);
    doc.text('Authorised Signatory', 410, doc.y + 15);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF' });
  }
};
