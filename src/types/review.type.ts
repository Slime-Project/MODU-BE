import { Prisma, Review } from '@prisma/client';

import { ItemsData } from '@/types/common.type';

type CreateReview = Pick<Review, Exclude<keyof Review, 'id' | 'createdAt'>>;

type SortBy = 'rating' | 'createdAt';
type OrderBy = Prisma.SortOrder;
type OrderByOpt = {
  [K in keyof Review]: { [P in K]: OrderBy };
}[keyof Review];
type SortingOpts = {
  createdAt: Record<OrderBy, OrderByOpt[]>;
  rating: Record<OrderBy, OrderByOpt[]>;
};

type ReviewsData = ItemsData & {
  reviews: Review[];
};

export { CreateReview, SortBy, OrderBy, SortingOpts, ReviewsData };
