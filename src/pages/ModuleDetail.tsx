import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  ArrowRight, 
  Settings,
  CheckCircle,
  Clock
} from 'lucide-react';
import { moduleApi, lessonApi } from '../services/api';
import { Module, Lesson } from '../types';

const ModuleDetail: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const location = useLocation();
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingLessons, setGeneratingLessons] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [page, setPage] = useState(0);
  const [pageLimit, setPageLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [addingLessonId, setAddingLessonId] = useState<string | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; description: string } | null>(null);
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [addForm, setAddForm] = useState<{
    title: string;
    description: string;
    level: string;
    tagsText: string;
    order_index: number;
    is_active: boolean;
  }>({ title: '', description: '', level: 'beginner', tagsText: '', order_index: 1, is_active: true });
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    if (moduleId) {
      const state = location.state as { lessons?: Lesson[] } | null;
      if (state?.lessons && state.lessons.length > 0) {
        setLessons(state.lessons);
      }
      loadModuleData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, page, pageLimit]);

  const loadModuleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load module data
      const moduleResponse = await moduleApi.getModule(moduleId!);
      if (moduleResponse.success) {
        setModule(moduleResponse.data);
      } else {
        setError(moduleResponse.message || 'Failed to load module');
        return;
      }

      await loadLessons();
    } catch (err) {
      setError('Failed to load module data');
      console.error('Error loading module:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (
    p: number = page,
    limit: number = pageLimit,
    searchText: string = search,
    sticky?: Lesson
  ) => {
    if (!moduleId) return;
    const skip = p * limit;
    const lessonsResponse = await lessonApi.getLessonsByModule(moduleId!, {
      skip,
      limit,
      search: searchText || undefined
    });
    if (lessonsResponse.success) {
      const fetched = lessonsResponse.data || [];
      if (sticky && !fetched.find((l) => l.id === sticky.id)) {
        setLessons([sticky, ...fetched]);
      } else {
        setLessons(fetched);
      }
    } else {
      setLessons([]);
    }
  };

  const handleGenerateLessons = async () => {
    if (!moduleId) return;
    
    try {
      setGeneratingLessons(true);
      const response = await moduleApi.generateLessons(moduleId, {
        level: selectedLevel
      });
      
      if (response.success) {
        setLessons(response.data);
        // Show success message
      }
    } catch (err) {
      console.error('Error generating lessons:', err);
      // Show error message
    } finally {
      setGeneratingLessons(false);
    }
  };

  const handleSearch = async () => {
    if (!moduleId) return;
    setPage(0);
    await loadLessons();
  };

  const handleAddLesson = async (afterLesson?: Lesson) => {
    // deprecated per-item add
  };

  const submitNewLesson = async () => {
    if (!moduleId || !module) return;
    try {
      setCreating(true);
      const tags = addForm.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const response = await lessonApi.createLesson({
        moduleId,
        courseId: module.courseId,
        title: addForm.title,
        description: addForm.description,
        level: addForm.level,
        order_index: addForm.order_index,
        tags,
        is_active: addForm.is_active
      });
      if (response.success) {
        setShowAddForm(false);
        setAddForm({ title: '', description: '', level: 'beginner', tagsText: '', order_index: 1, is_active: true });
        const created = response.data as Lesson | undefined;
        if (created) {
          // Persist locally without immediate refetch to avoid race overwriting
          setLessons((prev) => [created, ...prev.filter((l) => l.id !== created.id)]);
        }
      }
    } catch (err) {
      console.error('Error creating lesson:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    try {
      setDeletingLessonId(lesson.id);
      const response = await lessonApi.deleteLesson(lesson.id);
      if (response.success) {
        await loadLessons();
      }
    } catch (err) {
      console.error('Error deleting lesson:', err);
    } finally {
      setDeletingLessonId(null);
    }
  };

  const startEdit = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setEditForm({ name: lesson.name, description: lesson.description || '' });
  };

  const cancelEdit = () => {
    setEditingLessonId(null);
    setEditForm(null);
  };

  const saveEdit = async (lesson: Lesson) => {
    if (!editForm) return;
    try {
      setSavingLessonId(lesson.id);
      const response = await lessonApi.updateLesson(lesson.id, {
        moduleId: lesson.moduleId,
        courseId: module?.courseId,
        title: editForm.name,
        description: editForm.description,
      });
      if (response.success) {
        await loadLessons();
        cancelEdit();
      }
    } catch (err) {
      console.error('Error updating lesson:', err);
    } finally {
      setSavingLessonId(null);
    }
  };

  const handlePrev = () => {
    setPage((p) => Math.max(0, p - 1));
  };

  const handleNext = () => {
    // Optimistic: if we filled the page, allow going next
    if (lessons.length >= pageLimit) {
      setPage((p) => p + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'Module not found'}</div>
        <Link to="/" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link to="/" className="hover:text-gray-700">Dashboard</Link>
            <span>/</span>
            <Link to={`/course/${module.courseId}`} className="hover:text-gray-700">Course</Link>
            <span>/</span>
            <span className="text-gray-900">{module.name}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">{module.name}</h1>
          <p className="mt-2 text-gray-600">{module.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Module Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Lessons</p>
              <p className="text-2xl font-semibold text-gray-900">{lessons.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-semibold text-gray-900">
                {lessons.filter(l => l.status === 'published').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {lessons.filter(l => l.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Lessons Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Lessons</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="input w-auto"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={handleGenerateLessons}
            disabled={generatingLessons}
            className="btn btn-primary flex items-center gap-2"
          >
            {generatingLessons ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Generate Lessons
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            <input
              className="input w-48"
              placeholder="Search lessons"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input w-28" value={pageLimit} onChange={(e) => setPageLimit(parseInt(e.target.value) || 10)}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <button type="button" className="btn btn-secondary" onClick={handleSearch}>Apply</button>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Lessons</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddForm((v) => !v)}
            >
              {showAddForm ? 'Close' : 'Add Lesson'}
            </button>
            <span className="text-sm text-gray-500">
              Page {page + 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={page === 0}
                className="btn btn-secondary btn-sm"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={lessons.length < pageLimit}
                className="btn btn-secondary btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Title</label>
                <input
                  className="input w-full"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  placeholder="Lesson title"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Level</label>
                <select
                  className="input w-full"
                  value={addForm.level}
                  onChange={(e) => setAddForm({ ...addForm, level: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="elementary">Elementary</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Lesson description"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tags (comma separated)</label>
                <input
                  className="input w-full"
                  value={addForm.tagsText}
                  onChange={(e) => setAddForm({ ...addForm, tagsText: e.target.value })}
                  placeholder="e.g. poems,kids"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Order</label>
                <input
                  type="number"
                  className="input w-full"
                  value={addForm.order_index}
                  onChange={(e) => setAddForm({ ...addForm, order_index: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="publish-now"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={addForm.is_active}
                  onChange={(e) => setAddForm({ ...addForm, is_active: e.target.checked })}
                />
                <label htmlFor="publish-now" className="text-sm text-gray-700">Publish now</label>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={submitNewLesson}
                disabled={creating || !addForm.title}
              >
                {creating ? 'Creating...' : 'Create Lesson'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No lessons yet</h3>
              <p className="mt-1 text-sm text-gray-500">Generate lessons to get started</p>
            </div>
          ) : (
            lessons.map((lesson) => (
              <div key={lesson.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{lesson.order}</span>
                      {editingLessonId === lesson.id ? (
                        <input
                          className="input input-sm w-80"
                          value={editForm?.name || ''}
                          onChange={(e) => setEditForm({ ...(editForm as any), name: e.target.value })}
                        />
                      ) : (
                        <h3 className="text-lg font-medium text-gray-900">{lesson.name}</h3>
                      )}
                    </div>
                    {editingLessonId === lesson.id ? (
                      <textarea
                        className="input w-full mt-2"
                        rows={2}
                        value={editForm?.description || ''}
                        onChange={(e) => setEditForm({ ...(editForm as any), description: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-600 mt-1">{lesson.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`badge ${
                        lesson.status === 'published' ? 'badge-success' : 
                        lesson.status === 'draft' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {lesson.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingLessonId === lesson.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(lesson)}
                          className="btn btn-primary btn-sm"
                          disabled={savingLessonId === lesson.id}
                        >
                          {savingLessonId === lesson.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="btn btn-secondary btn-sm"
                          disabled={savingLessonId === lesson.id}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(lesson)}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(lesson)}
                          className="btn btn-danger btn-sm"
                          disabled={deletingLessonId === lesson.id}
                        >
                          {deletingLessonId === lesson.id ? 'Deleting...' : 'Delete'}
                        </button>
                        <Link
                          to={`/lesson/${lesson.id}`}
                          className="btn btn-secondary flex items-center gap-2"
                        >
                          Manage
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleDetail;
