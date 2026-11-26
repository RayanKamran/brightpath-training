import 'reflect-metadata';
import {Type} from 'class-transformer';
import {IsInt, IsOptional, Max, Min} from 'class-validator';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from '../constants/constants.js';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PAGE_SIZE)
  page?: number = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PAGE_SIZE)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number = DEFAULT_PAGE_SIZE;
}

export class PagedResponseDto<T> {
  items!: T[];
  page!: number;
  pageSize!: number;
  totalCount!: number;
  totalPages!: number;
}

export function toPagedDto<T>(
  items: T[],
  page: number,
  pageSize: number,
  totalCount: number,
): PagedResponseDto<T> {
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

  return {
    items,
    page,
    pageSize,
    totalCount,
    totalPages,
  };
}
