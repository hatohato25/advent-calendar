import { prisma } from './src/lib/prisma';

async function test() {
  try {
    console.log('Testing Prisma connection...');
    const users = await prisma.user.findMany({ take: 1 });
    console.log('✅ Success! Found users:', users.length);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
