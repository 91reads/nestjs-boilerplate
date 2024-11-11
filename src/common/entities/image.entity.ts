import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseModel } from './base.entity';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { join } from 'path';
import { POST_IMAGE_PATH, POST_PUBLIC_IMAGE_PATH } from '../const/path.const';
import { PostsModel } from 'src/posts/entities/posts.entity';

export enum ImageModelType {
  POST_IMAGE,
}

@Entity()
export class ImageModel extends BaseModel {
  @Column({
    default: 0,
  })
  @IsInt()
  @IsOptional()
  order: number;

  // UsersModel -> 사용자 프로필
  // PostsModel -> 포스트 이미지
  @Column({ enum: ImageModelType })
  @IsEnum(ImageModelType)
  @IsString()
  type: ImageModelType;

  @Column()
  @IsString()
  @Transform(({ value, obj }) => {
    if (obj.type === ImageModelType.POST_IMAGE) {
      return `/${join(POST_PUBLIC_IMAGE_PATH, value)}`;
    }
  })
  path: string;

  // 여러개의 이미지가 하나의 포스트에 연동
  @ManyToOne((type) => PostsModel, (post) => post.images, {
    nullable: true,
  })
  post?: PostsModel;
}
