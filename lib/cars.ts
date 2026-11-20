export type BodyType = "SUV" | "Sedan" | "Crossover" | "Bán tải" | "Coupe";
export type FuelType = "Xăng" | "Dầu" | "Hybrid" | "Điện";

export type Car = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  modelYear: number;
  bodyType: BodyType;
  fuel: FuelType;
  transmission: "Số tự động" | "Số sàn";
  seats: number;
  power: number; // mã lực
  price: number; // VNĐ
  originalPrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  tagline: string;
  description: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  /** Lớp gradient dùng cho ảnh placeholder (không phụ thuộc mạng) */
  gradient: string;
  accent: string;
};

export const CARS: Car[] = [
  {
    id: "car-s450",
    slug: "mercedes-benz-s-450-4matic",
    name: "Mercedes-Benz S 450 4MATIC",
    brand: "Mercedes-Benz",
    modelYear: 2025,
    bodyType: "Sedan",
    fuel: "Xăng",
    transmission: "Số tự động",
    seats: 5,
    power: 367,
    price: 4_319_000_000,
    stock: 4,
    rating: 4.9,
    reviewCount: 128,
    tagline: "Đẳng cấp thượng lưu trong từng chi tiết",
    description:
      "S 450 4MATIC là biểu tượng của dòng sedan hạng sang: khoang nội thất bọc Nappa, hệ thống treo AIRMATIC êm ái và dàn âm thanh Burmester 3D biến mỗi hành trình thành một trải nghiệm riêng tư.",
    highlights: [
      "Hệ thống treo khí nén AIRMATIC",
      "Dàn âm thanh Burmester 3D 15 loa",
      "Ghế sau massage 10 chương trình",
      "Đèn pha DIGITAL LIGHT",
    ],
    specs: [
      { label: "Động cơ", value: "3.0L I6 Turbo + EQ Boost" },
      { label: "Công suất", value: "367 mã lực" },
      { label: "Mô-men xoắn", value: "500 Nm" },
      { label: "Tăng tốc 0–100 km/h", value: "5,1 giây" },
      { label: "Tiêu hao nhiên liệu", value: "8,4 L/100km" },
      { label: "Kích thước (D×R×C)", value: "5.179 × 1.954 × 1.503 mm" },
    ],
    gradient: "from-[#1B2431] via-[#2C3A4C] to-[#0C1117]",
    accent: "#8FA6C4",
  },
  {
    id: "car-x5",
    slug: "bmw-x5-xdrive40i",
    name: "BMW X5 xDrive40i",
    brand: "BMW",
    modelYear: 2025,
    bodyType: "SUV",
    fuel: "Xăng",
    transmission: "Số tự động",
    seats: 5,
    power: 381,
    price: 3_759_000_000,
    originalPrice: 3_999_000_000,
    stock: 6,
    rating: 4.8,
    reviewCount: 96,
    tagline: "Chinh phục mọi hành trình",
    description:
      "X5 xDrive40i kết hợp động cơ 6 xy-lanh thẳng hàng với hệ dẫn động bốn bánh toàn thời gian, mang lại khả năng vận hành thể thao cùng sự tiện nghi chuẩn BMW.",
    highlights: [
      "Màn hình cong BMW Curved Display",
      "Hệ thống treo thích ứng Adaptive M",
      "Cửa sổ trời toàn cảnh Panorama",
      "Gói hỗ trợ lái Driving Assistant Professional",
    ],
    specs: [
      { label: "Động cơ", value: "3.0L I6 TwinPower Turbo" },
      { label: "Công suất", value: "381 mã lực" },
      { label: "Mô-men xoắn", value: "520 Nm" },
      { label: "Tăng tốc 0–100 km/h", value: "5,5 giây" },
      { label: "Tiêu hao nhiên liệu", value: "9,1 L/100km" },
      { label: "Kích thước (D×R×C)", value: "4.935 × 2.004 × 1.765 mm" },
    ],
    gradient: "from-[#16202B] via-[#22303F] to-[#0A0F14]",
    accent: "#7FA6C9",
  },
  {
    id: "car-911",
    slug: "porsche-911-carrera",
    name: "Porsche 911 Carrera",
    brand: "Porsche",
    modelYear: 2025,
    bodyType: "Coupe",
    fuel: "Xăng",
    transmission: "Số tự động",
    seats: 4,
    power: 394,
    price: 8_500_000_000,
    stock: 0,
    rating: 5,
    reviewCount: 41,
    tagline: "Huyền thoại không ngừng tiến hóa",
    description:
      "Với động cơ boxer 3.0L tăng áp kép đặt sau và hộp số PDK 8 cấp, 911 Carrera là chuẩn mực của một chiếc xe thể thao có thể sử dụng hằng ngày.",
    highlights: [
      "Động cơ boxer tăng áp kép",
      "Hộp số PDK 8 cấp",
      "Hệ thống treo PASM",
      "Nội thất da thủ công",
    ],
    specs: [
      { label: "Động cơ", value: "3.0L Boxer 6 Twin-Turbo" },
      { label: "Công suất", value: "394 mã lực" },
      { label: "Mô-men xoắn", value: "450 Nm" },
      { label: "Tăng tốc 0–100 km/h", value: "4,1 giây" },
      { label: "Tốc độ tối đa", value: "294 km/h" },
      { label: "Kích thước (D×R×C)", value: "4.527 × 1.852 × 1.299 mm" },
    ],
    gradient: "from-[#2A1414] via-[#3B1D1B] to-[#120809]",
    accent: "#D8A08E",
  },
  {
    id: "car-vf9",
    slug: "vinfast-vf-9-plus",
    name: "VinFast VF 9 Plus",
    brand: "VinFast",
    modelYear: 2025,
    bodyType: "SUV",
    fuel: "Điện",
    transmission: "Số tự động",
    seats: 7,
    power: 402,
    price: 1_491_000_000,
    originalPrice: 1_597_000_000,
    stock: 12,
    rating: 4.6,
    reviewCount: 214,
    tagline: "SUV điện 7 chỗ cho gia đình hiện đại",
    description:
      "VF 9 Plus sở hữu quãng đường di chuyển lên tới 594 km mỗi lần sạc, công nghệ hỗ trợ lái nâng cao và khoang cabin rộng rãi cho cả gia đình.",
    highlights: [
      "Quãng đường 594 km (WLTP)",
      "Hỗ trợ lái nâng cao ADAS",
      "Cửa sổ trời toàn cảnh",
      "Sạc nhanh 10–70% trong 35 phút",
    ],
    specs: [
      { label: "Động cơ", value: "2 mô-tơ điện AWD" },
      { label: "Công suất", value: "402 mã lực" },
      { label: "Mô-men xoắn", value: "620 Nm" },
      { label: "Tăng tốc 0–100 km/h", value: "6,5 giây" },
      { label: "Quãng đường", value: "594 km" },
      { label: "Kích thước (D×R×C)", value: "5.118 × 2.254 × 1.696 mm" },
    ],
    gradient: "from-[#0E2230] via-[#12374A] to-[#08141C]",
    accent: "#6FC2D9",
  },
  {
    id: "car-camry",
    slug: "toyota-camry-2-5-hev",
    name: "Toyota Camry 2.5 HEV",
    brand: "Toyota",
    modelYear: 2025,
    bodyType: "Sedan",
    fuel: "Hybrid",
    transmission: "Số tự động",
    seats: 5,
    power: 230,
    price: 1_340_000_000,
    stock: 9,
    rating: 4.7,
    reviewCount: 302,
    tagline: "Bền bỉ, tiết kiệm, sang trọng",
    description:
      "Camry thế hệ mới với hệ truyền động hybrid tiết kiệm nhiên liệu, gói an toàn Toyota Safety Sense 3.0 và thiết kế trẻ trung hơn.",
    highlights: [
      "Toyota Safety Sense 3.0",
      "Mức tiêu hao 4,2 L/100km",
      "Màn hình HUD",
      "Ghế lái chỉnh điện 10 hướng",
    ],
    specs: [
      { label: "Động cơ", value: "2.5L Hybrid" },
      { label: "Công suất", value: "230 mã lực" },
      { label: "Mô-men xoắn", value: "221 Nm" },
      { label: "Tăng tốc 0–100 km/h", value: "7,9 giây" },
      { label: "Tiêu hao nhiên liệu", value: "4,2 L/100km" },
      { label: "Kích thước (D×R×C)", value: "4.920 × 1.880 × 1.445 mm" },
    ],
    gradient: "from-[#1E2226] via-[#333A40] to-[#0D0F11]",
    accent: "#B9C2C9",
  },
  {
    id: "car-ranger",
    slug: "ford-ranger-wildtrak",
    name: "Ford Ranger Wildtrak",
    brand: "Ford",
    modelYear: 2025,
    bodyType: "Bán tải",
    fuel: "Dầu",
    transmission: "Số tự động",
    seats: 5,
    power: 210,
    price: 1_099_000_000,
    stock: 7,
    rating: 4.5,
    reviewCount: 187,
    tagline: "Mạnh mẽ cho mọi địa hình",
    description:
      "Ranger Wildtrak 2.0L Bi-Turbo với khung gầm chắc chắn, hệ dẫn động 4WD và hàng loạt công nghệ hỗ trợ off-road.",
    highlights: [
      "Động cơ Bi-Turbo 2.0L",
      "Dẫn động 4WD chọn chế độ",
      "Hệ thống hỗ trợ đổ đèo",
      "Màn hình SYNC 4A 12 inch",
    ],
    specs: [
      { label: "Động cơ", value: "2.0L Bi-Turbo Diesel" },
      { label: "Công suất", value: "210 mã lực" },
      { label: "Mô-men xoắn", value: "500 Nm" },
      { label: "Tăng tốc 0–100 km/h", value: "10,2 giây" },
      { label: "Tiêu hao nhiên liệu", value: "7,8 L/100km" },
      { label: "Kích thước (D×R×C)", value: "5.370 × 1.918 × 1.884 mm" },
    ],
    gradient: "from-[#1C2418] via-[#2C3A24] to-[#0C100A]",
    accent: "#A8C08A",
  },
  {
    id: "car-q7",
    slug: "audi-q7-55-tfsi",
    name: "Audi Q7 55 TFSI quattro",
    brand: "Audi",
    modelYear: 2025,
    bodyType: "SUV",
    fuel: "Xăng",
    transmission: "Số tự động",
    seats: 7,
    power: 340,
    price: 4_190_000_000,
    stock: 3,
    rating: 4.8,
    reviewCount: 74,
    tagline: "Công nghệ quattro trong hình hài lịch lãm",
    description:
      "Q7 55 TFSI quattro nổi bật với hệ dẫn động bốn bánh toàn thời gian, khoang nội thất 7 chỗ linh hoạt và hệ thống chiếu sáng Matrix LED.",
    highlights: [
      "Dẫn động quattro toàn thời gian",
      "Đèn Matrix LED",
      "Hệ thống âm thanh Bang & Olufsen",
      "Treo khí nén thích ứng",
    ],
    specs: [
      { label: "Động cơ", value: "3.0L V6 TFSI" },
      { label: "Công suất", value: "340 mã lực" },
      { label: "Mô-men xoắn", value: "500 Nm" },
      { label: "Tăng tốc 0–100 km/h", value: "5,6 giây" },
      { label: "Tiêu hao nhiên liệu", value: "9,4 L/100km" },
      { label: "Kích thước (D×R×C)", value: "5.063 × 1.970 × 1.741 mm" },
    ],
    gradient: "from-[#20201D] via-[#33322C] to-[#0F0F0D]",
    accent: "#CFC6B2",
  },
  {
    id: "car-vf8",
    slug: "vinfast-vf-8-plus",
    name: "VinFast VF 8 Plus",
    brand: "VinFast",
    modelYear: 2025,
    bodyType: "Crossover",
    fuel: "Điện",
    transmission: "Số tự động",
    seats: 5,
    power: 402,
    price: 1_009_000_000,
    stock: 15,
    rating: 4.4,
    reviewCount: 341,
    tagline: "Crossover điện thông minh",
    description:
      "VF 8 Plus mang đến trải nghiệm lái điện mượt mà, khả năng tăng tốc ấn tượng và gói tính năng an toàn chủ động toàn diện.",
    highlights: [
      "Quãng đường 471 km (WLTP)",
      "Trợ lý ảo tiếng Việt",
      "Hỗ trợ lái ADAS cấp 2",
      "Cập nhật phần mềm OTA",
    ],
    specs: [
      { label: "Động cơ", value: "2 mô-tơ điện AWD" },
      { label: "Công suất", value: "402 mã lực" },
      { label: "Mô-men xoắn", value: "620 Nm" },
      { label: "Tăng tốc 0–100 km/h", value: "5,9 giây" },
      { label: "Quãng đường", value: "471 km" },
      { label: "Kích thước (D×R×C)", value: "4.750 × 1.934 × 1.667 mm" },
    ],
    gradient: "from-[#12202A] via-[#1B3040] to-[#080F14]",
    accent: "#79B6CC",
  },
];

