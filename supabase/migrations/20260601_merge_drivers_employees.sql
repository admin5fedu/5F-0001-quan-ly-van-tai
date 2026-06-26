-- Merge Driver table into Employee table
-- Add columns to var_nhan_vien
alter table public.var_nhan_vien
  add column if not exists la_tai_xe boolean not null default false,
  add column if not exists ngay_sinh date,
  add column if not exists dia_chi text,
  add column if not exists so_gplx text,
  add column if not exists hang_bang text,
  add column if not exists ngay_het_han_bang date,
  add column if not exists id_xe_mac_dinh int8 references public.vt_xe(id) on delete set null,
  add column if not exists thong_tin_khac text,
  add column if not exists ghi_chu text;

-- Migrate existing data
update public.var_nhan_vien nv
set
  la_tai_xe = true,
  ngay_sinh = tx.ngay_sinh,
  dia_chi = tx.dia_chi,
  so_gplx = tx.so_gplx,
  hang_bang = tx.hang_bang,
  ngay_het_han_bang = tx.ngay_het_han_bang,
  id_xe_mac_dinh = tx.id_xe_mac_dinh,
  thong_tin_khac = tx.thong_tin_khac,
  ghi_chu = tx.ghi_chu
from public.vt_tai_xe tx
where tx.id_nhan_vien = nv.id;

-- Insert drivers without employee records into var_nhan_vien
insert into public.var_nhan_vien (
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
  id_xe_mac_dinh,
  thong_tin_khac,
  ghi_chu
)
select
  tx.ho_ten,
  case when tx.trang_thai = 'Đang hoạt động' then 'Đang làm việc' else 'Ngừng làm việc' end,
  tx.so_dien_thoai,
  tx.email,
  true,
  tx.ngay_sinh,
  tx.dia_chi,
  tx.so_gplx,
  tx.hang_bang,
  tx.ngay_het_han_bang,
  tx.id_xe_mac_dinh,
  tx.thong_tin_khac,
  tx.ghi_chu
from public.vt_tai_xe tx
where tx.id_nhan_vien is null
   or not exists (
     select 1 from public.var_nhan_vien nv
     where nv.id = tx.id_nhan_vien
   );
