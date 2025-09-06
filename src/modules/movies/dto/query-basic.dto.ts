import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryBasicDto {
  @IsOptional()
  @IsInt({ message: 'Limit phải là một số nguyên' })
  @Min(1, { message: 'Limit tối thiểu là 1' })
  @Max(64, { message: 'Limit tối đa là 64' })
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsInt({ message: 'Page phải là một số nguyên' })
  @Min(1, { message: 'Page tối thiểu là 1' })
  @Type(() => Number)
  page?: number;
}
