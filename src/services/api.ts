import axios from 'axios';
import {
  Course,
  Module,
  Lesson,
  Flashcard,
  GenerateModulesRequest,
  GenerateLessonsRequest,
  GenerateFlashcardsRequest,
  ApproveFlashcardsRequest,
  CreateModuleRequest,
  UpdateModuleRequest,
  ApiResponse,
  BackendCourse,
  BackendModule,
  BackendLesson
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    "Access-Control-Allow-Origin": "*"
  },
  // Allow very long-running AI operations without client-side timeout
  timeout: 600000, // 10 minutes

});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// Course API
export const courseApi = {
  // Generate modules for a course (matches: POST /api/course/:courseId/generate-modules)
  generateModules: async (courseId: string, data: GenerateModulesRequest): Promise<ApiResponse<Module[]>> => {
    const response = await api.post(`/course/${courseId}/generate-modules`, data);
    // backend returns { success, payload: { modules: BackendModule[] } }
    const raw = response.data as any;
    const backendModules: BackendModule[] = raw.payload?.modules || [];
    const mapped: Module[] = backendModules.map((m) => ({
      id: m._id,
      courseId: m.course_id,
      name: m.title,
      description: m.description,
      order: m.order_index,
      status: m.is_active ? 'published' : 'draft',
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
    return { success: raw.success, data: mapped, message: raw.message };
  },

  // Get single course
  getCourse: async (courseId: string): Promise<ApiResponse<Course>> => {
    const response = await api.get(`/course/${courseId}`);
    return response.data;
  },

  // List all courses (matches: GET /api/course)
  getCourses: async (): Promise<ApiResponse<Course[]>> => {
    const response = await api.get('/course');
    // The new API response structure groups courses by categories
    // { success, message, data: [{ category_id, category_name, category_description, courses: [...] }] }
    const backend = response.data as any;
    const categories = backend.data || [];
    // Flatten all courses from all categories
    
    const allCourses: BackendCourse[] = categories.flatMap((category: any) =>
      (category.courses || []).map((course: any) => ({
        ...course,
        category_id: category.category_id,
        category_name: category.category_name,
      }))
    );

    // Map backend shape to UI Course
    const mapped: Course[] = allCourses.map((c: any) => ({
      id: c._id,
      name: c.title,
      description: c.description,
      level: c.level || 'basic',
      course_char_url: c.course_char_url || "",
      icon_url: c.icon_url || "",
      status: (c.status as any) || 'draft',
      category_id: c.category_id,
      category_name: c.category_name,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return { success: backend.success, data: mapped, message: backend.message };
  }
};

// Create courses API
export interface CreateCoursePayload {
  categoryId: string;
  courses: Array<{
    title: string;
    description: string;
    level: string;
    language: string;
    is_premium: boolean;
    icon?: {
      fileName: string;
      fileType: string;
      fileSize?: number;
    };
    course_char?: {
      fileName: string;
      fileType: string;
      fileSize?: number;
    };
  }>;
}

export const courseCreateApi = {
  createCourses: async (payload: CreateCoursePayload): Promise<ApiResponse<Course[]>> => {
    const response = await api.post('/course', payload);
    return response.data;
  },

  updateCourse: async (id: string, payload: any): Promise<ApiResponse<any>> => {
    const response = await api.put(`/course/${id}`, payload);
    return {success: response.data.success, data: response.data.payload, message: response.data.message };
  },
};


// Module API
export const moduleApi = {
  // Get all modules
  getAllModules: async (): Promise<ApiResponse<Module[]>> => {
    const response = await api.get('/modules');
    const raw = response.data as any;
    const backendModulesAny: any = (raw.data || raw.payload || raw.modules || []);
    const modulesArrayRaw: any = Array.isArray(backendModulesAny)
      ? backendModulesAny
      : (backendModulesAny.modules || backendModulesAny.data || []);
    const modulesArray: BackendModule[] = (modulesArrayRaw || []) as BackendModule[];
    const mapped: Module[] = (modulesArray || []).map((m: any) => ({
      id: m._id,
      courseId: typeof m.course_id === 'string' ? m.course_id : (m.course_id?._id || ''),
      name: m.title,
      description: m.description,
      order: m.order_index,
      status: m.is_active ? 'published' : 'draft',
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
    return { success: !!raw.success || true, data: mapped, message: raw.message };
  },
  // Generate lessons for a module
  generateLessons: async (moduleId: string, data: GenerateLessonsRequest): Promise<ApiResponse<Lesson[]>> => {
    const response = await api.post(`/modules/${moduleId}/generate-lessons`, data);
    // backend returns { success, payload: { lessons: BackendLesson[] } }
    const raw = response.data as any;
    const backendLessons: BackendLesson[] = raw.payload?.lessons || [];
    const mapped: Lesson[] = backendLessons.map((l) => ({
      id: l._id,
      moduleId: l.module_id,
      name: l.title,
      description: l.description,
      order: l.order_index,
      level: l.level,
      tags: l.tags,
      meta: l.meta,
      status: l.is_active ? 'published' : 'draft',
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }));
    return { success: raw.success, data: mapped, message: raw.message };
  },

  // Get module details
  getModule: async (moduleId: string): Promise<ApiResponse<Module>> => {
    try {
      const response = await api.get(`/modules/${moduleId}`);
      const raw: any = response.data || {};
      const m: any = raw.data || raw.payload?.module || raw.module || raw.payload || {};
      const mapped: Module = {
        id: m._id || m.id || moduleId,
        courseId: typeof m.course_id === 'string' ? m.course_id : (m.course_id?._id || ''),
        name: m.title || m.name || '',
        description: m.description || '',
        order: m.order_index ?? m.order ?? 0,
        status: m.is_active ? 'published' : 'draft',
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      };
      return { success: true, data: mapped, message: raw.message } as any;
    } catch (primaryError) {
      // Fallback: fetch all modules and find the target by id
      try {
        const responseAll = await api.get('/modules');
        const rawAll = responseAll.data as any;
        const backendModulesAny: any = rawAll.data || rawAll.payload || rawAll.modules || [];
        const modulesArrayRaw: any = Array.isArray(backendModulesAny)
          ? backendModulesAny
          : (backendModulesAny.modules || backendModulesAny.data || []);
        const modulesArray: BackendModule[] = (modulesArrayRaw || []) as BackendModule[];
        const found = (modulesArray || []).find((m) => (m as any)?._id === moduleId);
        if (!found) {
          return { success: false, data: undefined as any, message: 'Module not found' } as any;
        }
        const mapped: Module = {
          id: found._id,
          courseId: typeof found.course_id === 'string' ? found.course_id : ((found as any).course_id?._id || ''),
          name: found.title,
          description: found.description,
          order: found.order_index,
          status: found.is_active ? 'published' : 'draft',
          createdAt: found.created_at,
          updatedAt: found.updated_at,
        };
        return { success: true, data: mapped, message: rawAll.message } as any;
      } catch (fallbackError) {
        return { success: false, data: undefined as any, message: 'Failed to load module' } as any;
      }
    }
  },

  // Get modules for a course
  getModulesByCourse: async (courseId: string): Promise<ApiResponse<Module[]>> => {
    const response = await api.get(`/courses/${courseId}/modules`);
    return response.data;
  },

  // Get modules by course id via /modules/:courseId
  getModulesByCourseId: async (courseId: string): Promise<ApiResponse<Module[]>> => {
    const response = await api.get(`/modules/${courseId}`);
    const raw = response.data as any;
    const backendModulesAny: any = raw.data || raw.payload || raw.modules || [];
    const list: any[] = Array.isArray(backendModulesAny)
      ? backendModulesAny
      : (backendModulesAny?.modules || backendModulesAny?.data || []);
    const mapped: Module[] = (list || []).map((m: any) => ({
      id: m._id || m.id,
      courseId: typeof m.course_id === 'string' ? m.course_id : (m.course_id?._id || ''),
      name: m.title || m.name,
      description: m.description,
      order: m.order_index ?? m.order ?? 0,
      status: m.is_active ? 'published' : 'draft',
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
    return { success: !!raw.success || true, data: mapped, message: raw.message } as any;
  },

  // Create a new module
  createModule: async (data: CreateModuleRequest): Promise<ApiResponse<Module>> => {
    const response = await api.post('/modules/', data);
    const raw = response.data as any;
    const m = raw.data || raw.payload || raw;
    const mapped: Module = {
      id: m._id || m.id,
      courseId: m.course_id,
      name: m.title,
      description: m.description,
      order: m.order_index,
      status: m.is_active ? 'published' : 'draft',
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    };
    return { success: !!raw.success || true, data: mapped, message: raw.message };
  },

  // Update a module
  updateModule: async (moduleId: string, data: UpdateModuleRequest): Promise<ApiResponse<Module>> => {
    const response = await api.put(`/modules/${moduleId}`, data);
    const raw = response.data as any;
    const m = raw.data || raw.payload || raw;
    const mapped: Module = {
      id: m._id || m.id,
      courseId: m.course_id,
      name: m.title,
      description: m.description,
      order: m.order_index,
      status: m.is_active ? 'published' : 'draft',
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    };
    return { success: !!raw.success || true, data: mapped, message: raw.message };
  },

  // Delete a module
  deleteModule: async (moduleId: string): Promise<ApiResponse<boolean>> => {
    const response = await api.delete(`/modules/${moduleId}`);
    const raw = response.data as any;
    const success = typeof raw?.success === 'boolean' ? raw.success : true;
    return { success, data: success, message: raw?.message } as any;
  }
};

// Lesson API
export const lessonApi = {
  // Get lesson details
  getLesson: async (lessonId: string): Promise<ApiResponse<Lesson>> => {
    const response = await api.get(`/lessons/${lessonId}`);
    return response.data;
  },

  // Get lessons for a module
  getLessonsByModule: async (
    moduleId: string,
    params?: { skip?: number; limit?: number; search?: string }
  ): Promise<ApiResponse<Lesson[]>> => {
    const response = await api.get(`/lessons/modules/${moduleId}`, { params });
    const raw = response.data as any;
    const backendLessonsAny: any =
      raw.payload?.lessons || raw.data?.lessons || raw.lessons || raw.data || [];
    const list: any[] = Array.isArray(backendLessonsAny)
      ? backendLessonsAny
      : (backendLessonsAny?.lessons || []);
    const mapped: Lesson[] = (list || []).map((l: any) => ({
      id: l._id,
      moduleId: l.module_id,
      name: l.title,
      description: l.description,
      order: l.order_index,
      level: l.level,
      tags: l.tags,
      meta: l.meta,
      status: l.is_active ? 'published' : 'draft',
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }));
    return { success: !!raw.success || true, data: mapped, message: raw.message };
  },

  // Create a new lesson (POST /api/lessons)
  createLesson: async (payload: {
    moduleId: string;
    courseId?: string;
    title: string;
    description?: string;
    level?: string;
    order_index?: number;
    tags?: string[];
    is_active?: boolean;
  }): Promise<ApiResponse<Lesson>> => {
    const body = {
      module_id: payload.moduleId,
      course_id: payload.courseId,
      title: payload.title,
      description: payload.description ?? '',
      level: payload.level,
      order_index: payload.order_index,
      tags: payload.tags ?? [],
      is_active: payload.is_active ?? false,
    } as any;
    const response = await api.post(`/lessons`, body);
    const raw = response.data as any;
    const l: any = raw.payload?.lesson || raw.data?.lesson || raw.data || raw.lesson || raw;
    const mapped: Lesson = {
      id: l._id || l.id,
      moduleId: l.module_id || payload.moduleId,
      name: l.title || payload.title,
      description: l.description ?? '',
      order: l.order_index ?? (payload.order_index ?? 0),
      level: l.level,
      tags: l.tags,
      meta: l.meta,
      status: l.is_active ? 'published' : 'draft',
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    };
    return { success: !!raw.success || true, data: mapped, message: raw.message } as any;
  },

  // Delete a lesson (DELETE /api/lessons/:lessonId)
  deleteLesson: async (lessonId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/lessons/${lessonId}`);
    const raw = response.data as any;
    return { success: !!raw?.success || true, data: undefined as any, message: raw?.message } as any;
  },

  // Update a lesson (PUT /api/lessons/:lessonId)
  updateLesson: async (lessonId: string, payload: {
    moduleId?: string;
    courseId?: string;
    title?: string;
    description?: string;
    level?: string;
    order_index?: number;
    tags?: string[];
    is_active?: boolean;
  }): Promise<ApiResponse<Lesson>> => {
    const body = {
      module_id: payload.moduleId,
      course_id: payload.courseId,
      title: payload.title,
      description: payload.description,
      level: payload.level,
      order_index: payload.order_index,
      tags: payload.tags,
      is_active: payload.is_active,
    } as any;
    const response = await api.put(`/lessons/${lessonId}`, body);
    const raw = response.data as any;
    const l: any = raw.payload?.lesson || raw.data?.lesson || raw.data || raw.lesson || raw;
    const mapped: Lesson = {
      id: l._id || l.id || lessonId,
      moduleId: l.module_id || payload.moduleId || '',
      name: l.title || payload.title || '',
      description: l.description ?? payload.description ?? '',
      order: l.order_index ?? (payload.order_index ?? 0),
      level: l.level ?? payload.level,
      tags: l.tags ?? payload.tags,
      meta: l.meta,
      status: l.is_active ? 'published' : 'draft',
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    };
    return { success: !!raw.success || true, data: mapped, message: raw.message } as any;
  }
};

// Flashcard API
export const flashcardApi = {
  // Generate flashcards for a lesson
  generateFlashcards: async (data: GenerateFlashcardsRequest): Promise<ApiResponse<Flashcard[]>> => {
    const response = await api.post('/ai/preview/flash-card', data);
    const raw: any = response.data || {};
    const preview = raw.payload?.preview || {};
    const bufferId: string | undefined = raw.payload?.bufferId;
    const list: any[] = Array.isArray(preview.flashcards) ? preview.flashcards : [];
    const mapped: Flashcard[] = list.map((fc: any, idx: number) => {
      const isMcq = (fc.answer_type === 'mcq') && fc.content_data?.answer;
      const options: string[] = isMcq ? (fc.content_data?.answer?.options || []) : [];
      const correct: string | undefined = isMcq ? fc.content_data?.answer?.correct : undefined;
      const backText = isMcq
        ? `Options: ${options.join(', ')}${correct ? ` | Correct: ${correct}` : ''}`
        : (fc.content_data?.subtext || '');
      const difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      return {
        id: fc._id || String(idx),
        lessonId: fc.lesson_id || '',
        front: fc.prompt || '',
        back: backText,
        difficulty,
        status: 'pending',
        bufferId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        raw: fc,
      } as Flashcard;
    });
    return { success: !!raw.success, data: mapped, message: raw.message } as any;
  },

  // Fetch AI draft flashcards (external drafts endpoint)
  getDrafts: async (): Promise<ApiResponse<Flashcard[]>> => {
    const response = await api.get('/ai/drafts');
    const raw: any = response.data || {};
    // Shape: { success, payload: { drafts: [ { buffer_id, lesson_id, flashcards: [...] }, ... ] } }
    const draftsContainer: any[] = raw?.payload?.drafts || [];
    // Flatten all flashcards from all drafts
    const flatFlashcards: any[] = draftsContainer.flatMap((d: any) => {
      const list = Array.isArray(d?.flashcards) ? d.flashcards : [];
      return list.map((fc: any) => ({
        ...fc,
        _buffer_id: d?.buffer_id || d?.bufferId,
        _draft_id: d?._id || d?.draft_id || d?.draftId,
        _lesson_id: d?.lesson_id || d?.lessonId
      }));
    });
    const mapped: Flashcard[] = flatFlashcards.map((fc: any, idx: number) => {
      const isMcq = (fc.answer_type === 'mcq') && fc.content_data?.answer;
      const options: string[] = isMcq ? (fc.content_data?.answer?.options || []) : [];
      const correct: string | undefined = isMcq ? fc.content_data?.answer?.correct : undefined;
      const backText = isMcq
        ? `Options: ${options.join(', ')}${correct ? ` | Correct: ${correct}` : ''}`
        : (fc.content_data?.subtext || '');
      return {
        id: fc._id || String(idx),
        lessonId: fc.lesson_id || fc._lesson_id || '',
        front: fc.prompt || '',
        back: backText,
        difficulty: 'medium',
        status: 'pending',
        bufferId: fc._buffer_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        raw: fc,
      } as Flashcard;
    });
    return { success: !!raw.success, data: mapped, message: raw.message } as any;
  },

  // Approve flashcards
  approveFlashcards: async (data: ApproveFlashcardsRequest): Promise<ApiResponse<void>> => {
    const response = await api.post('/ai/approve/lesson', data);
    return response.data;
  },

  // Approve single flashcard
  approveFlashcard: async (payload: { flashcardId: string; draftId: string; lessonId: string }): Promise<ApiResponse<void>> => {
    const { flashcardId, draftId, lessonId } = payload;
    const response = await api.post('/ai/approve/flash-card', {
      approvedIds: [flashcardId],
      rejectedIds: [],
      draftId,
      lessonId
    });
    return response.data;
  },

  // Reject single flashcard
  rejectFlashcard: async (payload: { flashcardId: string }): Promise<ApiResponse<void>> => {
    const { flashcardId } = payload;
    const response = await api.delete(`/flashcards/reject/${flashcardId}`);
    return response.data;
  },

  declineFlashcard: async (payload: { draftId: string; rejectedIds: string[]; lessonId: string }): Promise<ApiResponse<void>> => {
    const response = await api.post(`/ai/decline/flash-card`, payload);
    return response.data;
  },


  // Upload media for a specific flashcard in a draft
  uploadFlashcardMedia: async (
    draftId: string,
    flashcardId: string,
    file: File,
    onUploadProgress?: (percent: number) => void
  ): Promise<ApiResponse<any>> => {
    const form = new FormData();
    form.append('flashcardId', flashcardId);
    form.append('file', file);
    const response = await api.put(`/ai/drafts/${draftId}/media`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        const total = (evt?.total || (evt as any)?.srcElement?.getResponseHeader?.('content-length')) as number | undefined;
        if (onUploadProgress && total) {
          const percent = Math.round(((evt.loaded || 0) * 100) / total);
          onUploadProgress(percent);
        }
      }
    });
    return response.data;
  },

  // Generate/upload media via prompt for a specific flashcard in a draft
  uploadFlashcardMediaByPrompt: async (
    draftId: string,
    flashcardId: string,
    prompt: string,
    mediaType: 'image' | 'audio' | 'video'
  ): Promise<ApiResponse<any>> => {
    const body = { prompt, mediaType, flashcardId } as any;
    const response = await api.put(`/ai/drafts/${draftId}/media`, body, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  // Get flashcards for a lesson
  getFlashcardsByLesson: async (lessonId: string): Promise<ApiResponse<Flashcard[]>> => {
    const response = await api.get(`/lessons/${lessonId}/flashcards`);
    return response.data;
  }
};

// Categories API
export interface Category {
  _id: string;
  name: string;
  description: string;
  icon_url: string;
  is_active: boolean;
  created_at: string;
}

export const categoriesApi = {
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/categories');
    const raw = response.data;
    return {
      success: raw.success,
      data: raw.payload || raw.data || [],
      message: raw.message
    };
  }
};

export const helpCenterApi = {
  getStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/help-center/admin/statistics");
    const raw = response.data;

    return {
      success: raw.success,
      data: raw.payload || raw.data || [],
      message: raw.message,
    };
  },

  getAllQueries: async (page = 1): Promise<ApiResponse<any>> => {
    const response = await api.get(`/help-center/admin/queries?page=${page}`);
    const raw = response.data;

    return {
      success: raw.success,
      data: raw.payload || raw.data || {},
      message: raw.message,
    };
  },

  updateQueryStatus: async (
    queryId: string,
    status: string,
    admin_response: string
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(
      `/help-center/admin/query/${queryId}/status`,
      {
        status,
        admin_response,
      }
    );

    const raw = response.data;

    return {
      success: raw.success,
      data: raw.payload || raw.data || {},
      message: raw.message,
    };
  },
};

export const flagsApi = {
  // Get all admin flags
  getAllFlags: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/flags/admin/all");
    const raw = response.data;

    return {
      success: raw.success,
      data: raw.payload || raw.data || [],
      message: raw.message,
    };
  },

  // Get statistics of flags
  getStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("/flags/admin/statistics");
    const raw = response.data;

    return {
      success: raw.success,
      data: raw.payload || raw.data || {},
      message: raw.message,
    };
  },

  // Update flag status
  updateFlagStatus: async (
    flagId: string,
    status: string,
    admin_notes: string
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(
      `/flags/admin/${flagId}/status`,
      {
        status,
        admin_notes,
      }
    );

    const raw = response.data;

    return {
      success: raw.success,
      data: raw.payload || raw.data || {},
      message: raw.message,
    };
  },
};

export default api;
