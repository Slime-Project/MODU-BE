import { SortOrder } from '@/types/collection.type';

const getOrderBy = (sortOrder: SortOrder) => {
  const orderByLists = {
    [SortOrder.POPULAR]: { wishedCount: 'desc' },
    [SortOrder.LATEST]: { createdAt: 'desc' },
    [SortOrder.OLDEST]: { createdAt: 'asc' }
  } as const;
  return orderByLists[sortOrder];
};

export { getOrderBy };
