import { Expose, Transform } from 'class-transformer';

export class NaverProductDto {
  @Transform(({ value }) => value.replace(/<[^>]+>/g, ''))
  @Expose()
  readonly title: string;

  @Expose({ name: 'image' })
  readonly img: string;

  @Expose()
  readonly link: string;

  @Expose({ name: 'lprice' })
  @Transform(({ value }) => parseInt(value))
  readonly price: number;

  @Expose({ name: 'mallName' })
  readonly seller: string;

  @Expose({ name: 'productId' })
  readonly naverProductId: string;
}
