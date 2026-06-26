import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, CircleDollarSign, ClipboardList, MapPin, Truck, UserRoundCheck } from 'lucide-react';
import ModuleDashboardLayout from '@/components/dashboard/ModuleDashboardLayout';
import { can, type AppResource } from '@/lib/permissions';
import { useAuthStore } from '@/store/useStore';
import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';

const resourceMap: Record<string, AppResource> = {
  '/quan-ly-van-tai/chuyen-xe': 'chuyen-xe',
  '/quan-ly-van-tai/bang-luong': 'bang-luong',
  '/quan-ly-van-tai/thong-ke-chuyen-di': 'thong-ke-chuyen-di',
  '/quan-ly-van-tai/thong-ke-luong': 'thong-ke-luong',
  '/quan-ly-van-tai/tai-xe': 'tai-xe',
  '/quan-ly-van-tai/dia-diem': 'dia-diem',
  '/quan-ly-van-tai/danh-sach-xe': 'danh-sach-xe',
};

const TransportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const matrixActive = usePermissionGrantStore((s) => s.matrixActive);
  const grantsByModule = usePermissionGrantStore((s) => s.grantsByModule);

  const groups = useMemo(() => {
    const rawGroups = [
      {
        groupTitle: 'Kế hoạch',
        items: [
          {
            title: 'Chuyến xe',
            description: 'Danh sách chuyến và danh sách chi tiết theo từng điểm giao.',
            icon: ClipboardList,
            color: 'bg-cyan-500',
            action: () => navigate('/quan-ly-van-tai/chuyen-xe'),
            moduleId: '/quan-ly-van-tai/chuyen-xe',
          },
          {
            title: 'Bảng lương',
            description: 'Tổng hợp lương và chi phí theo tài xế, tháng, năm.',
            icon: CircleDollarSign,
            color: 'bg-amber-500',
            action: () => navigate('/quan-ly-van-tai/bang-luong'),
            moduleId: '/quan-ly-van-tai/bang-luong',
          },
          {
            title: 'Thống kê chuyến đi',
            description: 'Lọc theo ngày, chuyến, tài xế, địa điểm, xe, lương và chi phí.',
            icon: BarChart3,
            color: 'bg-indigo-500',
            action: () => navigate('/quan-ly-van-tai/thong-ke-chuyen-di'),
            moduleId: '/quan-ly-van-tai/thong-ke-chuyen-di',
          },
          {
            title: 'Thống kê lương',
            description: 'Báo cáo lương theo ngày, tháng và tài xế.',
            icon: CircleDollarSign,
            color: 'bg-violet-500',
            action: () => navigate('/quan-ly-van-tai/thong-ke-luong'),
            moduleId: '/quan-ly-van-tai/thong-ke-luong',
          },
        ],
      },
      {
        groupTitle: 'Thiết lập',
        items: [
          {
            title: 'Tài xế',
            description: 'Danh sách tài xế và liên kết nhân sự.',
            icon: UserRoundCheck,
            color: 'bg-emerald-500',
            action: () => navigate('/quan-ly-van-tai/tai-xe'),
            moduleId: '/quan-ly-van-tai/tai-xe',
          },
          {
            title: 'Địa điểm',
            description: 'Quản lý điểm giao nhận, nhóm tuyến và lương ban đầu.',
            icon: MapPin,
            color: 'bg-rose-500',
            action: () => navigate('/quan-ly-van-tai/dia-diem'),
            moduleId: '/quan-ly-van-tai/dia-diem',
          },
          {
            title: 'Danh sách xe',
            description: 'Quản lý xe, biển số và thông tin vận hành.',
            icon: Truck,
            color: 'bg-blue-500',
            action: () => navigate('/quan-ly-van-tai/danh-sach-xe'),
            moduleId: '/quan-ly-van-tai/danh-sach-xe',
          },
        ],
      },
    ];

    return rawGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          const res = resourceMap[item.moduleId];
          return res && can(user, 'view', res);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [user, matrixActive, grantsByModule, navigate]);

  return <ModuleDashboardLayout groups={groups} />;
};

export default TransportDashboard;
