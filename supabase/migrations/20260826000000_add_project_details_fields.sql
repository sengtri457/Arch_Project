-- Migration to add key features, challenges, and solutions to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS features_json JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS challenges_json JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS solutions_json JSONB DEFAULT '[]';
