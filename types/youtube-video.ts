export interface YoutubeVideo {
  id: string;
  video_id: string;
  title: string;
  description?: string;
  category: string;
  published_at: string;
  is_featured: boolean;
  created_at: string;
}
