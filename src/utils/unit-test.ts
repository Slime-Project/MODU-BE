import { Auth, Product, Review, WishlistItem } from '@prisma/client';

import { AuthService } from '@/auth/auth.service';
import { PRODUCTS_PAGE_SIZE } from '@/constants/product';

const getMockAuth = () => {
  const auth: Auth = {
    id: 1,
    userId: '1234567890',
    refreshToken: 'refreshToken',
    kakaoAccessToken: 'kakaoAccessToken',
    kakaoRefreshToken: 'kakaoRefreshToken',
    refreshTokenExp: AuthService.getExpDate(604800000)
  };
  return auth;
};

const getMockReview = () => {
  const review: Review = {
    id: 1,
    productId: 1,
    userId: '1234567890',
    text: '',
    rating: 2,
    createdAt: new Date()
  };
  return review;
};

const getMockProduct = () => {
  const product: Product = {
    id: 1,
    naverProductId: '1',
    title: 'title',
    body: null,
    img: 'url',
    link: 'url',
    price: 2000,
    seller: '네이버',
    likedCount: 0,
    createdAt: new Date()
  };
  return product;
};

const getMockWishlistItem = (
  userId: string,
  productId: number | null = null,
  giftCollectionId: number | null = null
) => {
  const mockWishlistItem: WishlistItem = {
    id: 1,
    userId,
    productId,
    giftCollectionId
  };
  return mockWishlistItem;
};

const mockNaverRes = {
  lastBuildDate: new Date().toISOString(),
  total: 1,
  start: 1,
  display: PRODUCTS_PAGE_SIZE,
  items: [
    {
      title: '이케아<b>조명</b> 테르티알 책상전등 <b>스탠드</b> <b>조명</b> LED 고정',
      link: 'https://smartstore.naver.com/main/products/4707928457',
      image: 'https://shopping-phinf.pstatic.net/main_8225244/82252449479.1.jpg',
      lprice: '25800',
      hprice: '',
      mallName: '빅코스트몰',
      productId: '82252449479',
      productType: '2',
      brand: '이케아',
      maker: '이케아',
      category1: '가구/인테리어',
      category2: '인테리어소품',
      category3: '스탠드',
      category4: '단스탠드'
    }
  ]
};

export { getMockAuth, getMockReview, getMockProduct, getMockWishlistItem, mockNaverRes };
