-- Update check constraint on var_phan_quyen table to accept 'kiem_tra'
alter table public.var_phan_quyen 
  drop constraint if exists var_phan_quyen_quyen_check;

alter table public.var_phan_quyen 
  add constraint var_phan_quyen_quyen_check 
  check (quyen in ('xem', 'them', 'sua', 'xoa', 'kiem_tra', 'quan_tri'));
