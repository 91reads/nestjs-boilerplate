// Data Transper Object

import { PickType } from '@nestjs/mapped-types';
import { PostsModel } from '../entities/posts.entity';
import { IsOptional, IsString } from 'class-validator';
// Pick, Omit, Partial -> Type 반환
// PickType, OmitType, PartialType -> 값을 반환
export class CreatePostDto extends PickType(PostsModel, ['title', 'content']) {
  @IsString({
    each: true, // list 안의 값이 문자열인지 확인
  })
  @IsOptional()
  images: string[];
}
