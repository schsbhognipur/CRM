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

    const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });

    const [
      studentCounts,
      feeSums,
      financeStatsRaw,
      recentTransactions,
      allFees
    ] = await Promise.all([
      // Combined student counts
      Promise.all([
        prisma.student.count({ where: { status: 'ACTIVE' } }),
        prisma.student.count({ where: { createdAt: { gte: firstDayMonth } } })
      ]),
      // Single fee aggregate
      prisma.studentFee.aggregate({ 
        _sum: { 
          payableAmount: true, 
          paidAmount: true, 
          discount: true 
        } 
      } as any),
      // Unified transaction data for finance cards
      prisma.transaction.findMany({
        where: { transactionDate: { gte: firstDayMonth } },
        select: { amount: true, type: true, transactionDate: true }
      }),
      // Recent feed
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
      } as any),
      // Course stats data
      prisma.studentFee.findMany({
        select: {
          payableAmount: true,
          paidAmount: true,
          student: {
            select: {
              course: {
                select: { name: true }
              }
            }
          }
        }
      } as any)
    ]);

    const [totalStudents, newStudentsMonth] = studentCounts;
    const expected = Number((feeSums as any)._sum.payableAmount || 0);
    const paid = Number((feeSums as any)._sum.paidAmount || 0);
    const discount = Number((feeSums as any)._sum.discount || 0);

    // Calculate finances from memory to save 3 queries
    // Precision Today Calculation (IST)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const todayIST = new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate());
    todayIST.setTime(todayIST.getTime() - istOffset);

    console.log('[DEBUG] Dashboard TodayIST:', todayIST.toISOString());

    let mCredit = 0;
    let tCredit = 0;
    let mDebit = 0;
    let tDebit = 0;
    let totalDebit = 0;

    financeStatsRaw.forEach(tx => {
      const amt = Number(tx.amount);
      if (tx.type === 'CREDIT') {
        mCredit += amt;
        if (new Date(tx.transactionDate) >= todayIST) tCredit += amt;
      } else {
        mDebit += amt;
        totalDebit += amt; // Assuming raw contains all or we need another aggregate
        if (new Date(tx.transactionDate) >= todayIST) tDebit += amt;
      }
    });

    // For All Time Expense, we need a separate aggregate if raw only has this month
    const totalExpenseAgg = await prisma.transaction.aggregate({
       where: { type: 'DEBIT', deletedAt: null },
       _sum: { amount: true }
    });

    // Group fees by course name efficiently
    const statsMap: Record<string, { expected: number, paid: number }> = {};
    allFees.forEach((f: any) => {
      const courseName = f.student.course.name;
      if (!statsMap[courseName]) {
        statsMap[courseName] = { expected: 0, paid: 0 };
      }
      statsMap[courseName].expected += Number(f.payableAmount);
      statsMap[courseName].paid += Number(f.paidAmount);
    });

    const courseStats = Object.entries(statsMap).map(([name, stats]) => ({
      name,
      expected: stats.expected,
      paid: stats.paid,
      yield: stats.expected > 0 ? Math.round((stats.paid / stats.expected) * 100) : 0
    }));
    
    const summary = {
      activeYear: activeYear?.label || 'N/A',
      students: {
        total: totalStudents,
        new_this_month: newStudentsMonth
      },
      fees: {
        totalExpected: expected,
        totalPaid: paid,
        totalDiscount: discount,
        totalOutstanding: expected - paid,
        collectionRate: expected > 0 ? Math.round((paid / expected) * 100) : 0
      },
      finances: {
        monthCredit: mCredit,
        todayCredit: tCredit,
        monthDebit: mDebit,
        todayDebit: tDebit,
        totalDebit: Number(totalExpenseAgg._sum.amount || 0)
      },
      courseStats,
      recentTransactions
    };

    // Cache for 2 minutes
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
