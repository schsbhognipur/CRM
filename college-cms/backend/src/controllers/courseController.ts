import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        durationYears: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });
    
    // Fallback: If DB is miraculously unseeded, auto-seed these
    if (courses.length === 0) {
      console.log('Courses unseeded. Running auto-seed protocol.');
      await prisma.course.createMany({
         data: [
            { name: 'D_PHARMA', durationYears: 2 },
            { name: 'B_PHARMA', durationYears: 4 }
         ]
      });
      const fallback = await prisma.course.findMany({ orderBy: { name: 'asc' } });
      return res.json({ success: true, data: fallback });
    }

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching courses' });
  }
};
