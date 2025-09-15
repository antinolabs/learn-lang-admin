import React, { useState, useEffect, useRef } from 'react';
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
  const [flashcardCount, setFlashcardCount] = useState(22);
  const [currentBufferId, setCurrentBufferId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]);
  const [displayedCount, setDisplayedCount] = useState(20);
  const [hasMoreFlashcards, setHasMoreFlashcards] = useState(false);
  // Guards to prevent repeated calls (e.g., React StrictMode double invoke or rapid clicks)
  const previewRequestedForLessonRef = useRef<string | null>(null);
  const generateRequestedForLessonRef = useRef<string | null>(null);

  useEffect(() => {
    if (lessonId) {
      // Reset guards when lesson changes
      previewRequestedForLessonRef.current = null;
      generateRequestedForLessonRef.current = null;
      loadLessonData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load lesson data
      try {
        const lessonResponse = await lessonApi.getLesson(lessonId!);
        if (lessonResponse.success) {
          setLesson(lessonResponse.data);
        } else {
          // Fallback: create a minimal lesson shell so we can still preview flashcards
          setLesson({ id: lessonId!, moduleId: '', name: 'Lesson', description: '', order: 0 });
        }
      } catch (e) {
        setLesson({ id: lessonId!, moduleId: '', name: 'Lesson', description: '', order: 0 });
      }

      // Always try preview flashcards from AI endpoint so user can see content (only once per lesson)
      if (previewRequestedForLessonRef.current !== lessonId) {
        await loadPreviewFlashcards(flashcardCount);
      }
    } catch (err) {
      setError('Failed to load lesson data');
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPreviewFlashcards = async (count: number) => {
    if (!lessonId) return;
    // Guard: prevent duplicate preview requests for same lesson
    if (previewRequestedForLessonRef.current === lessonId) return;
    try {
      setPreviewingFlashcards(true);
      setStatusMsg('Loading drafts...');
      // Mark as requested immediately to block re-entrancy
      previewRequestedForLessonRef.current = lessonId;
      const response = await flashcardApi.getDrafts();
      if (response.success) {
        const drafts = (response.data || []).filter((d) => d.lessonId === lessonId);
        setAllFlashcards(drafts);
        setFlashcards(drafts.slice(0, displayedCount));
        setHasMoreFlashcards(drafts.length > displayedCount);
        setCurrentBufferId(`content_${lessonId}_${Date.now()}.json`);
        setStatusMsg(null);
      } else {
        setAllFlashcards([]);
        setFlashcards([]);
        setStatusMsg('No drafts available.');
      }
    } catch (e: any) {
      setStatusMsg('Failed to load drafts.');
    }
  };

  const handleLoadMore = () => {
    const newDisplayedCount = displayedCount + 20;
    setDisplayedCount(newDisplayedCount);
    setFlashcards(allFlashcards.slice(0, newDisplayedCount));
    setHasMoreFlashcards(allFlashcards.length > newDisplayedCount);
  };

  // Removed legacy polling helper; drafts endpoint provides data directly

  const handleGenerateFlashcards = async () => {
    if (!lessonId) return;
    // Guard: ensure generate is only triggered once per lesson
    if (generateRequestedForLessonRef.current === lessonId) return;
    
    try {
      setGeneratingFlashcards(true);
      generateRequestedForLessonRef.current = lessonId;
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
        {statusMsg && (
          <p className="mt-3 text-sm text-gray-600">{statusMsg}</p>
        )}
      </div>

      {/* Preview from AI endpoint */}
      <div className="card">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (previewRequestedForLessonRef.current !== lessonId) {
                loadPreviewFlashcards(flashcardCount);
              }
            }}
            disabled={previewRequestedForLessonRef.current === lessonId}
          >
            Preview Flashcards
          </button>
          <span className="text-sm text-gray-500">Uses AI preview endpoint</span>
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
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Prompt</h4>
                        <p className="text-gray-900">{flashcard.raw?.prompt || flashcard.front}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {flashcard.raw?.flashcard_mode && (
                            <span className="badge badge-info">{flashcard.raw.flashcard_mode}</span>
                          )}
                          {flashcard.raw?.question_type && (
                            <span className="badge badge-warning">{flashcard.raw.question_type}</span>
                          )}
                          {flashcard.raw?.answer_type && (
                            <span className="badge badge-success">{flashcard.raw.answer_type}</span>
                          )}
                          {typeof flashcard.raw?.order_index === 'number' && (
                            <span className="badge">#{flashcard.raw.order_index}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Details</h4>
                        {flashcard.raw?.content_data?.subtext && (
                          <p className="text-gray-900">{flashcard.raw.content_data.subtext}</p>
                        )}
                        {/* MCQ options */}
                        {flashcard.raw?.answer_type === 'mcq' && Array.isArray(flashcard.raw?.content_data?.answer?.options) && (
                          <ul className="mt-2 list-disc list-inside text-gray-900 text-sm">
                            {flashcard.raw.content_data.answer.options.map((opt: string, i: number) => (
                              <li key={i} className={opt === flashcard.raw?.content_data?.answer?.correct ? 'font-semibold text-green-700' : ''}>
                                {opt}
                                {opt === flashcard.raw?.content_data?.answer?.correct && (
                                  <span className="ml-2 badge badge-success">correct</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                        {/* Media links */}
                        <div className="flex flex-wrap gap-2 mt-2 text-sm">
                          {flashcard.raw?.content_data?.image_url && (
                            <a href={flashcard.raw.content_data.image_url} target="_blank" rel="noreferrer" className="text-primary-700 underline">Image</a>
                          )}
                          {flashcard.raw?.content_data?.audio_url && (
                            <a href={flashcard.raw.content_data.audio_url} target="_blank" rel="noreferrer" className="text-primary-700 underline">Audio</a>
                          )}
                          {flashcard.raw?.content_data?.video_url && (
                            <a href={flashcard.raw.content_data.video_url} target="_blank" rel="noreferrer" className="text-primary-700 underline">Video</a>
                          )}
                        </div>
                      </div>
                    </div>
                    {flashcard.raw && (
                      <details className="mt-3">
                        <summary className="text-sm text-gray-600 cursor-pointer">View raw JSON</summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
{JSON.stringify(flashcard.raw, null, 2)}
                        </pre>
                      </details>
                    )}
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
        
        {/* Load More Button */}
        {hasMoreFlashcards && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLoadMore}
              className="btn btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Load More Flashcards
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Showing {flashcards.length} of {allFlashcards.length} flashcards
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonDetail;
