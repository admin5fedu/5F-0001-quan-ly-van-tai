-- Migration: Set ON DELETE CASCADE for var_nhan_vien foreign keys in vt_chuyen_xe and vt_luong
begin;

-- 1. Alter vt_chuyen_xe foreign key constraint
alter table public.vt_chuyen_xe
  drop constraint if exists vt_chuyen_xe_id_tai_xe_fkey;

alter table public.vt_chuyen_xe
  add constraint vt_chuyen_xe_id_tai_xe_fkey
  foreign key (id_tai_xe) references public.var_nhan_vien(id) on delete cascade;

-- 2. Alter vt_luong foreign key constraint
alter table public.vt_luong
  drop constraint if exists vt_luong_id_tai_xe_fkey;

alter table public.vt_luong
  add constraint vt_luong_id_tai_xe_fkey
  foreign key (id_tai_xe) references public.var_nhan_vien(id) on delete cascade;

commit;
