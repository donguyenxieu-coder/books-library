# Kế hoạch: Thư viện sách

Stack: Next.js 16 (App Router) · Supabase (Auth, Postgres, Storage) · Zod 4 · React Hook Form · shadcn/ui · Tailwind 4.

Mock API cũ (Phase 8) được giữ ở tag `phase-8-mock`.

Bản chạy thật: https://books-library-sandy.vercel.app (push `main` = deploy Production, nhánh khác = Preview).

Quy trình từ Ngày 2: mỗi ngày một nhánh `day-N-...` → push để có link Preview → Pull Request → merge vào `main`.
Migration SQL mới: chạy trong Supabase SQL Editor **trước** khi merge code dùng tới nó.

## Quyết định kiến trúc

| Vấn đề | Cách làm |
|---|---|
| Đăng nhập bằng username | Server đổi `username` → `username@books.local` cho Supabase Auth (tắt "Confirm email"). `username`, `full_name` vào `profiles` qua trigger. "Nhập lại password" chỉ có trong Zod |
| Ai được xem sách | Cột `books.visibility` = `private` (mặc định) \| `public`. RLS: chủ sách hoặc sách public |
| Parse sách | Trên trình duyệt: EPUB (JSZip + DOMParser, theo spine/TOC), md (`marked`), txt (regex `Chương \d+`). Có bước xem trước chương |
| Lưu sách | Ảnh bìa upload thẳng lên Storage. Chương gửi qua Server Action theo lô ~500KB, server `safeParse` lại |
| Số thứ tự chương | Chỉ lưu `position`; "Chương N" tính khi hiển thị. Reorder qua RPC `reorder_chapters` |
| Nội dung chương | HTML, sanitize ở server **trước khi lưu** (`sanitize-html`) → DB chỉ chứa HTML an toàn |
| Highlight / ghi chú | Offset ký tự + đoạn trích; vẽ bằng CSS Custom Highlight API |
| Lịch sử đọc | `reading_progress` (1 dòng / user–sách, upsert) |
| Luồng dữ liệu | Đọc: Server Component. Ghi: Zod schema → RHF `zodResolver` → Server Action `safeParse` → `ActionResult` → `setError` |

## Schema

```
profiles          id(=auth.uid) · username unique · full_name · avatar_url
books             id · owner_id · title · author · description · cover_path · format
                  · visibility · chapter_count · word_count · created_at · updated_at · deleted_at
chapters          id · book_id · title · content_html · position · word_count
reading_progress  (user_id, book_id) PK · chapter_id · block_index · percent · updated_at
bookmarks         id · user_id · book_id · chapter_id · block_index · excerpt
highlights        id · user_id · book_id · chapter_id · start_offset · end_offset · quote · note · color
```

## Lịch

P0 = bắt buộc để demo · P1 = nên có · P2 = nếu còn thời gian

- [x] **Ngày 1 — Nền móng & Auth**: thư viện + shadcn, migration (bảng, RLS, trigger, storage), `proxy.ts`, đăng ký / đăng nhập / đăng xuất, app shell, deploy Vercel (region `sin1`)
- [x] **Ngày 2 — Upload & thư viện**: 3 parser (+ test), wizard upload, lưới thư viện, tìm kiếm `?q=` (unaccent), trang chi tiết tối giản
- [ ] **Ngày 3 — Chi tiết & chương**: trang chi tiết, sửa thông tin, soft delete + Hoàn tác, (P1) kéo thả chương, đổi tên, chuyển vị trí
- [ ] **Ngày 4 — Trình đọc & trang chủ**: trang đọc, cài đặt đọc (bạn tự viết), command palette chọn chương, lưu tiến độ, trang chủ
- [ ] **Ngày 5 — Bookmark, ghi chú, hoàn thiện**: (P1) bookmark, highlight + note; loading/empty/error, mobile, README

Thứ tự cắt khi trễ: thùng rác → upload avatar → lưu file gốc → View Transitions → nhiều màu highlight.
