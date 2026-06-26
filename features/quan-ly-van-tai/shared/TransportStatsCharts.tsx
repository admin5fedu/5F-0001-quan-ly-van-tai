import React from 'react';
import {
  MapPin,
  User,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import ChartTooltip from '@/components/ui/ChartTooltip';
import { CHART_COLORS } from '@/lib/constants/chart-colors';

export interface TransportStatsChartsProps {
  type: 'trips' | 'payroll';
  chartsVisible: boolean;
  chartHeight: number;
  isMdUp: boolean;
  primaryHex: string;
  // Trip Report Chart Data
  locationData?: Array<{ id?: string; name: string; value: number }>;
  driverTripData?: Array<{ id?: string; name: string; value: number }>;
  financeTrendData?: Array<{ label: string; salary: number; cost: number }>;
  // Payroll Report Chart Data
  driverPayrollData?: Array<{
    id?: string;
    name: string;
    tong_luong_chuyen: number;
    tru_tien_khac: number;
    tong_con_lai: number;
  }>;
  payrollTrendData?: Array<{ label: string; total: number }>;
  onDrillDownLocation?: (id: string) => void;
  onDrillDownDriver?: (id: string) => void;
}

const TransportStatsCharts: React.FC<TransportStatsChartsProps> = ({
  type,
  chartsVisible,
  chartHeight,
  isMdUp,
  primaryHex,
  locationData = [],
  driverTripData = [],
  financeTrendData = [],
  driverPayrollData = [],
  payrollTrendData = [],
  onDrillDownLocation,
  onDrillDownDriver,
}) => {
  if (!chartsVisible) return null;

  const renderDrillDownHint = (onDrillDownLocation || onDrillDownDriver) && (
    <p className="text-[11px] text-muted-foreground leading-snug px-0.5 animate-none">
      Chạm hoặc nhấn vào biểu đồ để mở danh sách chi tiết (theo địa điểm hoặc tài xế).
    </p>
  );

  if (type === 'trips') {
    return (
      <div className="space-y-2">
        {renderDrillDownHint}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 1. Biểu đồ tròn: Số chuyến theo địa điểm */}
          {locationData.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-3.5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-primary" />
                <h3 className="text-xs font-semibold text-foreground">Số chuyến đi theo Địa điểm</h3>
              </div>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <PieChart>
                  <Pie
                    data={locationData}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={38}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    onClick={(data: any) => {
                      if (data && data.id && onDrillDownLocation) {
                        onDrillDownLocation(data.id);
                      }
                    }}
                    style={{ cursor: onDrillDownLocation ? 'pointer' : 'default' }}
                  >
                    {locationData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value: string) => (
                      <span className="text-muted-foreground text-[11px]">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 2. Biểu đồ cột: Số chuyến theo tài xế */}
          {driverTripData.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-3.5">
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-primary" />
                <h3 className="text-xs font-semibold text-foreground">Số chuyến đi theo Tài xế</h3>
              </div>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={driverTripData} barSize={isMdUp ? 32 : 28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    name="Số chuyến"
                    fill={primaryHex}
                    onClick={(data: any) => {
                      if (data && data.id && onDrillDownDriver) {
                        onDrillDownDriver(data.id);
                      }
                    }}
                    style={{ cursor: onDrillDownDriver ? 'pointer' : 'default' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 3. Biểu đồ vùng: Biến động lương & chi phí theo ngày */}
          {financeTrendData.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-3.5 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-primary" />
                <h3 className="text-xs font-semibold text-foreground">Biến động Lương & Chi phí chuyến đi theo thời gian</h3>
              </div>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={financeTrendData}>
                  <defs>
                    <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="salary"
                    name="Tiền lương"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorSalary)"
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name="Chi phí"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#colorCost)"
                    dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Báo cáo lương: type === 'payroll'
  return (
    <div className="space-y-2">
      {renderDrillDownHint}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. Biểu đồ cột: Cơ cấu lương theo tài xế */}
        {driverPayrollData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} className="text-primary" />
              <h3 className="text-xs font-semibold text-foreground">Chi tiết lương thực tế theo Tài xế</h3>
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={driverPayrollData} barSize={isMdUp ? 24 : 20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="tong_luong_chuyen"
                  name="Lương chuyến"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  onClick={(data: any) => {
                    if (data && data.id && onDrillDownDriver) {
                      onDrillDownDriver(data.id);
                    }
                  }}
                  style={{ cursor: onDrillDownDriver ? 'pointer' : 'default' }}
                />
                <Bar
                  dataKey="tru_tien_khac"
                  name="Trừ tiền khác"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  onClick={(data: any) => {
                    if (data && data.id && onDrillDownDriver) {
                      onDrillDownDriver(data.id);
                    }
                  }}
                  style={{ cursor: onDrillDownDriver ? 'pointer' : 'default' }}
                />
                <Bar
                  dataKey="tong_con_lai"
                  name="Thực nhận"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                  onClick={(data: any) => {
                    if (data && data.id && onDrillDownDriver) {
                      onDrillDownDriver(data.id);
                    }
                  }}
                  style={{ cursor: onDrillDownDriver ? 'pointer' : 'default' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 2. Biểu đồ vùng: Biến động tổng quỹ lương */}
        {payrollTrendData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-primary" />
              <h3 className="text-xs font-semibold text-foreground">Xu hướng tổng quỹ lương thực nhận</h3>
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={payrollTrendData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Tổng thực nhận"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#colorTotal)"
                  dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransportStatsCharts;
