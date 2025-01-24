import { Product } from '@prisma/client';

import { ItemsData } from '@/types/common.type';

type Sort = 'sim' | 'date' | 'asc' | 'dsc';

type ProductsData = ItemsData & {
  products: Product[];
};

type ProductThumbnailData = Pick<Product, 'id' | 'img' | 'title' | 'price' | 'seller'>;

export { Sort, ProductsData, ProductThumbnailData };
