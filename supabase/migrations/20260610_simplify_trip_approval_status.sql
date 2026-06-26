begin;

alter table public.vt_chuyen_xe
  alter column trang_thai set default 'Chưa duyệt';

update public.vt_chuyen_xe
set trang_thai = case
  when trang_thai = 'Đã thực hiện' then 'Đã duyệt'
  when trang_thai in ('Hủy', 'Không thực hiện') then 'Không duyệt'
  when trang_thai in ('Chưa thực hiện', 'Đang thực hiện') then 'Chưa duyệt'
  else trang_thai
end
where trang_thai in ('Đã thực hiện', 'Hủy', 'Không thực hiện', 'Chưa thực hiện', 'Đang thực hiện');

alter table public.vt_chuyen_xe_ct
  alter column trang_thai set default 'Chưa duyệt';

alter table public.vt_chuyen_xe_ct
  alter column phe_duyet set default 'Chưa duyệt';

with normalized_ct as (
  select
    id,
    case
      when coalesce(nullif(phe_duyet, ''), nullif(trang_thai, '')) = 'Đã duyệt' then 'Đã duyệt'
      when coalesce(nullif(phe_duyet, ''), nullif(trang_thai, '')) = 'Không duyệt' then 'Không duyệt'
      when coalesce(nullif(phe_duyet, ''), nullif(trang_thai, '')) = 'Chưa duyệt' then 'Chưa duyệt'
      when coalesce(nullif(phe_duyet, ''), nullif(trang_thai, '')) = 'Đã thực hiện' then 'Đã duyệt'
      when coalesce(nullif(phe_duyet, ''), nullif(trang_thai, '')) in ('Hủy', 'Không thực hiện') then 'Không duyệt'
      else 'Chưa duyệt'
    end as next_status
  from public.vt_chuyen_xe_ct
)
update public.vt_chuyen_xe_ct ct
set
  phe_duyet = normalized_ct.next_status,
  trang_thai = normalized_ct.next_status
from normalized_ct
where ct.id = normalized_ct.id
  and (
    ct.phe_duyet is distinct from normalized_ct.next_status
    or ct.trang_thai is distinct from normalized_ct.next_status
  );

commit;
