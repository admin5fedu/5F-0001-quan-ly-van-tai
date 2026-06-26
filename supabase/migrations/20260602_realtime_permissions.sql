-- Enable realtime for var_phan_quyen table
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- Check if table is not already in publication, if not, add it
    if not exists (
      select 1 
      from pg_publication_rel pr 
      join pg_class c on pr.prrelid = c.oid 
      join pg_publication p on pr.prpubid = p.oid 
      where p.pubname = 'supabase_realtime' and c.relname = 'var_phan_quyen'
    ) then
      alter publication supabase_realtime add table public.var_phan_quyen;
    end if;
  end if;
exception when others then
  -- Ignore if publication does not exist or we don't have superuser permission
end $$;
