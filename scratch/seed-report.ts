import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const channel = await prisma.channel.findFirst();
  const user = await prisma.user.findFirst();

  if (!channel || !user) {
    console.error('No channel or user found to create a report');
    return;
  }

  const report = await prisma.channelReport.create({
    data: {
      channelId: channel.id,
      reporterId: user.username,
      reason: 'Test report created by script',
    },
  });

  console.log('Report created:', report);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
