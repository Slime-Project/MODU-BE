import { Review } from '@prisma/client';

import { SanitizedReview } from '@/types/review.type';

const sanitizeReview = (review: Review) => {
  const sanitizedReview: SanitizedReview = {
    id: review.id,
    text: review.text,
    rating: review.rating,
    createdAt: review.createdAt
  };
  return sanitizedReview;
};

const sanitizeReviews = (reviews: Review[]) => {
  return reviews.map(review => sanitizeReview(review));
};

export { sanitizeReview, sanitizeReviews };
