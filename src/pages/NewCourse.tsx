import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseCreateApi, categoriesApi, Category } from '../services/api';

interface CourseInput {
  title: string;
  description: string;
  level: string;
  language: string;
  is_premium: boolean;
  iconFile?: File;
}

const NewCourse: React.FC = () => {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [courses, setCourses] = useState<CourseInput[]>([
    { title: '', description: '', level: 'beginner', language: 'en', is_premium: false }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await categoriesApi.getCategories();
        if (response.success) {
          setCategories(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

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

  const uploadToS3 = async (presignedUrl: string, file: File): Promise<boolean> => {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
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

      // Prepare payload with icon metadata
      const coursesPayload = courses.map(c => ({
        title: c.title,
        description: c.description,
        level: c.level,
        language: c.language,
        is_premium: c.is_premium,
        icon: c.iconFile ? {
          fileName: c.iconFile.name,
          fileType: c.iconFile.type,
          fileSize: c.iconFile.size
        } : undefined
      }));

      const res = await courseCreateApi.createCourses({
        categoryId,
        courses: coursesPayload
      });

      if (res.success) {
        // Upload icons to S3 if presigned URLs are provided
        const payload = (res as any).payload || [];
        const uploadPromises = payload.map(async (createdCourse: any, idx: number) => {
          const courseInput = courses[idx];
          if (createdCourse.iconUpload && courseInput.iconFile) {
            try {
              await uploadToS3(createdCourse.iconUpload.uploadUrl, courseInput.iconFile);
              console.log(`✅ Icon uploaded for course: ${createdCourse.title}`);
            } catch (uploadError) {
              console.error(`❌ Failed to upload icon for course: ${createdCourse.title}`, uploadError);
              // Continue even if one upload fails
            }
          }
        });

        await Promise.all(uploadPromises);
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          {loadingCategories ? (
            <div className="input">Loading categories...</div>
          ) : (
            <select
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Icon (optional)</label>
                <input
                  type="file"
                  className="input"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file type
                      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
                      if (!allowedTypes.includes(file.type)) {
                        alert('Invalid file type. Please use JPG, PNG, WebP, or SVG.');
                        e.target.value = '';
                        return;
                      }
                      // Validate file size (5MB max)
                      if (file.size > 5 * 1024 * 1024) {
                        alert('File size must be less than 5MB');
                        e.target.value = '';
                        return;
                      }
                      updateCourse(idx, 'iconFile', file);
                    }
                  }}
                />
                {c.iconFile && (
                  <p className="text-sm text-gray-600 mt-1">Selected: {c.iconFile.name}</p>
                )}
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


