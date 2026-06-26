import React, { useMemo } from 'react';
import { txt } from '../../lib/text';
import { useNavigate } from 'react-router-dom';
import { Users, Building, Shield, Briefcase } from 'lucide-react';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';
import { can, type AppResource } from '../../lib/permissions';
import { useAuthStore } from '../../store/useStore';
import { usePermissionGrantStore } from '../../store/usePermissionGrantStore';

const SystemDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const matrixActive = usePermissionGrantStore((s) => s.matrixActive);
  const grantsByModule = usePermissionGrantStore((s) => s.grantsByModule);

  const groups = useMemo(() => {
    const rawGroups = [
      {
        groupTitle: txt('page.systemDashboard.orgChartGroup'),
        items: [
          {
            title: txt('page.systemDashboard.department'),
            description: txt('page.systemDashboard.departmentDesc'),
            icon: Building,
            color: 'bg-indigo-500',
            action: () => navigate('/he-thong/phong-ban'),
            resource: 'departments' as AppResource,
          },
          {
            title: txt('page.systemDashboard.position'),
            description: txt('page.systemDashboard.positionDesc'),
            icon: Briefcase,
            color: 'bg-blue-500',
            action: () => navigate('/he-thong/chuc-vu'),
            resource: 'positions' as AppResource,
          },
          {
            title: txt('page.systemDashboard.employee'),
            description: txt('page.systemDashboard.employeeDesc'),
            icon: Users,
            color: 'bg-emerald-500',
            action: () => navigate('/he-thong/nhan-vien'),
            resource: 'employees' as AppResource,
          },
        ],
      },
      {
        groupTitle: txt('page.systemDashboard.securityGroup'),
        items: [
          {
            title: txt('page.systemDashboard.companyInfo'),
            description: txt('page.systemDashboard.companyInfoDesc'),
            icon: Building,
            color: 'bg-violet-500',
            action: () => navigate('/he-thong/thong-tin-cong-ty'),
            resource: 'company' as AppResource,
          },
          {
            title: txt('page.systemDashboard.permission'),
            description: txt('page.systemDashboard.permissionDesc'),
            icon: Shield,
            color: 'bg-rose-500',
            action: () => navigate('/he-thong/phan-quyen'),
            resource: 'permissions' as AppResource,
          },
        ],
      },
    ];

    return rawGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => can(user, 'view', item.resource)),
      }))
      .filter((g) => g.items.length > 0);
  }, [user, matrixActive, grantsByModule, navigate]);

  return <ModuleDashboardLayout groups={groups} />;
};

export default SystemDashboard;
