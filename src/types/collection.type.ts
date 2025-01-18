import { GiftCollection } from '@prisma/client';

type CreateGiftCollection = {
  title: string;
  userId: string | null;
  imgId: number;
  products?: {
    create?: {
      productId: number;
    }[];
  };
  tags?: {
    create?: {
      tagId: number;
    }[];
  };
};

type CollectionWithImg = GiftCollection & {
  img: string;
  products: {
    productId: number;
  }[];
  tags: {
    tagId: number;
  }[];
};

interface UpdateGiftCollection {
  title?: string;
  tags?: {
    deleteMany?: {
      tagId: {
        in: number[];
      };
    };
    create?: {
      tagId: number;
    }[];
  };
  products?: {
    deleteMany?: {
      productId: {
        in: number[];
      };
    };
    create?: {
      productId: number;
    }[];
  };
}

export { CreateGiftCollection, CollectionWithImg, UpdateGiftCollection };
