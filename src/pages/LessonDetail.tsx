import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  Settings,
  CheckCircle,
  Clock,
  Check,
  X,
  Copy,
  ExternalLink
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
  const [buttonClicked,setButtonClicked]=useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
 
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  }
 
  const [promptModal, setPromptModal] = useState<{ open: boolean; draftId?: string; flashcardId?: string; prompt: string; mediaType: 'image' | 'audio' | 'video' }>(
    { open: false, prompt: '', mediaType: 'image' }
  )

  const [uploadProgressById, setUploadProgressById] = useState<Record<string, number>>({})

  // Media preview panel state
  const [mediaPreviewPanel, setMediaPreviewPanel] = useState<{
    open: boolean;
    url: string;
    type: 'image' | 'audio' | 'video';
    fileName: string;
  }>({ open: false, url: '', type: 'image', fileName: '' })

  // Inline edit state for JSON form
  const [editModeById, setEditModeById] = useState<Record<string, boolean>>({})
  const [formJsonById, setFormJsonById] = useState<Record<string, string>>({})
  const [savingById, setSavingById] = useState<Record<string, boolean>>({})

  // Copy URL to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', 'URL copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('success', 'URL copied to clipboard!');
      } catch (fallbackErr) {
        showToast('error', 'Failed to copy URL');
      }
      document.body.removeChild(textArea);
    }
  };
 
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
    setButtonClicked(true)
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
      console.log("response",response)

      if (response.success) {
        console.log("response",response)
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

  const handleApproveFlashcard = (flashcardId: string, draftId?: string, lessonId?: string) => {
    if (!flashcardId || !draftId || !lessonId) {
      console.error('Missing identifiers for approve:', { flashcardId, draftId, lessonId });
      return;
    }
    flashcardApi.approveFlashcard({ flashcardId, draftId, lessonId })
      .then((response) => {
        if (response.success) {
          setFlashcards(prev => prev.map(f => 
            f.id === flashcardId ? { ...f, status: 'approved' as const } : f
          ));
        }
      })
      .catch((err) => {
        console.error('Error approving flashcard:', err);
      });
  };

  // Inline JSON form handlers
  const handleOpenEdit = (id: string, raw: any) => {
    setEditModeById((m) => ({ ...m, [id]: true }));
    setFormJsonById((f) => ({ ...f, [id]: JSON.stringify(raw || {}, null, 2) }));
  };

  const handleCancelEdit = (id: string) => {
    setEditModeById((m) => ({ ...m, [id]: false }));
  };

  const handleSubmitEdit = async (id: string) => {
    try {
      setSavingById((s) => ({ ...s, [id]: true }));
      const current = formJsonById[id] || '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(current);
      } catch (e) {
        showToast('error', 'Invalid JSON');
        return;
      }

      // Optimistically update UI
      setFlashcards((prev) => prev.map((f) => {
        if (f.id === id) {
          return { ...f, raw: parsed } as Flashcard;
        }
        return f;
      }));

      // Attempt server update using provided endpoint shape
      const existing = flashcards.find((f) => f.id === id) as any;
      const draftId = existing?.raw?._draft_id || parsed?._draft_id;
      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
      if (draftId) {
        await fetch(`${apiBase}/flashcards/drafts/${draftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flashcards: parsed })
        });
      }

      showToast('success', 'Flashcard updated');
      setEditModeById((m) => ({ ...m, [id]: false }));
    } catch (err) {
      console.error('Failed to update flashcard:', err);
      showToast('error', 'Update failed');
    } finally {
      setSavingById((s) => ({ ...s, [id]: false }));
    }
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
  console.log(flashcards)

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
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
        {buttonClicked && flashcards.length===0 ?<p>Loading...</p>: 
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

                    {/* Inline JSON edit form */}
                    {!editModeById[flashcard.id] ? (
                      <div className="mt-4">
                        <button className="btn btn-secondary" onClick={() => handleOpenEdit(flashcard.id, (flashcard as any).raw || {})}>Edit</button>
                      </div>
                    ) : (
                      <div className="mt-4 border rounded-lg p-4 bg-white">
                        <h4 className="text-md font-semibold text-gray-900 mb-2">Edit Flashcard JSON</h4>
                                                <textarea
                          className="input w-full font-mono text-sm"
                          style={{ minHeight: 220 }}
                          value={formJsonById[flashcard.id] || ''}
                          onChange={(e) => setFormJsonById((m) => ({ ...m, [flashcard.id]: e.target.value }))}
                        />
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <button
                            className="btn btn-primary"
                            onClick={() => handleSubmitEdit(flashcard.id)}
                            disabled={!!savingById[flashcard.id]}
                          >
                            {savingById[flashcard.id] ? 'Saving...' : 'Submit'}
                          </button>
                          <button className="btn btn-secondary" onClick={() => handleCancelEdit(flashcard.id)} disabled={!!savingById[flashcard.id]}>Cancel</button>
                        </div>
                      </div>
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
                    <div className="flex flex-col items-end gap-10 ml-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveFlashcard((flashcard as any).raw?._id || flashcard.id, (flashcard as any).raw?._draft_id, flashcard.lessonId || (flashcard as any).raw?._lesson_id || (flashcard as any).raw?.lesson_id)}
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
                      <div className="flex items-center gap-4">
                        <label className="btn btn-secondary btn-sm">
                          Upload File
                          <input
                            type="file"
                            accept="image/*,audio/*,video/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const input = e.currentTarget as HTMLInputElement;
                              const file = input.files?.[0];
                              const draftId = (flashcard as any).raw?._draft_id;
                              const flashcardId = (flashcard as any).raw?._id || flashcard.id;
                              if (!file || !draftId || !flashcardId) return;
                              (async () => {
                                try {
                                  setUploadProgressById((p) => ({ ...p, [flashcardId]: 1 }));
                                  // Determine media type
                                  const typeGuess: 'image' | 'audio' | 'video' = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'video';
                                  
                                  const res = await flashcardApi.uploadFlashcardMedia(draftId, flashcardId, file, (pct: number) => {
                                    setUploadProgressById((p) => ({ ...p, [flashcardId]: pct }));
                                  });
                                  
                                  // Extract URL from response - try multiple possible paths
                                  console.log('=== UPLOAD DEBUG INFO ===');
                                  console.log('File name:', file.name);
                                  console.log('File type:', file.type);
                                  console.log('File size:', file.size);
                                  console.log('Full upload response:', JSON.stringify(res, null, 2));
                                  
                                  const payload: any = (res as any)?.payload || (res as any)?.data || res;
                                  let uploadedUrl: string = '';
                                  let extractionMethod = '';
                                  
                                  // Try different possible response structures with detailed logging
                                  if (payload?.mediaUrl) {
                                    uploadedUrl = payload.mediaUrl;
                                    extractionMethod = 'payload.mediaUrl';
                                  } else if (payload?.url) {
                                    uploadedUrl = payload.url;
                                    extractionMethod = 'payload.url';
                                  } else if (payload?.fileUrl) {
                                    uploadedUrl = payload.fileUrl;
                                    extractionMethod = 'payload.fileUrl';
                                  } else if (payload?.image_url) {
                                    uploadedUrl = payload.image_url;
                                    extractionMethod = 'payload.image_url';
                                  } else if (payload?.audio_url) {
                                    uploadedUrl = payload.audio_url;
                                    extractionMethod = 'payload.audio_url';
                                  } else if (payload?.video_url) {
                                    uploadedUrl = payload.video_url;
                                    extractionMethod = 'payload.video_url';
                                  } else if (typeof payload === 'string' && payload.startsWith('http')) {
                                    uploadedUrl = payload;
                                    extractionMethod = 'direct string payload';
                                  }
                                  
                                  // If still no URL found, try aggressive extraction from nested structures
                                  // BUT prioritize URLs that are most recent or match the current upload
                                  if (!uploadedUrl) {
                                    const allFoundUrls: Array<{url: string, path: string}> = [];
                                    
                                    const searchForUrl = (obj: any, path: string = ''): void => {
                                      if (typeof obj === 'string' && obj.startsWith('http')) {
                                        allFoundUrls.push({url: obj, path});
                                        console.log(`Found URL at path: ${path} = ${obj}`);
                                      }
                                      if (typeof obj === 'object' && obj !== null) {
                                        for (const key in obj) {
                                          const currentPath = path ? `${path}.${key}` : key;
                                          if (key.toLowerCase().includes('url') && typeof obj[key] === 'string' && obj[key].startsWith('http')) {
                                            allFoundUrls.push({url: obj[key], path: currentPath});
                                            console.log(`Found URL at path: ${currentPath} = ${obj[key]}`);
                                          } else {
                                            searchForUrl(obj[key], currentPath);
                                          }
                                        }
                                      }
                                    };
                                    
                                    searchForUrl(res);
                                    
                                    if (allFoundUrls.length > 0) {
                                      console.log('All found URLs:', allFoundUrls);
                                      
                                      // Try to find the most recent URL (highest timestamp)
                                      const currentTime = Date.now();
                                      let bestUrl = allFoundUrls[0].url;
                                      let bestScore = 0;
                                      
                                      for (const {url, path} of allFoundUrls) {
                                        let score = 0;
                                        
                                        // Extract timestamp from URL
                                        const timestampMatch = url.match(/_(\d{13})_/);
                                        if (timestampMatch) {
                                          const urlTimestamp = parseInt(timestampMatch[1]);
                                          const timeDiff = Math.abs(currentTime - urlTimestamp);
                                          // Prefer more recent URLs (lower time difference = higher score)
                                          score += Math.max(0, 1000000 - timeDiff);
                                        }
                                        
                                        // Prefer URLs that match the uploaded filename
                                        const fileBaseName = file.name.split('.')[0].toLowerCase();
                                        if (url.toLowerCase().includes(fileBaseName)) {
                                          score += 500000;
                                        }
                                        
                                        // Prefer URLs in more specific paths (deeper = more specific)
                                        score += path.split('.').length * 1000;
                                        
                                        console.log(`URL: ${url}, Score: ${score}, Path: ${path}`);
                                        
                                        if (score > bestScore) {
                                          bestScore = score;
                                          bestUrl = url;
                                        }
                                      }
                                      
                                      uploadedUrl = bestUrl;
                                      extractionMethod = 'smart deep search';
                                      console.log(`Selected best URL: ${uploadedUrl} with score: ${bestScore}`);
                                    }
                                  }
                                  
                                  // Try to find any S3 URLs in the response (more specific to your case)
                                  if (!uploadedUrl) {
                                    const findS3Urls = (obj: any): string[] => {
                                      const urls: string[] = [];
                                      const search = (item: any) => {
                                        if (typeof item === 'string' && item.includes('s3.ap-south-1.amazonaws.com')) {
                                          urls.push(item);
                                        } else if (typeof item === 'object' && item !== null) {
                                          Object.values(item).forEach(search);
                                        }
                                      };
                                      search(obj);
                                      return urls;
                                    };
                                    
                                    const s3Urls = findS3Urls(res);
                                    console.log('Found S3 URLs:', s3Urls);
                                    
                                    if (s3Urls.length > 0) {
                                      // Try to find the most recent/relevant URL
                                      const relevantUrl = s3Urls.find(url => 
                                        url.includes(file.name.split('.')[0]) || 
                                        url.includes(Date.now().toString().slice(-6))
                                      ) || s3Urls[s3Urls.length - 1]; // Use the last one if no match
                                      
                                      uploadedUrl = relevantUrl;
                                      extractionMethod = 'S3 URL search';
                                    }
                                  }
                                  
                                  console.log('Extraction method:', extractionMethod);
                                  console.log('Extracted URL:', uploadedUrl);
                                  console.log('=== END DEBUG INFO ===');
                                  
                                  // Always show the panel, even if URL extraction failed
                                  // This way user can see what happened and we can debug
                                  const finalUrl = uploadedUrl || `URL extraction failed - check console for response details`;
                                  
                                  // Update flashcard data if URL was found
                                  if (uploadedUrl) {
                                    setFlashcards(prev => prev.map(f => {
                                      if ((f as any).raw?._id === flashcardId || f.id === flashcardId) {
                                        const next = { ...f } as any;
                                        next.raw = next.raw || {};
                                        next.raw.content_data = next.raw.content_data || {};
                                        if (typeGuess === 'image') next.raw.content_data.image_url = uploadedUrl;
                                        if (typeGuess === 'audio') next.raw.content_data.audio_url = uploadedUrl;
                                        if (typeGuess === 'video') next.raw.content_data.video_url = uploadedUrl;
                                        return next as Flashcard;
                                      }
                                      return f;
                                    }));
                                  }
                                  
                                  // ALWAYS show media preview panel - this is guaranteed to show
                                  console.log('Opening media preview panel with URL:', finalUrl);
                                  setMediaPreviewPanel({
                                    open: true,
                                    url: finalUrl,
                                    type: typeGuess,
                                    fileName: file.name
                                  });
                                  
                                  // Show appropriate toast message
                                  if (uploadedUrl) {
                                    showToast('success', `${typeGuess.charAt(0).toUpperCase() + typeGuess.slice(1)} uploaded successfully! Panel opened with URL.`);
                                  } else {
                                    showToast('error', 'Upload completed but URL extraction failed. Check console and panel for details.');
                                  }
                                } catch (err) {
                                  console.error('Error uploading media:', err);
                                  showToast('error', 'Failed to upload file');
                                } finally {
                                  setUploadProgressById((p) => ({ ...p, [flashcardId]: 0 }));
                                  input.value = '';
                                }
                              })();
                            }}
                          />
                        </label>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPromptModal({
                            open: true,
                            draftId: (flashcard as any).raw?._draft_id,
                            flashcardId: (flashcard as any).raw?._id || flashcard.id,
                            prompt: '',
                            mediaType: 'image'
                          })}
                        >
                          Prompt
                        </button>
                      </div>
                      {uploadProgressById[((flashcard as any).raw?._id || flashcard.id)] > 0 && (
                        <div className="w-48 h-2 bg-gray-200 rounded">
                          <div
                            className="h-2 bg-blue-600 rounded"
                            style={{ width: `${uploadProgressById[((flashcard as any).raw?._id || flashcard.id)]}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
}
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
      {promptModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg p-4 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Generate Media by Prompt</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                <textarea
                  className="input w-full"
                  rows={3}
                  value={promptModal.prompt}
                  onChange={(e) => setPromptModal((m) => ({ ...m, prompt: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                <select
                  className="input w-full"
                  value={promptModal.mediaType}
                  onChange={(e) => setPromptModal((m) => ({ ...m, mediaType: e.target.value as any }))}
                >
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setPromptModal({ open: false, prompt: '', mediaType: 'image' })}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const { draftId, flashcardId, prompt, mediaType } = promptModal;
                  if (!draftId || !flashcardId || !prompt) return;
                  try {
                    await flashcardApi.uploadFlashcardMediaByPrompt(draftId, flashcardId, prompt, mediaType);
                    showToast('success', 'Prompt submitted successfully');
                    setPromptModal({ open: false, prompt: '', mediaType: 'image' });
                  } catch (err) {
                    console.error('Error sending prompt:', err);
                    showToast('error', 'Failed to submit prompt');
                  }
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Panel */}
      {mediaPreviewPanel.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Media Uploaded Successfully</h3>
              <button
                onClick={() => setMediaPreviewPanel({ open: false, url: '', type: 'image', fileName: '' })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* File Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    mediaPreviewPanel.type === 'image' ? 'bg-blue-100 text-blue-600' :
                    mediaPreviewPanel.type === 'audio' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {mediaPreviewPanel.type === 'image' && <BookOpen className="h-5 w-5" />}
                    {mediaPreviewPanel.type === 'audio' && <BookOpen className="h-5 w-5" />}
                    {mediaPreviewPanel.type === 'video' && <BookOpen className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{mediaPreviewPanel.fileName}</p>
                    <p className="text-sm text-gray-500 capitalize">{mediaPreviewPanel.type} file</p>
                  </div>
                </div>
              </div>

              {/* Media Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
                {mediaPreviewPanel.type === 'image' && (
                  <div className="flex justify-center">
                    <img 
                      src={mediaPreviewPanel.url} 
                      alt="Uploaded content"
                      className="max-w-full max-h-64 object-contain rounded-lg shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden text-center text-gray-500 py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Image preview not available</p>
                    </div>
                  </div>
                )}
                
                {mediaPreviewPanel.type === 'audio' && (
                  <div className="flex justify-center">
                    <audio 
                      controls 
                      className="w-full max-w-md"
                      onError={(e) => {
                        (e.target as HTMLAudioElement).style.display = 'none';
                        (e.target as HTMLAudioElement).nextElementSibling!.classList.remove('hidden');
                      }}
                    >
                      <source src={mediaPreviewPanel.url} />
                      Your browser does not support the audio element.
                    </audio>
                    <div className="hidden text-center text-gray-500 py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Audio preview not available</p>
                    </div>
                  </div>
                )}
                
                {mediaPreviewPanel.type === 'video' && (
                  <div className="flex justify-center">
                    <video 
                      controls 
                      className="max-w-full max-h-64 rounded-lg shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLVideoElement).style.display = 'none';
                        (e.target as HTMLVideoElement).nextElementSibling!.classList.remove('hidden');
                      }}
                    >
                      <source src={mediaPreviewPanel.url} />
                      Your browser does not support the video element.
                    </video>
                    <div className="hidden text-center text-gray-500 py-8">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Video preview not available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* URL Section with Copy */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Media URL</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mediaPreviewPanel.url}
                    readOnly
                    className="flex-1 input text-sm font-mono bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(mediaPreviewPanel.url)}
                    className="btn btn-secondary btn-sm flex items-center gap-2"
                    title="Copy URL to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                  <a
                    href={mediaPreviewPanel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm flex items-center gap-2"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </a>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use this URL to reference the uploaded media in your applications
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setMediaPreviewPanel({ open: false, url: '', type: 'image', fileName: '' })}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => copyToClipboard(mediaPreviewPanel.url)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonDetail;
