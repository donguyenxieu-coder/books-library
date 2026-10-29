-- ============================================================
-- Ngày 3 — sắp xếp và xoá chương
-- Chạy trong Supabase Dashboard → SQL Editor.
-- ============================================================

-- Sắp xếp lại toàn bộ chương của một cuốn sách theo thứ tự id gửi lên.
-- Viết thành hàm SQL để mọi thay đổi nằm trong MỘT transaction: ràng buộc
-- unique (book_id, position) là "deferrable initially deferred", nên giữa chừng
-- hai chương tạm trùng vị trí vẫn được, chỉ cần đúng lúc commit.
create or replace function public.reorder_chapters(p_book_id uuid, p_chapter_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.books where id = p_book_id and owner_id = (select auth.uid())
  ) then
    raise exception 'Không có quyền sắp xếp sách này' using errcode = '42501';
  end if;

  -- Danh sách phải đúng bằng tập chương hiện có: không thiếu, không thừa, không trùng.
  -- (Tránh trường hợp người khác vừa xoá/thêm chương ở tab khác.)
  if cardinality(p_chapter_ids) <> (select count(distinct id) from unnest(p_chapter_ids) as t(id))
    or cardinality(p_chapter_ids) <> (select count(*) from public.chapters where book_id = p_book_id)
    or exists (
      select 1 from unnest(p_chapter_ids) as t(id)
      where not exists (select 1 from public.chapters c where c.id = t.id and c.book_id = p_book_id)
    )
  then
    raise exception 'Danh sách chương đã thay đổi, hãy tải lại trang' using errcode = '22023';
  end if;

  -- with ordinality: đánh số 1, 2, 3... theo thứ tự trong mảng → đó là position mới.
  update public.chapters c
  set position = t.ord
  from unnest(p_chapter_ids) with ordinality as t(id, ord)
  where c.id = t.id and c.book_id = p_book_id and c.position <> t.ord;
end;
$$;

-- Xoá một chương rồi dồn các chương phía sau lên một bậc,
-- để "Chương N" luôn liên tục 1, 2, 3... không bị lủng lỗ.
-- RLS của chapters (chỉ chủ sách được xoá) vẫn áp dụng vì security invoker.
create or replace function public.delete_chapter(p_chapter_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_book_id uuid;
  v_position integer;
begin
  delete from public.chapters
  where id = p_chapter_id
  returning book_id, position into v_book_id, v_position;

  if v_book_id is null then
    raise exception 'Không tìm thấy chương hoặc không có quyền xoá' using errcode = 'P0002';
  end if;

  update public.chapters
  set position = position - 1
  where book_id = v_book_id and position > v_position;
end;
$$;

grant execute on function public.reorder_chapters(uuid, uuid[]) to authenticated;
grant execute on function public.delete_chapter(uuid) to authenticated;
