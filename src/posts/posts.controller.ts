import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { ImageModelType } from 'src/common/entities/image.entity';
import { DataSource } from 'typeorm';
import { PostsImagesService } from './image/dto/images.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postsImagesService: PostsImagesService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getPosts(@Query() query: PaginatePostDto) {
    return this.postsService.paginatePosts(query);
  }

  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  async postPosts(@User('id') userId: number, @Body() body: CreatePostDto) {
    // 포스트는 생성하는데, 이미지 생성 때 오류가 발생하면
    // 포스트는 올라가는데, 이미지가 안올라가면 유저가 당황할 수 있다.
    // 그럴 때 transaction 으로 처리하면 좋다.

    // 트랜잭션과 관련된 모든 쿼리를 담당할 쿼리 러너 생성
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      const post = await this.postsService.createPost(
        userId,
        body,
        queryRunner,
      );

      for (let i = 0; i < body.images.length; i++) {
        await this.postsImagesService.createPostImage(
          {
            post,
            order: i,
            path: body.images[i],
            type: ImageModelType.POST_IMAGE,
          },
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return this.postsService.getPostById(post.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw new BadRequestException(error);
    }
  }

  @Patch(':id')
  patchPosts(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, body);
  }

  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
