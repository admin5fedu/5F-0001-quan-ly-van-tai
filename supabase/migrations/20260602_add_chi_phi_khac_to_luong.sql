-- Migration: Add ghi_chu_khoan_tru to vt_luong and migrate previous notes
begin;

alter table public.vt_luong
  add column if not exists ghi_chu_khoan_tru text;

-- Migrate existing ghi_chu_chi_phi to ghi_chu_khoan_tru (since ghi_chu_chi_phi was used for deduction notes)
update public.vt_luong
set ghi_chu_khoan_tru = ghi_chu_chi_phi
where ghi_chu_khoan_tru is null;

commit;
