export type Categories =
  | 'hanh-dong'
  | 'lich-su'
  | 'co-trang'
  | 'chien-tranh'
  | 'vien-tuong'
  | 'kinh-di'
  | 'tai-lieu'
  | 'bi-an'
  | 'phim-18'
  | 'tinh-cam'
  | 'tam-ly'
  | 'the-thao'
  | 'phieu-luu'
  | 'am-nhac'
  | 'gia-dinh'
  | 'hoc-duong'
  | 'hai-huoc'
  | 'hinh-su'
  | 'vo-thuat'
  | 'khoa-hoc'
  | 'than-thoai'
  | 'chinh-kich'
  | 'kinh-dien';

export type Countries =
  | 'viet-nam'
  | 'trung-quoc'
  | 'thai-lan'
  | 'hong-kong'
  | 'phap'
  | 'duc'
  | 'ha-lan'
  | 'mexico'
  | 'thuy-dien'
  | 'philippines'
  | 'dan-mach'
  | 'thuy-si'
  | 'ukraina'
  | 'han-quoc'
  | 'au-my'
  | 'an-do'
  | 'canada'
  | 'tay-ban-nha'
  | 'indonesia'
  | 'ba-lan'
  | 'malaysia'
  | 'bo-dao-nha'
  | 'uae'
  | 'chau-phi'
  | 'a-rap-xe-ut'
  | 'nhat-ban'
  | 'dai-loan'
  | 'anh'
  | 'quoc-gia-khac'
  | 'tho-nhi-ky'
  | 'nga'
  | 'uc'
  | 'brazil'
  | 'y'
  | 'na-uy';

export type MovieType =
  | 'phim-le'
  | 'phim-bo'
  | 'phim-chieu-rap'
  | 'hoat-hinh'
  | 'tv-shows'
  | 'phim-vietsub'
  | 'phim-thuyet-minh'
  | 'phim-long-tieng'
  | 'subteam'
  | 'latest';

export const CountriesArray: Countries[] = [
  'viet-nam',
  'trung-quoc',
  'thai-lan',
  'hong-kong',
  'phap',
  'duc',
  'ha-lan',
  'mexico',
  'thuy-dien',
  'philippines',
  'dan-mach',
  'thuy-si',
  'ukraina',
  'han-quoc',
  'au-my',
  'an-do',
  'canada',
  'tay-ban-nha',
  'indonesia',
  'ba-lan',
  'malaysia',
  'bo-dao-nha',
  'uae',
  'chau-phi',
  'a-rap-xe-ut',
  'nhat-ban',
  'dai-loan',
  'anh',
  'quoc-gia-khac',
  'tho-nhi-ky',
  'nga',
  'uc',
  'brazil',
  'y',
  'na-uy',
] as const;

export const CategoriesArray: Categories[] = [
  'hanh-dong',
  'lich-su',
  'co-trang',
  'chien-tranh',
  'vien-tuong',
  'kinh-di',
  'tai-lieu',
  'bi-an',
  'tinh-cam',
  'phim-18',
  'tam-ly',
  'the-thao',
  'phieu-luu',
  'am-nhac',
  'gia-dinh',
  'hoc-duong',
  'hai-huoc',
  'hinh-su',
  'vo-thuat',
  'khoa-hoc',
  'than-thoai',
  'chinh-kich',
  'kinh-dien',
] as const;
