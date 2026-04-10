import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing Database Connection...');
  console.log('📡 Attempting to connect to Supabase...');

  try {
    // Attempt a simple query
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log('📊 Result from DB:', result);
    
    // Check if we can see tables
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('📂 Tables found in public schema:', (tables as any[]).length);
    
  } catch (error: any) {
    console.error('❌ CONNECTION FAILED');
    console.error('----------------------------------------');
    console.error('ERROR MESSAGE:', error.message);
    console.error('ERROR CODE:', error.code);
    console.error('----------------------------------------');
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 TIP: Check if your password contains special characters like $, %, #. They must be URL-encoded.');
    }
    if (error.message.includes('Can\'t reach database server')) {
      console.log('💡 TIP: Ensure your database is active on Supabase and you aren\'t behind a restrictive firewall.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
