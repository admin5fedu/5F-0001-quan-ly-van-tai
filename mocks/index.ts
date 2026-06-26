/**
 * Central export — mock data cho toàn bộ ứng dụng.
 */
export {
  MOCK_DEPARTMENTS,
  MOCK_JOB_LEVELS,
  MOCK_EMPLOYEES,
  MOCK_BRANCHES,
  getEmployeeName,
  getDepartmentName,
  findMockEmployeeByLogin,
  findMockEmployeeById,
  type JobLevel,
} from './he-thong';

export { MOCK_POSITIONS, findMockPositionById } from './positions';

export {
  DRIVER_ROWS,
  LOCATION_ROWS,
  VEHICLE_ROWS,
  TRIP_ROWS,
  TRIP_DETAIL_ROWS,
  PAYROLL_ROWS,
} from './van-tai';

export { MOCK_AUTH_USERS, findMockAuthUser, type MockAuthUser } from './auth-users';
