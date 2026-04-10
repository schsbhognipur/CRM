import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting intensive seeding...');

  // 1. Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.studentFee.deleteMany();
  await prisma.feeStructureComponent.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.student.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.course.deleteMany();
  await prisma.feeComponent.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.user.deleteMany();

  // 2. Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const superAdmin = await prisma.user.create({
    data: { name: 'Super Admin', email: 'admin@college.com', passwordHash, role: 'SUPER_ADMIN' }
  });
  const accountant = await prisma.user.create({
    data: { name: 'John Accountant', email: 'cash@college.com', passwordHash, role: 'ACCOUNTANT' }
  });
  const staff = await prisma.user.create({
    data: { name: 'Sarah Staff', email: 'staff@college.com', passwordHash, role: 'STAFF' }
  });

  // 3. Academic Year
  const currentAY = await prisma.academicYear.create({
    data: { label: '2024-25', startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), isActive: true }
  });
  const nextAY = await prisma.academicYear.create({
    data: { label: '2025-26', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), isActive: false }
  });

  // 4. Courses
  const dPharma = await prisma.course.create({ data: { name: 'D_PHARMA', durationYears: 2 } });
  const bPharma = await prisma.course.create({ data: { name: 'B_PHARMA', durationYears: 4 } });

  // 5. Fee Components
  const tuition = await prisma.feeComponent.create({ data: { name: 'Tuition Fee' } });
  const lab = await prisma.feeComponent.create({ data: { name: 'Laboratory Fee' } });
  const exam = await prisma.feeComponent.create({ data: { name: 'Examination Fee' } });
  const library = await prisma.feeComponent.create({ data: { name: 'Library Fee' } });

  // 6. Expense Categories
  const electricity = await prisma.expenseCategory.create({ data: { name: 'Electricity Bill' } });
  const salary = await prisma.expenseCategory.create({ data: { name: 'Staff Salary' } });
  const maintenance = await prisma.expenseCategory.create({ data: { name: 'Maintenance' } });

  // 7. Fee Structures (D.Pharma Yr 1)
  const dpharmaStructure = await prisma.feeStructure.create({
    data: {
      courseId: dPharma.id,
      academicYearId: currentAY.id,
      yearOfStudy: 1,
      totalAmount: 65000,
    }
  });

  await prisma.feeStructureComponent.create({
    data: {
        feeStructureId: dpharmaStructure.id,
        feeComponentId: tuition.id,
        amount: 50000
    }
  });

  // 8. Students
  const activeStudent = await prisma.student.create({
    data: {
      enrollmentNo: 'DPHA2024-0001',
      name: 'Rahul Kumar',
      phone: '9876543210',
      dob: new Date('2005-01-15'),
      gender: 'MALE',
      fatherName: 'Raj Kumar',
      motherName: 'Sunita Devi',
      address: '123, Civil Lines',
      city: 'Kanpur',
      state: 'UP',
      pinCode: '208001',
      courseId: dPharma.id,
      academicYearId: currentAY.id,
      yearOfStudy: 1,
      batchYear: 2024,
      status: 'ACTIVE'
    }
  });

  const defaulterStudent = await prisma.student.create({
    data: {
      enrollmentNo: 'DPHA2024-0002',
      name: 'Sneha Gupta',
      phone: '9988776655',
      dob: new Date('2005-05-20'),
      gender: 'FEMALE',
      fatherName: 'Anil Gupta',
      motherName: 'Mamta Gupta',
      address: '45, Shastri Nagar',
      city: 'Kanpur',
      state: 'UP',
      pinCode: '208005',
      courseId: dPharma.id,
      academicYearId: currentAY.id,
      yearOfStudy: 1,
      batchYear: 2024,
      status: 'ACTIVE'
    }
  });

  // 9. Student Fees
  const fee1 = await prisma.studentFee.create({
    data: {
      studentId: activeStudent.id,
      academicYearId: currentAY.id,
      feeStructureId: dpharmaStructure.id,
      totalAmount: 65000,
      paidAmount: 40000,
      balance: 25000,
      status: 'PARTIAL',
      dueDate: new Date('2024-10-01')
    }
  });

  const fee2 = await prisma.studentFee.create({
    data: {
      studentId: defaulterStudent.id,
      academicYearId: currentAY.id,
      feeStructureId: dpharmaStructure.id,
      totalAmount: 65000,
      paidAmount: 0,
      balance: 65000,
      status: 'PENDING',
      dueDate: new Date('2024-08-01') // Past due
    }
  });

  // 10. Transactions (Credits)
  await prisma.transaction.create({
    data: {
      type: 'CREDIT',
      subType: 'FEE_PAYMENT',
      amount: 40000,
      studentId: activeStudent.id,
      studentFeeId: fee1.id,
      paymentMode: 'BANK_TRANSFER',
      referenceNo: 'TXN100200300',
      receiptNo: 'RCP-2024-00001',
      transactionDate: new Date('2024-04-10T10:30:00'),
      recordedById: accountant.id,
      remarks: 'Initial payment'
    }
  });

  // 11. Transactions (Debits/Expenses)
  await prisma.transaction.create({
    data: {
      type: 'DEBIT',
      subType: 'EXPENSE',
      amount: 12000,
      expenseCategoryId: electricity.id,
      description: 'Electricity bill for Admin Block',
      paymentMode: 'CASH',
      receiptNo: 'EXP-BILL-2024-01',
      transactionDate: new Date(),
      recordedById: accountant.id,
    }
  });

  await prisma.transaction.create({
    data: {
      type: 'DEBIT',
      subType: 'EXPENSE',
      amount: 45000,
      expenseCategoryId: salary.id,
      description: 'Staff Salary - June',
      paymentMode: 'BANK_TRANSFER',
      receiptNo: 'EXP-SAL-2024-06',
      transactionDate: new Date(),
      recordedById: superAdmin.id,
    }
  });

  console.log('✅ Seeding complete!');
  console.log('Credentials:');
  console.log('- Super Admin: admin@college.com / password123');
  console.log('- Accountant: cash@college.com / password123');
  console.log('- Staff: staff@college.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
