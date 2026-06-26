import { describe, it, expect } from 'vitest';
import { employeeSchema } from '../schema';

const validData = () => ({
  ho_va_ten: 'Nguyễn Văn A',
  avatar: '',
  trang_thai: 'Đang làm việc' as const,
  id_phong_ban: '1',
  id_chuc_vu: '1',
  so_dien_thoai: '0901234567',
  email: 'test@company.vn',
  ten_dang_nhap: 'nguyenvana',
});

const parse = (overrides: Record<string, unknown> = {}) =>
  employeeSchema.safeParse({ ...validData(), ...overrides });

describe('employeeSchema', () => {
  it('chấp nhận đúng bộ trường tối giản theo sheet Fix app', () => {
    expect(parse().success).toBe(true);
  });

  describe('ho_va_ten', () => {
    it('bắt buộc tối thiểu 2 ký tự', () => {
      expect(parse({ ho_va_ten: 'A' }).success).toBe(false);
      expect(parse({ ho_va_ten: 'AB' }).success).toBe(true);
    });
  });

  describe('so_dien_thoai', () => {
    it('chấp nhận rỗng vì sheet không chốt là bắt buộc', () => {
      expect(parse({ so_dien_thoai: '' }).success).toBe(true);
      expect(parse({ so_dien_thoai: null }).success).toBe(true);
    });

    it('chấp nhận SĐT Việt Nam hợp lệ', () => {
      expect(parse({ so_dien_thoai: '0901234567' }).success).toBe(true);
      expect(parse({ so_dien_thoai: '02812345678' }).success).toBe(true);
    });

    it('từ chối SĐT không hợp lệ', () => {
      expect(parse({ so_dien_thoai: '9012345678' }).success).toBe(false);
      expect(parse({ so_dien_thoai: '090abc1234' }).success).toBe(false);
    });
  });

  describe('email', () => {
    it('chấp nhận rỗng hoặc email hợp lệ', () => {
      expect(parse({ email: '' }).success).toBe(true);
      expect(parse({ email: null }).success).toBe(true);
      expect(parse({ email: 'user@domain.com' }).success).toBe(true);
    });

    it('từ chối email không hợp lệ', () => {
      expect(parse({ email: 'not-email' }).success).toBe(false);
    });
  });

  describe('ten_dang_nhap', () => {
    it('chấp nhận rỗng hoặc username hợp lệ', () => {
      expect(parse({ ten_dang_nhap: '' }).success).toBe(true);
      expect(parse({ ten_dang_nhap: 'admin' }).success).toBe(true);
      expect(parse({ ten_dang_nhap: 'tai.xe_01' }).success).toBe(true);
    });

    it('từ chối username có khoảng trắng hoặc ký tự lạ', () => {
      expect(parse({ ten_dang_nhap: 'tai xe' }).success).toBe(false);
      expect(parse({ ten_dang_nhap: 'tai@xe' }).success).toBe(false);
    });
  });

  describe('trường đã bị owner yêu cầu bỏ', () => {
    it('không yêu cầu mã nhân viên, ngày sinh, giới tính, hợp đồng hoặc ngày vào làm', () => {
      const removedFieldKeys = [
        ['ma', 'nhan', 'vien'],
        ['ngay', 'sinh'],
        ['gioi', 'tinh'],
        ['loai', 'hop', 'dong'],
        ['ngay', 'vao', 'lam'],
      ].map((parts) => parts.join('_'));
      const result = parse(Object.fromEntries(removedFieldKeys.map((key) => [key, undefined])));
      expect(result.success).toBe(true);
    });
  });
});
