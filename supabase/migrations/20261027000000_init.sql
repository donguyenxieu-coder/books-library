-- ============================================================
-- Ngày 1 — schema khởi tạo
-- Chạy file này trong Supabase Dashboard → SQL Editor (một lần).
-- ============================================================

create extension if not exists unaccent with schema extensions;

-- ---------- Tiện ích chung ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles: 1–1 với auth.users
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  full_name text not null check (char_length(full_name) between 1 and 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Khi đăng ký, app gửi username + full_name trong options.data của signUp
-- → Supabase lưu vào raw_user_meta_data → trigger này tạo profile.
-- security definer vì người dùng chưa có quyền insert vào profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    -- fallback cho user tạo tay trong Dashboard (không có metadata)
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || left(replace(new.id::text, '-', ''), 8)),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Người dùng mới')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- books
-- ============================================================
create type public.book_format as enum ('epub', 'txt', 'md');
create type public.book_visibility as enum ('private', 'public');

create table public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  author text check (char_length(author) <= 120),
  description text check (char_length(description) <= 2000),
  cover_path text,
  format public.book_format not null,
  visibility public.book_visibility not null default 'private',
  chapter_count integer not null default 0,
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index books_owner_idx on public.books (owner_id, created_at desc) where deleted_at is null;
create index books_public_idx on public.books (created_at desc) where visibility = 'public' and deleted_at is null;

create trigger books_set_updated_at
before update on public.books
for each row execute function public.set_updated_at();

-- ============================================================
-- chapters
-- "Chương N" = position, không lưu nhãn riêng.
-- unique deferrable: khi sắp xếp lại, các position được tráo đổi trong
-- cùng transaction mà không vướng ràng buộc giữa chừng.
-- ============================================================
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 200),
  content_html text not null,
  position integer not null check (position > 0),
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint chapters_book_position_key unique (book_id, position) deferrable initially deferred
);

-- Giữ books.chapter_count / word_count luôn khớp với bảng chapters.
create or replace function public.sync_book_stats()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target uuid := coalesce(new.book_id, old.book_id);
begin
  update public.books b
  set chapter_count = s.chapter_count,
      word_count = s.word_count
  from (
    select count(*)::int as chapter_count, coalesce(sum(word_count), 0)::int as word_count
    from public.chapters
    where book_id = target
  ) s
  where b.id = target;
  return null;
end;
$$;

create trigger chapters_sync_book_stats
after insert or delete or update of word_count on public.chapters
for each row execute function public.sync_book_stats();

-- ============================================================
-- Lịch sử đọc, bookmark, highlight
-- ============================================================
create table public.reading_progress (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  block_index integer not null default 0,
  percent real not null default 0 check (percent between 0 and 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create index reading_progress_recent_idx on public.reading_progress (user_id, updated_at desc);

create trigger reading_progress_set_updated_at
before update on public.reading_progress
for each row execute function public.set_updated_at();

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  block_index integer not null,
  excerpt text not null check (char_length(excerpt) <= 300),
  created_at timestamptz not null default now(),
  unique (user_id, chapter_id, block_index)
);

create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  start_offset integer not null check (start_offset >= 0),
  end_offset integer not null,
  quote text not null check (char_length(quote) <= 2000),
  note text check (char_length(note) <= 2000),
  color text not null default 'yellow',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_offset > start_offset)
);

create index highlights_chapter_idx on public.highlights (user_id, chapter_id);

create trigger highlights_set_updated_at
before update on public.highlights
for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
-- (select auth.uid()) thay vì auth.uid(): Postgres tính một lần / câu query.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.chapters enable row level security;
alter table public.reading_progress enable row level security;
alter table public.bookmarks enable row level security;
alter table public.highlights enable row level security;

-- profiles: ai đăng nhập cũng xem được (để hiện tên người đăng sách public)
create policy "profiles: authenticated read" on public.profiles
for select to authenticated using (true);

create policy "profiles: update own" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- books: chủ sách thấy hết sách của mình (kể cả trong thùng rác);
-- người khác chỉ thấy sách public chưa xoá.
create policy "books: read own or public" on public.books
for select to authenticated
using (
  owner_id = (select auth.uid())
  or (visibility = 'public' and deleted_at is null)
);

create policy "books: insert own" on public.books
for insert to authenticated
with check (owner_id = (select auth.uid()));

-- Không có policy delete: xoá = update deleted_at (soft delete).
create policy "books: update own" on public.books
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

-- chapters: đọc được nếu đọc được sách (subquery chạy dưới RLS của books)
create policy "chapters: read if book readable" on public.chapters
for select to authenticated
using (exists (select 1 from public.books b where b.id = book_id and b.deleted_at is null));

create policy "chapters: write if book owner" on public.chapters
for all to authenticated
using (exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())))
with check (exists (select 1 from public.books b where b.id = book_id and b.owner_id = (select auth.uid())));

-- Dữ liệu đọc cá nhân: chỉ của chính mình, và chỉ trên sách mình đọc được.
create policy "reading_progress: own" on public.reading_progress
for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.books b where b.id = book_id and b.deleted_at is null)
);

create policy "bookmarks: own" on public.bookmarks
for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.books b where b.id = book_id and b.deleted_at is null)
);

create policy "highlights: own" on public.highlights
for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.books b where b.id = book_id and b.deleted_at is null)
);

-- Cấp quyền rõ ràng cho Data API (dự án Supabase mới không còn tự cấp).
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.books to authenticated;
grant select, insert, update, delete on public.chapters to authenticated;
grant select, insert, update, delete on public.reading_progress to authenticated;
grant select, insert, update, delete on public.bookmarks to authenticated;
grant select, insert, update, delete on public.highlights to authenticated;

-- ============================================================
-- Storage: ảnh bìa và avatar
-- Đường dẫn file: {user_id}/{tên-file} → policy so thư mục đầu với auth.uid()
-- Bucket public: ai có URL đều xem được ảnh, chỉ chủ thư mục được ghi.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('covers', 'covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "images: read own folder" on storage.objects
for select to authenticated
using (bucket_id in ('covers', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "images: insert own folder" on storage.objects
for insert to authenticated
with check (bucket_id in ('covers', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "images: update own folder" on storage.objects
for update to authenticated
using (bucket_id in ('covers', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "images: delete own folder" on storage.objects
for delete to authenticated
using (bucket_id in ('covers', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text);
