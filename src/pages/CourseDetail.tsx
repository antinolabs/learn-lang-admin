import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  ArrowRight, 
  Settings,
  CheckCircle,
  Clock
} from 'lucide-react';
import { courseApi, moduleApi } from '../services/api';
import { Course, Module } from '../types';

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingModules, setGeneratingModules] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [loadingModules, setLoadingModules] = useState(false); // used internally for fetch

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Backend does not expose GET /course/:id; fetch list and find
      const listResponse = await courseApi.getCourses();
      if (listResponse.success) {
        const found = listResponse.data.find((c) => c.id === courseId);
        if (found) {
          setCourse(found);
        } else {
          setCourse({
            id: courseId!,
            name: 'Course',
            description: 'Details unavailable from API. You can still generate modules.',
            level: 'basic',
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        // Gracefully fall back with minimal info, allow generate-modules
        setCourse({
          id: courseId!,
          name: 'Course',
          description: 'Details unavailable from API. You can still generate modules.',
          level: 'basic',
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Load modules from DB and filter by this course
      await loadModulesForCourse();
    } catch (err) {
      setError('Failed to load course data');
      console.error('Error loading course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateModules = async () => {
    if (!courseId) return;
    
    try {
      setGeneratingModules(true);
      const response = await courseApi.generateModules(courseId, {
        level: selectedLevel
      });
      
      if (response.success) {
        setModules(response.data);
        // Show success message
      }
    } catch (err) {
      console.error('Error generating modules:', err);
      // Show error message
    } finally {
      setGeneratingModules(false);
    }
  };

  const handleGenerateLessons = async (moduleId: string) => {
    try {
      const res = await moduleApi.generateLessons(moduleId, { level: selectedLevel });
      // Navigate to module page and pass generated lessons via state
      navigate(`/module/${moduleId}`, { state: { lessons: res.data } });
    } catch (err) {
      console.error('Error generating lessons:', err);
    }
  };

  const loadModulesForCourse = async () => {
    if (!courseId) return;
    try {
      setLoadingModules(true);
      const res = await moduleApi.getAllModules();
      if (res.success) {
        setModules(res.data.filter((m) => m.courseId === courseId));
      } else {
        setModules([]);
      }
    } catch (e) {
      console.error('Error loading modules:', e);
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'Course not found'}</div>
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
            <span className="text-gray-900">{course.name}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
          <p className="mt-2 text-gray-600">{course.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Modules</p>
              <p className="text-2xl font-semibold text-gray-900">{modules.length}</p>
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
                {modules.filter(m => m.status === 'published').length}
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
                {modules.filter(m => m.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Modules Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Modules</h2>
        <div className="flex items-center gap-4">
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
            onClick={handleGenerateModules}
            disabled={generatingModules}
            className="btn btn-primary flex items-center gap-2"
          >
            {generatingModules ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Generate Modules
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modules List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Modules</h2>
          <span className="text-sm text-gray-500">{modules.length} modules</span>
        </div>
        
        <div className="space-y-4">
          {modules.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No modules yet</h3>
              <p className="mt-1 text-sm text-gray-500">Generate modules to get started</p>
            </div>
          ) : (
            modules.map((module) => (
              <div key={module.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{module.order}</span>
                      <h3 className="text-lg font-medium text-gray-900">{module.name}</h3>
                    </div>
                    <p className="text-gray-600 mt-1">{module.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`badge ${
                        module.status === 'published' ? 'badge-success' : 
                        module.status === 'draft' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {module.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/module/${module.id}`}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      Manage
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleGenerateLessons(module.id)}
                      className="btn btn-primary"
                    >
                      Generate Lessons
                    </button>
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

export default CourseDetail;
