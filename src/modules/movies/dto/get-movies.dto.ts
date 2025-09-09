import { IsIn, IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMoviesDto {
  @IsNotEmpty({ message: 'Type không được để trống' })
  type: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit phải là một số nguyên' })
  @Min(1, { message: 'Limit tối thiểu là 1' })
  @Max(64, { message: 'Limit tối đa là 64' })
  limit?: number;

  @IsOptional()
  @IsInt({ message: 'Page phải là một số nguyên' })
  @Min(1, { message: 'Page tối thiểu là 1' })
  @Type(() => Number)
  page?: number;
}
