import prisma from './prisma';

export const getNextReceiptNo = async (): Promise<string> => {
  // Use a raw update to ensure atomicity and get the new value in one go
  // PostgreSQL RETURNING clause is supported by $queryRaw
  const currentYear = new Date().getFullYear();
  
  try {
    // 1. Try to update and return. If it fails, the row might not exist.
    const result: any[] = await prisma.$queryRaw`
      UPDATE "Counter" 
      SET value = value + 1 
      WHERE id = 'receipt' 
      RETURNING value
    `;

    let newValue: number;

    if (result.length === 0) {
      // 2. Row doesn't exist, create it. 
      // We use upsert to handle potential race condition where another process creates it first.
      const counter = await prisma.counter.upsert({
        where: { id: 'receipt' },
        update: { value: { increment: 1 } },
        create: { id: 'receipt', value: 1 }
      });
      newValue = counter.value;
    } else {
      newValue = result[0].value;
    }

    // Format: RCP-2025-00001
    return `RCP-${currentYear}-${newValue.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating receipt number:', error);
    throw new Error('Failed to generate receipt number');
  }
};
