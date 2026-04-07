export interface ProjectMetadata {
  name: string;
  descriptionExpanded: string;
  whatSolves: string;
  technicalDifferential: string;
  technologies: string[];
  videoUrl?: string; // YouTube URL ou arquivo local
  url: string;
}

export interface ProjectDetail {
  name: string;
  description: string;
  language: string;
  stars: number;
  size: number;
  url: string;
  updated_at: string;
  forks?: number;
  metadata?: ProjectMetadata;
}
