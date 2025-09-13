import { Category, Country, MovieType } from '../types/movie.type';

export const MOVIE_TYPE: MovieType[] = [
  'phim-le',
  'phim-bo',
  'phim-chieu-rap',
  'hoat-hinh',
  'tv-shows',
  'phim-vietsub',
  'phim-thuyet-minh',
  'phim-long-tieng',
];

export const titlePageMapping: Partial<
  Record<MovieType | Country | Category, any>
> = {
  'phim-le': 'Phim lẻ',
  'phim-bo': 'Phim bộ',
  'phim-chieu-rap': 'Phim chiếu rạp',
  'hoat-hinh': 'Phim hoạt hình',
  subteam: 'Phim độc quyền',
  'tv-shows': 'Chương trình truyền hình',
  'phim-vietsub': 'Phim phụ đề',
  'phim-thuyet-minh': 'Phim thuyết minh',
  'phim-long-tieng': 'Phim lồng tiếng',
  'viet-nam': 'Phim Việt Nam',
  'trung-quoc': 'Phim Trung Quốc',
  'thai-lan': 'Phim Thái Lan',
  'hong-kong': 'Phim Hồng Kông',
  phap: 'Phim Pháp',
  duc: 'Phim Đức',
  'ha-lan': 'Phim Hà Lan',
  mexico: 'Phim Mexico',
  'thuy-dien': 'Phim Thụy Điển',
  philippines: 'Phim Philippines',
  'dan-mach': 'Phim Đan Mạch',
  'thuy-si': 'Phim Thụy Sĩ',
  ukraina: 'Phim Ukraina',
  'han-quoc': 'Phim Hàn Quốc',
  'au-my': 'Phim Âu Mỹ',
  'an-do': 'Phim Ấn Độ',
  canada: 'Phim Canada',
  'tay-ban-nha': 'Phim Tây Ban Nha',
  indonesia: 'Phim Indonesia',
  'ba-lan': 'Phim Ba Lan',
  malaysia: 'Phim Malaysia',
  'bo-dao-nha': 'Phim Bồ Đào Nha',
  uae: 'Phim UAE',
  'chau-phi': 'Phim Châu Phi',
  'a-rap-xe-ut': 'Phim Ả Rập Xê Út',
  'nhat-ban': 'Phim Nhật Bản',
  'dai-loan': 'Phim Đài Loan',
  anh: 'Phim Anh',
  'quoc-gia-khac': 'Phim quốc gia khác',
  'tho-nhi-ky': 'Phim Thổ Nhĩ Kỳ',
  nga: 'Phim Nga',
  uc: 'Phim Úc',
  brazil: 'Phim Brazil',
  y: 'Phim Ý',
  'na-uy': 'Phim Na Uy',
  'hanh-dong': 'Phim Hành Động',
  'lich-su': 'Phim Lịch Sử',
  'co-trang': 'Phim Cổ Trang',
  'chien-tranh': 'Phim Chiến Tranh',
  'vien-tuong': 'Phim Viễn Tưởng',
  'kinh-di': 'Phim Kinh Dị',
  'tai-lieu': 'Phim Tài Liệu',
  'bi-an': 'Phim Bí Ẩn',
  'phim-18': 'Phim 18+',
  'tinh-cam': 'Phim Tình Cảm',
  'tam-ly': 'Phim Tâm Lý',
  'the-thao': 'Phim Thể Thao',
  'phieu-luu': 'Phim Phiêu Lưu',
  'am-nhac': 'Phim Âm Nhạc',
  'gia-dinh': 'Phim Gia Đình',
  'hoc-duong': 'Phim Học Đường',
  'hai-huoc': 'Phim Hài Hước',
  'hinh-su': 'Phim Hình Sự',
  'vo-thuat': 'Phim Võ Thuật',
  'khoa-hoc': 'Phim Khoa Học',
  'than-thoai': 'Phim Thần Thoại',
  'chinh-kich': 'Phim Chính Kịch',
  'kinh-dien': 'Phim Kinh Điển',
};

