import React, { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCircle, UserPlus, Camera, User, Mail, Phone, Briefcase, Building2, KeyRound, UserRoundCheck, CircleDollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import SingleImageInput from '../../../../components/ui/SingleImageInput';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import { employeeSchema, type EmployeeFormValues } from '../core/schema';
import type { Employee } from '../core/types';
import { getDefaultEmployeeFormValues, employeeToFormValues } from '../utils/employee-to-form';
import { useCreateEmployee, useUpdateEmployee } from '../hooks/use-nhan-vien';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';
import { usePositions } from '../../chuc-vu/hooks/use-chuc-vu';
import { STATUS_OPTIONS } from '../core/constants';
import { getTransportRows } from '@/features/quan-ly-van-tai/shared/transport-service';
import { TRANSPORT_MODULES } from '@/features/quan-ly-van-tai/shared/transport-config';
import { resolveEmployeeDepartmentLabels } from '../utils/employee-department';
import { getDepartmentSubtreeIds } from '../../chuc-vu/utils/build-position-tree-rows';

interface Props {
  initialData?: Employee | null;
  prefillData?: Partial<EmployeeFormValues>;
  onClose: () => void;
}

const EmployeeForm: React.FC<Props> = ({ initialData, prefillData, onClose }) => {
  const isEdit = !!initialData;
  const createMutation = useCreateEmployee(onClose);
  const updateMutation = useUpdateEmployee(onClose);
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();

  const statusOptions = useMemo(
    () => STATUS_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
    [],
  );

  const { data: vehicles = [] } = useQuery({
    queryKey: ['transport', 'danh-sach-xe'],
    queryFn: () => getTransportRows(TRANSPORT_MODULES.vehicles),
  });

  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({ label: `${v.bien_so} (${v.hang} ${v.model})`, value: String(v.id) })),
    [vehicles],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: getDefaultEmployeeFormValues(),
  });

  const isDriver = watch('la_tai_xe');
  const selectedPositionId = watch('id_chuc_vu');
  const selectedDepartmentId = watch('id_phong_ban');
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
  const scopedDepartmentIds = useMemo(
    () => (selectedDepartmentId ? getDepartmentSubtreeIds(departments, [String(selectedDepartmentId)]) : new Set<string>()),
    [departments, selectedDepartmentId],
  );
  const positionOptions = useMemo(
    () =>
      positions
        .filter((p) => p.trang_thai === 'Đang hoạt động')
        .filter((p) => selectedDepartmentId && p.phong_ban_id && scopedDepartmentIds.has(String(p.phong_ban_id)))
        .map((p) => ({
          label: p.cap_bac ? `${p.ten_chuc_vu} - Cấp ${p.cap_bac}` : p.ten_chuc_vu,
          value: String(p.id),
          subLabel: [
            p.ma_chuc_vu,
            resolveEmployeeDepartmentLabels(p.phong_ban_id, departments, p.ten_phong_ban).ten_phong_ban,
            resolveEmployeeDepartmentLabels(p.phong_ban_id, departments, p.ten_phong_ban).ten_bo_phan,
          ].filter(Boolean).join(' · '),
        })),
    [departments, positions, scopedDepartmentIds, selectedDepartmentId],
  );
  const selectedPosition = useMemo(
    () => positions.find((item) => String(item.id) === String(selectedPositionId || '')),
    [positions, selectedPositionId],
  );
  useEffect(() => {
    if (initialData) reset(employeeToFormValues(initialData));
    else reset({ ...getDefaultEmployeeFormValues(), ...prefillData });
  }, [initialData, prefillData, reset]);

  useEffect(() => {
    if (!selectedPositionId) return;
    if (!selectedPosition?.phong_ban_id || !scopedDepartmentIds.has(String(selectedPosition.phong_ban_id))) {
      setValue('id_chuc_vu', '', { shouldDirty: true, shouldValidate: true });
    }
  }, [scopedDepartmentIds, selectedPosition?.phong_ban_id, selectedPositionId, setValue]);

  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      if (isEdit && initialData) await updateMutation.mutateAsync({ id: initialData.id, data });
      else await createMutation.mutateAsync(data);
      onClose();
    } catch {
      // Error toast is handled in the mutation hook; keep the drawer open for correction.
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const footer = (
    <FormDrawerFooter
      formId="emp-form"
      onCancel={onClose}
      isLoading={isLoading}
      isEdit={isEdit}
      compact
      createIcon={<UserPlus className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
    />
  );

  return (
    <GenericDrawer
      title={isEdit ? 'Sửa nhân viên' : 'Thêm nhân viên'}
      subtitle={isEdit ? initialData?.ho_va_ten : 'Bảng nhân viên tối giản theo sheet Fix app'}
      icon={<UserCircle size={20} />}
      onClose={onClose}
      footer={footer}
      footerCompact
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="emp-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <FormSection title="Thông tin chính" icon={<User size={14} />}>
          <div className="flex justify-center">
            <Controller
              name="avatar"
              control={control}
              render={({ field }) => (
                <SingleImageInput
                  label="Avatar"
                  icon={<Camera className="w-4 h-4" />}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  shape="circle"
                  maxSizeMB={2}
                  className="w-[180px]"
                />
              )}
            />
          </div>

          <FormGrid cols={2}>
            <Input
              label="Họ và tên"
              placeholder="Nhập họ và tên"
              required
              icon={<User className="w-4 h-4 text-muted-foreground" />}
              {...register('ho_va_ten')}
              error={errors.ho_va_ten?.message}
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label="Trạng thái"
                  options={statusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  searchable={false}
                />
              )}
            />
          </FormGrid>

          <FormGrid cols={2}>
            <Controller
              name="id_phong_ban"
              control={control}
              render={({ field }) => (
                <Combobox
                  label="Phòng ban / Bộ phận"
                  required
                  options={departmentOptions}
                  value={field.value ?? ''}
                  onChange={(value) => {
                    field.onChange(value ? String(value) : '');
                    setValue('id_chuc_vu', '', { shouldDirty: true, shouldValidate: true });
                  }}
                  placeholder="Chọn phòng ban hoặc bộ phận"
                  icon={<Building2 size={16} className="text-muted-foreground" />}
                  error={errors.id_phong_ban?.message}
                />
              )}
            />
            <Controller
              name="id_chuc_vu"
              control={control}
              render={({ field }) => (
                <Combobox
                  label="Chức vụ"
                  required
                  options={positionOptions}
                  value={field.value ?? ''}
                  onChange={(value) => {
                    const nextPosition = positions.find((p) => String(p.id) === String(value || ''));
                    field.onChange(value ? String(value) : '');
                    if (nextPosition?.phong_ban_id) {
                      setValue('id_phong_ban', String(nextPosition.phong_ban_id), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  placeholder={selectedDepartmentId ? 'Chọn chức vụ trong phòng ban' : 'Chọn phòng ban trước'}
                  icon={<Briefcase size={16} className="text-muted-foreground" />}
                  disabled={!selectedDepartmentId}
                  error={errors.id_chuc_vu?.message}
                />
              )}
            />
          </FormGrid>

          <FormGrid cols={2}>
            <Controller
              name="luong_co_ban"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label="Lương cơ bản"
                  placeholder="Nhập lương cơ bản, vd: 5.000.000"
                  icon={<CircleDollarSign className="w-4 h-4 text-muted-foreground" />}
                  value={field.value ?? 0}
                  onChange={field.onChange}
                  error={errors.luong_co_ban?.message}
                />
              )}
            />
          </FormGrid>

          <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-dashed border-border bg-muted/10 rounded-xl border border-border/40 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="la_tai_xe"
                  {...register('la_tai_xe')}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer"
                />
                <div className="flex flex-col">
                  <label htmlFor="la_tai_xe" className="text-sm font-semibold text-foreground cursor-pointer select-none">
                    Nhân viên này là Tài xế lái xe
                  </label>
                  <p className="text-xs text-muted-foreground">Kích hoạt để nhập thông tin bằng lái và xe mặc định</p>
                </div>
              </div>
              {isDriver && (
                <Link
                  to="/quan-ly-van-tai/tai-xe"
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-primary/5 px-2.5 py-1 rounded border border-primary/10 transition-colors"
                >
                  <UserRoundCheck className="w-3.5 h-3.5" />
                  Xem thông tin tại Module Tài xế →
                </Link>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="Liên hệ và đăng nhập" icon={<KeyRound size={14} />}>
          <FormGrid cols={2}>
            <Input
              label="Tên đăng nhập"
              placeholder="vd: admin"
              icon={<KeyRound className="w-4 h-4 text-muted-foreground" />}
              {...register('ten_dang_nhap')}
              error={errors.ten_dang_nhap?.message}
            />
            {!isEdit && (
              <Input
                label="Mật khẩu"
                type="password"
                placeholder="Nhập mật khẩu đăng nhập"
                icon={<KeyRound className="w-4 h-4 text-muted-foreground" />}
                {...register('mat_khau')}
                error={errors.mat_khau?.message}
              />
            )}
            <Input
              label="Email thực tế"
              placeholder="email thật của nhân viên"
              icon={<Mail className="w-4 h-4 text-muted-foreground" />}
              {...register('email')}
              error={errors.email?.message}
            />
          </FormGrid>

          <FormGrid cols={2}>
            <Input
              label="Số điện thoại"
              placeholder="0900000000"
              icon={<Phone className="w-4 h-4 text-muted-foreground" />}
              {...register('so_dien_thoai')}
              error={errors.so_dien_thoai?.message}
            />
          </FormGrid>
        </FormSection>

        {isDriver && (
          <FormSection title="Thông tin bằng lái & Phương tiện" icon={<Briefcase size={14} />}>
            <FormGrid cols={2}>
              <Input
                label="Ngày sinh"
                type="date"
                {...register('ngay_sinh')}
                error={errors.ngay_sinh?.message}
              />
              <Input
                label="Địa chỉ"
                placeholder="Nhập địa chỉ"
                {...register('dia_chi')}
                error={errors.dia_chi?.message}
              />
            </FormGrid>
            <FormGrid cols={3}>
              <Input
                label="Số GPLX"
                placeholder="Nhập số bằng lái"
                {...register('so_gplx')}
                error={errors.so_gplx?.message}
              />
              <Input
                label="Hạng bằng"
                placeholder="vd: B2, C, FC"
                {...register('hang_bang')}
                error={errors.hang_bang?.message}
              />
              <Input
                label="Ngày hết hạn bằng"
                type="date"
                {...register('ngay_het_han_bang')}
                error={errors.ngay_het_han_bang?.message}
              />
            </FormGrid>
            <FormGrid cols={2}>
              <Controller
                name="id_xe_mac_dinh"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label="Xe thường chạy"
                    options={vehicleOptions}
                    value={field.value ? String(field.value) : ''}
                    onChange={field.onChange}
                    placeholder="Chọn xe mặc định"
                    searchable
                  />
                )}
              />
              <Input
                label="Thông tin khác"
                placeholder="Thông tin bổ sung"
                {...register('thong_tin_khac')}
                error={errors.thong_tin_khac?.message}
              />
            </FormGrid>
            <div className="col-span-1 sm:col-span-2 mt-2">
              <Input
                label="Ghi chú tài xế"
                placeholder="Ghi chú thêm về tài xế"
                {...register('ghi_chu')}
                error={errors.ghi_chu?.message}
              />
            </div>
          </FormSection>
        )}
      </form>
    </GenericDrawer>
  );
};

export default EmployeeForm;
