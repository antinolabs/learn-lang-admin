import React, { useEffect, useMemo, useState } from 'react';
import { moduleApi } from '../services/api';
import { Module } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, ArrowRight, RefreshCw } from 'lucide-react';

const ModulesPage: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const filterCourseId = searchParams.get('courseId');

  const loadModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await moduleApi.getAllModules();
      if (response.success) {
        setModules(response.data);
      } else {
        setError(response.message || 'Failed to load modules');
      }
    } catch (err) {
      setError('Failed to load modules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!filterCourseId) return modules;
    return modules.filter((m) => m.courseId === filterCourseId);
  }, [modules, filterCourseId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
          <p className="mt-2 text-gray-600">All generated modules{filterCourseId ? ' for this course' : ''}</p>
        </div>
        <button onClick={loadModules} className="btn btn-secondary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">{error}</div>
            <button onClick={loadModules} className="btn btn-primary">Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No modules found</h3>
            <p className="mt-1 text-sm text-gray-500">Generate modules or adjust filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{m.order}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xl truncate">{m.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.courseId}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${m.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/module/${m.id}`} className="btn btn-secondary btn-sm inline-flex items-center gap-2">
                        Manage <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModulesPage;


