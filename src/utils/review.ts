import { PrismaClient } from '@prisma/client';
import { ITXClientDenyList } from '@prisma/client/runtime/library';

const getAverageRating = async (
  prisma: Omit<PrismaClient, ITXClientDenyList>,
  productId: number
) => {
  const { _avg: avg } = await prisma.review.aggregate({
    _avg: {
      rating: true
    },
    where: {
      productId
    }
  });
  return avg.rating || 0;
};

const updateAverageRating = async (
  prisma: Omit<PrismaClient, ITXClientDenyList>,
  productId: number
) => {
  const averageRating = await getAverageRating(prisma, productId);
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating
    }
  });
};

export { getAverageRating, updateAverageRating };
