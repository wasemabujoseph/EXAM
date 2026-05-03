import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addTestUser() {
    const email = 'test@example.com';
    const password = 'testpassword123';
    const name = 'Test User';

    console.log(`Adding test user ${email}...`);

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
        where: { email },
        update: { passwordHash, name },
        create: {
            email,
            passwordHash,
            name,
            role: 'STUDENT'
        }
    });

    console.log('Test user added successfully.');
    await prisma.$disconnect();
}

addTestUser().catch(err => {
    console.error(err);
    process.exit(1);
});