export const BRANDS = Array.from(new Set(CARS.map((c) => c.brand))).sort();
export const BODY_TYPES: BodyType[] = ["SUV", "Sedan", "Crossover", "Bán tải", "Coupe"];
export const FUEL_TYPES: FuelType[] = ["Xăng", "Dầu", "Hybrid", "Điện"];

export const PRICE_RANGES = [
  { id: "under-1b", label: "Dưới 1 tỷ", min: 0, max: 1_000_000_000 },
  { id: "1b-2b", label: "1 – 2 tỷ", min: 1_000_000_000, max: 2_000_000_000 },
  { id: "2b-4b", label: "2 – 4 tỷ", min: 2_000_000_000, max: 4_000_000_000 },
  { id: "above-4b", label: "Trên 4 tỷ", min: 4_000_000_000, max: Number.MAX_SAFE_INTEGER },
] as const;

export function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
}

export function formatShortVnd(value: number): string {
  if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000;
    return `${billions.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("vi-VN")} triệu`;
  }
  return formatVnd(value);
}

export function getCarBySlug(slug: string): Car | undefined {
  return CARS.find((car) => car.slug === slug);
}

export function getRelatedCars(car: Car, limit = 3): Car[] {
  return CARS.filter((c) => c.id !== car.id && (c.bodyType === car.bodyType || c.brand === car.brand))
    .concat(CARS.filter((c) => c.id !== car.id && c.bodyType !== car.bodyType && c.brand !== car.brand))
    .slice(0, limit);
}

