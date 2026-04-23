import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { createAuditLog } from '../utils/audit';
import cache from '../utils/cache';
import { Prisma } from '@prisma/client';
import { getNextReceiptNo } from '../utils/receiptNumber';
import { generateReceiptPDFInternal, generateVoucherPDFInternal } from '../utils/pdfReceipt';

export const getTransactions = async (req: Request, res: Response) => {
  const { 
    type, 
    subType, 
    studentId, 
    expenseCategoryId,
    dateFrom, 
    dateTo, 
    paymentMode, 
    page = 1, 
    limit = 20 
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where: Prisma.TransactionWhereInput = {
    deletedAt: null,
    ...(type && { type: type as any }),
    ...(subType && { subType: subType as any }),
    ...(studentId && { studentId: String(studentId) }),
    ...(expenseCategoryId && { expenseCategoryId: String(expenseCategoryId) }),
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
          recordedBy: { select: { name: true } },
          expenseCategory: { select: { name: true } },
        },
        orderBy: { transactionDate: 'desc' }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        meta: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching financial history' });
  }
};

const feePaymentSchema = z.object({
  studentFeeId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'DD']),
  referenceNo: z.string().optional().or(z.literal('')),
  transactionDate: z.string().optional().or(z.literal('')),
  remarks: z.string().optional(),
});

export const recordFeePayment = async (req: Request, res: Response) => {
  try {
    console.log('[recordFeePayment] INCOMING PAYLOAD:', req.body);
    const validation = feePaymentSchema.safeParse(req.body);
    if (!validation.success) {
      console.error('[recordFeePayment] VALIDATION FALLOUT:', validation.error.issues);
      return res.status(422).json({ success: false, message: 'Validation failed', errors: validation.error.issues });
    }

    const data = validation.data;

    if (data.paymentMode !== 'CASH' && !data.referenceNo) {
      return res.status(422).json({ success: false, message: 'Reference number is required for non-cash payments' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const studentFee = await tx.studentFee.findUnique({
        where: { id: data.studentFeeId },
        include: { student: true }
      });

      if (!studentFee) throw new Error('Student fee record not found');
      
      const balance = Number(studentFee.balance);
      if (data.amount > balance) {
        throw new Error(`Amount ₹${data.amount} exceeds pending balance ₹${balance}`);
      }

      const receiptNo = await getNextReceiptNo();

      const transaction = await tx.transaction.create({
        data: {
          type: 'CREDIT',
          subType: 'FEE_PAYMENT',
          amount: data.amount,
          student: { connect: { id: studentFee.studentId } },
          studentFee: { connect: { id: data.studentFeeId } },
          paymentMode: data.paymentMode,
          referenceNo: data.referenceNo || null,
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
          receiptNo,
          recordedBy: { connect: { id: req.user!.id } },
          remarks: data.remarks,
          description: "Fee payment"
        }
      });

      const newPaidAmount = Number(studentFee.paidAmount) + data.amount;
      const newBalance = Number(studentFee.totalAmount) - newPaidAmount;
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

      const updatedStudentFee = await tx.studentFee.update({
        where: { id: data.studentFeeId },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus
        }
      });

      const receipt = await tx.receipt.create({
        data: {
          transactionId: transaction.id,
          receiptNo,
          issuedTo: studentFee.student.name,
          amount: data.amount
        }
      });

      return { transaction, receipt, updatedStudentFee, student: { name: studentFee.student.name, enrollmentNo: studentFee.student.enrollmentNo } };
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

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error('[recordFeePayment] CRITICAL TRANSACTION FAILURE:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during matrix execution' });
  }
};

export const generateReceiptPDF = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id, deletedAt: null },
      include: { 
        student: { include: { course: true } },
        recordedBy: true,
        receipt: true
      }
    });

    if (!tx) return res.status(404).json({ message: 'Transaction not found or deleted' });

    generateReceiptPDFInternal(res, tx);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating PDF receipt' });
  }
};

