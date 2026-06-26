import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Toaster } from 'sonner';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ConfirmDialog from './components/shared/ConfirmDialog';
import PwaRegister from './components/shared/PwaRegister';

import Home from './pages/Home';
import LicenseInfo from './pages/LicenseInfo';
import NotificationPage from './pages/NotificationPage';
import SystemDashboard from './pages/dashboards/SystemDashboard';
import TransportDashboard from './pages/dashboards/TransportDashboard';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import {
  ThemeSynchronizer,
  MetadataSynchronizer,
  LanguageSynchronizer,
  useResolvedTheme,
} from './lib/app-sync';
import { PermissionMatrixSynchronizer } from './components/auth/PermissionMatrixSynchronizer';
import { AuthSynchronizer } from './components/auth/AuthSynchronizer';
import { UserEnrichSynchronizer } from './components/auth/UserEnrichSynchronizer';

const EmployeePage = lazy(() => import('./features/he-thong/nhan-vien/index'));
const CompanyInfoPage = lazy(() => import('./features/he-thong/thong-tin-cong-ty/index'));
const SecurityPage = lazy(() => import('./features/he-thong/phan-quyen/index'));
const DepartmentPage = lazy(() => import('./features/he-thong/phong-ban/index'));
const PositionPage = lazy(() => import('./features/he-thong/chuc-vu/index'));
const ChuyenXePage = lazy(() => import('./features/quan-ly-van-tai/chuyen-xe/index'));
const BangLuongPage = lazy(() => import('./features/quan-ly-van-tai/bang-luong/index'));
const ThongKeChuyenDiPage = lazy(() => import('./features/quan-ly-van-tai/thong-ke-chuyen-di/index'));
const ThongKeLuongPage = lazy(() => import('./features/quan-ly-van-tai/thong-ke-luong/index'));
const TaiXePage = lazy(() => import('./features/quan-ly-van-tai/tai-xe/index'));
const DiaDiemPage = lazy(() => import('./features/quan-ly-van-tai/dia-diem/index'));
const DanhSachXePage = lazy(() => import('./features/quan-ly-van-tai/danh-sach-xe/index'));
const EmployeeProfilePreviewPage = lazy(() => import('./features/he-thong/nhan-vien/EmployeeProfilePreviewPage'));
const PayrollPreviewPage = lazy(() => import('./features/quan-ly-van-tai/bang-luong/PayrollPreviewPage'));
const PayrollPeriodMatrixPage = lazy(() => import('./features/quan-ly-van-tai/bang-luong/PayrollPeriodMatrixPage'));

const PageFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[40vh]" aria-busy="true" aria-label="Đang mở trang">
    <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

import { PermissionGuard } from './components/auth/PermissionGuard';

const App = () => {
  const resolvedTheme = useResolvedTheme();
  return (
    <LazyMotion features={domAnimation} strict>
      <ThemeSynchronizer />
      <MetadataSynchronizer />
      <LanguageSynchronizer />
      <AuthSynchronizer />
      <UserEnrichSynchronizer />
      <PermissionMatrixSynchronizer />
      <ConfirmDialog />
      <PwaRegister />
      <Toaster position="top-right" richColors theme={resolvedTheme} />
      <Routes>
        <Route path="/dang-nhap" element={<Login />} />
        <Route path="/dang-ky" element={<Navigate to="/dang-nhap" replace />} />
        <Route path="/login" element={<Navigate to="/dang-nhap" replace />} />
        <Route path="/register" element={<Navigate to="/dang-nhap" replace />} />
        <Route
          path="/ho-so-nhan-vien/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageFallback />}>
                <EmployeeProfilePreviewPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bang-luong-preview/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageFallback />}>
                <PayrollPreviewPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bang-luong-ky-chi-tiet/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageFallback />}>
                <PayrollPeriodMatrixPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/thong-tin-ban-quyen" element={<LicenseInfo />} />

                    <Route path="/he-thong" element={<SystemDashboard />} />
                    <Route path="/he-thong/nhan-vien" element={<PermissionGuard resource="employees"><EmployeePage /></PermissionGuard>} />
                    <Route path="/he-thong/phong-ban" element={<PermissionGuard resource="departments"><DepartmentPage /></PermissionGuard>} />
                    <Route path="/he-thong/chuc-vu" element={<PermissionGuard resource="positions"><PositionPage /></PermissionGuard>} />
                    <Route path="/he-thong/thong-tin-cong-ty" element={<PermissionGuard resource="company"><CompanyInfoPage /></PermissionGuard>} />
                    <Route path="/he-thong/phan-quyen" element={<PermissionGuard resource="permissions"><SecurityPage /></PermissionGuard>} />

                    <Route path="/quan-ly-van-tai" element={<TransportDashboard />} />
                    <Route path="/quan-ly-van-tai/chuyen-xe" element={<PermissionGuard resource="chuyen-xe"><ChuyenXePage /></PermissionGuard>} />
                    <Route path="/quan-ly-van-tai/bang-luong" element={<PermissionGuard resource="bang-luong"><BangLuongPage /></PermissionGuard>} />
                    <Route path="/quan-ly-van-tai/thong-ke-chuyen-di" element={<PermissionGuard resource="thong-ke-chuyen-di"><ThongKeChuyenDiPage /></PermissionGuard>} />
                    <Route path="/quan-ly-van-tai/thong-ke-luong" element={<PermissionGuard resource="thong-ke-luong"><ThongKeLuongPage /></PermissionGuard>} />
                    <Route path="/quan-ly-van-tai/tai-xe" element={<PermissionGuard resource="tai-xe"><TaiXePage /></PermissionGuard>} />
                    <Route path="/quan-ly-van-tai/dia-diem" element={<PermissionGuard resource="dia-diem"><DiaDiemPage /></PermissionGuard>} />
                    <Route path="/quan-ly-van-tai/danh-sach-xe" element={<PermissionGuard resource="danh-sach-xe"><DanhSachXePage /></PermissionGuard>} />

                    <Route path="/nhan-vien" element={<Navigate to="/he-thong/nhan-vien" replace />} />
                    <Route path="/phong-ban" element={<Navigate to="/he-thong/phong-ban" replace />} />
                    <Route path="/chuc-vu" element={<Navigate to="/he-thong/chuc-vu" replace />} />
                    <Route path="/thong-tin-cong-ty" element={<Navigate to="/he-thong/thong-tin-cong-ty" replace />} />
                    <Route path="/phan-quyen" element={<Navigate to="/he-thong/phan-quyen" replace />} />

                    <Route path="/ho-so" element={<Profile />} />
                    <Route path="/thong-bao" element={<NotificationPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </LazyMotion>
  );
};

export default App;
