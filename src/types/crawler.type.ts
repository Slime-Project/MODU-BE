export type ProductCrawled = {
  id: number;
  title: string;
  body: null | string;
  img?: string;
  link: string;
  price: number;
  seller: string;
  createdAt: Date;
  tags?: number[];
  wishedCount: number;
};
