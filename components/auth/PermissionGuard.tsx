import React from 'react';
import { Link } from 'react-router-dom';
import { useCan } from '@/hooks/use-can';
import { useAuthStore } from '@/store/useStore';
import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';
import { type AppResource } from '@/lib/permissions';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionGuardProps {
  resource: AppResource;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ resource, children }) => {
  const user = useAuthStore((s) => s.user);
  const matrixActive = usePermissionGrantStore((s) => s.matrixActive);
  const canView = useCan('view', resource);

  const isHydrating = user && user.role !== 'admin' && user.id_chuc_vu && !matrixActive;

  React.useEffect(() => {
    if (!isHydrating && !canView) {
      toast.error('Bạn không có quyền truy cập trang này');
    }
  }, [isHydrating, canView]);

  if (isHydrating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]" aria-busy="true" aria-label="Đang xác thực quyền hạn">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <AlertCircle size={56} className="text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Truy cập bị từ chối</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Tài khoản của bạn không được cấp quyền để xem thông tin của module này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
        </p>
        <Link to="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
