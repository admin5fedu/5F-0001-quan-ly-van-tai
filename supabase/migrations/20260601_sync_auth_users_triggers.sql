-- Migration: Add triggers on auth.users for bidirectional sync with public.var_nhan_vien
begin;

-- 1. Function for INSERT
create or replace function public.fn_sync_auth_user_to_employee()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_ten_dang_nhap text;
  v_email text;
  v_ho_va_ten text;
begin
  v_email := new.email;
  
  -- Extract ten_dang_nhap: if not in metadata, use prefix of email
  v_ten_dang_nhap := coalesce(
    new.raw_user_meta_data->>'ten_dang_nhap',
    split_part(v_email, '@', 1)
  );
  
  -- Extract ho_va_ten: look for name, full name, display name, metadata, fallback to capitalized username
  v_ho_va_ten := coalesce(
    new.raw_user_meta_data->>'ho_va_ten',
    new.raw_user_meta_data->>'display_name',
    initcap(v_ten_dang_nhap)
  );

  -- Check if employee already exists in public.var_nhan_vien (by ten_dang_nhap or email)
  if not exists (
    select 1 from public.var_nhan_vien 
    where ten_dang_nhap = v_ten_dang_nhap or email = v_email
  ) then
    insert into public.var_nhan_vien (
      ho_va_ten,
      email,
      ten_dang_nhap,
      trang_thai,
      la_tai_xe
    )
    values (
      v_ho_va_ten,
      v_email,
      v_ten_dang_nhap,
      'Đang làm việc',
      false
    );
  else
    -- Update existing record's credentials if they are null to link them
    update public.var_nhan_vien
    set 
      email = coalesce(email, v_email),
      ten_dang_nhap = coalesce(ten_dang_nhap, v_ten_dang_nhap)
    where ten_dang_nhap = v_ten_dang_nhap or email = v_email;
  end if;

  return new;
end;
$$;

-- 2. Function for UPDATE
create or replace function public.fn_sync_auth_user_update_to_employee()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_old_ten_dang_nhap text;
  v_new_ten_dang_nhap text;
  v_old_email text;
  v_new_email text;
begin
  v_old_email := old.email;
  v_new_email := new.email;
  
  v_old_ten_dang_nhap := coalesce(
    old.raw_user_meta_data->>'ten_dang_nhap',
    split_part(v_old_email, '@', 1)
  );
  v_new_ten_dang_nhap := coalesce(
    new.raw_user_meta_data->>'ten_dang_nhap',
    split_part(v_new_email, '@', 1)
  );

  update public.var_nhan_vien
  set 
    ten_dang_nhap = v_new_ten_dang_nhap,
    email = v_new_email,
    ho_va_ten = coalesce(new.raw_user_meta_data->>'ho_va_ten', new.raw_user_meta_data->>'display_name', ho_va_ten)
  where ten_dang_nhap = v_old_ten_dang_nhap or email = v_old_email;

  return new;
end;
$$;

-- 3. Function for DELETE
create or replace function public.fn_sync_auth_user_delete_to_employee()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_ten_dang_nhap text;
  v_email text;
begin
  v_email := old.email;
  v_ten_dang_nhap := coalesce(
    old.raw_user_meta_data->>'ten_dang_nhap',
    split_part(v_email, '@', 1)
  );

  -- Set ten_dang_nhap to null to disable logging into the app, preserving DB references
  update public.var_nhan_vien
  set ten_dang_nhap = null
  where ten_dang_nhap = v_ten_dang_nhap or email = v_email;

  return old;
end;
$$;

-- 4. Create triggers on auth.users (triggers reside in the auth schema, but fire our functions)
drop trigger if exists trg_sync_auth_user_to_employee on auth.users;
create trigger trg_sync_auth_user_to_employee
after insert on auth.users
for each row execute function public.fn_sync_auth_user_to_employee();

drop trigger if exists trg_sync_auth_user_update_to_employee on auth.users;
create trigger trg_sync_auth_user_update_to_employee
after update of email, raw_user_meta_data on auth.users
for each row execute function public.fn_sync_auth_user_update_to_employee();

drop trigger if exists trg_sync_auth_user_delete_to_employee on auth.users;
create trigger trg_sync_auth_user_delete_to_employee
after delete on auth.users
for each row execute function public.fn_sync_auth_user_delete_to_employee();

commit;
