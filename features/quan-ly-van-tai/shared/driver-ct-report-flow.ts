import type { TransportRow } from './transport-config';
import { canDriverReportCt } from './trip-execution-sync';

/** CT con của chuyến mà tài xế còn được báo cáo (chưa khóa duyệt). */
export function getReportableCtRowsForTrip(
  tripId: unknown,
  tripDetails: TransportRow[],
): TransportRow[] {
  return tripDetails.filter(
    (d) => String(d.id_chuyen_xe) === String(tripId) && canDriverReportCt(d),
  );
}

/** Cần bước chọn CT trước popup TH + chi phí. */
export function shouldPickCtBeforeReport(reportableCount: number): boolean {
  return reportableCount > 1;
}