const expenseSchema = z.object({
  expenseCategoryId: z.string().uuid(),
  amount: z.number().positive().max(10000000),
  description: z.string().min(3).max(500),
  paymentMode: z.enum(['CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'DD']),
  referenceNo: z.string().optional().or(z.literal('')),
  invoiceNo: z.string().max(50).optional().or(z.literal('')),
  transactionDate: z.string().refine(val => new Date(val) <= new Date(), { message: "Date cannot be in the future" }),
  remarks: z.string().optional(),
});

export const recordExpense = async (req: Request, res: Response) => {
  try {
    const validation = expenseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(422).json({ success: false, message: 'Validation failed', errors: validation.error.issues });
    }

    const data = validation.data;

    if (data.paymentMode !== 'CASH' && !data.referenceNo) {
      return res.status(422).json({ success: false, message: 'Reference number is required for non-cash payments' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const category = await tx.expenseCategory.findUnique({
        where: { id: data.expenseCategoryId }
      });

      if (!category || !category.isActive) {
        throw new Error('Expense category not found or inactive');
      }

      const receiptNo = `EXP-${Date.now()}`;
      
      const transaction = await tx.transaction.create({
        data: {
          type: 'DEBIT',
          subType: 'EXPENSE',
          amount: data.amount,
          description: data.description,
          expenseCategory: { connect: { id: data.expenseCategoryId } },
          paymentMode: data.paymentMode,
          referenceNo: data.referenceNo || null,
          invoiceNo: data.invoiceNo || null,
          transactionDate: new Date(data.transactionDate),
          receiptNo,
          recordedBy: { connect: { id: req.user!.id } },
          remarks: data.remarks
        }
      });

      return { transaction, category: { name: category.name } };
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'RECORD_EXPENSE',
      entity: 'Transaction',
      entityId: result.transaction.id,
      newValue: result.transaction,
      ipAddress: req.ip
    });

    cache.del(['dashboard_summary', 'dashboard_monthly_chart']);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'Expense category not found or inactive') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Error recording expense' });
  }
};

export const getExpenseSummary = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    // Determine dates from query params or use defaults
    const dateFromStr = req.query.dateFrom as string;
    let startOfMonth: Date;
    let endOfMonth: Date;

    if (dateFromStr) {
       startOfMonth = new Date(dateFromStr);
       const toParam = req.query.dateTo as string;
       endOfMonth = toParam ? new Date(toParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else {
       startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
       endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);

    const [
      thisMonthTotal,
      lastMonthTotal,
      thisYearTotal,
      byCategoryRows,
      categories
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'DEBIT', subType: 'EXPENSE', deletedAt: null, transactionDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'DEBIT', subType: 'EXPENSE', deletedAt: null, transactionDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'DEBIT', subType: 'EXPENSE', deletedAt: null, transactionDate: { gte: startOfThisYear } },
        _sum: { amount: true }
      }),
      prisma.transaction.groupBy({
        by: ['expenseCategoryId'],
        where: { type: 'DEBIT', subType: 'EXPENSE', deletedAt: null, transactionDate: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } }
      }),
      prisma.expenseCategory.findMany({ select: { id: true, name: true } })
    ]);

    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const totalMonthAmount = Number(thisMonthTotal._sum.amount || 0);

    const byCategory = byCategoryRows.map(bc => ({
      categoryId: bc.expenseCategoryId,
      categoryName: bc.expenseCategoryId ? (categoryMap[bc.expenseCategoryId] || 'Unknown') : 'Unknown',
      total: Number(bc._sum.amount || 0),
      count: bc._count.id,
      percentage: totalMonthAmount > 0 ? Math.round((Number(bc._sum.amount || 0) / totalMonthAmount) * 100) : 0
    }));

    // Generate byMonth (last 6 months)
    const byMonth = [];
    for (let i = 5; i >= 0; i--) {
      const tgtMonthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const tgtMonthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const agg = await prisma.transaction.aggregate({
        where: { type: 'DEBIT', subType: 'EXPENSE', deletedAt: null, transactionDate: { gte: tgtMonthStart, lte: tgtMonthEnd } },
        _sum: { amount: true }
      });
      byMonth.push({
        month: `${tgtMonthStart.getFullYear()}-${String(tgtMonthStart.getMonth() + 1).padStart(2, '0')}`,
        total: Number(agg._sum.amount || 0)
      });
    }

    res.json({
      success: true,
      data: {
        totalThisMonth: totalMonthAmount,
        totalLastMonth: Number(lastMonthTotal._sum.amount || 0),
        totalThisYear: Number(thisYearTotal._sum.amount || 0),
        byCategory,
        byMonth
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching expense summary' });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, expenseCategoryId, invoiceNo, remarks, paymentMode, referenceNo } = req.body;

  try {
    const tx = await prisma.transaction.findUnique({ where: { id, deletedAt: null } });
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const isWithin24Hrs = (new Date().getTime() - new Date(tx.createdAt).getTime()) < 24 * 60 * 60 * 1000;
    const canEdit = isWithin24Hrs || ['SUPER_ADMIN', 'ADMIN'].includes(req.user!.role);

    if (!canEdit) {
      return res.status(403).json({ success: false, message: "Expenses can only be edited within 24 hours of recording" });
    }

    const updatedTx = await prisma.transaction.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(expenseCategoryId && { expenseCategoryId }),
        ...(invoiceNo !== undefined && { invoiceNo }),
        ...(remarks !== undefined && { remarks }),
        ...(paymentMode && { paymentMode }),
        ...(referenceNo !== undefined && { referenceNo })
      }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE_EXPENSE',
      entity: 'Transaction',
      entityId: tx.id,
      oldValue: tx,
      newValue: updatedTx,
      ipAddress: req.ip
    });

    cache.del(['dashboard_summary', 'dashboard_monthly_chart']);
    res.json({ success: true, data: updatedTx });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.query;

  if (!reason || String(reason).length < 5) {
    return res.status(422).json({ success: false, message: 'A valid reason (min 5 chars) is required for deletion' });
  }

  try {
    const deletedTx = await prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedReason: String(reason)
      }
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'DELETE_EXPENSE',
      entity: 'Transaction',
      entityId: id,
      newValue: { deletedAt: deletedTx.deletedAt, deletedReason: deletedTx.deletedReason },
      ipAddress: req.ip
    });

    cache.del(['dashboard_summary', 'dashboard_monthly_chart']);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting expense' });
  }
};

export const generateVoucherPDF = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const tx = await prisma.transaction.findUnique({
      where: { id, deletedAt: null },
      include: {
        expenseCategory: true,
        recordedBy: true
      }
    });

    if (!tx || tx.type !== 'DEBIT' || tx.subType !== 'EXPENSE') {
      return res.status(404).json({ message: 'Expense transaction not found' });
    }

    generateVoucherPDFInternal(res, tx);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating PDF voucher' });
  }
};
