import { join } from 'path';

// 서버 프로젝트 루프 폴더
export const PROJECT_ROOT_PATH = process.cwd();

// 외부에서 접근 가능한 파일을 모아둔 폴더
export const PUBLIC_FOLDER_NAME = 'public';

// public 폴더
export const POSTS_FOLDER_NAME = 'posts';

// 임시 폴더
export const TEMP_FOLDER_NAME = 'temp';

// 실제 공개 폴더의 절대 경로
// {프로젝트}/public
export const PUBLIC_FOLDER_PATH = join(PROJECT_ROOT_PATH, PUBLIC_FOLDER_NAME);

// 포스트 이미지 저장 폴더
export const POST_IMAGE_PATH = join(PUBLIC_FOLDER_PATH, POSTS_FOLDER_NAME);

// 절대 경로
// /public/posts/xxx.jpg
export const POST_PUBLIC_IMAGE_PATH = join(
  PUBLIC_FOLDER_NAME,
  POSTS_FOLDER_NAME,
);

// 임시 파일들을 저장할 폴더
// {프로젝트경로}/temp
export const TEMP_FOLDER_PATH = join(PUBLIC_FOLDER_PATH, TEMP_FOLDER_NAME);
