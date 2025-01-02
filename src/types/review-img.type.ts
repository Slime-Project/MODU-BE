import { Review, ReviewImg } from '@prisma/client';

import { ItemsData } from '@/types/common.type';
import { Profile } from '@/types/user.type';

type ReviewWithReviewer = Review & {
  reviewer: Profile;
};

type ReviewImgWithReview = ReviewImg & {
  review: Review;
};

type ReviewImgWithReviewAndReviewer = ReviewImg & {
  review: ReviewWithReviewer;
};

type ReviewImgsData = ItemsData & {
  reviewImgs: ReviewImgWithReviewAndReviewer[];
};

export { ReviewImgWithReview, ReviewImgWithReviewAndReviewer, ReviewImgsData };
