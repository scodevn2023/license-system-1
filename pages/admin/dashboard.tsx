import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AdminDashboard(props) {
  const [user, setUser] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newLicenseType, setNewLicenseType] = useState('ONE_MONTH');
  const [bulkCount, setBulkCount] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    unactivated: 0,
    expired: 0,
    revoked: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [router, page, statusFilter]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/user');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Chưa đăng nhập');
      }

      if (data.user.role !== 'ADMIN') {
        throw new Error('Không có quyền truy cập');
      }

      setUser(data.user);
      fetchStats();
      fetchLicenses();
    } catch (err) {
      console.error('Auth error:', err);
      router.push('/login');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể lấy thống kê');
      }

      setStats(data.data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const res = await fetch(`/api/admin/licenses?${queryParams}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể lấy danh sách license');
      }

      setLicenses(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Đăng xuất thất bại');
      }

      router.push('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  const createLicense = async () => {
    try {
      setError('');
      setSuccessMessage('');
      
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newLicenseType,
          count: bulkCount > 1 ? bulkCount : undefined
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo license');
      }

      setSuccessMessage(
        bulkCount > 1
          ? `Đã tạo ${bulkCount} license thành công`
          : 'Đã tạo license thành công'
      );
      
      fetchStats();
      fetchLicenses();
    } catch (err) {
      setError(err.message);
    }
  };

  const revokeLicense = async (key) => {
    try {
      setError('');
      setSuccessMessage('');
      
      const res = await fetch(`/api/admin/licenses/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'revoke'
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể thu hồi license');
      }

      setSuccessMessage('Đã thu hồi license thành công');
      fetchStats();
      fetchLicenses();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetHWID = async (key) => {
    try {
      setError('');
      setSuccessMessage('');
      
      const res = await fetch(`/api/admin/licenses/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset_hwid'
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể reset HWID');
      }

      setSuccessMessage('Đã reset HWID thành công');
      fetchLicenses();
    } catch (err) {
      setError(err.message);
    }
  };

  const exportLicenses = async () => {
    try {
      const res = await fetch('/api/admin/licenses/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `licenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Không thể xuất dữ liệu');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">AUVA License System - Admin</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Xin chào, {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Quản lý giấy phép
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Thống kê */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng số license</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Đang hoạt động</dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.active}</dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Chưa kích hoạt</dt>
                  <dd className="mt-1 text-3xl font-semibold text-yellow-600">{stats.unactivated}</dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Đã hết hạn</dt>
                  <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.expired}</dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Đã thu hồi</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-600">{stats.revoked}</dd>
                </div>
              </div>
            </div>

            {/* Form tạo license mới */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Tạo giấy phép mới
                </h2>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                {successMessage && (
                  <div className="mb-4 px-4 py-3 bg-green-50 text-green-700 rounded">
                    {successMessage}
                  </div>
                )}
                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-50 text-red-700 rounded">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-2">
                    <label htmlFor="license-type" className="block text-sm font-medium text-gray-700">
                      Loại giấy phép
                    </label>
                    <select
                      id="license-type"
                      name="license-type"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={newLicenseType}
                      onChange={(e) => setNewLicenseType(e.target.value)}
                    >
                      <option value="ONE_MONTH">1 tháng</option>
                      <option value="THREE_MONTHS">3 tháng</option>
                      <option value="SIX_MONTHS">6 tháng</option>
                      <option value="ONE_YEAR">1 năm</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="bulk-count" className="block text-sm font-medium text-gray-700">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      name="bulk-count"
                      id="bulk-count"
                      min="1"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={createLicense}
                      className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Tạo giấy phép
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tìm kiếm và lọc */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                      Tìm kiếm
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <input
                        type="text"
                        name="search"
                        id="search"
                        className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                        placeholder="Tìm theo key, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Trạng thái
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Tất cả</option>
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="UNACTIVATED">Chưa kích hoạt</option>
                      <option value="EXPIRED">Đã hết hạn</option>
                      <option value="REVOKED">Đã thu hồi</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={exportLicenses}
                      className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Xuất CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Danh sách license */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Danh sách giấy phép
                </h2>
              </div>
              <div className="border-t border-gray-200">
                {loading ? (
                  <div className="px-4 py-5 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2">Đang tải...</p>
                  </div>
                ) : licenses.length === 0 ? (
                  <div className="px-4 py-5 text-center text-gray-500">
                    Không tìm thấy giấy phép nào
                  </div>
                ) : (
                  <div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Mã giấy phép
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Loại
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Trạng thái
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Người dùng
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Email
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Ngày kích hoạt
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Ngày hết hạn
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {licenses.map((license) => (
                          <tr key={license.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {license.key}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {license.type === 'ONE_MONTH'
                                ? '1 tháng'
                                : license.type === 'THREE_MONTHS'
                                ? '3 tháng'
                                : license.type === 'SIX_MONTHS'
                                ? '6 tháng'
                                : '1 năm'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  license.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-800'
                                    : license.status === 'UNACTIVATED'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : license.status === 'EXPIRED'
                                    ? 'bg-red-100 text-red-800'
                                    : license.status === 'REVOKED'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {license.status === 'ACTIVE'
                                  ? 'Đang hoạt động'
                                  : license.status === 'UNACTIVATED'
                                  ? 'Chưa kích hoạt'
                                  : license.status === 'EXPIRED'
                                  ? 'Đã hết hạn'
                                  : license.status === 'REVOKED'
                                  ? 'Đã thu hồi'
                                  : license.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {license.user?.name || 'Chưa gán'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {license.user?.email || 'Chưa gán'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {license.activatedAt
                                ? format(new Date(license.activatedAt), 'dd/MM/yyyy HH:mm')
                                : 'Chưa kích hoạt'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {license.expiresAt
                                ? format(new Date(license.expiresAt), 'dd/MM/yyyy HH:mm')
                                : 'Chưa xác định'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                {license.status !== 'REVOKED' && (
                                  <button
                                    onClick={() => revokeLicense(license.key)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Thu hồi
                                  </button>
                                )}
                                {license.status === 'ACTIVE' && (
                                  <button
                                    onClick={() => resetHWID(license.key)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Reset HWID
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Phân trang */}
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Trước
                        </button>
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Sau
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Trang <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setPage(Math.max(1, page - 1))}
                              disabled={page === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                              <span className="sr-only">Trước</span>
                              &larr;
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                              <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`relative inline-flex items-center px-4 py-2 border ${
                                  p === page
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                } text-sm font-medium`}
                              >
                                {p}
                              </button>
                            ))}
                            <button
                              onClick={() => setPage(Math.min(totalPages, page + 1))}
                              disabled={page === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                              <span className="sr-only">Sau</span>
                              &rarr;
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
