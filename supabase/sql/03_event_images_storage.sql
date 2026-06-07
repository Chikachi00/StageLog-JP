-- StageLog JP event image storage
-- Run after events core/compatibility SQL so public.events exists.

alter table public.events
add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "event_images_select_own" on storage.objects;
create policy "event_images_select_own"
on storage.objects
for select
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "event_images_insert_own" on storage.objects;
create policy "event_images_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "event_images_update_own" on storage.objects;
create policy "event_images_update_own"
on storage.objects
for update
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "event_images_delete_own" on storage.objects;
create policy "event_images_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
