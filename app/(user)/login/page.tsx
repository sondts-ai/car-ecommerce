import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/site/auth/AuthShell";
import { LoginForm } from "@/components/site/auth/LoginForm";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Chào mừng trở lại"
      title="Đăng nhập tài khoản"
      subtitle="Tiếp tục hành trình cùng AutoWeb — theo dõi đơn đặt cọc, lịch lái thử và ưu đãi của bạn."
      footer={
        <p className="text-center text-[12px] leading-relaxed text-ink-600/60">
          Cần hỗ trợ đăng nhập? Gọi{" "}
          <a href="tel:19008686" className="font-medium text-ink-900 hover:text-champagne-600">
            1900 8686
          </a>{" "}
          hoặc{" "}
          <Link href="/forgot-password" className="font-medium text-champagne-600 hover:underline">
            khôi phục mật khẩu
          </Link>
          .
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
