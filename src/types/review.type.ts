import { Prisma, Review } from '@prisma/client';

import { REVIEW_PAGE_SIZE } from '@/constants/review-constants';

type CreateReview = Pick<Review, Exclude<keyof Review, 'id' | 'createdAt'>>;
type UpdateReview = Partial<
  Pick<Review, Exclude<keyof Review, 'id' | 'createdAt' | 'productId' | 'userId'>>
>;

type SortBy = 'rating' | 'createdAt';
type OrderBy = Prisma.SortOrder;
type OrderByOpt = {
  [K in keyof Review]: { [P in K]: OrderBy };
}[keyof Review];
type SortingOpts = {
  createdAt: Record<OrderBy, OrderByOpt[]>;
  rating: Record<OrderBy, OrderByOpt[]>;
};

type ReviewsData = {
  reviews: Review[];
  meta: {
    page: number;
    pageSize: typeof REVIEW_PAGE_SIZE;
    totalReviews: number;
    totalPages: number;
  };
};

export { CreateReview, UpdateReview, SortBy, OrderBy, SortingOpts, ReviewsData };
