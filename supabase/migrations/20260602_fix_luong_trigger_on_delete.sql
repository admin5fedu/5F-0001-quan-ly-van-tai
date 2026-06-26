-- Migration: Fix fn_sync_vt_luong trigger to prevent foreign key errors during employee deletion
begin;

create or replace function public.fn_sync_vt_luong()
returns trigger
language plpgsql
security definer
as $$
declare
  v_id_tai_xe int8;
  v_thang int4;
  v_nam int4;
begin
  if tg_op = 'DELETE' then
    v_id_tai_xe := old.id_tai_xe;
    v_thang := extract(month from old.ngay)::int4;
    v_nam := extract(year from old.ngay)::int4;
  else
    v_id_tai_xe := new.id_tai_xe;
    v_thang := extract(month from new.ngay)::int4;
    v_nam := extract(year from new.ngay)::int4;
  end if;

  -- Bypasses recalculating salary if the driver/employee has been deleted or is being deleted
  if not exists (select 1 from public.var_nhan_vien where id = v_id_tai_xe) then
    return null;
  end if;

  insert into public.vt_luong (
    nam, thang, id_tai_xe,
    tong_luong_chuyen, tong_chi_phi_chuyen, tru_tien_khac, tong_con_lai,
    trang_thai, tg_cap_nhat
  )
  values (
    v_nam,
    v_thang,
    v_id_tai_xe,
    coalesce((select sum(tong_tien_luong) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
    coalesce((select sum(tong_phi) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
    0,
    coalesce((select sum(tong_tien_luong) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
    'Chưa duyệt',
    now()
  )
  on conflict (nam, thang, id_tai_xe) do update set
    tong_luong_chuyen = excluded.tong_luong_chuyen,
    tong_chi_phi_chuyen = excluded.tong_chi_phi_chuyen,
    tong_con_lai = excluded.tong_luong_chuyen - public.vt_luong.tru_tien_khac,
    tg_cap_nhat = now();

  if tg_op = 'UPDATE' and (old.id_tai_xe <> new.id_tai_xe or old.ngay <> new.ngay) then
    v_id_tai_xe := old.id_tai_xe;
    v_thang := extract(month from old.ngay)::int4;
    v_nam := extract(year from old.ngay)::int4;

    -- Bypasses recalculating salary if the old driver/employee has been deleted or is being deleted
    if not exists (select 1 from public.var_nhan_vien where id = v_id_tai_xe) then
      return null;
    end if;

    insert into public.vt_luong (
      nam, thang, id_tai_xe,
      tong_luong_chuyen, tong_chi_phi_chuyen, tru_tien_khac, tong_con_lai,
      trang_thai, tg_cap_nhat
    )
    values (
      v_nam,
      v_thang,
      v_id_tai_xe,
      coalesce((select sum(tong_tien_luong) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
      coalesce((select sum(tong_phi) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
      0,
      coalesce((select sum(tong_tien_luong) from public.vt_chuyen_xe where id_tai_xe = v_id_tai_xe and extract(month from ngay) = v_thang and extract(year from ngay) = v_nam), 0),
      'Chưa duyệt',
      now()
    )
    on conflict (nam, thang, id_tai_xe) do update set
      tong_luong_chuyen = excluded.tong_luong_chuyen,
      tong_chi_phi_chuyen = excluded.tong_chi_phi_chuyen,
      tong_con_lai = excluded.tong_luong_chuyen - public.vt_luong.tru_tien_khac,
      tg_cap_nhat = now();
  end if;

  return null;
end;
$$;

commit;
