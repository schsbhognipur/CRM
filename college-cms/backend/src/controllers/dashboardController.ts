import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import cache from '../utils/cache';

export const getDashboardSummary = async (req: Request, res: Response) => {
  const cacheKey = 'dashboard_summary';
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.json(cachedData);

  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalStudents,
      activeStudents,
      newStudentsThisMonth,
      feeStats,
      finToday,
      finMonth,
      recentTransactions
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.studentFee.aggregate({
        _sum: { totalAmount: true, paidAmount: true, balance: true }
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { transactionDate: { gte: new Date(now.setHours(0,0,0,0)) } },
        _sum: { amount: true }
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { transactionDate: { gte: firstDayOfMonth } },
        _sum: { amount: true }
      }),
      prisma.transaction.findMany({
        take: 10,
        orderBy: { transactionDate: 'desc' },
        include: { student: { select: { name: true } } }
      })
    ]);

    const result = {
      students: {
        total: totalStudents,
        active: activeStudents,
        new_this_month: newStudentsThisMonth
      },
      fees: {
        totalExpected: feeStats._sum.totalAmount || 0,
        totalCollected: feeStats._sum.paidAmount || 0,
        totalOutstanding: feeStats._sum.balance || 0,
        collectionRate: feeStats._sum.totalAmount ? (Number(feeStats._sum.paidAmount) / Number(feeStats._sum.totalAmount) * 100).toFixed(1) : 0
      },
      finances: {
        todayCredit: finToday.find(t => t.type === 'CREDIT')?._sum.amount || 0,
        todayDebit: finToday.find(t => t.type === 'DEBIT')?._sum.amount || 0,
        monthCredit: finMonth.find(t => t.type === 'CREDIT')?._sum.amount || 0,
        monthDebit: finMonth.find(t => t.type === 'DEBIT')?._sum.amount || 0,
      },
      recentTransactions
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard summary' });
  }
};

export const getMonthlyChartData = async (req: Request, res: Response) => {
    const cacheKey = 'dashboard_monthly_chart';
    const cachedData = cache.get(cacheKey);
    if (cachedData) return res.json(cachedData);

    try {
        const months = 12;
        const result = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            
            const stats = await prisma.transaction.groupBy({
                by: ['type'],
                where: { transactionDate: { gte: date, lte: endOfMonth } },
                _sum: { amount: true }
            });

            const credits = Number(stats.find(s => s.type === 'CREDIT')?._sum.amount || 0);
            const debits = Number(stats.find(s => s.type === 'DEBIT')?._sum.amount || 0);

            result.push({
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear(),
                credits,
                debits,
                net: credits - debits
            });
        }

        cache.set(cacheKey, result, 3600); // 1 hour for historical charts
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chart data' });
    }
};

export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity feed' });
  }
};
