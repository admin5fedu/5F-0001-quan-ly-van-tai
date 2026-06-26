import React, { useMemo, useState } from 'react';
import { txt } from '../../../../lib/text';
import { Users, Briefcase, FileText, CircleDot, Save, X } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import Combobox from '../../../../components/ui/Combobox';
import Button from '../../../../components/ui/Button';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';
import { usePositions } from '../../chuc-vu/hooks/use-chuc-vu';
import { getAvatarUrl } from '../../../../lib/utils';
import { STATUS_OPTIONS } from '../core/constants';
import { useBulkUpdateEmployees } from '../hooks/use-nhan-vien';
import { Employee } from '../core/types';
import { resolveEmployeeDepartmentLabels } from '../utils/employee-department';
import { getDepartmentSubtreeIds } from '../../chuc-vu/utils/build-position-tree-rows';

export interface BulkEditFields {
  id_phong_ban?: string | null;
  id_chuc_vu?: string | null;
  trang_thai?: string;
}

interface Props {
  selectedEmployees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

const BulkEditSheet: React.FC<Props> = ({ selectedEmployees, onClose, onSuccess }) => {
  const [fields, setFields] = useState<BulkEditFields>({});
  const [enabledFields, setEnabledFields] = useState<Set<keyof BulkEditFields>>(new Set());

  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const bulkMutation = useBulkUpdateEmployees(() => {
    onSuccess();
    onClose();
  });

  const selectedDepartmentId = fields.id_phong_ban ? String(fields.id_phong_ban) : '';
  const scopedDepartmentIds = useMemo(
    () => (selectedDepartmentId ? getDepartmentSubtreeIds(departments, [selectedDepartmentId]) : new Set<string>()),
    [departments, selectedDepartmentId],
  );
  const departmentOptions = useMemo(
    () =>
      departments
        .filter((d) => d.trang_thai === 'Đang hoạt động')
        .map((d) => {
          const labels = resolveEmployeeDepartmentLabels(d.id, departments);
          return {
            label: d.ten_phong_ban,
            value: String(d.id),
            subLabel: labels.ten_bo_phan ? labels.ten_phong_ban : d.cha_id ? 'Bộ phận' : 'Phòng ban',
          };
        }),
    [departments],
  );
  const positionOptions = useMemo(
    () =>
      positions
        .filter((p) => p.trang_thai === 'Đang hoạt động')
        .filter((p) => selectedDepartmentId && p.phong_ban_id && scopedDepartmentIds.has(String(p.phong_ban_id)))
        .map((p) => ({
          label: p.ten_chuc_vu,
          value: String(p.id),
          subLabel: [
            p.ma_chuc_vu,
            resolveEmployeeDepartmentLabels(p.phong_ban_id, departments, p.ten_phong_ban).ten_phong_ban,
            resolveEmployeeDepartmentLabels(p.phong_ban_id, departments, p.ten_phong_ban).ten_bo_phan,
          ].filter(Boolean).join(' · '),
        })),
    [departments, positions, scopedDepartmentIds, selectedDepartmentId],
  );
  const statusOptions = STATUS_OPTIONS.map(s => ({ value: String(s.value), label: s.label }));
  const selectedPosition = positions.find((item) => String(item.id) === String(fields.id_chuc_vu || ''));
  const selectedDepartmentLabels = resolveEmployeeDepartmentLabels(
    fields.id_phong_ban,
    departments,
    selectedPosition?.ten_phong_ban,
  );

  const toggleField = (field: keyof BulkEditFields) => {
    const next = new Set(enabledFields);
    if (next.has(field)) {
      next.delete(field);
      const nextFields = { ...fields };
      delete nextFields[field];
      setFields(nextFields);
    } else {
      next.add(field);
    }
    setEnabledFields(next);
  };

  const handleSubmit = () => {
    const ids = selectedEmployees.map(e => e.id);
    // Chỉ gửi các trường được kích hoạt
    const payload: Partial<BulkEditFields> = {};
    enabledFields.forEach(key => {
      if (fields[key] !== undefined && fields[key] !== '') {
        payload[key] = fields[key] as any;
      }
    });
    if (Object.keys(payload).length === 0) return;
    bulkMutation.mutate({ ids, fields: payload });
  };

  const hasChanges = enabledFields.size > 0 && Array.from(enabledFields).some(k => fields[k] !== undefined && fields[k] !== '');

  const renderFieldToggle = (field: keyof BulkEditFields, label: string) => (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={enabledFields.has(field)}
        onChange={() => toggleField(field)}
        className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
      />
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </label>
  );

  const footer = (
    <div className="flex items-center justify-between w-full gap-3">
      <Button variant="outline" onClick={onClose} className="border-border text-muted-foreground">
        <X size={16} className="mr-2" /> {txt('common.cancel')}
      </Button>
      <Button
        onClick={handleSubmit}
        isLoading={bulkMutation.isPending}
        disabled={!hasChanges}
        className="bg-primary text-white shadow-lg"
      >
        <Save size={16} className="mr-2" /> {txt('employee.bulk.applyButton', { count: selectedEmployees.length })}
      </Button>
    </div>
  );

  return (
    <GenericDrawer
      title={txt('employee.bulk.title')}
      subtitle={`${selectedEmployees.length} ${txt('employee.bulk.subtitle')}`}
      icon={<Users size={20} />}
      onClose={onClose}
      footer={footer}
      maxWidthClass="sm:w-[36rem] sm:min-w-[36rem] sm:max-w-[36rem]"
    >
      <div className="space-y-4">
        {/* Danh sách nhân viên được chọn */}
        <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">{txt('employee.bulk.selectedLabel')}</p>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
            {selectedEmployees.map(emp => (
              <span key={emp.id} className="inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1 text-xs">
                <img src={emp.avatar || getAvatarUrl(emp.ho_va_ten || '')} className="w-5 h-5 rounded-full object-cover animate-none" alt={emp.ho_va_ten} />
                <span className="font-medium text-foreground">{emp.ho_va_ten}</span>
                {emp.ten_dang_nhap && (
                  <span className="text-muted-foreground">({emp.ten_dang_nhap})</span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-600 font-bold text-lg leading-none shrink-0">!</span>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            {txt('employee.bulk.warning')}
          </p>
        </div>

        {/* Các trường có thể chỉnh sửa */}
        <FormSection title={txt('employee.bulk.workSection')} icon={<Briefcase size={14} />}>
          <div className="space-y-4">
            <div className="space-y-2">
              {renderFieldToggle('id_phong_ban', 'Đổi phòng ban / bộ phận')}
              {enabledFields.has('id_phong_ban') && (
                <Combobox
                  options={departmentOptions}
                  value={fields.id_phong_ban || ''}
                  onChange={(val) => setFields(prev => ({
                    ...prev,
                    id_phong_ban: val ? String(val) : null,
                    id_chuc_vu: null,
                  }))}
                  placeholder="Chọn phòng ban hoặc bộ phận"
                  icon={<Users size={16} className="text-muted-foreground" />}
                />
              )}
            </div>
            <div className="space-y-2">
              {renderFieldToggle('id_chuc_vu', txt('employee.bulk.changePosition'))}
              {enabledFields.has('id_chuc_vu') && (
                <div className="space-y-2">
                  <Combobox
                    options={positionOptions}
                    value={fields.id_chuc_vu || ''}
                    onChange={(val) => setFields(prev => ({
                      ...prev,
                      id_chuc_vu: val ? String(val) : null,
                      id_phong_ban: val
                        ? String(positions.find((p) => String(p.id) === String(val))?.phong_ban_id ?? prev.id_phong_ban ?? '')
                        : prev.id_phong_ban ?? null,
                    }))}
                    placeholder={selectedDepartmentId ? txt('employee.form.positionPlaceholder') : 'Chọn phòng ban trước'}
                    icon={<Briefcase size={16} className="text-muted-foreground" />}
                    disabled={!selectedDepartmentId}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <p className="text-muted-foreground">Phòng ban</p>
                      <p className="font-medium text-foreground">{selectedDepartmentLabels.ten_phong_ban || 'Tự lấy theo chức vụ'}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <p className="text-muted-foreground">Bộ phận</p>
                      <p className="font-medium text-foreground">{selectedDepartmentLabels.ten_bo_phan || 'Không có bộ phận con'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FormSection>
 
        <FormSection title={txt('employee.bulk.contractSection')} icon={<FileText size={14} />}>
          <div className="space-y-4">
            <div className="space-y-2">
              {renderFieldToggle('trang_thai', txt('employee.bulk.changeStatus'))}
              {enabledFields.has('trang_thai') && (
                <Combobox
                  options={statusOptions}
                  value={fields.trang_thai ?? ''}
                  onChange={(val) => setFields(prev => ({ ...prev, trang_thai: val ? String(val) : undefined }))}
                  placeholder={txt('employee.form.workStatusPlaceholder')}
                  icon={<CircleDot size={16} className="text-muted-foreground" />}
                  searchable={false}
                />
              )}
            </div>
          </div>
        </FormSection>
      </div>
    </GenericDrawer>
  );
};

export default BulkEditSheet;