export const CountriesArray: Country[] = [
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

export const LanguagesArray = ['long-tieng', 'thuyet-minh', 'vietsub'] as const;

export const CategoriesArray: Category[] = [
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

// Object.fromEntries() giúp chuyển đổi một mảng các cặp [key, value] thành một đối tượng.
// Vd: Object.fromEntries([['key1', 'value1'], ['key2', 'value2']]) => { key1: 'value1', key2: 'value2' }
// Partial<Record<...>> giúp định nghĩa kiểu cho đối tượng kết quả.
// Object.entries(titlePageMapping) lấy tất cả các cặp [key, value] từ đối tượng titlePageMapping.
// Vd: Object.entries({ a: 1, b: 2 }) => [['a', 1], ['b', 2]]

export const generateMetaData: Partial<
  Record<MovieType | Country | Category, any>
> = Object.fromEntries(
  Object.entries(titlePageMapping).map(([key, title]) => [
    key,
    {
      title: `${title} - Xem phim online miễn phí`,
      description: `Xem ngay ${title} chất lượng cao, cập nhật nhanh nhất tại PHOFLIX-V3.`,
    },
  ]),
);

export const CountriesArrayWithAll: {
  id: string;
  name: string;
  slug: Country;
}[] = [
  {
    id: 'f6ce1ae8b39af9d38d653b8a0890adb8',
    name: 'Việt Nam',
    slug: 'viet-nam',
  },
  {
    id: '3e075636c731fe0f889c69e0bf82c083',
    name: 'Trung Quốc',
    slug: 'trung-quoc',
  },
  {
    id: 'cefbf1640a17bad1e13c2f6f2a811a2d',
    name: 'Thái Lan',
    slug: 'thai-lan',
  },
  {
    id: 'dcd5551cbd22ea2372726daafcd679c1',
    name: 'Hồng Kông',
    slug: 'hong-kong',
  },
  {
    id: '92f688188aa938a03a61a786d6616dcb',
    name: 'Pháp',
    slug: 'phap',
  },
  {
    id: '24a5bf049aeef94ab79bad1f73f16b92',
    name: 'Đức',
    slug: 'duc',
  },
  {
    id: '41487913363f08e29ea07f6fdfb49a41',
    name: 'Hà Lan',
    slug: 'ha-lan',
  },
  {
    id: '8dbb07a18d46f63d8b3c8994d5ccc351',
    name: 'Mexico',
    slug: 'mexico',
  },
  {
    id: '61709e9e6ca6ca8245bc851c0b781673',
    name: 'Thụy Điển',
    slug: 'thuy-dien',
  },
  {
    id: '77dab2f81a6c8c9136efba7ab2c4c0f2',
    name: 'Philippines',
    slug: 'philippines',
  },
  {
    id: '208c51751eff7e1480052cdb4e26176a',
    name: 'Đan Mạch',
    slug: 'dan-mach',
  },
  {
    id: '69e561770d6094af667b9361f58f39bd',
    name: 'Thụy Sĩ',
    slug: 'thuy-si',
  },
  {
    id: 'c338f80e38dd2381f8faf9eccb6e6c1c',
    name: 'Ukraina',
    slug: 'ukraina',
  },
  {
    id: '05de95be5fc404da9680bbb3dd8262e6',
    name: 'Hàn Quốc',
    slug: 'han-quoc',
  },
  {
    id: '74d9fa92f4dea9ecea8fc2233dc7921a',
    name: 'Âu Mỹ',
    slug: 'au-my',
  },
  {
    id: 'aadd510492662beef1a980624b26c685',
    name: 'Ấn Độ',
    slug: 'an-do',
  },
  {
    id: '445d337b5cd5de476f99333df6b0c2a7',
    name: 'Canada',
    slug: 'canada',
  },
  {
    id: '8a40abac202ab3659bb98f71f05458d1',
    name: 'Tây Ban Nha',
    slug: 'tay-ban-nha',
  },
  {
    id: '4647d00cf81f8fb0ab80f753320d0fc9',
    name: 'Indonesia',
    slug: 'indonesia',
  },
  {
    id: '59317f665349487a74856ac3e37b35b5',
    name: 'Ba Lan',
    slug: 'ba-lan',
  },
  {
    id: '3f0e49c46cbde0c7adf5ea04a97ab261',
    name: 'Malaysia',
    slug: 'malaysia',
  },
  {
    id: 'fcd5da8ea7e4bf894692933ee3677967',
    name: 'Bồ Đào Nha',
    slug: 'bo-dao-nha',
  },
  {
    id: 'b6ae56d2d40c99fc293aefe45dcb3b3d',
    name: 'UAE',
    slug: 'uae',
  },
  {
    id: '471cdb11e01cf8fcdafd3ab5cd7b4241',
    name: 'Châu Phi',
    slug: 'chau-phi',
  },
  {
    id: 'cc85d02a69f06f7b43ab67f5673604a3',
    name: 'Ả Rập Xê Út',
    slug: 'a-rap-xe-ut',
  },
  {
    id: 'd4097fbffa8f7149a61281437171eb83',
    name: 'Nhật Bản',
    slug: 'nhat-ban',
  },
  {
    id: '559fea9881e3a6a3e374b860fa8fb782',
    name: 'Đài Loan',
    slug: 'dai-loan',
  },
  {
    id: '932bbaca386ee0436ad0159117eabae4',
    name: 'Anh',
    slug: 'anh',
  },
  {
    id: '45a260effdd4ba38e861092ae2a1b96a',
    name: 'Quốc Gia Khác',
    slug: 'quoc-gia-khac',
  },
  {
    id: '8931caa7f43ee5b07bf046c8300f4eba',
    name: 'Thổ Nhĩ Kỳ',
    slug: 'tho-nhi-ky',
  },
  {
    id: '2dbf49dd0884691f87e44769a3a3a29e',
    name: 'Nga',
    slug: 'nga',
  },
  {
    id: '435a85571578e419ed511257881a1e75',
    name: 'Úc',
    slug: 'uc',
  },
  {
    id: '42537f0fb56e31e20ab9c2305752087d',
    name: 'Brazil',
    slug: 'brazil',
  },
  {
    id: 'a30878a7fdb6a94348fce16d362edb11',
    name: 'Ý',
    slug: 'y',
  },
  {
    id: '638f494a6d33cf5760f6e95c8beb612a',
    name: 'Na Uy',
    slug: 'na-uy',
  },
  {
    id: '3cf479dac2caaead12dfa36105b1c402',
    name: 'Nam Phi',
    slug: 'nam-phi',
  },
];

export const CategoriesArrayWithAll: {
  id: string;
  name: string;
  slug: Category;
}[] = [
  {
    id: '9822be111d2ccc29c7172c78b8af8ff5',
    name: 'Hành Động',
    slug: 'hanh-dong',
  },
  {
    id: 'd111447ee87ec1a46a31182ce4623662',
    name: 'Miền Tây',
    slug: 'mien-tay',
  },
  {
    id: '0c853f6238e0997ee318b646bb1978bc',
    name: 'Trẻ Em',
    slug: 'tre-em',
  },
  {
    id: 'f8ec3e9b77c509fdf64f0c387119b916',
    name: 'Lịch Sử',
    slug: 'lich-su',
  },
  {
    id: '3a17c7283b71fa84e5a8d76fb790ed3e',
    name: 'Cổ Trang',
    slug: 'co-trang',
  },
  {
    id: '1bae5183d681b7649f9bf349177f7123',
    name: 'Chiến Tranh',
    slug: 'chien-tranh',
  },
  {
    id: '68564911f00849030f9c9c144ea1b931',
    name: 'Viễn Tưởng',
    slug: 'vien-tuong',
  },
  {
    id: '4db8d7d4b9873981e3eeb76d02997d58',
    name: 'Kinh Dị',
    slug: 'kinh-di',
  },
  {
    id: '1645fa23fa33651cef84428b0dcc2130',
    name: 'Tài Liệu',
    slug: 'tai-lieu',
  },
  {
    id: '2fb53017b3be83cd754a08adab3e916c',
    name: 'Bí Ẩn',
    slug: 'bi-an',
  },
  {
    id: '4b4457a1af8554c282dc8ac41fd7b4a1',
    name: 'Phim 18+',
    slug: 'phim-18',
  },
  {
    id: 'bb2b4b030608ca5984c8dd0770f5b40b',
    name: 'Tình Cảm',
    slug: 'tinh-cam',
  },
  {
    id: 'a7b065b92ad356387ef2e075dee66529',
    name: 'Tâm Lý',
    slug: 'tam-ly',
  },
  {
    id: '591bbb2abfe03f5aa13c08f16dfb69a2',
    name: 'Thể Thao',
    slug: 'the-thao',
  },
  {
    id: '66c78b23908113d478d8d85390a244b4',
    name: 'Phiêu Lưu',
    slug: 'phieu-luu',
  },
  {
    id: '252e74b4c832ddb4233d7499f5ed122e',
    name: 'Âm Nhạc',
    slug: 'am-nhac',
  },
  {
    id: 'a2492d6cbc4d58f115406ca14e5ec7b6',
    name: 'Gia Đình',
    slug: 'gia-dinh',
  },
  {
    id: '01c8abbb7796a1cf1989616ca5c175e6',
    name: 'Học Đường',
    slug: 'hoc-duong',
  },
  {
    id: 'ba6fd52e5a3aca80eaaf1a3b50a182db',
    name: 'Hài Hước',
    slug: 'hai-huoc',
  },
  {
    id: '7a035ac0b37f5854f0f6979260899c90',
    name: 'Hình Sự',
    slug: 'hinh-su',
  },
  {
    id: '578f80eb493b08d175c7a0c29687cbdf',
    name: 'Võ Thuật',
    slug: 'vo-thuat',
  },
  {
    id: '0bcf4077916678de9b48c89221fcf8ae',
    name: 'Khoa Học',
    slug: 'khoa-hoc',
  },
  {
    id: '2276b29204c46f75064735477890afd6',
    name: 'Thần Thoại',
    slug: 'than-thoai',
  },
  {
    id: '37a7b38b6184a5ebd3c43015aa20709d',
    name: 'Chính Kịch',
    slug: 'chinh-kich',
  },
  {
    id: '268385d0de78827ff7bb25c35036ee2a',
    name: 'Kinh Điển',
    slug: 'kinh-dien',
  },
];
