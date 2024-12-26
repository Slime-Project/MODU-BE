import { Prisma, Review, ReviewImg } from '@prisma/client';

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

type ReviewIncludeImgs = Review & {
  imgs: ReviewImg[];
};
type ReviewIncludeImgsUrl = Review & {
  imgs: { url: string }[];
};
type ReviewWithImgs = Review & {
  imgs: string[];
};
type ReviewWithReviewer = ReviewWithImgs & {
  reviewer: UserInfo | null;
};
type ReviewsWithReviewerData = ItemsData & {
  reviews: ReviewWithReviewer[];
};
type ReviewsData = ItemsData & {
  reviews: ReviewWithImgs[];
};

export {
  CreateReview,
  SortBy,
  OrderBy,
  OrderByOpts,
  ReviewWithReviewer,
  ReviewsWithReviewerData,
  ReviewWithImgs,
  ReviewsData,
  ReviewIncludeImgs,
  ReviewIncludeImgsUrl
};
