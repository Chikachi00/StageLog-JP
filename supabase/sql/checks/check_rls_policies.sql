-- Check RLS policies used by StageLog JP.
-- This is a read-only verification script, not a migration.

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in (
    'events',
    'profiles',
    'ticket_applications',
    'custom_venues',
    'objects'
  )
order by schemaname, tablename, policyname;
