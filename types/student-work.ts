export interface StudentWorkPost {
  id: string;
  title: string;
  slug: string;
  description?: string;
  student_id?: string;
  student_name: string;
  media_urls: string[]; // JSON array of image/video URLs
  cover_image_url: string;
  architecture_field?: string; // e.g. 'Residential', 'Commercial', etc.
  software_used?: string; // e.g. 'SketchUp, Photoshop'
  created_by?: string; // Admin creator id
  is_published: boolean;
  created_at: string;
  updated_at: string;

  // Computed/aggregated fields (joined or calculated)
  average_rating?: number;
  ratings_count?: number;
}

export interface StudentWorkRating {
  id: string;
  post_id: string;
  student_id: string;
  rating: number;
  feedback?: string;
  created_at: string;
  
  // Joined profile fields
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}
