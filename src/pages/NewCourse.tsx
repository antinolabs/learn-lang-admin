import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseCreateApi } from '../services/api';

interface CourseInput {
  title: string;
  description: string;
  level: string;
  language: string;
  is_premium: boolean;
}

const NewCourse: React.FC = () => {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState('');
  const [courses, setCourses] = useState<CourseInput[]>([
    { title: '', description: '', level: 'beginner', language: 'en', is_premium: false }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCourse = () => {
    setCourses([...courses, { title: '', description: '', level: 'beginner', language: 'en', is_premium: false }]);
  };

  const removeCourse = (idx: number) => {
    setCourses(courses.filter((_, i) => i !== idx));
  };

  const updateCourse = (idx: number, field: keyof CourseInput, value: any) => {
    const next = [...courses];
    (next[idx] as any)[field] = value;
    setCourses(next);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Category ID is required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await courseCreateApi.createCourses({ categoryId, courses });
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Failed to create courses');
      }
    } catch (err) {
      setError('Failed to create courses');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Course</h1>
          <p className="mt-2 text-gray-600">Create one or multiple courses</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">Category ID</label>
          <input
            className="input"
            placeholder="60d5ec9f8f1a2e3b4c8d7e6f"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          />
        </div>

        {courses.map((c, idx) => (
          <div className="card" key={idx}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Course #{idx + 1}</h2>
              {courses.length > 1 && (
                <button type="button" onClick={() => removeCourse(idx)} className="btn btn-danger">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input className="input" value={c.title} onChange={(e) => updateCourse(idx, 'title', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select className="input" value={c.level} onChange={(e) => updateCourse(idx, 'level', e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea className="input" rows={3} value={c.description} onChange={(e) => updateCourse(idx, 'description', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <input className="input" value={c.language} onChange={(e) => updateCourse(idx, 'language', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Premium</label>
                <select className="input" value={c.is_premium ? 'yes' : 'no'} onChange={(e) => updateCourse(idx, 'is_premium', e.target.value === 'yes')}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-secondary" onClick={addCourse}>Add another course</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create courses'}</button>
        </div>

        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
};

export default NewCourse;


