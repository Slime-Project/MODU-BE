import { Product } from '@prisma/client';

import { ItemsData } from '@/types/common.type';

type Sort = 'sim' | 'date' | 'asc' | 'dsc';

type ProductsData = ItemsData & {
  products: Product[];
};

export { Sort, ProductsData };
