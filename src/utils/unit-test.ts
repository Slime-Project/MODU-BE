import { Auth, Product, Review, ReviewImg, UserRole, WishlistItem } from '@prisma/client';

import { AuthService } from '@/auth/auth.service';
import { PRODUCTS_PAGE_SIZE } from '@/constants/page';
import { REVIEW_IMGS_PAGE_SIZE } from '@/constants/review-img';
import { KaKaoUserInfoDto } from '@/kakao/login/dto/kakao-user-info.dto';

import { UserInfoRes, UsersRes } from '@/types/kakao.type';
import {
  ReviewImgsData,
  ReviewImgWithReview,
  ReviewImgWithReviewAndReviewer
} from '@/types/review-img.type';
import {
  ReviewIncludeImgs,
  ReviewIncludeImgsUrl,
  ReviewWithImgs,
  ReviewWithReviewer
} from '@/types/review.type';
import { Profile, UserInfo } from '@/types/user.type';

const kakaoUsersResMock: UsersRes = [
  {
    id: 1,
    connected_at: new Date().toISOString(),
    kakao_account: {
      profile_nickname_needs_agreement: false,
      profile_image_needs_agreement: false,
      profile: {
        nickname: 'nickname',
        thumbnail_image_url: 'url',
        profile_image_url: 'url',
        is_default_image: true,
        is_default_nickname: false
      }
    }
  }
];

const kakaoUserInfoResMock: UserInfoRes = {
  ...kakaoUsersResMock[0],
  properties: {
    nickname: 'nickname',
    profile_image: 'url',
    thumbnail_image: 'url'
  }
};

const kakaoUserInfoDtoMock: KaKaoUserInfoDto = {
  id: kakaoUserInfoResMock.id.toString(),
  nickname: kakaoUserInfoResMock.properties.nickname,
  profileImg: kakaoUserInfoResMock.properties.profile_image
};

const profileMock: Profile = {
  nickname: kakaoUserInfoDtoMock.nickname,
  profileImg: kakaoUserInfoDtoMock.profileImg
};

const mockUser: UserInfo = {
  id: kakaoUserInfoDtoMock.id,
  role: UserRole.USER,
  ...profileMock
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

const reviewMockWithImgs: ReviewWithImgs = {
  ...reviewMock,
  imgs: []
};

const reviewWithReviewerMock: ReviewWithReviewer = {
  ...reviewMockWithImgs,
  reviewer: profileMock
};

const reviewImgMock: ReviewImg = {
  id: 1,
  url: 'test.com/review/1/1.png',
  filePath: 'review/1/1.png',
  order: 1,
  reviewId: 1
};

const reviewImgWithReviewMock: ReviewImgWithReview = {
  ...reviewImgMock,
  review: reviewMock
};

const reviewImgWithReviewAndReviewerMock: ReviewImgWithReviewAndReviewer = {
  ...reviewImgMock,
  review: {
    ...reviewMock,
    reviewer: profileMock
  }
};

const reviewImgsDataMock: ReviewImgsData = {
  reviewImgs: [reviewImgWithReviewAndReviewerMock],
  pageSize: REVIEW_IMGS_PAGE_SIZE,
  total: 1,
  totalPages: 1
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
  kakaoUsersResMock,
  kakaoUserInfoResMock,
  mockAuth,
  mockProduct,
  getMockWishlistItem,
  mockNaverRes,
  reviewMock,
  reviewMockWithImgs,
  reviewIncludeImgsMock,
  reviewWithReviewerMock,
  reviewIncludeImgsUrlMock,
  reviewImgMock,
  reviewImgsMock,
  reviewImgWithReviewMock,
  reviewImgWithReviewAndReviewerMock,
  reviewImgsDataMock,
  mockUser,
  kakaoUserInfoDtoMock,
  fileMock
};
