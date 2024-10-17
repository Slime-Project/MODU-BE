import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class RefreshReq {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  readonly id: bigint;
}
