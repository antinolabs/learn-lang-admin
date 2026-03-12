import React, { useState, useEffect, useCallback } from "react";
import {
  Users as UsersIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  TrendingUp,
  Clock,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { userCourseApi } from "../services/api";

interface UserCourseEntry {
  user_id: string;
  user_name: string;
  user_email: string;
  course_id: string;
  course_title: string;
  progress: number;
  status: string;
  enrolled_at: string;
  last_accessed_at: string;
}

const Users: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 10;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit };
      if (search) params.search = search;
      const response = await userCourseApi.getUsersCourses(params);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load users");
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users data");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  // Extract users list - flexible for different API response shapes
  const rawUsers: any[] = data?.users || data?.data || data?.results || (Array.isArray(data) ? data : []);
  const totalItems = data?.total || data?.totalCount || rawUsers.length;
  const totalPages = data?.totalPages || Math.ceil(totalItems / limit) || 1;

  // Aggregate stats from current data
  const uniqueUsers = new Set(rawUsers.map((u: any) => u.user_id || u._id || u.email)).size;
  const activeUsers = rawUsers.filter((u: any) => {
    const lastAccess = u.last_accessed_at || u.lastAccessedAt || u.updated_at;
    if (!lastAccess) return false;
    const diff = Date.now() - new Date(lastAccess).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // active in last 7 days
  }).length;
  const avgProgress = rawUsers.length
    ? Math.round(rawUsers.reduce((sum: number, u: any) => sum + (u.progress || 0), 0) / rawUsers.length)
    : 0;
  const totalEnrollments = totalItems;

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-amber-500";
    return "bg-gray-300";
  };

  const getProgressBg = (progress: number) => {
    if (progress >= 75) return "bg-emerald-50";
    if (progress >= 50) return "bg-blue-50";
    if (progress >= 25) return "bg-amber-50";
    return "bg-gray-50";
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "complete")
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
    if (s === "in_progress" || s === "in-progress" || s === "active")
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
    if (s === "not_started" || s === "not-started" || s === "inactive")
      return "bg-gray-50 text-gray-600 ring-1 ring-gray-500/20";
    return "bg-gray-50 text-gray-600 ring-1 ring-gray-500/20";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getActivityIcon = (dateStr: string) => {
    if (!dateStr) return <Minus className="h-3.5 w-3.5 text-gray-400" />;
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />;
    if (diffDays <= 7) return <Minus className="h-3.5 w-3.5 text-amber-500" />;
    return <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />;
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-violet-100 text-violet-700",
      "bg-blue-100 text-blue-700",
      "bg-emerald-100 text-emerald-700",
      "bg-amber-100 text-amber-700",
      "bg-rose-100 text-rose-700",
      "bg-cyan-100 text-cyan-700",
      "bg-indigo-100 text-indigo-700",
      "bg-teal-100 text-teal-700",
    ];
    const hash = (name || "").split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-4">
          <UsersIcon className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-gray-900 font-medium mb-1">Failed to load users</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button onClick={loadUsers} className="btn btn-primary text-sm">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor user enrollments, progress, and learning activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Enrollments",
            value: totalEnrollments,
            icon: BookOpen,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            label: "Unique Users",
            value: uniqueUsers,
            icon: UsersIcon,
            iconBg: "bg-violet-50",
            iconColor: "text-violet-600",
          },
          {
            label: "Active (7d)",
            value: activeUsers,
            icon: UserCheck,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
          {
            label: "Avg Progress",
            value: `${avgProgress}%`,
            icon: TrendingUp,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <button type="submit" className="btn btn-primary text-sm py-2">
              Search
            </button>
            {search && (
              <button type="button" onClick={clearSearch} className="text-sm text-gray-500 hover:text-gray-700">
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  User
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  Course
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  Progress
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  Last Active
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
                  Enrolled
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rawUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                      <UsersIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {search ? `No users found for "${search}"` : "No user data available"}
                    </p>
                  </td>
                </tr>
              ) : (
                rawUsers.map((user: any, idx: number) => {
                  const name = user.user_name || user.name || user.userName || "Unknown";
                  const email = user.user_email || user.email || user.userEmail || "";
                  const courseTitle = user.course_title || user.courseTitle || user.course_name || "—";
                  const progress = user.progress || 0;
                  const status = user.status || "unknown";
                  const lastAccess = user.last_accessed_at || user.lastAccessedAt || user.updated_at || "";
                  const enrolled = user.enrolled_at || user.enrolledAt || user.created_at || "";

                  return (
                    <tr
                      key={`${user.user_id || user._id || idx}-${user.course_id || idx}`}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(name)}`}
                          >
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                            <p className="text-xs text-gray-500 truncate">{email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-900 truncate max-w-[200px]">{courseTitle}</p>
                      </td>

                      {/* Progress */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-24 h-1.5 rounded-full ${getProgressBg(progress)}`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 tabular-nums w-8 text-right">
                            {progress}%
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getStatusBadge(status)}`}
                        >
                          {status.replace(/_/g, " ").replace(/-/g, " ")}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {getActivityIcon(lastAccess)}
                          <span className="text-sm text-gray-600">{formatDate(lastAccess)}</span>
                        </div>
                      </td>

                      {/* Enrolled */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{formatDate(enrolled)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages} · {totalItems} total
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                      page === pageNum
                        ? "bg-primary-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
