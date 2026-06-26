import {
  EMPTY_TRANSPORT_LOOKUPS,
  resolveTransportValue,
  type TransportLookupRows,
  type TransportRow,
} from './transport-config';

/** Map CT rows for thống kê chuyến — tách trạng thái TH (`trang_thai`) và duyệt (`phe_duyet`). */
export function getTripReportRows(
  details: TransportRow[],
  lookups: Partial<TransportLookupRows> = EMPTY_TRANSPORT_LOOKUPS,
) {
  const trips = lookups.trips || [];
  return details.map((detail) => {
    const trip = (trips.find((row) => String(row.id) === String(detail.id_chuyen_xe)) || {}) as Partial<TransportRow>;
    return {
      id: detail.id,
      id_tai_xe: trip.id_tai_xe,
      id_xe: trip.id_xe,
      id_dia_diem: detail.id_dia_diem,
      ngay: trip.ngay,
      tai_xe: resolveTransportValue('id_tai_xe', trip.id_tai_xe, lookups),
      xe: resolveTransportValue('id_xe', trip.id_xe, lookups),
      dia_diem: resolveTransportValue('id_dia_diem', detail.id_dia_diem, lookups),
      tien_luong: Number(detail.tien_luong ?? 0),
      chi_phi: Number(detail.chi_phi ?? 0),
      trang_thai: String(detail.trang_thai ?? 'Chưa thực hiện'),
      phe_duyet: String(detail.phe_duyet ?? 'Chưa duyệt'),
    };
  });
}