import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixFees() {
  const fees = await prisma.studentFee.findMany();
  console.log(`Found ${fees.length} fee records.`);
  
  for (const fee of fees) {
    const total = Number(fee.totalAmount);
    const disc = Number(fee.discount || 0);
    const paid = Number(fee.paidAmount || 0);
    const nett = total - disc;
    const balance = nett - paid;
    
    await prisma.studentFee.update({
      where: { id: fee.id },
      data: {
        payableAmount: nett,
        balance: balance
      }
    });
  }
  console.log('Migration complete.');
}

fixFees()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
