import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entities/users.entity';
import { HASH_ROUNDS, JWT_SECRET } from './const/auth.const';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 1. 사용자가 로그인 or 회원가입을 진행하면
   *    access, refresh 토큰을 발급 받는다.
   *
   * 2. 로그인 할땐 Basic 토큰과 함께 요청을 보낸다
   *    Basic 토큰은 '이메일:비밀번호' 를 base64 로 인코딩한 형태
   *    예) {authorization: `Basic {token}` }
   *
   * 3. 아무나 접근할 수 없는 정보 private route 접근 시
   *    accessToken 을 Header 에 추가해 요청보낸다.
   *    예) {authorization: `Bearer {token}` }
   *
   * 4. 토큰과 요청을 함께 받은 서버는 토큰 검증을 통해 현재 요청을 보낸
   *    사용자가 누구인지 알 수 있다.
   *
   *    예를 들어 현재 로그인한 사용자가 작성한 포스트만 가져오려면
   *    토큰의 sub 값에 입력된 사용자 포스트만 필터링 할 수 있다.
   *
   *    특정 사용자 토큰이 없다면 다른 사용자 데이터에 접근 못한다.
   *
   * 5. 모든 토큰은 만료 기간이 있다. 만료 기간이 지나면 새로 토큰을 발급 받는다.
   *    그렇지 않으면 jwtService.verify()에서 인증이 통과 안된다.
   */

  /**
   * 1. registerWithEmail
   *    - email, nickname, password
   *    - 생성 완료시 accessToken, refreshToken 반환
   *      회원가입 후 로그인 <- 쓸데 없는 과정을 방지하기 위해
   *
   * 2. loginWithEmail
   *    - email, password 를 받으면 사용자 검증을 진행한다.
   *    - 검증 완료 후 accessToken 과 refreshToken 을 반환
   *
   * 3. loginUser
   *    - 1, 2에서 필요한 accessToken 과 refreshToken 을 반환하는 로직
   *
   * 4. signToken
   *    - 3에서 필요한 accessToken 과 refreshToken 을 sign 하는 로직
   *
   * 5. authenticationWithEmailAndPassword
   *    - 2에서 필요한 기본적인 검증 진행
   *      1) 사용자가 존재하는지 확인 (email)
   *      2) 비밀번호가 맞는지 확인
   *      3) 통과되면 사용자 정보 반환
   *      4) loginWithEmail 에서 반환된 데이터 기반으로 토큰 생성
   */

  extractTokenFromHeader(header: string, isBearer: boolean) {
    const splitToken = header.split(' ');
    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('잘못된 토큰입니다.');
    }

    const token = splitToken[1];
    return token;
  }

  decodeBasicToken(base64String: string) {
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');
    const split = decoded.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
    }

    const email = split[0];
    const password = split[1];

    return { email, password };
  }

  /**
   * 토큰 검증
   */
  verifyToken(token: string) {
    return this.jwtService.verify(token, {
      secret: JWT_SECRET,
    });
  }

  rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.jwtService.verify(token, {
      secret: JWT_SECRET,
    });

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰 재발급은 Refresh 토큰으로만 가능합니다.',
      );
    }

    return this.signToken(
      {
        ...decoded,
      },
      isRefreshToken,
    );
  }

  async registerWithEmail(
    user: Pick<UsersModel, 'nickname' | 'email' | 'password'>,
  ) {
    const hash = await bcrypt.hash(user.password, HASH_ROUNDS);

    const newUser = await this.usersService.createUser({
      ...user,
      password: hash,
    });

    return this.loginUser(newUser);
  }

  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    const existingUser = await this.authenticationWithEmailAndPassword(user);
    return this.loginUser(existingUser);
  }

  /**
   *  1) 사용자가 존재하는지 확인 (email)
   *  2) 비밀번호가 맞는지 확인
   *  3) 통과되면 사용자 정보 반환
   *  4) loginWithEmail 에서 반환된 데이터 기반으로 토큰 생성
   */
  async authenticationWithEmailAndPassword(
    user: Pick<UsersModel, 'email' | 'password'>,
  ) {
    const existingUser = await this.usersService.getUserByEmail(user.email);

    if (!existingUser) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }

    const isPass = await bcrypt.compare(user.password, existingUser.password);

    if (!isPass) {
      throw new UnauthorizedException('패스워드가 틀렸습니다.');
    }

    return existingUser;
  }

  /**
   * payload 정보
   * 1. email
   * 2. sub -> 사용자의 id
   * 3. type: 'access' | 'refresh'
   */
  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }
}
