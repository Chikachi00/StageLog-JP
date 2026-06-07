-- Check public.custom_venues columns.
-- This is a read-only verification script, not a migration.

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'custom_venues'
order by ordinal_position;
