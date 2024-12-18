export type ProductCrawled = {
  id: number;
  title: string;
  img?: string;
  link: string;
  price: number;
  seller: string;
  createdAt: Date;
  tags?: number[];
  wishedCount: number;
};
