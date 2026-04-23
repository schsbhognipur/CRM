import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import cache from '../utils/cache'; // I will create this utility

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'dashboard_summary';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 🔥 SENIOR OPTIMIZATION: Parallel execution of 6 independent metrics
    const [
      totalStudents,
      newStudentsMonth,
      totalExpected,
      totalPaid,
      monthCredit,
      monthDebit,
      recentTransactions
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count({ where: { createdAt: { gte: firstDayMonth } } }),
      prisma.studentFee.aggregate({ _sum: { totalAmount: true } }),
      prisma.studentFee.aggregate({ _sum: { paidAmount: true } }),
      prisma.transaction.aggregate({
        where: { type: 'CREDIT', transactionDate: { gte: firstDayMonth } },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { type: 'DEBIT', transactionDate: { gte: firstDayMonth } },
        _sum: { amount: true }
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { transactionDate: 'desc' },
        select: {
          id: true,
          amount: true,
          type: true,
          subType: true,
          description: true,
          student: { select: { name: true } }
        }
      })
    ]);

    const expected = Number(totalExpected._sum.totalAmount || 0);
    const paid = Number(totalPaid._sum.paidAmount || 0);
    
    const summary = {
      students: {
        total: totalStudents,
        new_this_month: newStudentsMonth
      },
      fees: {
        totalExpected: expected,
        totalPaid: paid,
        totalOutstanding: expected - paid,
        collectionRate: expected > 0 ? Math.round((paid / expected) * 100) : 0
      },
      finances: {
        monthCredit: Number(monthCredit._sum.amount || 0),
        monthDebit: Number(monthDebit._sum.amount || 0)
      },
      recentTransactions
    };

    // Cache for 2 minutes to reduce DB load
    cache.set(cacheKey, summary, 120);
    
    res.json(summary);
  } catch (error) {
    console.error('Dashboard optimization error:', error);
    res.status(500).json({ message: 'Error generating intelligence' });
  }
};

export const getMonthlyChartData = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'dashboard_chart';
    if (cache.get(cacheKey)) return res.json(cache.get(cacheKey));

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await prisma.transaction.findMany({
      where: { transactionDate: { gte: sixMonthsAgo } },
      select: { amount: true, type: true, transactionDate: true }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthLabel = months[d.getMonth()];
      
      const monthlyTxs = transactions.filter(t => 
        new Date(t.transactionDate).getMonth() === d.getMonth()
      );

      return {
        month: monthLabel,
        credits: monthlyTxs.filter(t => t.type === 'CREDIT').reduce((s, t) => s + Number(t.amount), 0),
        debits: monthlyTxs.filter(t => t.type === 'DEBIT').reduce((s, t) => s + Number(t.amount), 0)
      };
    });

    cache.set(cacheKey, chartData, 300);
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: 'Error processing chart analytics' });
  }
};

export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        createdAt: true,
        user: { select: { name: true } }
      }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit trail' });
  }
};
