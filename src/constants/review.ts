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

const REVIEWS_PAGE_SIZE = 10;

export { REIVEW_ORDERBY_OPTS, REVIEWS_PAGE_SIZE };
