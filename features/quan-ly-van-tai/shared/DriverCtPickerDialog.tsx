import React, { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import Combobox from '@/components/ui/Combobox';
import {
  resolveLocationGroup,
  resolveTransportValue,
  type TransportLookupRows,
  type TransportRow,
} from './transport-config';
import { normalizeExecutionStatus } from './trip-execution-sync';

export function resolveCtLocationLabel(
  ctRow: TransportRow,
  lookups: Partial<TransportLookupRows>,
): string {
  const groupName = resolveLocationGroup(ctRow.id_dia_diem, lookups);
  const locationName = resolveTransportValue('id_dia_diem', ctRow.id_dia_diem, lookups);
  return groupName ? `${groupName} · ${locationName}` : locationName;
}

type DriverCtPickerDialogProps = {
  reportableRows: TransportRow[];
  lookups: Partial<TransportLookupRows>;
  selectedCtId: string;
  onSelectedCtIdChange: (ctId: string) => void;
};

export const DriverCtPickerDialog: React.FC<DriverCtPickerDialogProps> = ({
  reportableRows,
  lookups,
  selectedCtId,
  onSelectedCtIdChange,
}) => {
  const options = useMemo(
    () =>
      reportableRows.map((ct) => {
        const status = normalizeExecutionStatus(ct.trang_thai);
        return {
          value: String(ct.id),
          label: resolveCtLocationLabel(ct, lookups),
          subLabel: status,
        };
      }),
    [reportableRows, lookups],
  );

  const [value, setValue] = useState(selectedCtId || String(reportableRows[0]?.id ?? ''));

  useEffect(() => {
    onSelectedCtIdChange(value);
  }, [value, onSelectedCtIdChange]);

  return (
    <div className="space-y-4 text-left py-1 w-full min-w-[320px] sm:min-w-[400px]">
      <p className="text-sm text-muted-foreground">
        Chọn dòng chi tiết chuyến cần báo cáo trạng thái thực hiện và chi phí.
      </p>
      <Combobox
        label="Chi tiết chuyến (CT)"
        options={options}
        value={value}
        onChange={(next) => setValue(String(next))}
        placeholder="Chọn CT..."
        searchPlaceholder="Tìm địa điểm..."
        icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
        dropdownInPortal
        clearable={false}
        required
      />
    </div>
  );
};