import React, { useCallback, useMemo, memo } from 'react';
import type { Employee } from '../core/types';
import { User, Mail, Phone, Briefcase, Building2, Edit, Trash2, RefreshCw, KeyRound, Calendar, Printer, CircleDollarSign } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { type DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import Button from '../../../../components/ui/Button';
import Combobox from '../../../../components/ui/Combobox';
import EnumBadge from '../../../../components/ui/EnumBadge';
import { formatDate, cn, getAvatarUrl, formatCurrency } from '@/lib/utils';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useUpdateStatusEmployee } from '../hooks/use-nhan-vien';
import { STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../core/constants';
import { useCan } from '@/hooks/use-can';
import { openEmployeeProfilePreviewTab } from '../utils/open-employee-profile-preview';

interface Props {
  data: Employee;
  onClose: () => void;
  onEdit: (item: Employee) => void;
  onDelete: (id: string) => void;
}

const EmployeeDetailComponent: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const confirm = useConfirmStore((state) => state.confirm);
  const statusMutation = useUpdateStatusEmployee();
  const canEdit = useCan('edit', 'employees');
  const canDelete = useCan('delete', 'employees');

  const handleUpdateStatus = useCallback(() => {
    const selection = { current: data.trang_thai };
    confirm({
      title: 'Đổi trạng thái nhân viên',
      message: (
        <div className="space-y-4 text-left py-2">
          <p className="text-sm">Chọn trạng thái mới cho <strong>{data.ho_va_ten}</strong>:</p>
          <Combobox
            value={data.trang_thai}
            options={STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            onChange={(v) => { selection.current = v as Employee['trang_thai']; }}
            searchable={false}
            dropdownInPortal
          />
        </div>
      ),
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await statusMutation.mutateAsync({ ids: [data.id], status: selection.current });
      },
    });
  }, [data.id, data.trang_thai, data.ho_va_ten, confirm, statusMutation]);

  const toolbarActions = useMemo((): DetailToolbarAction[] => {
    const actions: DetailToolbarAction[] = [];
    actions.push({
      label: 'In hồ sơ',
      icon: <Printer />,
      href: `/ho-so-nhan-vien/${encodeURIComponent(data.id)}`,
      variant: 'secondary',
    });

    if (canEdit) {
      actions.push({
        label: 'Đổi trạng thái',
        icon: <RefreshCw />,
        onClick: handleUpdateStatus,
        variant: 'info',
      });
    }
    if (data.email) {
      actions.push({
        label: 'Gửi email',
        icon: <Mail />,
        onClick: () => { window.location.href = `mailto:${data.email}`; },
        variant: 'primary',
      });
    }
    if (data.so_dien_thoai) {
      actions.push({
        label: 'Gọi điện',
        icon: <Phone />,
        onClick: () => { window.location.href = `tel:${data.so_dien_thoai}`; },
        variant: 'success',
      });
    }
    return actions;
  }, [handleUpdateStatus, data.id, data.email, data.so_dien_thoai, canEdit]);

  const footer = useMemo(() => (
    <div className="flex items-center justify-between w-full gap-2">
      <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      {(canEdit || canDelete) ? (
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button size="sm" onClick={() => onEdit(data)} className="h-8 px-3 text-xs bg-primary text-white shadow-sm hover:bg-primary/90">
              <Edit className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {BTN_EDIT()}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(data.id)}
              className="h-8 px-3 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 shrink-0" /> {BTN_DELETE()}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  ), [onClose, onEdit, onDelete, data, canEdit, canDelete]);

  return (
    <GenericDrawer
      title="Chi tiết nhân viên"
      subtitle={data.ten_dang_nhap ? `Tên đăng nhập: ${data.ten_dang_nhap}` : 'Chưa có tên đăng nhập'}
      icon={<User size={20} />}
      onClose={onClose}
      footer={footer}
      footerCompact
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={data.avatar || getAvatarUrl(data.ho_va_ten)}
              alt={data.ho_va_ten}
              className="w-14 h-14 rounded-xl border-2 border-card shadow-md object-cover bg-card"
            />
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card shadow-sm',
                data.trang_thai === 'Đang làm việc' ? 'bg-emerald-500' : 'bg-muted-foreground/30',
              )}
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight truncate flex-1 min-w-0">{data.ho_va_ten}</h2>
              <div className="shrink-0"><EnumBadge value={data.trang_thai} config={STATUS_BADGE_CONFIG} /></div>
            </div>
            <p className="text-body-sm text-primary font-medium">{data.ten_chuc_vu || '--'}</p>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection title="Thông tin chính" icon={<User size={14} />}>
          <DetailFieldGrid>
            <DetailField label="Họ và tên" value={data.ho_va_ten} icon={<User size={12} />} />
            <DetailField label="Tên đăng nhập" value={data.ten_dang_nhap} icon={<KeyRound size={12} />} />
            <DetailField label="Trạng thái" value={<EnumBadge value={data.trang_thai} config={STATUS_BADGE_CONFIG} />} />
            <DetailField label="Lương cơ bản" value={data.luong_co_ban != null ? formatCurrency(Number(data.luong_co_ban)) : '--'} icon={<CircleDollarSign size={12} />} />
            <DetailField label="Phòng ban" value={data.ten_phong_ban} icon={<Building2 size={12} />} />
            <DetailField label="Bộ phận" value={data.ten_bo_phan} icon={<Building2 size={12} />} />
            <DetailField label="Chức vụ" value={data.ten_chuc_vu} icon={<Briefcase size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title="Liên hệ" icon={<Phone size={14} />}>
          <DetailFieldGrid>
            <DetailField label="Email thực tế" value={data.email} icon={<Mail size={12} />} />
            <DetailField label="Số điện thoại" value={data.so_dien_thoai} icon={<Phone size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        {(data.tg_tao || data.tg_cap_nhat) && (
          <DetailSection title="Thông tin hệ thống" icon={<Calendar size={14} />}>
            <DetailFieldGrid>
              <DetailField label="Ngày tạo" value={data.tg_tao ? formatDate(data.tg_tao) : undefined} icon={<Calendar size={12} />} />
              <DetailField label="Cập nhật" value={data.tg_cap_nhat ? formatDate(data.tg_cap_nhat) : undefined} icon={<Calendar size={12} />} />
            </DetailFieldGrid>
          </DetailSection>
        )}
      </div>
    </GenericDrawer>
  );
};

const EmployeeDetail = memo(EmployeeDetailComponent);
export default EmployeeDetail;
