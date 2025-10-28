import React, { useEffect, useState } from "react";
import {
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { helpCenterApi } from "../services/api";

interface HelpStats {
  total: number;
  by_status: {
    open: number;
    in_progress: number;
    resolved: number;
  };
  by_category: Record<string, number>;
  average_resolution_time_hours: number;
}

interface HelpQuery {
  _id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  user_id: {
    name: string;
    email: string;
  };
}

const HelpCenter: React.FC = () => {
  const [stats, setStats] = useState<HelpStats | null>(null);
  const [queries, setQueries] = useState<HelpQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Popup state
  const [selectedQuery, setSelectedQuery] = useState<HelpQuery | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, queryRes] = await Promise.all([
        helpCenterApi.getStatistics(),
        helpCenterApi.getAllQueries(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setError(statsRes.message || "Failed to load statistics");
      }

      if (queryRes.success && Array.isArray(queryRes.data?.queries)) {
        setQueries(queryRes.data.queries.slice(0, 5)); // show only 5 recent
      }
    } catch (err) {
      console.error("Error loading help center data:", err);
      setError("Failed to load Help Center data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPopup = (query: HelpQuery) => {
    setSelectedQuery(query);
    setStatus(query.status);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedQuery(null);
  };

    const handleStatusUpdate = async () => {
    if (!selectedQuery) return;

    try {
    const res = await helpCenterApi.updateQueryStatus(
        selectedQuery._id,
        status,
        "We are investigating your issue and will update you soon."
    );

    if (res.success) {
        // Update the status locally in the table
        setQueries((prevQueries) =>
        prevQueries.map((q) =>
            q._id === selectedQuery._id ? { ...q, status } : q
        )
        );

        // Also update popup data
        setSelectedQuery({ ...selectedQuery, status });

        // Close popup
        setShowPopup(false);
    } else {
        console.error("Failed to update status:", res.message);
        alert("Failed to update status. Please try again.");
    }
    } catch (err) {
    console.error("Error updating status:", err);
    alert("An error occurred while updating the query status.");
    }
    };



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
        <button onClick={loadData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const kpiCards = stats
    ? [
        {
          name: "Total Queries",
          value: stats.total,
          icon: MessageCircle,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        },
        {
          name: "Open",
          value: stats.by_status.open,
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
        },
        {
          name: "In Progress",
          value: stats.by_status.in_progress,
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
        },
        {
          name: "Resolved",
          value: stats.by_status.resolved,
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage user support queries.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card p-4 flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Queries by Category
        </h2>
        {Object.entries(stats?.by_category || {}).length === 0 ? (
          <p className="text-gray-500">No category data available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats?.by_category || {})
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <div
                  key={category}
                  className="border border-gray-200 rounded-lg p-4 text-center"
                >
                  <p className="text-gray-700 font-medium">{category}</p>
                  <p className="text-2xl font-bold text-primary-600 mt-1">
                    {count}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Recent Queries Table */}
      <div className="card mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Queries</h2>
          <Link to="/help-center" className="text-primary-600 hover:underline">
            View All
          </Link>
        </div>
        {queries.length === 0 ? (
          <p className="text-gray-500">No recent queries available.</p>
        ) : (
         <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
  <table className="min-w-full text-sm text-gray-700">
    <thead className="bg-gray-100 text-gray-800 uppercase text-xs font-semibold tracking-wide">
      <tr>
        <th className="px-5 py-3 text-left">User</th>
        <th className="px-5 py-3 text-left">Category</th>
        <th className="px-5 py-3 text-left">Subject</th>
        <th className="px-5 py-3 text-left">Status</th>
        <th className="px-5 py-3 text-left">Date</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      {queries.map((q) => (
        <tr
          key={q._id}
          className="hover:bg-gray-50 transition-all duration-150 cursor-pointer"
          onClick={() => handleOpenPopup(q)}
        >
          <td className="px-5 py-3 flex items-center gap-2">
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">
                {q.user_id?.name || "N/A"}
              </span>
              <span className="text-xs text-gray-500">
                {q.user_id?.email || ""}
              </span>
            </div>
          </td>

          <td className="px-5 py-3">
            <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
              {q.category}
            </span>
          </td>

          <td className="px-5 py-3">
            <span className="text-gray-800 line-clamp-1">{q.subject}</span>
          </td>

          <td className="px-5 py-3 capitalize">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                ${
                  q.status === "open"
                    ? "bg-red-100 text-red-700"
                    : q.status === "in_progress"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
            >
              {q.status === "open" && (
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              )}
              {q.status === "in_progress" && (
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              )}
              {q.status === "resolved" && (
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              )}
              {q.status.replace("_", " ")}
            </span>
          </td>

          <td className="px-5 py-3 text-gray-600">
            {new Date(q.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {queries.length === 0 && (
    <div className="text-center py-10 text-gray-500 text-sm">
      No recent queries available.
    </div>
  )}
</div>

        )}
      </div>

        {showPopup && selectedQuery && (
            <div className="fixed !mt-0 inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-fadeIn overflow-y-auto max-h-[90vh]">
                {/* Close Button */}
                <button
                    className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    onClick={handleClosePopup}
                >
                    &times;
                </button>

                {/* Header */}
                <h3 className="text-2xl font-semibold mb-5 text-gray-900 border-b pb-2">
                    Query Details
                </h3>

                {/* Content */}
                <div className="space-y-3 text-gray-700 text-sm">
                    <p>
                    <span className="font-semibold text-gray-800">User:</span>{" "}
                    {selectedQuery.user_id?.name} (
                    <span className="text-blue-600">{selectedQuery.user_id?.email}</span>)
                    </p>
                    <p>
                    <span className="font-semibold text-gray-800">Category:</span>{" "}
                    {selectedQuery.category}
                    </p>
                    <p>
                    <span className="font-semibold text-gray-800">Subject:</span>{" "}
                    {selectedQuery.subject}
                    </p>
                    <div>
                    <span className="font-semibold text-gray-800">Description:</span>
                    <p className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 text-gray-700 text-sm">
                        {selectedQuery.description || "No description provided."}
                    </p>
                    </div>
                    <p>
                    <span className="font-semibold text-gray-800">Date:</span>{" "}
                    {new Date(selectedQuery.createdAt).toLocaleString()}
                    </p>

                    {/* Update Status */}
                    <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Update Status
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-6 flex justify-end gap-3">
                    <button
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                    onClick={handleClosePopup}
                    >
                    Cancel
                    </button>
                    <button
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
                    onClick={handleStatusUpdate}
                    >
                    Save
                    </button>
                </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default HelpCenter;
