-- Fix driver foreign keys and add triggers for real-time totals calculation
begin;

-- 1. Ensure driver Xuyến (id_nhan_vien = 1) is correctly updated in var_nhan_vien
update public.var_nhan_vien
set
  la_tai_xe = true,
  ngay_sinh = coalesce(ngay_sinh, '1988-04-12'::date),
  dia_chi = coalesce(dia_chi, 'Quận 5, TP.HCM'),
  so_gplx = coalesce(so_gplx, 'GPLX-001'),
  hang_bang = coalesce(hang_bang, 'B2'),
  ngay_het_han_bang = coalesce(ngay_het_han_bang, '2028-04-12'::date),
  ghi_chu = coalesce(ghi_chu, 'Tài xế chính từ dữ liệu sheet')
where id = 1;

-- 2. Insert Linh (id = 2) into var_nhan_vien
insert into public.var_nhan_vien (
  id,
  ho_va_ten,
  trang_thai,
  so_dien_thoai,
  email,
  la_tai_xe,
  ngay_sinh,
  dia_chi,
  so_gplx,
  hang_bang,
  ngay_het_han_bang,
  ghi_chu,
  ten_dang_nhap
)
values (
  2,
  'Linh',
  'Đang làm việc',
  '0900000102',
  'linh@example.com',
  true,
  '1990-07-21'::date,
  'Nhà Bè, TP.HCM',
  'GPLX-002',
  'C',
  '2029-07-21'::date,
  'Tài xế dự phòng',
  'linh'
)
on conflict (id) do update set
  la_tai_xe = true,
  ho_va_ten = 'Linh',
  ten_dang_nhap = 'linh';

-- 3. Insert Nguyễn Văn Test (id = 11) into var_nhan_vien
insert into public.var_nhan_vien (
  id,
  ho_va_ten,
  trang_thai,
  la_tai_xe,
  ten_dang_nhap
)
values (
  11,
  'Nguyễn Văn Test',
  'Đang làm việc',
  true,
  'nguyenvantest'
)
on conflict (id) do update set
  la_tai_xe = true,
  ho_va_ten = 'Nguyễn Văn Test',
  ten_dang_nhap = 'nguyenvantest';

-- 4. Drop existing foreign keys referencing the old vt_tai_xe table
alter table public.vt_chuyen_xe drop constraint if exists vt_chuyen_xe_id_tai_xe_fkey;
alter table public.vt_luong drop constraint if exists vt_luong_id_tai_xe_fkey;

-- 5. Add foreign keys pointing to var_nhan_vien(id)
alter table public.vt_chuyen_xe
  add constraint vt_chuyen_xe_id_tai_xe_fkey
  foreign key (id_tai_xe) references public.var_nhan_vien(id) on delete restrict;

alter table public.vt_luong
  add constraint vt_luong_id_tai_xe_fkey
  foreign key (id_tai_xe) references public.var_nhan_vien(id) on delete restrict;

-- 6. Drop the deprecated vt_tai_xe table
drop table if exists public.vt_tai_xe;

-- 7. Create trigger to update vt_chuyen_xe totals when vt_chuyen_xe_ct (details) changes
create or replace function public.fn_sync_chuyen_xe_totals()
returns trigger
language plpgsql
security definer
as $$
declare
  v_chuyen_xe_id int8;
begin
  v_chuyen_xe_id := coalesce(new.id_chuyen_xe, old.id_chuyen_xe);

  update public.vt_chuyen_xe
  set
    so_chuyen = (
      select count(*)
      from public.vt_chuyen_xe_ct
      where id_chuyen_xe = v_chuyen_xe_id
    ),
    tong_tien_luong = coalesce(
      (select sum(tien_luong)
       from public.vt_chuyen_xe_ct
       where id_chuyen_xe = v_chuyen_xe_id),
      0
    ),
    tong_phi = coalesce(
      (select sum(chi_phi)
       from public.vt_chuyen_xe_ct
       where id_chuyen_xe = v_chuyen_xe_id),
      0
    )
  where id = v_chuyen_xe_id;

  return null;
end;
$$;

drop trigger if exists trg_sync_chuyen_xe_totals on public.vt_chuyen_xe_ct;
create trigger trg_sync_chuyen_xe_totals
after insert or update or delete on public.vt_chuyen_xe_ct
for each row execute function public.fn_sync_chuyen_xe_totals();

-- 8. Create trigger to sync/recalculate vt_luong totals when vt_chuyen_xe (trips) changes
create or replace function public.fn_sync_vt_luong()
returns trigger
language plpgsql
security definer
as $$
declare
  v_id_tai_xe int8;
  v_thang int4;
  v_nam int4;
begin
  if tg_op = 'DELETE' then
    v_id_tai_xe := old.id_tai_xe;
    v_thang := extract(month from old.ngay)::int4;
    v_nam := extract(year from old.ngay)::int4;
  else
    v_id_tai_xe := new.id_tai_xe;
    v_thang := extract(month from new.ngay)::int4;
    v_nam := extract(year from new.ngay)::int4;
  end if;

  insert into public.vt_luong (
    nam, thang, id_tai_xe,
    tong_luong_chuyen, tong_chi_phi_chuyen, tru_tien_khac, tong_con_lai,
    trang_thai, tg_cap_nhat
  )
  values (
    v_nam,
    v_thang,
    v_id_tai_xe,
    coalesce((select sum(tong_tien_luong) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
    coalesce((select sum(tong_phi) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
    0,
    coalesce((select sum(tong_tien_luong) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
    'Chưa duyệt',
    now()
  )
  on conflict (nam, thang, id_tai_xe) do update set
    tong_luong_chuyen = excluded.tong_luong_chuyen,
    tong_chi_phi_chuyen = excluded.tong_chi_phi_chuyen,
    tong_con_lai = excluded.tong_luong_chuyen - public.vt_luong.tru_tien_khac,
    tg_cap_nhat = now();

  if tg_op = 'UPDATE' and (old.id_tai_xe <> new.id_tai_xe or old.ngay <> new.ngay) then
    v_id_tai_xe := old.id_tai_xe;
    v_thang := extract(month from old.ngay)::int4;
    v_nam := extract(year from old.ngay)::int4;

    insert into public.vt_luong (
      nam, thang, id_tai_xe,
      tong_luong_chuyen, tong_chi_phi_chuyen, tru_tien_khac, tong_con_lai,
      trang_thai, tg_cap_nhat
    )
    values (
      v_nam,
      v_thang,
      v_id_tai_xe,
      coalesce((select sum(tong_tien_luong) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
      coalesce((select sum(tong_phi) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
      0,
      coalesce((select sum(tong_tien_luong) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
      'Chưa duyệt',
      now()
    )
    on conflict (nam, thang, id_tai_xe) do update set
      tong_luong_chuyen = excluded.tong_luong_chuyen,
      tong_chi_phi_chuyen = excluded.tong_chi_phi_chuyen,
      tong_con_lai = excluded.tong_luong_chuyen - public.vt_luong.tru_tien_khac,
      tg_cap_nhat = now();
  end if;

  return null;
end;
$$;

drop trigger if exists trg_sync_vt_luong on public.vt_chuyen_xe;
create trigger trg_sync_vt_luong
after insert or update or delete on public.vt_chuyen_xe
for each row execute function public.fn_sync_vt_luong();

commit;
