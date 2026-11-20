import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Khôi phục mật khẩu" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Bảo mật tài khoản"
      title="Khôi phục mật khẩu"
      subtitle="Nhập email đã đăng ký để nhận mã xác thực và đặt mật khẩu mới."
      sideHeading="Bảo vệ tài khoản của bạn"
      sideDescription="AutoWeb áp dụng mã hoá hai lớp và xác thực OTP cho mọi thay đổi mật khẩu."
      benefits={[
        "Mã OTP 6 chữ số, hiệu lực 10 phút",
        "Không lưu mật khẩu dưới dạng văn bản thuần",
        "Cảnh báo đăng nhập bất thường qua email",
        "Hỗ trợ khôi phục 24/7 bởi chuyên viên",
      ]}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
