import { PrismaClient } from '@prisma/client';

// initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  const tags = [
    { name: '남자' },
    { name: '여자' },
    { name: '10대' },
    { name: '20대' },
    { name: '30대' },
    { name: '40대' },
    { name: '50대' },
    { name: '60대' },
    { name: '70대' },
    { name: '80대' },
    { name: '친구' },
    { name: '부모님' },
    { name: '커플' },
    { name: '직장동료' },
    { name: '재미있는' },
    { name: '로맨틱한' },
    { name: '실용적인' },
    { name: '심플한' }
  ];

  // createMany - 여러 태그 동시 생성
  await prisma.tag.createMany({
    data: tags
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
