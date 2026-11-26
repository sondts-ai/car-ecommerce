import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";

export const metadata: Metadata = {
  title: "Quản trị hệ thống",
  description: "AutoWeb Admin Portal — Quản lý danh mục xe, tồn kho và chi nhánh.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
