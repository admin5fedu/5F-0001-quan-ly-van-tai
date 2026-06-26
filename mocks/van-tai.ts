import type { TransportRow } from '@/features/quan-ly-van-tai/shared/transport-config';

const ts = '2026-05-30T08:00:00.000Z';

/** Tài xế — id trùng employee id (emp-tx-*) khi mock; module tài xế đọc từ var_nhan_vien la_tai_xe */
export const DRIVER_ROWS: TransportRow[] = [];

export const LOCATION_ROWS: TransportRow[] = [
  { id: 'dd-cho-lon', chi_phi: 80000, dia_chi: 'Quận 5, TP.HCM', nhom: 'Nội thành', ten: 'Chợ Lớn', mo_ta: 'Điểm giao hàng thường xuyên', tien_luong: 120000, ghi_chu: '', dinh_vi: 'Quận 5', trang_thai: 'Đang hoạt động', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'dd-phu-xuan', chi_phi: 80000, dia_chi: 'Nhà Bè, TP.HCM', nhom: 'Ngoại thành', ten: 'Phú Xuân', mo_ta: 'Tuyến phát sinh nhiều tháng 5/2026', tien_luong: 180000, ghi_chu: '', dinh_vi: 'Nhà Bè', trang_thai: 'Đang hoạt động', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'dd-pv-dong', chi_phi: 80000, dia_chi: 'Phạm Văn Đồng, TP.HCM', nhom: 'Nội thành', ten: 'PVĐồng', mo_ta: 'Điểm lặp theo sheet vận tải', tien_luong: 150000, ghi_chu: '', dinh_vi: 'Phạm Văn Đồng', trang_thai: 'Đang hoạt động', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'dd-binh-duong', chi_phi: 120000, dia_chi: 'Thủ Dầu Một, Bình Dương', nhom: 'Tỉnh lân cận', ten: 'Bình Dương', mo_ta: 'Kho trung chuyển Bình Dương', tien_luong: 220000, ghi_chu: '', dinh_vi: 'Thủ Dầu Một', trang_thai: 'Đang hoạt động', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'dd-tan-binh', chi_phi: 70000, dia_chi: 'Quận Tân Bình, TP.HCM', nhom: 'Nội thành', ten: 'Tân Bình', mo_ta: 'Giao hàng sân bay / khu công nghiệp', tien_luong: 130000, ghi_chu: '', dinh_vi: 'Tân Bình', trang_thai: 'Đang hoạt động', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'dd-thu-duc', chi_phi: 90000, dia_chi: 'TP. Thủ Đức', nhom: 'Ngoại thành', ten: 'Thủ Đức', mo_ta: 'Khu công nghệ cao', tien_luong: 160000, ghi_chu: '', dinh_vi: 'Thủ Đức', trang_thai: 'Đang hoạt động', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'dd-long-an', chi_phi: 100000, dia_chi: 'Tân An, Long An', nhom: 'Tỉnh lân cận', ten: 'Long An', mo_ta: 'Tuyến phía Tây', tien_luong: 200000, ghi_chu: '', dinh_vi: 'Tân An', trang_thai: 'Đang hoạt động', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'dd-bien-hoa', chi_phi: 110000, dia_chi: 'Biên Hòa, Đồng Nai', nhom: 'Tỉnh lân cận', ten: 'Biên Hòa', mo_ta: 'KCN Biên Hòa', tien_luong: 210000, ghi_chu: '', dinh_vi: 'Biên Hòa', trang_thai: 'Đang hoạt động', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
];

export const VEHICLE_ROWS: TransportRow[] = [
  { id: 'xe-1', loai_xe: 'Xe tải nhẹ', tai_trong: '1.5 tấn', han_dang_kiem: '2027-01-15', han_bao_hiem: '2027-02-15', hang: 'Hyundai', model: 'Porter', doi: '2021', bien_so: '51C-123.45', thong_tin_khac: 'Bảo hiểm còn hạn', trang_thai: 'Đang hoạt động', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'xe-2', loai_xe: 'Xe tải thùng', tai_trong: '2.5 tấn', han_dang_kiem: '2026-12-20', han_bao_hiem: '2027-01-20', hang: 'Isuzu', model: 'QKR', doi: '2020', bien_so: '51D-678.90', thong_tin_khac: 'Xe dự phòng', trang_thai: 'Đang hoạt động', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'xe-3', loai_xe: 'Xe tải trung', tai_trong: '5 tấn', han_dang_kiem: '2027-06-10', han_bao_hiem: '2027-07-10', hang: 'Hino', model: '300', doi: '2019', bien_so: '51C-456.78', thong_tin_khac: 'Tuyến tỉnh', trang_thai: 'Đang hoạt động', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'xe-4', loai_xe: 'Xe bán tải', tai_trong: '1 tấn', han_dang_kiem: '2026-09-01', han_bao_hiem: '2026-10-01', hang: 'Ford', model: 'Ranger', doi: '2022', bien_so: '51F-321.65', thong_tin_khac: 'Giao nội thành nhanh', trang_thai: 'Đang hoạt động', tg_tao: ts, tg_cap_nhat: ts },
];

export const TRIP_ROWS: TransportRow[] = [
  { id: 'cx-2026-05-01', ngay: '2026-05-01', id_tai_xe: 'emp-tx-1', id_xe: 'xe-1', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Chợ Lớn, Phú Xuân, PVĐồng', trang_thai: 'Đã duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-05-02', ngay: '2026-05-02', id_tai_xe: 'emp-tx-2', id_xe: 'xe-2', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Bình Dương, Chợ Lớn', trang_thai: 'Chưa duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-05-03', ngay: '2026-05-03', id_tai_xe: 'emp-tx-1', id_xe: 'xe-1', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Tân Bình, Thủ Đức', trang_thai: 'Đã duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-05-05', ngay: '2026-05-05', id_tai_xe: 'emp-tx-3', id_xe: 'xe-3', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Long An, Biên Hòa', trang_thai: 'Đã duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-05-08', ngay: '2026-05-08', id_tai_xe: 'emp-tx-2', id_xe: 'xe-2', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Phú Xuân, PVĐồng', trang_thai: 'Đã duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-05-10', ngay: '2026-05-10', id_tai_xe: 'emp-tx-1', id_xe: 'xe-4', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Nội thành', trang_thai: 'Chưa duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-05-12', ngay: '2026-05-12', id_tai_xe: 'emp-tx-3', id_xe: 'xe-3', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Bình Dương', trang_thai: 'Chưa duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-05-15', ngay: '2026-05-15', id_tai_xe: 'emp-tx-2', id_xe: 'xe-2', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Chợ Lớn, Tân Bình', trang_thai: 'Đã duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-05-18', ngay: '2026-05-18', id_tai_xe: 'emp-tx-1', id_xe: 'xe-1', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Thủ Đức, Biên Hòa', trang_thai: 'Đã duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-05-20', ngay: '2026-05-20', id_tai_xe: 'emp-tx-3', id_xe: 'xe-3', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Long An', trang_thai: 'Không duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-06-02', ngay: '2026-06-02', id_tai_xe: 'emp-tx-1', id_xe: 'xe-1', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Đầu tháng 6', trang_thai: 'Chưa duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cx-2026-06-05', ngay: '2026-06-05', id_tai_xe: 'emp-tx-2', id_xe: 'xe-2', so_chuyen: 0, tong_tien_luong: 0, tong_phi: 0, ghi_chu: 'Phú Xuân', trang_thai: 'Chưa duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
];

export const TRIP_DETAIL_ROWS: TransportRow[] = [
  { id: 'cxct-1', id_chuyen_xe: 'cx-2026-05-01', id_dia_diem: 'dd-cho-lon', tien_luong: 120000, chi_phi: 80000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-2', id_chuyen_xe: 'cx-2026-05-01', id_dia_diem: 'dd-phu-xuan', tien_luong: 180000, chi_phi: 80000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-3', id_chuyen_xe: 'cx-2026-05-01', id_dia_diem: 'dd-pv-dong', tien_luong: 150000, chi_phi: 80000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-4', id_chuyen_xe: 'cx-2026-05-02', id_dia_diem: 'dd-binh-duong', tien_luong: 220000, chi_phi: 120000, ghi_chu: '', trang_thai: 'Chưa thực hiện', phe_duyet: 'Chưa duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-5', id_chuyen_xe: 'cx-2026-05-02', id_dia_diem: 'dd-cho-lon', tien_luong: 120000, chi_phi: 80000, ghi_chu: '', trang_thai: 'Chưa thực hiện', phe_duyet: 'Chưa duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-6', id_chuyen_xe: 'cx-2026-05-03', id_dia_diem: 'dd-tan-binh', tien_luong: 130000, chi_phi: 70000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-7', id_chuyen_xe: 'cx-2026-05-03', id_dia_diem: 'dd-thu-duc', tien_luong: 160000, chi_phi: 90000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-8', id_chuyen_xe: 'cx-2026-05-05', id_dia_diem: 'dd-long-an', tien_luong: 200000, chi_phi: 100000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-9', id_chuyen_xe: 'cx-2026-05-05', id_dia_diem: 'dd-bien-hoa', tien_luong: 210000, chi_phi: 110000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-10', id_chuyen_xe: 'cx-2026-05-08', id_dia_diem: 'dd-phu-xuan', tien_luong: 180000, chi_phi: 80000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-11', id_chuyen_xe: 'cx-2026-05-08', id_dia_diem: 'dd-pv-dong', tien_luong: 150000, chi_phi: 80000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-12', id_chuyen_xe: 'cx-2026-05-15', id_dia_diem: 'dd-cho-lon', tien_luong: 120000, chi_phi: 80000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-13', id_chuyen_xe: 'cx-2026-05-15', id_dia_diem: 'dd-tan-binh', tien_luong: 130000, chi_phi: 70000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-14', id_chuyen_xe: 'cx-2026-05-18', id_dia_diem: 'dd-thu-duc', tien_luong: 160000, chi_phi: 90000, ghi_chu: '', trang_thai: 'Đã thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'cxct-15', id_chuyen_xe: 'cx-2026-05-18', id_dia_diem: 'dd-bien-hoa', tien_luong: 210000, chi_phi: 110000, ghi_chu: '', trang_thai: 'Đang thực hiện', phe_duyet: 'Đã duyệt', tg_tao: ts, tg_cap_nhat: ts },
];

export const PAYROLL_ROWS: TransportRow[] = [
  { id: 'luong-2026-05-tx1', nam: 2026, thang: 5, id_tai_xe: 'emp-tx-1', tong_luong_chuyen: 0, tong_chi_phi_chuyen: 0, tru_tien_khac: 0, tong_chi_phi_khac: 50000, tong_con_lai: 0, ghi_chu_khoan_tru: '', ghi_chu_chi_phi: 'Xăng dầu bổ sung', trang_thai: 'Chưa duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'luong-2026-05-tx2', nam: 2026, thang: 5, id_tai_xe: 'emp-tx-2', tong_luong_chuyen: 0, tong_chi_phi_chuyen: 0, tru_tien_khac: 50000, tong_chi_phi_khac: 0, tong_con_lai: 0, ghi_chu_khoan_tru: 'Phụ phí bốc xếp', ghi_chu_chi_phi: '', trang_thai: 'Chưa duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'luong-2026-05-tx3', nam: 2026, thang: 5, id_tai_xe: 'emp-tx-3', tong_luong_chuyen: 0, tong_chi_phi_chuyen: 0, tru_tien_khac: 0, tong_chi_phi_khac: 0, tong_con_lai: 0, ghi_chu_khoan_tru: '', ghi_chu_chi_phi: '', trang_thai: 'Đã duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
  { id: 'luong-2026-06-tx1', nam: 2026, thang: 6, id_tai_xe: 'emp-tx-1', tong_luong_chuyen: 0, tong_chi_phi_chuyen: 0, tru_tien_khac: 0, tong_chi_phi_khac: 0, tong_con_lai: 0, ghi_chu_khoan_tru: '', ghi_chu_chi_phi: '', trang_thai: 'Chưa duyệt', id_nguoi_tao: 'emp-000', tg_tao: ts, tg_cap_nhat: ts },
];
