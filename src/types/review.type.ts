import { Prisma, Review } from '@prisma/client';

import { ItemsData } from '@/types/common.type';
import { UserInfo } from '@/types/user.type';

type CreateReview = Pick<Review, Exclude<keyof Review, 'id' | 'createdAt'>>;

type SortBy = 'rating' | 'createdAt';
type OrderBy = Prisma.SortOrder;
type OrderByOpt = {
  [K in keyof Review]: { [P in K]: OrderBy };
}[keyof Review];
type OrderByOpts = {
  createdAt: Record<OrderBy, OrderByOpt[]>;
  rating: Record<OrderBy, OrderByOpt[]>;
};

type ReviewWithReviewer = Review & {
  reviewer: UserInfo | null;
};
type ReviewsWithReviewerData = ItemsData & {
  reviews: ReviewWithReviewer[];
};
type ReviewsData = ItemsData & {
  reviews: Review[];
};

export {
  CreateReview,
  SortBy,
  OrderBy,
  OrderByOpts,
  ReviewWithReviewer,
  ReviewsWithReviewerData,
  ReviewsData
};
