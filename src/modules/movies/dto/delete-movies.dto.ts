import { IsArray, IsMongoId } from 'class-validator';

export class DeleteMoviesDto {
  @IsArray()
  @IsMongoId({ each: true, message: 'id không đúng định dạng' })
  ids: string[];
}
