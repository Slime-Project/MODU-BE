import { Review } from '@prisma/client';

type CreateReview = Pick<Review, Exclude<keyof Review, 'id' | 'createdAt'>>;

export { CreateReview };
