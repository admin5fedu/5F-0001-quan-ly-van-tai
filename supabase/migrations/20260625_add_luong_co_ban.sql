begin;

-- Thêm cột luong_co_ban cho var_nhan_vien
alter table public.var_nhan_vien
  add column if not exists luong_co_ban numeric not null default 0;

-- Thêm cột luong_co_ban cho vt_luong
alter table public.vt_luong
  add column if not exists luong_co_ban numeric not null default 0;

-- Cập nhật trigger function fn_upsert_vt_luong_from_approved_ct
create or replace function public.fn_upsert_vt_luong_from_approved_ct(
  p_id_tai_xe int8,
  p_thang int4,
  p_nam int4
)
returns void
language plpgsql
security definer
as $$
declare
  v_tong_luong numeric := 0;
  v_tong_chi_phi numeric := 0;
  v_luong_co_ban numeric := 0;
begin
  if p_id_tai_xe is null or p_thang is null or p_nam is null then
    return;
  end if;

  if not exists (select 1 from public.var_nhan_vien where id = p_id_tai_xe) then
    return;
  end if;

  -- Lấy lương cơ bản hiện tại của nhân viên/tài xế
  select coalesce(luong_co_ban, 0)
  into v_luong_co_ban
  from public.var_nhan_vien
  where id = p_id_tai_xe;

  -- Tính tổng lương chuyến và tổng chi phí chuyến đi của các chuyến đã duyệt trong kỳ
  select
    coalesce(sum(ct.tien_luong), 0),
    coalesce(sum(ct.chi_phi), 0)
  into v_tong_luong, v_tong_chi_phi
  from public.vt_chuyen_xe cx
  join public.vt_chuyen_xe_ct ct on ct.id_chuyen_xe = cx.id
  where cx.id_tai_xe = p_id_tai_xe
    and extract(month from cx.ngay)::int4 = p_thang
    and extract(year from cx.ngay)::int4 = p_nam
    and cx.trang_thai = 'Đã duyệt'
    and ct.phe_duyet = 'Đã duyệt';

  -- Chèn hoặc cập nhật bảng lương
  insert into public.vt_luong (
    nam, thang, id_tai_xe, luong_co_ban,
    tong_luong_chuyen, tong_chi_phi_chuyen, tru_tien_khac, tong_con_lai,
    trang_thai, tg_cap_nhat
  )
  values (
    p_nam,
    p_thang,
    p_id_tai_xe,
    v_luong_co_ban,
    v_tong_luong,
    v_tong_chi_phi,
    0,
    v_luong_co_ban + v_tong_luong - v_tong_chi_phi,
    'Chưa duyệt',
    now()
  )
  on conflict (nam, thang, id_tai_xe) do update set
    luong_co_ban = excluded.luong_co_ban,
    tong_luong_chuyen = excluded.tong_luong_chuyen,
    tong_chi_phi_chuyen = excluded.tong_chi_phi_chuyen,
    tong_con_lai = excluded.luong_co_ban + excluded.tong_luong_chuyen - excluded.tong_chi_phi_chuyen - coalesce(public.vt_luong.tru_tien_khac, 0),
    tg_cap_nhat = now();
end;
$$;

-- Tính toán lại toàn bộ bảng vt_luong hiện tại
do $$
declare
  r record;
begin
  for r in
    select distinct
      id_tai_xe,
      extract(month from ngay)::int4 as thang,
      extract(year from ngay)::int4 as nam
    from public.vt_chuyen_xe
  loop
    perform public.fn_upsert_vt_luong_from_approved_ct(r.id_tai_xe, r.thang, r.nam);
  end loop;
end $$;

commit;
