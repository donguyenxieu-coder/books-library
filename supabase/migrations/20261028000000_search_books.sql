-- ============================================================
-- Ngày 2 — tìm sách không phân biệt dấu
-- Chạy trong Supabase Dashboard → SQL Editor.
-- ============================================================

-- "mat biec", "MẮT BIẾC", "mắt" đều tìm ra "Mắt biếc".
-- unaccent trước rồi mới lower: lower() của Postgres không chắc hạ được
-- chữ hoa có dấu (Ắ, Ữ...) tuỳ locale, còn unaccent đưa về A–Z trước.
--
-- security invoker: hàm chạy với quyền của người gọi → RLS của books vẫn áp dụng,
-- không thể dùng hàm này để đọc sách private của người khác.
create or replace function public.search_books(p_query text default '', p_scope text default 'mine')
returns setof public.books
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    -- Escape ký tự đặc biệt của LIKE để "50%" không thành "mọi thứ".
    select replace(replace(replace(
      lower(extensions.unaccent(trim(coalesce(p_query, '')))),
      '\', '\\'), '%', '\%'), '_', '\_') as term
  )
  select b.*
  from public.books b, q
  where b.deleted_at is null
    and case
      when p_scope = 'public' then b.visibility = 'public' and b.owner_id <> (select auth.uid())
      else b.owner_id = (select auth.uid())
    end
    and (
      q.term = ''
      or lower(extensions.unaccent(b.title || ' ' || coalesce(b.author, ''))) like '%' || q.term || '%'
    )
  order by b.created_at desc
  limit 100;
$$;

grant execute on function public.search_books(text, text) to authenticated;
