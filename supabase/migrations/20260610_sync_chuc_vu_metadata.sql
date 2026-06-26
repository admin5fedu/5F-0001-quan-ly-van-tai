-- Sync id_chuc_vu, full_name, id_phong_ban from var_nhan_vien to auth.users metadata
begin;

update auth.users
set raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
  'id_chuc_vu', emp.id_chuc_vu,
  'full_name', emp.ho_va_ten,
  'id_phong_ban', emp.id_phong_ban,
  'ten_dang_nhap', emp.ten_dang_nhap
)
from (
  select ten_dang_nhap, email, id_chuc_vu, ho_va_ten, id_phong_ban
  from public.var_nhan_vien
  where ten_dang_nhap is not null
) emp
where (
  raw_user_meta_data->>'ten_dang_nhap' = emp.ten_dang_nhap
  or lower(email) = lower(emp.ten_dang_nhap || '@gmail.com')
);

create or replace function public.fn_sync_employee_to_auth_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid;
  v_fake_email text;
begin
  if new.ten_dang_nhap is null or trim(new.ten_dang_nhap) = '' then
    return new;
  end if;

  v_fake_email := lower(trim(new.ten_dang_nhap)) || '@gmail.com';

  select id into v_auth_user_id
  from auth.users
  where lower(email) = v_fake_email
     or lower(email) = lower(coalesce(new.email, ''))
  limit 1;

  if v_auth_user_id is not null then
    update auth.users
    set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
      'ten_dang_nhap', new.ten_dang_nhap,
      'full_name', new.ho_va_ten,
      'id_chuc_vu', new.id_chuc_vu,
      'id_phong_ban', new.id_phong_ban
    )
    where id = v_auth_user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_employee_to_auth_metadata on public.var_nhan_vien;
create trigger trg_sync_employee_to_auth_metadata
after insert or update of ten_dang_nhap, ho_va_ten, id_chuc_vu, id_phong_ban, email
on public.var_nhan_vien
for each row
execute function public.fn_sync_employee_to_auth_metadata();

commit;