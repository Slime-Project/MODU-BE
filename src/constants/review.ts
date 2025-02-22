import { MimeType } from '@/types/file.type';
import { OrderByOpts } from '@/types/review.type';

const REIVEW_ORDERBY_OPTS: OrderByOpts = {
  createdAt: {
    desc: [{ createdAt: 'desc' }, { id: 'desc' }],
    asc: [{ createdAt: 'asc' }, { id: 'desc' }]
  },
  rating: {
    desc: [{ rating: 'desc' }, { id: 'desc' }],
    asc: [{ rating: 'asc' }, { id: 'desc' }]
  }
};
const REVIEW_ORDER_BY_DEFAULT = REIVEW_ORDERBY_OPTS.rating.desc;

const REVIEWS_PAGE_SIZE = 10;
const REVIEW_IMG_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const REVIEW_ALLOWED_MIME_TYPE: MimeType[] = ['image/jpeg', 'image/png'];

export {
  REIVEW_ORDERBY_OPTS,
  REVIEW_ORDER_BY_DEFAULT,
  REVIEWS_PAGE_SIZE,
  REVIEW_IMG_SIZE_LIMIT,
  REVIEW_ALLOWED_MIME_TYPE
};
