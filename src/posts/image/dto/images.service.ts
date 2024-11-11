import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ImageModel } from 'src/common/entities/image.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CreatePostImageDto } from './create-image.dto';
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { basename, join } from 'path';
import { promises } from 'fs';

@Injectable()
export class PostsImagesService {
  constructor(
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
  ) {}

  getRepositry(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ImageModel>(ImageModel)
      : this.imageRepository;
  }

  async createPostImage(dto: CreatePostImageDto, queryRunner?: QueryRunner) {
    const repositry = this.getRepositry(queryRunner);

    const tempFilePath = join(TEMP_FOLDER_PATH, dto.path);

    try {
      // 파일이 존재하는지 확인, 존재 안하면 에러를 던짐
      await promises.access(tempFilePath);
    } catch (err) {
      throw new BadRequestException('파일이 존재하지 않습니다.');
    }

    // 파일 이름을 가져옴
    // /Users/aaa/bb/cc/asdf.jpg -> asdf.jpg
    const fileName = basename(tempFilePath);

    const result = await repositry.save({
      ...dto,
    });

    // 파일 옮기기
    // {프로젝트 경로}/public/posts/asdf.jpg
    const newFilePath = join(POST_IMAGE_PATH, fileName);
    await promises.rename(tempFilePath, newFilePath);

    return result;
  }
}
