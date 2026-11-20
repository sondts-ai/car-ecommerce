import type { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile/ProfileDashboard";

export const metadata: Metadata = { title: "Tài khoản của tôi" };

export default function ProfilePage() {
  return <ProfileDashboard />;
}