export type CarFilters = {
  query: string;
  brands: string[];
  bodyTypes: BodyType[];
  fuels: FuelType[];
  priceRange: string | null;
  sort: "featured" | "price-asc" | "price-desc" | "rating";
};

export const EMPTY_FILTERS: CarFilters = {
  query: "",
  brands: [],
  bodyTypes: [],
  fuels: [],
  priceRange: null,
  sort: "featured",
};

export function filterCars(cars: Car[], filters: CarFilters): Car[] {
  const keyword = filters.query.trim().toLowerCase();
  const range = PRICE_RANGES.find((r) => r.id === filters.priceRange);

  const result = cars.filter((car) => {
    const matchKeyword =
      keyword.length === 0 ||
      `${car.name} ${car.brand} ${car.bodyType} ${car.fuel} ${car.modelYear}`
        .toLowerCase()
        .includes(keyword);
    const matchBrand = filters.brands.length === 0 || filters.brands.includes(car.brand);
    const matchBody = filters.bodyTypes.length === 0 || filters.bodyTypes.includes(car.bodyType);
    const matchFuel = filters.fuels.length === 0 || filters.fuels.includes(car.fuel);
    const matchPrice = !range || (car.price >= range.min && car.price < range.max);
    return matchKeyword && matchBrand && matchBody && matchFuel && matchPrice;
  });

  switch (filters.sort) {
    case "price-asc":
      return [...result].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...result].sort((a, b) => b.price - a.price);
    case "rating":
      return [...result].sort((a, b) => b.rating - a.rating);
    default:
      return [...result].sort((a, b) => b.reviewCount - a.reviewCount);
  }
}
