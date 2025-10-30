import React, { useEffect, useState } from "react";
import { Flag, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { flagsApi } from "../services/api";

interface FlagStats {
  total: number;
  by_status: {
    pending: number;
    verified: number;
    resolved: number;
    rejected: number;
  };
  by_reason: Record<string, number>;
  average_resolution_time_hours: number;
}

interface AdminFlag {
  _id: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  user_id: {
    name: string;
    email: string;
  };
  admin_notes?: string;
}

const Flags: React.FC = () => {
  const [stats, setStats] = useState<FlagStats | null>(null);
  const [flags, setFlags] = useState<AdminFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Popup state
  const [selectedFlag, setSelectedFlag] = useState<AdminFlag | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, flagsRes] = await Promise.all([
        flagsApi.getStatistics(),
        flagsApi.getAllFlags(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        setError(statsRes.message || "Failed to load statistics");
      }

      if (flagsRes.success && Array.isArray(flagsRes.data?.flags)) {
        setFlags(flagsRes.data.flags.slice(0, 5)); // show only 5 recent
      }
    } catch (err) {
      console.error("Error loading flag data:", err);
      setError("Failed to load Flag data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPopup = (flag: AdminFlag) => {
    setSelectedFlag(flag);
    setStatus(flag.status);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedFlag(null);
  };

  const handleStatusUpdate = async () => {
    if (!selectedFlag) return;

    try {
      const res = await flagsApi.updateFlagStatus(
        selectedFlag._id,
        status,
        "Admin has reviewed the flag and updated its status."
      );

      if (res.success) {
        setFlags((prevFlags) =>
          prevFlags.map((f) =>
            f._id === selectedFlag._id ? { ...f, status } : f
          )
        );
        setSelectedFlag({ ...selectedFlag, status });
        setShowPopup(false);
      } else {
        console.error("Failed to update flag status:", res.message);
        alert("Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error("Error updating flag status:", err);
      alert("An error occurred while updating the flag status.");
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
          name: "Total Flags",
          value: stats.total,
          icon: Flag,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        },
        {
          name: "Pending",
          value: stats.by_status.pending,
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
        },
        {
          name: "Resolved",
          value: stats.by_status.resolved,
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
        },
        {
          name: "Rejected",
          value: stats.by_status.rejected,
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Flags</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage content flags raised by users.
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

      {/* Reason Breakdown */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Flags by Reason
        </h2>
        {Object.entries(stats?.by_reason || {}).length === 0 ? (
          <p className="text-gray-500">No reason data available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats?.by_reason || {})
              .sort((a, b) => b[1] - a[1])
              .map(([reason, count]) => (
                <div
                  key={reason}
                  className="border border-gray-200 rounded-lg p-4 text-center"
                >
                  <p className="text-gray-700 font-medium">{reason}</p>
                  <p className="text-2xl font-bold text-primary-600 mt-1">
                    {count}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Recent Flags Table */}
      <div className="card mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Flags
          </h2>
          <Link to="/flags" className="text-primary-600 hover:underline">
            View All
          </Link>
        </div>

        {flags.length === 0 ? (
          <p className="text-gray-500">No recent flags available.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-100 text-gray-800 uppercase text-xs font-semibold tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Reason</th>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {flags.map((f) => (
                  <tr
                    key={f._id}
                    className="hover:bg-gray-50 transition-all duration-150 cursor-pointer"
                    onClick={() => handleOpenPopup(f)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {f.user_id?.name || "N/A"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {f.user_id?.email || ""}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3 capitalize">
                      <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                        {f.reason.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-3 line-clamp-1 text-gray-800">
                      {f.description || "-"}
                    </td>

                    <td className="px-5 py-3 capitalize">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${
                          f.status === "pending"
                            ? "bg-red-100 text-red-700"
                            : f.status === "resolved"
                            ? "bg-green-100 text-green-700"
                            : f.status === "rejected"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-gray-600">
                      {new Date(f.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Popup */}
      {showPopup && selectedFlag && (
        <div className="fixed !mt-0 inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-fadeIn overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
              onClick={handleClosePopup}
            >
              &times;
            </button>

            <h3 className="text-2xl font-semibold mb-5 text-gray-900 border-b pb-2">
              Flag Details
            </h3>

            <div className="space-y-3 text-gray-700 text-sm">
              <p>
                <span className="font-semibold text-gray-800">User:</span>{" "}
                {selectedFlag.user_id?.name} (
                <span className="text-blue-600">
                  {selectedFlag.user_id?.email}
                </span>
                )
              </p>
              <p>
                <span className="font-semibold text-gray-800">Reason:</span>{" "}
                {selectedFlag.reason.replace("_", " ")}
              </p>
              <div>
                <span className="font-semibold text-gray-800">
                  Description:
                </span>
                <p className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 text-gray-700 text-sm">
                  {selectedFlag.description || "No description provided."}
                </p>
              </div>
              <p>
                <span className="font-semibold text-gray-800">Date:</span>{" "}
                {new Date(selectedFlag.createdAt).toLocaleString()}
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
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

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

export default Flags;
