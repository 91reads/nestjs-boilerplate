import { BadRequestException, Injectable } from '@nestjs/common';
import { BasePaginationDto } from './dto/base-pagination.dto';
import {
  FindManyOptions,
  FindOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseModel } from './entities/base.entity';
import { FILTER_MAPPER } from './const/filter-mapper.const';

@Injectable()
export class CommonService {
  paginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T>,
    path: string,
  ) {
    if (dto.page) {
      return this.pagePaginate(dto, repository, overrideFindOptions);
    } else {
      return this.cursorPaginate(dto, repository, overrideFindOptions, path);
    }
  }

  private async pagePaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T>,
  ) {}

  private async cursorPaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T>,
    path: string,
  ) {
    /**
     * where__liko__count_more_than
     *
     * where__title__ilike
     */
    const findOptions = this.composeFindOptions<T>(dto);
  }

  private composeFindOptions<T extends BaseModel>(
    dto: BasePaginationDto,
  ): FindManyOptions<T> {
    /**
     * where
     * order,
     * take
     * skip -> page 기반일 때만
     */
    //
    /**
     * DTO 현재 구조
     * {
     *    where__id__more_than: 1,
     *    order__createdAt: 'ASC',
     * }
     *
     * 현재 where__id__more_than / where__id__less_than 해당되는 where 필터만 사용중인데
     * 나중에 where__likeCount__more_than 이나 where__title__ilike 등 추가 필터를 넣을 떄
     * 모든 where 필터들을 자동 피싱 할 수 있어야 한다.
     *
     * 1. where 로 시작하면 필터 로직
     * 2. order 로 시작하면 정렬 로직
     * 3. 필터 로직을 적용하면 '__' 기준으로 split 했을 때 3개 값으로 나뉘는지, 2개로 나뉘는지
     *  3-1. 3개의 값으로 나눈다면 FILTER_MAPPER 에 해당되는 operator 함수를 찾아 적용
     *        ['where', 'id', 'more_than]
     *  3-2. 2개 값으로 나눈다면 정확한 값을 필터하는 것이니 operator 없이 적용
     *        ['where', 'id']
     * 4. order 의 경우 3-2로 적용한다.
     */
    let where: FindOptionsWhere<T> = {};
    let order: FindOptionsOrder<T> = {};

    for (const [key, value] of Object.entries(dto)) {
      // key -> where__id__less_than
      // value -> 1

      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseWhereFilter(key, value),
        };
      } else if (key.startsWith('order__')) {
        order = {
          ...order,
          ...this.parseWhereFilter(key, value),
        };
      }
    }

    return {
      where,
      order,
      take: dto.take,
      skip: dto.page ? dto.take * (dto.page - 1) : null,
    };
  }

  private parseWhereFilter<T extends BaseModel>(
    key: string,
    value: any,
  ): FindOptionsWhere<T> | FindOptionsOrder<T> {
    const options: FindOptionsWhere<T> = {};

    /**
     * 예를들어 where__id__more_than 을 __ 기준으로 나누면
     * ['where', 'id', 'more_than']으로 나눌 수 있다.
     */

    const split = key.split('__');

    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException(
        `where 필터는 '__'로 split 했을 때 길이가 2 혹은 3이어야 합니다. - 문제되는 키값: ${key}`,
      );
    }

    /**
     * 길이가 2일 경우
     * where__id = 3
     *
     * FindOptionsWhere 로 풀면
     * 아래와 같다.
     *
     * {
     *    where: {
     *        id:3,
     *    }
     * }
     */
    if (split.length === 2) {
      // ['where', 'id']
      const [_, field] = split;

      /**
       * field -> 'id'
       * value -> 3
       */
      options[field] = value;
    } else {
      /**
       * 길이가 3일 경우 TypeORM 유틸리티 적용이 필요하다.
       *
       * where__id__more_than 의 경우 where 는 버려도 되고
       * 두번째 값은 필터할 키 값
       * 세번째 값은 typeorm 유틸리티가 된다.
       *
       * FILTER_MAPPER 에 미리 정의해둔 값으로 field 값에 FILTER_MAPPER 에 해당되는 유틸리티를
       * 가져온 후 값에 적용한다.
       */

      // ['where', 'id', 'more_than']
      const [_, field, operator] = split;

      // where__id__between = 3,4
      // split 대상 문자가 존재하지 않으면 길이가 무조건 1이다.
      // const values = value.toString().split(',');

      // 인자값이 두개일 때
      // if (operator === 'between') {
      //   options[field] = FILTER_MAPPER[operator](values[0], values[1]);
      // } else {
      //   options[field] = FILTER_MAPPER[operator](value);
      // }

      // filed -> id
      // operator -> more_than
      // FILTER_MAPPER[operator] -> MoreThan 함수
      options[field] = FILTER_MAPPER[operator](value);
    }

    return options;
  }
}
