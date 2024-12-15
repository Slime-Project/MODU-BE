import { Product } from '@prisma/client';

import { ItemsData } from '@/types/common.type';

type WishlistProductsData = ItemsData & {
  products: Product[];
};

export { WishlistProductsData };
