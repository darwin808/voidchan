CREATE TYPE item_type AS ENUM ('text', 'image', 'file');
CREATE TABLE public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  type item_type NOT NULL,
  content TEXT,
  blurhash TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  x DOUBLE PRECISION NOT NULL DEFAULT 0,
  y DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION NOT NULL DEFAULT 200,
  height DOUBLE PRECISION NOT NULL DEFAULT 200,
  z_index INTEGER NOT NULL DEFAULT 0,
  author_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_items_room_id ON public.items (room_id);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_select" ON public.items FOR SELECT USING (true);
CREATE POLICY "items_insert" ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "items_update" ON public.items FOR UPDATE USING (true);
CREATE POLICY "items_delete" ON public.items FOR DELETE USING (true);
