import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  Settings,
  CheckCircle,
  Clock,
  Check,
  X
} from 'lucide-react';
import { lessonApi, flashcardApi } from '../services/api';
import { Lesson, Flashcard } from '../types';

const LessonDetail: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [previewingFlashcards, setPreviewingFlashcards] = useState(false);
  const [flashcardCount, setFlashcardCount] = useState(20);
  const [currentBufferId, setCurrentBufferId] = useState<string | null>(null);

  useEffect(() => {
    if (lessonId) {
      loadLessonData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load lesson data
      const lessonResponse = await lessonApi.getLesson(lessonId!);
      if (lessonResponse.success) {
        setLesson(lessonResponse.data);
      } else {
        setError(lessonResponse.message || 'Failed to load lesson');
        return;
      }

      // Load flashcards for the lesson
      const flashcardsResponse = await flashcardApi.getFlashcardsByLesson(lessonId!);
      if (flashcardsResponse.success) {
        setFlashcards(flashcardsResponse.data);
      } else {
        // If flashcards fail to load, set empty array but don't show error
        setFlashcards([]);
      }
    } catch (err) {
      setError('Failed to load lesson data');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!lessonId) return;
    
    try {
      setGeneratingFlashcards(true);
      const response = await flashcardApi.generateFlashcards({
        lessonId,
        count: flashcardCount
      });
      
      if (response.success) {
        setFlashcards(response.data);
        setPreviewingFlashcards(true);
        // Extract bufferId from response if available
        setCurrentBufferId(`content_${lessonId}_${Date.now()}.json`);
      }
    } catch (err) {
      console.error('Error generating flashcards:', err);
      // Show error message
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleApproveFlashcards = async () => {
    if (!currentBufferId || !lessonId) return;
    
    try {
      const response = await flashcardApi.approveFlashcards({
        bufferId: currentBufferId,
        lessonId
      });
      
      if (response.success) {
        // Update flashcard statuses
        setFlashcards(prev => prev.map(f => ({ ...f, status: 'approved' as const })));
        setPreviewingFlashcards(false);
        setCurrentBufferId(null);
        // Show success message
      }
    } catch (err) {
      console.error('Error approving flashcards:', err);
      // Show error message
    }
  };

  const handleRejectFlashcard = (flashcardId: string) => {
    setFlashcards(prev => prev.map(f => 
      f.id === flashcardId ? { ...f, status: 'rejected' as const } : f
    ));
  };

  const handleApproveFlashcard = (flashcardId: string) => {
    setFlashcards(prev => prev.map(f => 
      f.id === flashcardId ? { ...f, status: 'approved' as const } : f
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'Lesson not found'}</div>
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
            <Link to={`/module/${lesson.moduleId}`} className="hover:text-gray-700">Module</Link>
            <span>/</span>
            <span className="text-gray-900">{lesson.name}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">{lesson.name}</h1>
          <p className="mt-2 text-gray-600">{lesson.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Lesson Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Flashcards</p>
              <p className="text-2xl font-semibold text-gray-900">{flashcards.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {flashcards.filter(f => f.status === 'approved').length}
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
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {flashcards.filter(f => f.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-semibold text-gray-900">
                {flashcards.filter(f => f.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Flashcards Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Flashcards</h2>
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={flashcardCount}
            onChange={(e) => setFlashcardCount(parseInt(e.target.value) || 20)}
            min="1"
            max="100"
            className="input w-32"
            placeholder="Count"
          />
          <button
            onClick={handleGenerateFlashcards}
            disabled={generatingFlashcards}
            className="btn btn-primary flex items-center gap-2"
          >
            {generatingFlashcards ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Generate Flashcards
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview/Approval Actions */}
      {previewingFlashcards && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900">Flashcards Generated</h3>
              <p className="text-blue-700">Review and approve the generated flashcards</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreviewingFlashcards(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveFlashcards}
                className="btn btn-success flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Approve All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flashcards List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Flashcards</h2>
          <span className="text-sm text-gray-500">{flashcards.length} flashcards</span>
        </div>
        
        <div className="space-y-4">
          {flashcards.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No flashcards yet</h3>
              <p className="mt-1 text-sm text-gray-500">Generate flashcards to get started</p>
            </div>
          ) : (
            flashcards.map((flashcard) => (
              <div key={flashcard.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Front</h4>
                        <p className="text-gray-900">{flashcard.front}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Back</h4>
                        <p className="text-gray-900">{flashcard.back}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`badge ${
                        flashcard.status === 'approved' ? 'badge-success' : 
                        flashcard.status === 'pending' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {flashcard.status}
                      </span>
                      <span className={`badge ${
                        flashcard.difficulty === 'easy' ? 'badge-success' : 
                        flashcard.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {flashcard.difficulty}
                      </span>
                    </div>
                  </div>
                  {previewingFlashcards && flashcard.status === 'pending' && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleApproveFlashcard(flashcard.id)}
                        className="btn btn-success btn-sm flex items-center gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectFlashcard(flashcard.id)}
                        className="btn btn-danger btn-sm flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
