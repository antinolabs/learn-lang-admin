import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { categoriesApi, courseCreateApi, Category } from "../services/api";
import { Course } from "../types";

interface EditCourseModalProps {
  courseData: Course;
  onClose: () => void;
  onUpdated?: () => void;
}

interface CourseInput {
  title: string;
  description: string;
  level: string;
  iconFile?: File;
  courseCharFile?: File;
  icon_url?: string;
  course_char_url?: string;
}

const EditCourseModal: React.FC<EditCourseModalProps> = ({
  courseData,
  onClose,
  onUpdated,
}) => {
  const [course, setCourse] = useState<CourseInput | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseData) {
      setCourse({
        title: courseData.name || "",
        description: courseData.description || "",
        level: courseData.level || "",
        icon_url: courseData.icon_url,
        course_char_url: courseData.course_char_url,
      });
      setCategoryId(courseData.category_id || "");
    }
  }, [courseData]);

  const handleCategoryFocus = useCallback(async () => {
    if (loadingCategories || categories.length > 0) return;
    try {
      setLoadingCategories(true);
      const response = await categoriesApi.getCategories();
      if (response.success) setCategories(response.data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, [loadingCategories, categories.length]);

  useEffect(() => {
    handleCategoryFocus();
  }, [handleCategoryFocus]);

  const handleFileChange = (
    file: File,
    type: "iconFile" | "courseCharFile"
  ) => {
    if (
      !["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(
        file.type
      )
    ) {
      alert("Please upload JPG, PNG, WebP, or SVG file only.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB");
      return;
    }
    setCourse((prev) => (prev ? { ...prev, [type]: file } : prev));
  };

  const uploadToS3 = async (url: string, file: File) => {
    const res = await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!res.ok) throw new Error("S3 upload failed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        title: course.title,
        description: course.description,
        level: course.level,
        category_id: categoryId,
        ...(course.iconFile && {
          icon_url: {
            fileName: course.iconFile.name,
            fileType: course.iconFile.type,
            fileSize: course.iconFile.size,
          },
        }),
        ...(course.courseCharFile && {
          course_char_url: {
            fileName: course.courseCharFile.name,
            fileType: course.courseCharFile.type,
            fileSize: course.courseCharFile.size,
          },
        }),
      };

      const res = await courseCreateApi.updateCourse(courseData.id, payload);

      if (res.success) {
        const uploads: Promise<any>[] = [];
        if (res.data?.iconUpload && course.iconFile)
          uploads.push(
            uploadToS3(res.data.iconUpload.uploadUrl, course.iconFile)
          );
        if (res.data?.courseCharUpload && course.courseCharFile)
          uploads.push(
            uploadToS3(
              res.data.courseCharUpload.uploadUrl,
              course.courseCharFile
            )
          );

        await Promise.all(uploads);
        onUpdated?.();
        onClose();
      } else setError(res.message || "Update failed");
    } catch (err) {
      console.error(err);
      setError("Error updating course");
    } finally {
      setSubmitting(false);
    }
  };

  if (!course) return null;

  return (
    <div className="fixed !mt-0 inset-0 z-50 bg-black/40 flex items-center justify-center p-2">
      <div className="bg-white rounded-xl w-full max-w-lg p-5 relative shadow-md">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-3 text-gray-800">
          Edit Course
        </h2>
        {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={course.title}
            onChange={(e) => setCourse({ ...course, title: e.target.value })}
            placeholder="Course Title"
            className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm"
            required
          />

          <textarea
            value={course.description}
            onChange={(e) =>
              setCourse({ ...course, description: e.target.value })
            }
            placeholder="Course Description"
            className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm min-h-[80px]"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={course.level}
              onChange={(e) => setCourse({ ...course, level: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Select Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={categoryId}
              onFocus={handleCategoryFocus}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {categories && categories.length === 0
                ? "Select Category"
                : courseData.category_name || "Select Category"}
              {loadingCategories ? (
                <option>Loading...</option>
              ) : (
                categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Image Upload Section */}
          <div className="grid grid-cols-2 gap-4 mt-3">
  {/* Course Icon */}
  <div className="flex flex-col items-center border rounded-lg p-3">
    <label className="text-sm font-medium text-gray-700 mb-2">Icon</label>

    {(course.iconFile || course.icon_url) && (
      <img
        src={
          course.iconFile
            ? URL.createObjectURL(course.iconFile)
            : course.icon_url || ""
        }
        alt="Icon"
        className="w-16 h-16 object-contain rounded-md border mb-2"
      />
    )}

    <label
      htmlFor="iconFile"
      className="cursor-pointer bg-blue-600 text-white text-xs px-3 py-1 rounded-md hover:bg-blue-700 transition"
    >
      Choose File
    </label>
    <input
      id="iconFile"
      type="file"
      accept="image/*"
      onChange={(e) =>
        e.target.files && handleFileChange(e.target.files[0], "iconFile")
      }
      className="hidden"
    />

    {course.iconFile && (
      <p className="text-[11px] text-gray-500 mt-1 truncate w-28 text-center">
        {course.iconFile.name}
      </p>
    )}
  </div>

  {/* Course Character */}
  <div className="flex flex-col items-center border rounded-lg p-3">
    <label className="text-sm font-medium text-gray-700 mb-2">Character</label>

    {(course.courseCharFile || course.course_char_url) && (
      <img
        src={
          course.courseCharFile
            ? URL.createObjectURL(course.courseCharFile)
            : course.course_char_url || ""
        }
        alt="Character"
        className="w-16 h-16 object-contain rounded-md border mb-2"
      />
    )}

    <label
      htmlFor="charFile"
      className="cursor-pointer bg-blue-600 text-white text-xs px-3 py-1 rounded-md hover:bg-blue-700 transition"
    >
      Choose File
    </label>
    <input
      id="charFile"
      type="file"
      accept="image/*"
      onChange={(e) =>
        e.target.files &&
        handleFileChange(e.target.files[0], "courseCharFile")
      }
      className="hidden"
    />

    {course.courseCharFile && (
      <p className="text-[11px] text-gray-500 mt-1 truncate w-28 text-center">
        {course.courseCharFile.name}
      </p>
    )}
  </div>
</div>


          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourseModal;
