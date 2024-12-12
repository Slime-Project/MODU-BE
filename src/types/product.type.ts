import { Product } from '@prisma/client';

import { PRODUCTS_PAGE_SIZE } from '@/constants/product';

type Sort = 'sim' | 'date' | 'asc' | 'dsc';

type ProductsData = {
  products: Product[];
  pageSize: typeof PRODUCTS_PAGE_SIZE;
  totalProducts: number;
  totalPages: number;
};

export { Sort, ProductsData };
