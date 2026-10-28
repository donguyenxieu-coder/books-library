import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/features/auth/queries";
import { UploadWizard } from "@/features/import/components/upload-wizard";

export const metadata: Metadata = { title: "Tải sách lên" };

export default async function NewBookPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/books/new");

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Tải sách lên</h1>
        <p className="text-muted-foreground">Chọn file, kiểm tra chương và thông tin sách, rồi lưu vào tủ sách.</p>
      </header>
      {/* userId dùng làm thư mục khi upload ảnh bìa lên Storage */}
      <UploadWizard userId={profile.id} />
    </div>
  );
}
