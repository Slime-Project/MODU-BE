type GetTokenRes = {
  token_type: 'bearer';
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
};

type ReissueTokenRes = {
  token_type: 'bearer';
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
};

type KakaoAccount = {
  profile_nickname_needs_agreement: boolean;
  profile_image_needs_agreement: boolean;
  profile: {
    nickname: string;
    thumbnail_image_url: string;
    profile_image_url: string;
    is_default_image: boolean;
    is_default_nickname: boolean;
  };
};

type UserInfoRes = {
  id: number;
  connected_at?: string; // ISO string
  properties: {
    nickname: string;
    profile_image: string;
    thumbnail_image: string;
  };
  kakao_account: KakaoAccount;
};

type UsersRes = {
  id: number;
  connected_at?: string; // ISO string
  kakao_account: KakaoAccount;
}[];

export { GetTokenRes, ReissueTokenRes, UserInfoRes, UsersRes };
