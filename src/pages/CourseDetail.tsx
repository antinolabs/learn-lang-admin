import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  ArrowRight, 
  Settings,
  CheckCircle,
  Clock,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import { courseApi, moduleApi } from '../services/api';
import { Course, Module, CreateModuleRequest, UpdateModuleRequest } from '../types';

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingModules, setGeneratingModules] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showUpdateModuleModal, setShowUpdateModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [newModule, setNewModule] = useState({
    title: '',
    description: '',
    order_index: 1,
    is_active: true
  });
  const [updateModule, setUpdateModule] = useState({
    title: '',
    description: '',
    order_index: 1,
    is_active: true
  });
  const [creatingModule, setCreatingModule] = useState(false);
  const [updatingModule, setUpdatingModule] = useState(false);
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);
  

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
            category_id: 'course category id',
            category_name: 'course category name',
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
          category_id: 'course category id',
          category_name: 'course category name',
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

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    
    try {
      setCreatingModule(true);
      const moduleData: CreateModuleRequest = {
        course_id: courseId,
        title: newModule.title,
        description: newModule.description,
        order_index: modules.length + 1, // Auto-increment order
        is_active: newModule.is_active
      };
      
      const response = await moduleApi.createModule(moduleData);
      
      if (response.success) {
        setModules([...modules, response.data]);
        setShowAddModuleModal(false);
        setNewModule({
          title: '',
          description: '',
          order_index: 1,
          is_active: true
        });
      }
    } catch (err) {
      console.error('Error creating module:', err);
    } finally {
      setCreatingModule(false);
    }
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !editingModule) return;
    
    try {
      setUpdatingModule(true);
      const moduleData: UpdateModuleRequest = {
        course_id: courseId,
        title: updateModule.title,
        description: updateModule.description,
        order_index: updateModule.order_index,
        is_active: updateModule.is_active
      };
      
      const response = await moduleApi.updateModule(editingModule.id, moduleData);
      
      if (response.success) {
        setModules(modules.map(m => m.id === editingModule.id ? response.data : m));
        setShowUpdateModuleModal(false);
        setEditingModule(null);
        setUpdateModule({
          title: '',
          description: '',
          order_index: 1,
          is_active: true
        });
      }
    } catch (err) {
      console.error('Error updating module:', err);
    } finally {
      setUpdatingModule(false);
    }
  };

  const openUpdateModal = (module: Module) => {
    setEditingModule(module);
    setUpdateModule({
      title: module.name,
      description: module.description,
      order_index: module.order,
      is_active: module.status === 'published'
    });
    setShowUpdateModuleModal(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this module?');
    if (!confirmed) return;
    try {
      setDeletingModuleId(moduleId);
      const res = await moduleApi.deleteModule(moduleId);
      if (res.success) {
        setModules((prev) => prev.filter((m) => m.id !== moduleId));
      }
    } catch (err) {
      console.error('Error deleting module:', err);
    } finally {
      setDeletingModuleId(null);
    }
  };

  const loadModulesForCourse = async () => {
    if (!courseId) return;
    try {
      const res = await moduleApi.getModulesByCourseId(courseId);
      if (res.success) {
        setModules(res.data);
      } else {
        setModules([]);
      }
    } catch (e) {
      console.error('Error loading modules:', e);
      setModules([]);
    } finally {
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
          <button 
            onClick={() => setShowAddModuleModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Module
          </button>
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
                      onClick={() => openUpdateModal(module)}
                      className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteModule(module.id)}
                      className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                      disabled={deletingModuleId === module.id}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingModuleId === module.id ? 'Deleting...' : 'Delete'}
                    </button>
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

      {/* Add Module Modal */}
      {showAddModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add New Module</h2>
              <button
                onClick={() => setShowAddModuleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module Title
                </label>
                <input
                  type="text"
                  value={newModule.title}
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                  className="input w-full"
                  placeholder="Enter module title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  className="input w-full h-24 resize-none"
                  placeholder="Enter module description"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newModule.is_active}
                  onChange={(e) => setNewModule({ ...newModule, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Publish immediately
                </label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModuleModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingModule}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {creatingModule ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Module
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Module Modal */}
      {showUpdateModuleModal && editingModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Update Module</h2>
              <button
                onClick={() => setShowUpdateModuleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module Title
                </label>
                <input
                  type="text"
                  value={updateModule.title}
                  onChange={(e) => setUpdateModule({ ...updateModule, title: e.target.value })}
                  className="input w-full"
                  placeholder="Enter module title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={updateModule.description}
                  onChange={(e) => setUpdateModule({ ...updateModule, description: e.target.value })}
                  className="input w-full h-24 resize-none"
                  placeholder="Enter module description"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Index
                </label>
                <input
                  type="number"
                  value={updateModule.order_index}
                  onChange={(e) => setUpdateModule({ ...updateModule, order_index: parseInt(e.target.value) })}
                  className="input w-full"
                  min="1"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="update_is_active"
                  checked={updateModule.is_active}
                  onChange={(e) => setUpdateModule({ ...updateModule, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="update_is_active" className="text-sm text-gray-700">
                  Publish immediately
                </label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpdateModuleModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingModule}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {updatingModule ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Update Module
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
