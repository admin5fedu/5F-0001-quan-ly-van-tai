begin;

alter table public.vt_chuyen_xe_ct
  alter column trang_thai set default 'Chưa thực hiện';

-- Hoàn tách TT thực hiện khỏi giá trị duyệt (sau migration 20260610 gộp nhầm).
update public.vt_chuyen_xe_ct
set trang_thai = case
  when trang_thai in ('Đã duyệt', 'Da duyet') then 'Đã thực hiện'
  when trang_thai in ('Không duyệt', 'Khong duyet') then 'Hủy'
  when trang_thai in ('Chưa duyệt', 'Chờ duyệt', 'Chua duyet') then 'Chưa thực hiện'
  when trang_thai in ('Đã thực hiện', 'Đang thực hiện', 'Chưa thực hiện', 'Hủy', 'Không thực hiện') then trang_thai
  else 'Chưa thực hiện'
end
where trang_thai is distinct from case
  when trang_thai in ('Đã duyệt', 'Da duyet') then 'Đã thực hiện'
  when trang_thai in ('Không duyệt', 'Khong duyet') then 'Hủy'
  when trang_thai in ('Chưa duyệt', 'Chờ duyệt', 'Chua duyet') then 'Chưa thực hiện'
  when trang_thai in ('Đã thực hiện', 'Đang thực hiện', 'Chưa thực hiện', 'Hủy', 'Không thực hiện') then trang_thai
  else 'Chưa thực hiện'
end;

commit;