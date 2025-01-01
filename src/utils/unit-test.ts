import { Auth, Product, Review, ReviewImg, UserRole, WishlistItem } from '@prisma/client';

import { AuthService } from '@/auth/auth.service';
import { PRODUCTS_PAGE_SIZE } from '@/constants/page';

import { ReviewIncludeImgs, ReviewIncludeImgsUrl, ReviewWithImgs } from '@/types/review.type';
import { UserInfo } from '@/types/user.type';

const mockUser: UserInfo = {
  id: '1',
  role: UserRole.USER,
  nickname: 'nickname',
  profileImg: 'url'
};
const mockAuth: Auth = {
  id: 1,
  userId: mockUser.id,
  refreshToken: 'refreshToken',
  kakaoAccessToken: 'kakaoAccessToken',
  kakaoRefreshToken: 'kakaoRefreshToken',
  refreshTokenExp: AuthService.getExpDate(604800000)
};
const mockProduct: Product = {
  id: 1,
  naverProductId: '1',
  title: 'title',
  body: null,
  img: 'url',
  link: 'url',
  price: 2000,
  seller: '네이버',
  wishedCount: 0,
  createdAt: new Date(),
  averageRating: 0
};
const reviewMock: Review = {
  id: 1,
  userId: mockUser.id,
  productId: mockProduct.id,
  text: '',
  rating: 2,
  createdAt: new Date()
};
const reviewIncludeImgsUrlMock: ReviewIncludeImgsUrl = {
  ...reviewMock,
  imgs: []
};

const reviewImgMock: ReviewImg = {
  id: 1,
  url: 'test.com/review/1/1.png',
  filePath: 'review/1/1.png',
  order: 1,
  reviewId: 1
};
const reviewImgsMock: ReviewImg[] = [
  reviewImgMock,
  {
    id: 2,
    url: 'test.com/review/1/2.png',
    filePath: 'review/1/2.png',
    order: 2,
    reviewId: 1
  },
  {
    id: 3,
    url: 'test.com/review/1/3.png',
    filePath: 'review/1/3.png',
    order: 3,
    reviewId: 1
  }
];

const reviewMockWithImgs: ReviewWithImgs = {
  ...reviewMock,
  imgs: []
};

const reviewIncludeImgsMock: ReviewIncludeImgs = { ...reviewMock, imgs: [reviewImgMock] };

const fileMock: Express.Multer.File = {
  fieldname: 'imgs',
  originalname: 'test.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from(''),
  size: 1000,
  stream: null,
  destination: '',
  filename: '',
  path: ''
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

export {
  mockAuth,
  mockProduct,
  getMockWishlistItem,
  mockNaverRes,
  reviewMock,
  reviewMockWithImgs,
  reviewIncludeImgsMock,
  reviewIncludeImgsUrlMock,
  reviewImgMock,
  reviewImgsMock,
  mockUser,
  fileMock
};
