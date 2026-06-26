export interface MockAuthUser {
  ten_dang_nhap: string;
  password: string;
  employeeId: string;
  role: 'admin' | 'user';
}

export const MOCK_AUTH_USERS: MockAuthUser[] = [
  { ten_dang_nhap: 'admin', password: '5fedu.com', employeeId: 'emp-000', role: 'admin' },
  { ten_dang_nhap: 'xuyen', password: '5fedu.com', employeeId: 'emp-tx-1', role: 'user' },
  { ten_dang_nhap: 'linh', password: '5fedu.com', employeeId: 'emp-tx-2', role: 'user' },
  { ten_dang_nhap: 'long.cao', password: '5fedu.com', employeeId: 'emp-015', role: 'user' },
];

export function findMockAuthUser(loginName: string, password: string): MockAuthUser | undefined {
  const name = loginName.trim().toLowerCase();
  return MOCK_AUTH_USERS.find(
    (u) => u.ten_dang_nhap.toLowerCase() === name && u.password === password,
  );
}
