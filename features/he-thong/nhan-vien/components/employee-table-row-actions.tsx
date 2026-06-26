import React, { useState } from 'react';
import { toast } from 'sonner';
import { Edit, RefreshCw, Mail, Phone, Trash2, KeyRound } from 'lucide-react';
import { txt } from '../../../../lib/text';
import {
  DataTableRowActions,
  TableRowIconButton,
  type RowOverflowMenuItem,
} from '../../../../components/shared/row-actions';
import type { Employee } from '../core/types';
import { useCan } from '@/hooks/use-can';
import { useConfirmStore } from '@/store/useConfirmStore';
import { changeEmployeePassword } from '../services/nhan-vien-service';

const PasswordChangePrompt: React.FC<{ employeeName: string; username: string; onChange: (value: string) => void }> = ({
  employeeName,
  username,
  onChange,
}) => {
  const [value, setValue] = useState('');
  const inputId = React.useId();

  return (
    <div className="space-y-3 text-left">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <div className="font-semibold text-foreground">{employeeName}</div>
        <div>Tên đăng nhập: <span className="font-mono text-foreground">{username}</span></div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-xs font-semibold text-muted-foreground">Mật khẩu mới</label>
        <input
          id={inputId}
          type="password"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            onChange(event.target.value);
          }}
          placeholder="Tối thiểu 6 ký tự"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
};

export interface EmployeeTableRowActionsProps {
  item: Employee;
  menuOpenId: string | null;
  onMenuOpenChange: (id: string | null) => void;
  onEdit: (item: Employee) => void;
  onDelete: (id: string) => void;
  onStatusChange: (item: Employee) => void;
  /** Hàng thao tác trên card mobile (mobile list): nút gọn, cùng hàng với checkbox */
  compact?: boolean;
}

export function EmployeeTableRowActions({
  item,
  menuOpenId,
  onMenuOpenChange,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
}: EmployeeTableRowActionsProps) {
  const close = () => onMenuOpenChange(null);

  const canEdit = useCan('edit', 'employees');
  const canDelete = useCan('delete', 'employees');
  const canViewRow = useCan('view', 'employees');
  const confirm = useConfirmStore((state) => state.confirm);

  const openChangePassword = () => {
    const username = item.ten_dang_nhap?.trim() || '';
    close();
    if (!username) {
      toast.warning('Nhân viên chưa có tên đăng nhập');
      return;
    }
    if (username.toLowerCase() === 'admin') {
      toast.warning('Không đổi mật khẩu tài khoản admin tại đây');
      return;
    }
    let nextPassword = '';
    confirm({
      title: 'Đổi mật khẩu',
      message: (
        <PasswordChangePrompt
          employeeName={item.ho_va_ten}
          username={username}
          onChange={(value) => { nextPassword = value; }}
        />
      ),
      variant: 'info',
      confirmText: 'Đổi mật khẩu',
      cancelText: 'Đóng',
      onConfirm: async () => {
        if (nextPassword.trim().length < 6) {
          toast.warning('Mật khẩu tối thiểu 6 ký tự');
          throw new Error('Password too short');
        }
        try {
          await changeEmployeePassword(username, nextPassword);
          toast.success('Đã đổi mật khẩu');
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Không đổi được mật khẩu');
          throw error;
        }
      },
    });
  };

  const overflowItems: RowOverflowMenuItem[] = [
    ...(canEdit
      ? [
          {
            key: 'status',
            label: txt('employee.detail.changeStatus'),
            icon: <RefreshCw size={14} />,
            onClick: () => {
              onStatusChange(item);
              close();
            },
          },
          {
            key: 'password',
            label: 'Đổi mật khẩu',
            icon: <KeyRound size={14} />,
            onClick: openChangePassword,
          },
        ]
      : []),
    ...(canViewRow
      ? [
          {
            key: 'email',
            label: txt('employee.detail.sendEmail'),
            icon: <Mail size={14} />,
            onClick: () => {
              window.location.href = `mailto:${item.email}`;
              close();
            },
          },
          {
            key: 'phone',
            label: txt('employee.detail.callPhone'),
            icon: <Phone size={14} />,
            onClick: () => {
              if (item.so_dien_thoai) {
                window.location.href = `tel:${item.so_dien_thoai}`;
              } else {
                toast.warning(txt('employee.rowActions.noPhone'));
              }
              close();
            },
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            key: 'delete',
            label: txt('common.delete'),
            icon: <Trash2 size={14} />,
            variant: 'destructive' as const,
            onClick: () => {
              onDelete(item.id);
              close();
            },
          },
        ]
      : []),
  ];

  const hasMenuItems = overflowItems.length > 0;

  const primary =
    canEdit ? (
      <TableRowIconButton
        icon={Edit}
        label={txt('common.edit')}
        size={compact ? 'compact' : 'default'}
        variant="primary"
        onClick={() => onEdit(item)}
      />
    ) : undefined;

  if (!primary && !hasMenuItems) {
    return (
      <div
        role="group"
        className="flex items-center justify-center"
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <DataTableRowActions
      rowId={item.id}
      compact={compact}
      menuOpenId={menuOpenId}
      onMenuOpenChange={onMenuOpenChange}
      primary={primary}
      overflowItems={overflowItems}
      overflowTriggerLabel={txt('employee.rowActions.more')}
    />
  );
}
