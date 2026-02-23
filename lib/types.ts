export type ItemType = 'text' | 'image' | 'file';

export interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
  last_activity_at: string;
}

export interface Item {
  id: string;
  room_id: string;
  type: ItemType;
  content: string | null;
  blurhash: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  z_index: number;
  author_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CanvasState {
  offsetX: number;
  offsetY: number;
  scale: number;
  mode: 'idle' | 'panning' | 'dragging';
  dragTargetId: string | null;
}

export interface OptimisticItem extends Item {
  optimistic?: boolean;
}
