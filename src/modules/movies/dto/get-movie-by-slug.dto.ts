import { IsNotEmpty } from 'class-validator';

export class GetMovieBySlugDto {
  @IsNotEmpty({ message: 'Slug không được để trống' })
  slug: string;
}
