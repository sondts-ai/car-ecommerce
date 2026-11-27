import type { Metadata } from "next";
import { AuthShell } from "@/components/site/auth/AuthShell";
import { RegisterForm } from "@/components/site/auth/RegisterForm";

export const metadata: Metadata = { title: "Đăng ký tài khoản" };

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Thành viên AutoWeb"
      title="Tạo tài khoản mới"
      subtitle="Chỉ mất 1 phút để mở khoá toàn bộ trải nghiệm mua xe trực tuyến của AutoWeb."
      sideHeading="Gia nhập cộng đồng chủ xe đẳng cấp"
      sideDescription="Hơn 12.000 khách hàng đã tin chọn AutoWeb cho hành trình sở hữu xe của mình."
      benefits={[
        "Đặt cọc giữ xe trực tuyến, không cần đến showroom",
        "Đặt lịch lái thử linh hoạt 14 ngày tới",
        "Lưu trữ hợp đồng, hoá đơn và lịch bảo dưỡng",
        "Ưu đãi thành viên lên tới 50 triệu đồng",
      ]}
      footer={
        <p className="text-center text-[12px] leading-relaxed text-ink-600/60">
          Bạn cần tư vấn trước khi tạo tài khoản? Gọi{" "}
          <a href="tel:19008686" className="font-medium text-ink-900 hover:text-champagne-600">
            1900 8686
          </a>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
