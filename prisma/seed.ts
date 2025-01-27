import { PrismaClient } from '@prisma/client';

// initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  const tags = [
    { name: '10대 남성' },
    { name: '20대 남성' },
    { name: '30대 남성' },
    { name: '40대 남성' },
    { name: '50대 남성' },
    { name: '60대 남성' },
    { name: '70대 남성' },
    { name: '80대 남성' },
    { name: '90대 남성' },
    { name: '10대 여성' },
    { name: '20대 여성' },
    { name: '30대 여성' },
    { name: '40대 여성' },
    { name: '50대 여성' },
    { name: '60대 여성' },
    { name: '70대 여성' },
    { name: '80대 여성' },
    { name: '90대 여성' },
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
