import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  Edit,
} from "lucide-react";
import { courseApi } from "../services/api";
import { Course } from "../types";
import EditCourseModal from "../components/EditCourseModal"; // Import modal

const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null); // full data passed
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseApi.getCourses();
      console.log(response.data)
      if (response.success) {
        setCourses(response.data);
      } else {
        setError(response.message || "Failed to load courses");
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (course: Course) => {
    setEditingCourse(course);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCourse(null);
  };

  const handleCourseUpdated = () => {
    loadCourses();
    handleModalClose();
  };

  const stats = [
    {
      name: "Total Courses",
      value: courses.length,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Published",
      value: courses.filter((c) => c.status === "published").length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "In Progress",
      value: courses.filter((c) => c.status === "draft").length,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      name: "Modules Generated",
      value: 12,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={loadCourses} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your language learning courses
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          New Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Courses List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Courses
          </h2>
          <Link
            to="/courses"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View all
          </Link>
        </div>

        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={
                        course.course_char_url || "/dummy-image.svg"
                      }
                      alt={course.name || "Course"}
                      className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                    />

                    <img
                      src={course.icon_url || "/dummy-icon.svg"}
                      alt="icon"
                      className="absolute -bottom-2 -right-2 w-6 h-6 object-contain rounded-full bg-white p-1 border border-gray-200 shadow-sm"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-gray-600 mt-1 line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-4 mt-3">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          course.status === "published"
                            ? "bg-green-100 text-green-700"
                            : course.status === "draft"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {course.status}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">
                        {course.level}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(course)} // sends full course data
                    className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Update
                  </button>
                  <Link
                    to={`/course/${course.id}`}
                    className="btn btn-secondary flex items-center gap-2 text-sm px-4 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    Manage
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Edit Modal */}
      {showModal && editingCourse && (
        <EditCourseModal
          courseData={editingCourse}
          onClose={handleModalClose}
          onUpdated={handleCourseUpdated}
        />
      )}
    </div>
  );
};

export default Dashboard;
