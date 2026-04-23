import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export const getDayBook = async (req: Request, res: Response) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;
  const targetDate = new Date(String(date));
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  try {
    // 🔥 SENIOR OPTIMIZATION: Triple-parallel execution
    const [priorStats, transactions] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        where: { transactionDate: { lt: targetDate } },
        _sum: { amount: true }
      }),
      prisma.transaction.findMany({
        where: { transactionDate: { gte: targetDate, lt: nextDate } },
        select: {
          id: true,
          amount: true,
          type: true,
          subType: true,
          transactionDate: true,
          description: true,
          student: { select: { name: true, enrollmentNo: true } },
          expenseCategory: { select: { name: true } }
        },
        orderBy: { transactionDate: 'asc' }
      })
    ]);

    const priorCredits = Number(priorStats.find(s => s.type === 'CREDIT')?._sum.amount || 0);
    const priorDebits = Number(priorStats.find(s => s.type === 'DEBIT')?._sum.amount || 0);
    const openingBalance = priorCredits - priorDebits;

    const credits = transactions.filter(t => t.type === 'CREDIT');
    const debits = transactions.filter(t => t.type === 'DEBIT');

    const totalCredits = credits.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalDebits = debits.reduce((sum, t) => sum + Number(t.amount), 0);
    const closingBalance = openingBalance + totalCredits - totalDebits;

    res.json({
        date,
        openingBalance,
        closingBalance,
        totalCredits,
        totalDebits,
        credits,
        debits
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating institutional day book' });
  }
};

export const getFeeCollectionReport = async (req: Request, res: Response) => {
  const { academicYearId, courseId, dateFrom, dateTo } = req.query;
  try {
    const where: any = {
        subType: 'FEE_PAYMENT',
        ...(academicYearId && { studentFee: { academicYearId: String(academicYearId) } }),
        ...(courseId && { student: { courseId: String(courseId) } }),
        ...(dateFrom || dateTo ? {
            transactionDate: {
                ...(dateFrom && { gte: new Date(String(dateFrom)) }),
                ...(dateTo && { lte: new Date(String(dateTo)) }),
            }
        } : {})
    };

    const collections = await prisma.transaction.findMany({
        where,
        include: {
            student: { select: { name: true, enrollmentNo: true } },
            studentFee: { include: { academicYear: true } }
        },
        orderBy: { transactionDate: 'desc' }
    });

    const totalCollected = collections.reduce((sum, c) => sum + Number(c.amount), 0);

    res.json({ collections, totalCollected });
  } catch (error) {
    res.status(500).json({ message: 'Error generating fee collection report' });
  }
};

export const getOutstandingFees = async (req: Request, res: Response) => {
    const { academicYearId, courseId } = req.query;
    try {
        const fees = await prisma.studentFee.findMany({
            where: {
                balance: { gt: 0 },
                ...(academicYearId && { academicYearId: String(academicYearId) }),
                student: { ...(courseId && { courseId: String(courseId) }) }
            },
            select: {
                id: true,
                totalAmount: true,
                paidAmount: true,
                balance: true,
                dueDate: true,
                student: { 
                  select: { 
                    name: true, 
                    enrollmentNo: true, 
                    phone: true,
                    course: { select: { name: true } } 
                  } 
                }
            }
        });

        const now = new Date();
        const results = fees.map(f => {
            const dueDate = f.dueDate || new Date();
            const diffTime = Math.max(0, now.getTime() - dueDate.getTime());
            const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
                ...f,
                daysOverdue: dueDate < now ? daysOverdue : 0
            };
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error generating fiscal outstanding registry' });
    }
};

export const getExpenseLedger = async (req: Request, res: Response) => {
    const { dateFrom, dateTo, expenseCategoryId } = req.query;
    try {
        const expenses = await prisma.transaction.findMany({
            where: {
                subType: 'EXPENSE',
                ...(expenseCategoryId && { expenseCategoryId: String(expenseCategoryId) }),
                ...(dateFrom || dateTo ? {
                    transactionDate: {
                        ...(dateFrom && { gte: new Date(String(dateFrom)) }),
                        ...(dateTo && { lte: new Date(String(dateTo)) }),
                    }
                } : {})
            },
            include: { expenseCategory: true },
            orderBy: { transactionDate: 'desc' }
        });

        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        res.json({ expenses, total });
    } catch (error) {
        res.status(500).json({ message: 'Error generating expense ledger' });
    }
};

export const exportReportExcel = async (req: Request, res: Response) => {
    // This is a generic exporter. In real app, you'd branch based on report type.
    // Simplifying for demo.
    const { type } = req.params;
    try {
        const workbook = XLSX.utils.book_new();
        const data = [{ 'Info': 'Report implementation pending' }]; 
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${type}.xlsx`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: 'Error exporting excel' });
    }
};
