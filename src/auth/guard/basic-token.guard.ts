/**
 * 1. 요청 객체(request)를 받아서
 *    authorization header 로 토큰을 가져온다.
 *
 * 2. authService.extractTokenFormheader 를 이용해서
 *    사용할 수 있는 형태의 토큰을 추출한다.
 *
 * 3. authService.decodeBasicToken 을 실행해서
 *    email과 password를 추출한다.
 *
 * 4. email과 password를 이용해서 사용자를 가져온다.
 *    authService.authenticationWithEamilAndPassword
 *
 * 5. 찾아낸 사용자를 [1] 요청 객체에 붙여준다.
 *    req.user = user;
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class BasicTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // {authorization: 'Basic asdfdsasdfsa'}
    const rawToken = req.headers['authorization'];

    if (!rawToken) {
      throw new UnauthorizedException('토큰이 없습니다!');
    }

    const token = this.authService.extractTokenFromHeader(rawToken, false);

    const { email, password } = this.authService.decodeBasicToken(token);

    const user = await this.authService.authenticationWithEmailAndPassword({
      email,
      password,
    });

    req.user = user;

    return true;
  }
}
