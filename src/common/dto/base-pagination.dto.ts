import { IsIn, IsNumber, IsOptional } from 'class-validator';

export class BasePaginationDto {
  // 이 값이 있다면 무조건 Page 기반
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  where__id__less_than?: number;

  // 이전 마지막 데이터 ID
  // 이 프로퍼에 입력된 ID 보다 높은 ID 부터 값을 가져온다.
  @IsNumber()
  @IsOptional()
  where__id__more_than?: number;

  // 리스트의 값들만 허용된다.
  // 정렬
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/prefer-as-const
  order__createdAt: 'ASC' | 'DESC' = 'ASC';

  // 몇개의 데이터를 응답으로 받을지
  @IsNumber()
  @IsOptional()
  take: number = 20;
}
