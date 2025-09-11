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

  const loadLessons = async () => {
    if (!moduleId) return;
    const skip = page * pageLimit;
    const lessonsResponse = await lessonApi.getLessonsByModule(moduleId!, {
      skip,
      limit: pageLimit,
      search: search || undefined
    });
    if (lessonsResponse.success) {
      setLessons(lessonsResponse.data);
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
                      <h3 className="text-lg font-medium text-gray-900">{lesson.name}</h3>
                    </div>
                    <p className="text-gray-600 mt-1">{lesson.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`badge ${
                        lesson.status === 'published' ? 'badge-success' : 
                        lesson.status === 'draft' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {lesson.status}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/lesson/${lesson.id}`}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    Manage
                    <ArrowRight className="h-4 w-4" />
                  </Link>
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
