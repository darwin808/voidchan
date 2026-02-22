INSERT INTO storage.buckets (id, name, public) VALUES ('room-files', 'room-files', true);
CREATE POLICY "room_files_select" ON storage.objects FOR SELECT USING (bucket_id = 'room-files');
CREATE POLICY "room_files_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'room-files');
CREATE POLICY "room_files_delete" ON storage.objects FOR DELETE USING (bucket_id = 'room-files');
