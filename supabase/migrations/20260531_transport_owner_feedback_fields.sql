-- Owner feedback transport fields.
-- Safe additive migration: keep int8 identity primary keys and preserve existing data.

begin;

alter table if exists public.vt_tai_xe
  add column if not exists so_dien_thoai text,
  add column if not exists email text,
  add column if not exists ngay_sinh date,
  add column if not exists dia_chi text,
  add column if not exists so_gplx text,
  add column if not exists hang_bang text,
  add column if not exists ngay_het_han_bang date,
  add column if not exists id_xe_mac_dinh int8 references public.vt_xe(id) on delete set null,
  add column if not exists thong_tin_khac text;

alter table if exists public.vt_dia_diem
  add column if not exists chi_phi numeric not null default 0,
  add column if not exists dia_chi text;

alter table if exists public.vt_xe
  add column if not exists loai_xe text,
  add column if not exists tai_trong text,
  add column if not exists han_dang_kiem date,
  add column if not exists han_bao_hiem date,
  add column if not exists ghi_chu text;

alter table if exists public.vt_luong
  add column if not exists tru_tien_khac numeric not null default 0,
  add column if not exists tong_con_lai numeric not null default 0;

update public.vt_tai_xe
set
  so_dien_thoai = coalesce(so_dien_thoai, '0900000101'),
  email = coalesce(email, 'xuyen@example.com'),
  ngay_sinh = coalesce(ngay_sinh, '1988-04-12'::date),
  dia_chi = coalesce(dia_chi, 'Quận 5, TP.HCM'),
  so_gplx = coalesce(so_gplx, 'GPLX-001'),
  hang_bang = coalesce(hang_bang, 'B2'),
  ngay_het_han_bang = coalesce(ngay_het_han_bang, '2028-04-12'::date),
  id_xe_mac_dinh = coalesce(id_xe_mac_dinh, 1)
where id = 1;

update public.vt_tai_xe
set
  so_dien_thoai = coalesce(so_dien_thoai, '0900000102'),
  email = coalesce(email, 'linh@example.com'),
  ngay_sinh = coalesce(ngay_sinh, '1990-07-21'::date),
  dia_chi = coalesce(dia_chi, 'Nhà Bè, TP.HCM'),
  so_gplx = coalesce(so_gplx, 'GPLX-002'),
  hang_bang = coalesce(hang_bang, 'C'),
  ngay_het_han_bang = coalesce(ngay_het_han_bang, '2029-07-21'::date),
  id_xe_mac_dinh = coalesce(id_xe_mac_dinh, 2)
where id = 2;

update public.vt_dia_diem
set
  chi_phi = coalesce(nullif(chi_phi, 0), 80000),
  dia_chi = coalesce(dia_chi, dinh_vi)
where id in (1, 2, 3);

update public.vt_xe
set
  loai_xe = coalesce(loai_xe, 'Xe tải nhẹ'),
  tai_trong = coalesce(tai_trong, '1.5 tấn'),
  han_dang_kiem = coalesce(han_dang_kiem, '2027-01-15'::date),
  han_bao_hiem = coalesce(han_bao_hiem, '2027-02-15'::date)
where id = 1;

update public.vt_xe
set
  loai_xe = coalesce(loai_xe, 'Xe tải thùng'),
  tai_trong = coalesce(tai_trong, '2.5 tấn'),
  han_dang_kiem = coalesce(han_dang_kiem, '2026-12-20'::date),
  han_bao_hiem = coalesce(han_bao_hiem, '2027-01-20'::date)
where id = 2;

update public.vt_luong
set
  tru_tien_khac = coalesce(tru_tien_khac, tong_chi_phi_khac, 0),
  tong_con_lai = coalesce(tong_con_lai, tong_luong_chuyen - coalesce(tru_tien_khac, tong_chi_phi_khac, 0), 0);

commit;
