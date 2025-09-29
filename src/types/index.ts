export interface Course {
  id: string;
  name: string;
  description: string;
  level: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Raw course type as returned by backend GET /api/course
export interface BackendCourse {
  _id: string;
  title: string;
  description: string;
  level: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  courseId: string;
  name: string;
  description: string;
  order: number;
  status?: 'draft' | 'published' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  name: string;
  description: string;
  order: number;
  level?: string;
  tags?: string[];
  meta?: Record<string, unknown>;
  status?: 'draft' | 'published' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface Flashcard {
  id: string;
  lessonId: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'approved' | 'rejected';
  bufferId?: string;
  createdAt: string;
  updatedAt: string;
  raw?: any;
}

export interface GenerateModulesRequest {
  level: string;
}

export interface GenerateLessonsRequest {
  level: string;
}

export interface GenerateFlashcardsRequest {
  lessonId: string;
  count: number;
}

export interface ApproveFlashcardsRequest {
  bufferId: string;
  lessonId: string;
}

export interface CreateModuleRequest {
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  is_active: boolean;
}

export interface UpdateModuleRequest {
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  is_active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Backend module type from generate-modules response
export interface BackendModule {
  _id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendLesson {
  _id: string;
  module_id: string;
  course_id: string;
  title: string;
  description: string;
  level: string;
  tags: string[];
  order_index: number;
  meta: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
