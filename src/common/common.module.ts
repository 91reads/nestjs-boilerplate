import { BadRequestException, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
//
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import { TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { v4 as uuid } from 'uuid';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
@Module({
  imports: [
    AuthModule,
    UsersModule,
    MulterModule.register({
      limits: {
        fileSize: 10000000, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname);

        if (
          ext !== '.png' &&
          ext !== '.jpg' &&
          ext !== '.gif' &&
          ext !== '.jpeg'
        ) {
          return cb(new BadRequestException('Only images are allowed!'), false);
        }
        return cb(null, true);
      },
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, TEMP_FOLDER_PATH);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname);
          cb(null, `${uuid()}${ext}`);
        },
      }),
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
