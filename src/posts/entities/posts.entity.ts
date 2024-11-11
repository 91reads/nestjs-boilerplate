import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { join } from 'path';
import { POST_PUBLIC_IMAGE_PATH } from 'src/common/const/path.const';
import { BaseModel } from 'src/common/entities/base.entity';
import { ImageModel } from 'src/common/entities/image.entity';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class PostsModel extends BaseModel {
  // 1) UsersModel 과 연동한다. Foreign Key 를 이용해서
  // 2) null 이 될 수 없다.
  // 3) 작성자 하나가 여러 포스트를 작성한다.
  @ManyToOne(() => UsersModel, (user) => user.posts, {
    nullable: false,
  })
  author: UsersModel;

  @IsString({
    message: stringValidationMessage,
  })
  @Column()
  title: string;

  @IsString({
    message: stringValidationMessage,
  })
  @Column()
  content: string;

  // @Column({
  //   nullable: true,
  // })
  // @Transform(({ value }) => value && `/${join(POST_PUBLIC_IMAGE_PATH, value)}`)
  // image?: string;

  @Column()
  likeCount: number;

  @Column()
  commentCount: number;

  @OneToMany((type) => ImageModel, (image) => image.post)
  images: ImageModel[];
}
