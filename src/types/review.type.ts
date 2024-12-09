import { Review } from '@prisma/client';

type CreateReview = Pick<Review, Exclude<keyof Review, 'id' | 'createdAt'>>;
type UpdateReview = Partial<
  Pick<Review, Exclude<keyof Review, 'id' | 'createdAt' | 'productId' | 'userId'>>
>;

export { CreateReview, UpdateReview };
