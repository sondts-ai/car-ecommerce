import { createHash, randomInt, randomUUID } from "node:crypto";
import { CARS } from "@/lib/cars";
import type {
  CustomerProfile,
  DepositDto,
  PaymentDto,
  ReviewDto,
  TestDriveDto,
} from "@/lib/api/types";

/**
 * Mock database lưu trong bộ nhớ (reset khi restart dev server).
 * Thay bằng Prisma / TypeORM / MongoDB khi nối backend thật.
 */

export type StoredUser = CustomerProfile & {
  passwordHash: string;
};

export type StoredOtp = {
  email: string;
  otp: string;
  expiresAt: number;
  resetToken?: string;
};

type MockStore = {
  users: StoredUser[];
  sessions: Map<string, string>; // token -> userId
  otps: Map<string, StoredOtp>; // email -> otp
  deposits: DepositDto[];
  payments: PaymentDto[];
  testDrives: TestDriveDto[];
  reviews: ReviewDto[];
  sequences: Record<string, number>;
};

export function hashPassword(plain: string): string {
  return createHash("sha256").update(`autoweb-salt::${plain}`).digest("hex");
}

export function generateCode(prefix: "DC" | "TD" | "PM"): string {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  const random = randomInt(0, 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");
  return `${prefix}-${stamp}-${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

function isoDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function isoDateOnly(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function seedReviews(): ReviewDto[] {
  const seeds = [
    {
      author: "Trần Minh Quân",
      rating: 5,
      title: "Trải nghiệm mua xe rất chuyên nghiệp",
      content:
        "Đặt cọc online buổi tối, sáng hôm sau đã có chuyên viên gọi xác nhận. Xe giao đúng hẹn, nội thất sạch sẽ và được hướng dẫn sử dụng rất kỹ.",
      verified: true,
      days: 36,
    },
    {
      author: "Nguyễn Thu Hà",
      rating: 4,
      title: "Xe vận hành êm, dịch vụ tốt",
      content:
        "Mình chọn bản màu trắng, nhận xe sau 9 ngày. Điểm trừ nhỏ là thời gian chờ làm hợp đồng hơi lâu, còn lại mọi thứ ổn.",
      verified: true,
      days: 52,
    },
    {
      author: "Lê Hoàng Nam",
      rating: 5,
      title: "Đáng từng đồng",
      content:
        "Lái thử tại showroom Tây Hồ rồi quyết định luôn. Cảm giác lái chắc chắn, cách âm tốt, gia đình rất hài lòng.",
      verified: false,
      days: 74,
    },
  ];

  return CARS.flatMap((car) =>
    seeds.map((seed, index) => ({
      id: `rv_${car.id}_${index + 1}`,
      carSlug: car.slug,
      author: seed.author,
      rating: seed.rating,
      title: seed.title,
      content: seed.content,
      createdAt: isoDaysFromNow(-seed.days),
      verified: seed.verified,
    })),
  );
}

function createStore(): MockStore {
  const demoUser: StoredUser = {
    id: "usr_demo",
    fullName: "Nguyễn Văn An",
    email: "demo@autoweb.vn",
    phone: "0901234567",
    tier: "Kim Cương",
    joinedAt: isoDaysFromNow(-420),
    birthday: "1990-05-18",
    address: "Số 25 Lý Thường Kiệt, Q. Hoàn Kiếm",
    city: "Hà Nội",
    newsletter: true,
    updatedAt: nowIso(),
    passwordHash: hashPassword("Autoweb@123"),
  };

  const deposits: DepositDto[] = [
    {
      id: "dep_seed_1",
      code: "DC-20261112-8F2K",
      carSlug: "bmw-x5-xdrive40i",
      carName: "BMW X5 xDrive40i",
      showroomId: "hn-tay-ho",
      amount: 50_000_000,
      status: "paid",
      customer: { fullName: demoUser.fullName, phone: demoUser.phone, email: demoUser.email },
      createdAt: isoDaysFromNow(-5),
      holdUntil: isoDaysFromNow(10),
    },
  ];

  const testDrives: TestDriveDto[] = [
    {
      id: "td_seed_1",
      code: "TD-20261109-3QW1",
      carSlug: "vinfast-vf-9-plus",
      carName: "VinFast VF 9 Plus",
      showroomId: "hcm-q7",
      date: isoDateOnly(3),
      time: "14:30",
      status: "confirmed",
      customer: { fullName: demoUser.fullName, phone: demoUser.phone, email: demoUser.email },
      createdAt: isoDaysFromNow(-8),
    },
  ];

  return {
    users: [demoUser],
    sessions: new Map(),
    otps: new Map(),
    deposits: [...deposits],
    payments: [],
    testDrives: [...testDrives],
    reviews: seedReviews(),
    sequences: {},
  };
}

const globalForStore = globalThis as unknown as { __autowebMockStore?: MockStore };

export const store: MockStore = globalForStore.__autowebMockStore ?? createStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.__autowebMockStore = store;
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return store.users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
}

export function findUserByPhone(phone: string): StoredUser | undefined {
  const normalized = phone.replace(/[\s.-]/g, "");
  return store.users.find((user) => user.phone === normalized);
}

export function createSession(userId: string): string {
  const token = randomUUID().replace(/-/g, "");
  store.sessions.set(token, userId);
  return token;
}

export function findUserByToken(token: string): StoredUser | undefined {
  const userId = store.sessions.get(token);
  if (!userId) return undefined;
  return store.users.find((user) => user.id === userId);
}

export function toAuthUser(user: StoredUser): Omit<StoredUser, "passwordHash"> {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}
