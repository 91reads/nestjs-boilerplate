import { Injectable, NotFoundException } from '@nestjs/common';

export interface PostModel {
  id: number;
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

let posts: PostModel[] = [
  {
    id: 1,
    author: 'newjeans_official',
    title: '뉴진스 민지',
    content: '메컵 고치는 민지',
    likeCount: 10000,
    commentCount: 49998,
  },
  {
    id: 2,
    author: 'newjeans_official',
    title: '매니저',
    content: '촬영하는 매니저',
    likeCount: 6592,
    commentCount: 9218,
  },
  {
    id: 3,
    author: 'blackpink_official',
    title: '로제',
    content: '공연하는로제',
    likeCount: 11112,
    commentCount: 54512,
  },
];

@Injectable()
export class PostsService {
  getAllPosts() {
    return posts;
  }

  getPostById(id: number) {
    const post = posts.find((post) => post.id === +id);

    if (!post) throw new NotFoundException('찾지 못했습니다.');

    return post;
  }

  createPost(author: string, title: string, content: string) {
    const post: PostModel = {
      id: posts[posts.length - 1].id + 1,
      author,
      title,
      content,
      likeCount: 0,
      commentCount: 0,
    };

    posts = [...posts, post];

    return post;
  }

  updatePost(id: number, author: string, title: string, content: string) {
    const post = posts.find((post) => post.id === +id);

    if (!post) {
      throw new NotFoundException();
    }

    if (author) {
      post.author = author;
    }

    if (title) {
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    posts = posts.map((prevPost) => (prevPost.id === +id ? post : prevPost));
    return post;
  }

  deletePost(id: number) {
    const post = posts.find((post) => post.id === +id);

    if (!post) {
      throw new NotFoundException();
    }

    posts = posts.filter((post) => post.id !== +id);
    return id;
  }
}
