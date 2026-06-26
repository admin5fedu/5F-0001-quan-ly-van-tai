-- Phương án A: cho tài xế tự báo cáo chuyến (tiến độ + chi phí) của chính mình.
-- Chức vụ "Tài xế" (id=7, cap_bac=4) trước đây chỉ có quyền xem + sua trên module chuyen-xe,
-- nên không tạo được chuyến mới và không thêm được dòng chi tiết (canAddChildRow cần quyền 'them').
-- Cấp thêm quyền 'them' (create) ở mức chức vụ. Việc lọc dòng vẫn theo ownership ở app-side
-- (id_nguoi_tao / id_tai_xe) nên tài xế chỉ thấy & thao tác chuyến của chính mình.
insert into public.var_phan_quyen (id_chuc_vu, id_module, quyen)
values (7, 'chuyen-xe', 'them')
on conflict (id_chuc_vu, id_module, quyen) do nothing;
