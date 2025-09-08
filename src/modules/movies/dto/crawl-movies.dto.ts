import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CrawlMoviesDto {
  @IsOptional()
  @IsInt({ message: 'Limit phải là một số nguyên' })
  @Type(() => Number)
  @Min(1, { message: 'Limit tối thiểu là 1' })
  @Max(50, { message: 'Limit tối đa là 50' })
  limit?: number;

  @IsOptional()
  @IsIn(['create', 'update'], { message: 'Type phải là create hoặc update' })
  type?: string;
}
