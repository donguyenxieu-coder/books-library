# Book Library — Mock API Contract (Phase 8)

Mock backend chạy bằng **Next.js Route Handlers** (`src/app/api/...`).
Bạn **không cần sửa** các file backend. Việc của bạn là đọc contract này và viết frontend gọi đúng.

## Cài vào project

1. Copy vào project Next.js (giữ nguyên đường dẫn):
   - `src/types/book.ts`
   - `src/lib/server/book-store.ts`
   - `src/lib/server/api-utils.ts`
   - `src/app/api/books/route.ts`
   - `src/app/api/books/[bookId]/route.ts`
2. Cần `zod`: `npm i zod` (nếu chưa có).
3. `npm run dev`, mở `http://localhost:3000/api/books` → thấy JSON 8 cuốn sách là OK.
4. Dữ liệu lưu ở `data/books.json` (tự tạo lần đầu). Xóa file này = reset về dữ liệu mẫu.
   Nên thêm `/data` vào `.gitignore`.

Mỗi request chậm ~800ms có chủ đích để bạn **thấy** loading state (đổi `DELAY_MS` trong `api-utils.ts`).

## Data model

```ts
type ReadingStatus = "want-to-read" | "reading" | "read";
type Book = {
  id: number;
  title: string;
  author: string;
  description?: string;
  status: ReadingStatus;
  rating?: number; // số nguyên 1–5
  image?: string;  // URL ảnh bìa
};
type CreateBookInput = Omit<Book, "id">;
```

## Endpoints

| Thao tác | Method + URL | Request body | Thành công | Lỗi có thể gặp |
|---|---|---|---|---|
| List | `GET /api/books` | — | `200` `Book[]` | `500` |
| Detail | `GET /api/books/:bookId` | — | `200` `Book` | `400` id sai dạng, `404`, `500` |
| Create | `POST /api/books` | `CreateBookInput` (JSON) | `201` `Book` vừa tạo (có `id`) | `400` validation, `500` |
| Edit | `PATCH /api/books/:bookId` | các field muốn đổi (JSON) | `200` `Book` sau khi sửa | `400`, `404`, `500` |
| Delete | `DELETE /api/books/:bookId` | — | `204` **không có body** | `400`, `404`, `500` |

POST/PATCH cần header `Content-Type: application/json` và body `JSON.stringify(...)`.

### Query cho List (tùy chọn)

`GET /api/books?q=nhật ánh&status=read`

- `q`: tìm trong **title hoặc author**, không phân biệt hoa thường
- `status`: `want-to-read` | `reading` | `read`

API **không phân trang**, luôn trả về mảng đầy đủ đã lọc. Phân trang làm ở đâu là quyết định của bạn ở P8.7.

### Field tùy chọn

`description`, `rating`, `image` có thể:
- không gửi → POST: không có; PATCH: **giữ nguyên** giá trị cũ
- gửi `""` hoặc `null` → coi như **không có** (PATCH: **xóa** giá trị cũ)

Ví dụ xóa đánh giá: `PATCH /api/books/2` với body `{ "rating": null }`.

### Hình dạng lỗi

```json
{ "message": "Không tìm thấy sách" }
```

Lỗi validation (`400`) có thêm `errors` theo từng field:

```json
{
  "message": "Dữ liệu không hợp lệ",
  "errors": { "title": "Title không được để trống", "rating": "Rating từ 1 đến 5" }
}
```

### Rule server validation

- `title`: bắt buộc, trim, 1–150 ký tự
- `author`: bắt buộc, trim, 1–100 ký tự
- `description`: tùy chọn, tối đa 1000 ký tự
- `status`: một trong 3 giá trị
- `rating`: tùy chọn, **số nguyên 1–5**
- `image`: tùy chọn, URL hợp lệ

### Giả lập lỗi 500

Thêm `?simulateError=true` vào URL API bất kỳ, ví dụ `GET /api/books?simulateError=true` → `500`.

## Lưu ý cho frontend

- **Server Component** gọi `fetch` cần **URL đầy đủ**: `http://localhost:3000/api/books`.
  **Client Component** gọi được URL tương đối: `/api/books`.
- `params.bookId` là **string** (`"7"`), còn `Book.id` là **number**.
- `DELETE` trả `204`: không gọi `response.json()`.
- Ảnh bìa mẫu từ `picsum.photos`. Nếu dùng `next/image`, cần khai báo domain trong `next.config.ts`
  (`images.remotePatterns`). Dùng thẻ `<img>` thường thì không cần.
- Trong dự án thật, Server Component thường gọi thẳng hàm lấy data thay vì `fetch` tới API của chính app.
  Ở đây làm vậy có chủ đích để luyện request/response như với một backend riêng.
