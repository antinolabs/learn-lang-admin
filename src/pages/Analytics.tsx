import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Target,
} from "lucide-react";
import { courseApi } from "../services/api";
import { userCourseApi } from "../services/api";
import { Course } from "../types";

const Analytics: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "users">("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [courseRes, userRes] = await Promise.all([
        courseApi.getCourses(),
        userCourseApi.getUsersCourses({ page: 1, limit: 100 }),
      ]);
      if (courseRes.success) setCourses(courseRes.data);
      if (userRes.success) setUserData(userRes.data);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Derive analytics from real data
  const rawUsers: any[] = userData?.users || userData?.data || userData?.results || (Array.isArray(userData) ? userData : []);
  const totalEnrollments = userData?.total || rawUsers.length;
  const uniqueUserIds = new Set(rawUsers.map((u: any) => u.user_id || u._id || u.email));
  const uniqueUsers = uniqueUserIds.size;

  // Progress distribution
  const progressBuckets = { notStarted: 0, beginner: 0, intermediate: 0, advanced: 0, completed: 0 };
  rawUsers.forEach((u: any) => {
    const p = u.progress || 0;
    if (p === 0) progressBuckets.notStarted++;
    else if (p < 25) progressBuckets.beginner++;
    else if (p < 50) progressBuckets.intermediate++;
    else if (p < 100) progressBuckets.advanced++;
    else progressBuckets.completed++;
  });

  // Activity analysis
  const now = Date.now();
  const activeToday = rawUsers.filter((u: any) => {
    const d = u.last_accessed_at || u.lastAccessedAt;
    return d && (now - new Date(d).getTime()) < 24 * 60 * 60 * 1000;
  }).length;
  const activeWeek = rawUsers.filter((u: any) => {
    const d = u.last_accessed_at || u.lastAccessedAt;
    return d && (now - new Date(d).getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const activeMonth = rawUsers.filter((u: any) => {
    const d = u.last_accessed_at || u.lastAccessedAt;
    return d && (now - new Date(d).getTime()) < 30 * 24 * 60 * 60 * 1000;
  }).length;
  const inactive = rawUsers.length - activeMonth;

  // Course-level analytics
  const courseEnrollmentMap: Record<string, { title: string; count: number; totalProgress: number; completed: number }> = {};
  rawUsers.forEach((u: any) => {
    const cid = u.course_id || u.courseId || "unknown";
    const title = u.course_title || u.courseTitle || u.course_name || "Unknown";
    if (!courseEnrollmentMap[cid]) {
      courseEnrollmentMap[cid] = { title, count: 0, totalProgress: 0, completed: 0 };
    }
    courseEnrollmentMap[cid].count++;
    courseEnrollmentMap[cid].totalProgress += u.progress || 0;
    if ((u.progress || 0) >= 100) courseEnrollmentMap[cid].completed++;
  });
  const courseAnalytics = Object.entries(courseEnrollmentMap)
    .map(([id, data]) => ({
      id,
      title: data.title,
      enrollments: data.count,
      avgProgress: data.count ? Math.round(data.totalProgress / data.count) : 0,
      completionRate: data.count ? Math.round((data.completed / data.count) * 100) : 0,
      completed: data.completed,
    }))
    .sort((a, b) => b.enrollments - a.enrollments);

  const avgProgress = rawUsers.length
    ? Math.round(rawUsers.reduce((s: number, u: any) => s + (u.progress || 0), 0) / rawUsers.length)
    : 0;
  const completionRate = rawUsers.length
    ? Math.round((rawUsers.filter((u: any) => (u.progress || 0) >= 100).length / rawUsers.length) * 100)
    : 0;

  // Level distribution from courses
  const levelDist: Record<string, number> = {};
  courses.forEach((c) => {
    const lvl = (c.level || "unknown").toLowerCase();
    levelDist[lvl] = (levelDist[lvl] || 0) + 1;
  });

  const publishedCourses = courses.filter((c) => c.status === "published").length;
  const draftCourses = courses.filter((c) => c.status === "draft").length;

  // Simple bar helper
  const BarSegment: React.FC<{ value: number; max: number; color: string; label: string; count: number }> = ({
    value,
    max,
    color,
    label,
    count,
  }) => (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 text-right truncate">{label}</span>
      <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative">
        <div
          className={`h-full rounded-md transition-all duration-700 ${color}`}
          style={{ width: max > 0 ? `${Math.max((value / max) * 100, 2)}%` : "0%" }}
        />
        <span className="absolute inset-0 flex items-center px-2.5 text-xs font-medium text-gray-700">
          {count}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-4">
          <BarChart3 className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-gray-900 font-medium mb-1">Failed to load analytics</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button onClick={loadData} className="btn btn-primary text-sm">
          Try Again
        </button>
      </div>
    );
  }

  const maxEnrollment = courseAnalytics.length ? Math.max(...courseAnalytics.map((c) => c.enrollments)) : 1;
  const maxBucket = Math.max(
    progressBuckets.notStarted,
    progressBuckets.beginner,
    progressBuckets.intermediate,
    progressBuckets.advanced,
    progressBuckets.completed,
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Insights into course performance and learner engagement
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(["overview", "courses", "users"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Courses",
            value: courses.length,
            sub: `${publishedCourses} published`,
            icon: BookOpen,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            trend: publishedCourses > draftCourses ? "up" : "down",
          },
          {
            label: "Total Enrollments",
            value: totalEnrollments,
            sub: `${uniqueUsers} unique users`,
            icon: Users,
            iconBg: "bg-violet-50",
            iconColor: "text-violet-600",
            trend: "up",
          },
          {
            label: "Avg Progress",
            value: `${avgProgress}%`,
            sub: `${completionRate}% completion rate`,
            icon: TrendingUp,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            trend: avgProgress > 50 ? "up" : "down",
          },
          {
            label: "Active Today",
            value: activeToday,
            sub: `${activeWeek} this week`,
            icon: Target,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            trend: activeToday > 0 ? "up" : "neutral",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg ${kpi.iconBg}`}>
                  <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
                {kpi.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                ) : kpi.trend === "down" ? (
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                ) : null}
              </div>
              <p className="text-2xl font-semibold text-gray-900 mt-3">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
              <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Progress Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-5">
              <Award className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Progress Distribution</h3>
            </div>
            <div className="space-y-3">
              <BarSegment label="Not Started" value={progressBuckets.notStarted} max={maxBucket} color="bg-gray-300" count={progressBuckets.notStarted} />
              <BarSegment label="0–25%" value={progressBuckets.beginner} max={maxBucket} color="bg-amber-400" count={progressBuckets.beginner} />
              <BarSegment label="25–50%" value={progressBuckets.intermediate} max={maxBucket} color="bg-blue-400" count={progressBuckets.intermediate} />
              <BarSegment label="50–99%" value={progressBuckets.advanced} max={maxBucket} color="bg-violet-500" count={progressBuckets.advanced} />
              <BarSegment label="Completed" value={progressBuckets.completed} max={maxBucket} color="bg-emerald-500" count={progressBuckets.completed} />
            </div>
          </div>

          {/* User Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">User Activity</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Active Today", value: activeToday, color: "bg-emerald-500", lightColor: "bg-emerald-50 text-emerald-700" },
                { label: "This Week", value: activeWeek, color: "bg-blue-500", lightColor: "bg-blue-50 text-blue-700" },
                { label: "This Month", value: activeMonth, color: "bg-violet-500", lightColor: "bg-violet-50 text-violet-700" },
                { label: "Inactive (30d+)", value: inactive, color: "bg-gray-400", lightColor: "bg-gray-50 text-gray-600" },
              ].map((item) => (
                <div key={item.label} className="relative overflow-hidden rounded-xl border border-gray-100 p-4">
                  <div className={`absolute top-0 left-0 w-1 h-full ${item.color}`} />
                  <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Course Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-5">
              <Layers className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Course Status</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray={`${courses.length ? (publishedCourses / courses.length) * 97.4 : 0} 97.4`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-900">{courses.length}</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {[
                  { label: "Published", count: publishedCourses, color: "bg-emerald-500" },
                  { label: "Draft", count: draftCourses, color: "bg-amber-400" },
                  { label: "Archived", count: courses.filter((c) => c.status === "archived").length, color: "bg-gray-300" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Level Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Course Levels</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(levelDist).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No course level data</p>
              ) : (
                Object.entries(levelDist)
                  .sort(([, a], [, b]) => b - a)
                  .map(([level, count]) => {
                    const colors: Record<string, string> = {
                      beginner: "bg-emerald-400",
                      basic: "bg-emerald-400",
                      intermediate: "bg-blue-500",
                      advanced: "bg-violet-500",
                      expert: "bg-rose-500",
                    };
                    return (
                      <BarSegment
                        key={level}
                        label={level.charAt(0).toUpperCase() + level.slice(1)}
                        value={count}
                        max={Math.max(...Object.values(levelDist))}
                        color={colors[level] || "bg-gray-400"}
                        count={count}
                      />
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "courses" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Course Performance</h3>
            <p className="text-xs text-gray-500 mt-0.5">Enrollment and completion metrics per course</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    Course
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    Enrollments
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    Avg Progress
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    Completion Rate
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {courseAnalytics.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                      No course enrollment data available
                    </td>
                  </tr>
                ) : (
                  courseAnalytics.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">{course.title}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(course.enrollments / maxEnrollment) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700 tabular-nums">{course.enrollments}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                            <div
                              className={`h-full rounded-full ${
                                course.avgProgress >= 75
                                  ? "bg-emerald-500"
                                  : course.avgProgress >= 50
                                  ? "bg-blue-500"
                                  : "bg-amber-400"
                              }`}
                              style={{ width: `${course.avgProgress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700 tabular-nums">{course.avgProgress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                            course.completionRate >= 50
                              ? "bg-emerald-50 text-emerald-700"
                              : course.completionRate >= 25
                              ? "bg-amber-50 text-amber-700"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {course.completionRate}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700 tabular-nums">
                          {course.completed}/{course.enrollments}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Engagement Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Engagement Summary</h3>
            <div className="space-y-4">
              {[
                { label: "Users with 100% completion", value: rawUsers.filter((u: any) => (u.progress || 0) >= 100).length, total: rawUsers.length, color: "bg-emerald-500" },
                { label: "Users above 50% progress", value: rawUsers.filter((u: any) => (u.progress || 0) >= 50).length, total: rawUsers.length, color: "bg-blue-500" },
                { label: "Users who haven't started", value: rawUsers.filter((u: any) => (u.progress || 0) === 0).length, total: rawUsers.length, color: "bg-gray-400" },
                { label: "Multi-course enrollments", value: rawUsers.length - uniqueUsers, total: rawUsers.length, color: "bg-violet-500" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-600">{item.label}</span>
                    <span className="text-xs font-medium text-gray-900">
                      {item.value} <span className="text-gray-400">/ {item.total}</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: item.total ? `${(item.value / item.total) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Learners</h3>
            <div className="space-y-3">
              {rawUsers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No user data available</p>
              ) : (
                [...rawUsers]
                  .sort((a: any, b: any) => (b.progress || 0) - (a.progress || 0))
                  .slice(0, 6)
                  .map((user: any, idx: number) => {
                    const name = user.user_name || user.name || "Unknown";
                    const progress = user.progress || 0;
                    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";
                    return (
                      <div
                        key={`${user.user_id || idx}-${user.course_id || idx}`}
                        className="flex items-center gap-3"
                      >
                        <span className="w-5 text-center text-xs">
                          {medal || <span className="text-gray-400">{idx + 1}</span>}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-900 truncate font-medium">{name}</p>
                            <span className="text-xs font-medium text-gray-600 tabular-nums ml-2">{progress}%</span>
                          </div>
                          <div className="w-full h-1 bg-gray-100 rounded-full mt-1">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                progress >= 100
                                  ? "bg-emerald-500"
                                  : progress >= 50
                                  ? "bg-blue-500"
                                  : "bg-amber-400"
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {user.course_title || user.courseTitle || ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
