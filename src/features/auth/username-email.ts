// Supabase Auth bắt buộc có email, còn app chỉ dùng username.
// → Đổi username thành một email nội bộ. Không có email nào được gửi tới địa chỉ này
// (đã tắt "Confirm email"), nên domain chỉ cần đúng định dạng.
const AUTH_EMAIL_DOMAIN = "books.local";

export function usernameToEmail(username: string) {
  return `${username}@${AUTH_EMAIL_DOMAIN}`;
}
