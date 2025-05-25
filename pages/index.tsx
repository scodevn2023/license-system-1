import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../lib/auth';

interface DashboardProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  statistics: {
    totalUsers: number;
    totalLicenses: number;
    activeLicenses: number;
    expiredLicenses: number;
  };
}

export default function Dashboard({ user, statistics }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [licenses, setLicenses] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    type: '',
    notes: '',
    expirationDate: ''
  });

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/licenses');
      const data = await response.json();
      if (data.success) {
        setLicenses(data.data);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
    }
  };

  const handleCreateLicense = () => {
    router.push('/licenses/create');
  };

  const handleEditLicense = (license) => {
    setSelectedLicense(license);
    setEditForm({
      type: license.type,
      notes: license.notes || '',
      expirationDate: new Date(license.expirationDate).toISOString().split('T')[0]
    });
    setIsEditing(true);
  };

  const handleUpdateLicense = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/licenses/${selectedLicense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (data.success) {
        setIsEditing(false);
        setSelectedLicense(null);
        fetchLicenses();
      }
    } catch (error) {
      console.error('Error updating license:', error);
    }
  };

  const handleDeleteLicense = async (licenseId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa license này?')) {
      try {
        const response = await fetch(`/api/licenses/${licenseId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          fetchLicenses();
        }
      } catch (error) {
        console.error('Error deleting license:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Dashboard - License System</title>
      </Head>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">License System</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="/" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </a>
                {user.role === 'ADMIN' && (
                  <>
                    <a href="/users" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Users
                    </a>
                    <a href="/licenses" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Licenses
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">{user.email}</span>
              <button
                onClick={() => router.push('/api/auth/logout')}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{statistics.totalUsers}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Licenses</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{statistics.totalLicenses}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Licenses</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">{statistics.activeLicenses}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Expired Licenses</dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">{statistics.expiredLicenses}</dd>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {user.role === 'ADMIN' ? (
              <>
                <button
                  onClick={() => router.push('/users')}
                  className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">Manage Users</h3>
                    <p className="mt-1 text-sm text-gray-500">View and manage user accounts</p>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/licenses')}
                  className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">Manage Licenses</h3>
                    <p className="mt-1 text-sm text-gray-500">View and manage all licenses</p>
                  </div>
                </button>
                <button
                  onClick={handleCreateLicense}
                  className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">Create New License</h3>
                    <p className="mt-1 text-sm text-gray-500">Generate a new license key</p>
                  </div>
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/licenses')}
                className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50"
              >
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">View My Licenses</h3>
                  <p className="mt-1 text-sm text-gray-500">View and manage your licenses</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* License List */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Recent Licenses</h2>
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {licenses.map((license) => (
                <li key={license.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {license.key}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Type: {license.type} | Status: {license.status}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Expires: {new Date(license.expirationDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => handleEditLicense(license)}
                          className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLicense(license.id)}
                          className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Edit License Modal */}
        {isEditing && selectedLicense && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit License</h3>
              <form onSubmit={handleUpdateLicense}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="ONE_MONTH">One Month</option>
                      <option value="ONE_YEAR">One Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
                    <input
                      type="date"
                      value={editForm.expirationDate}
                      onChange={(e) => setEditForm({ ...editForm, expirationDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const token = context.req.cookies.token;
    if (!token) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Get statistics
    const [totalUsers, totalLicenses, activeLicenses, expiredLicenses] = await Promise.all([
      prisma.user.count(),
      prisma.license.count(),
      prisma.license.count({
        where: {
          status: 'ACTIVE',
          expirationDate: {
            gt: new Date(),
          },
        },
      }),
      prisma.license.count({
        where: {
          OR: [
            { status: 'EXPIRED' },
            {
              status: 'ACTIVE',
              expirationDate: {
                lte: new Date(),
              },
            },
          ],
        },
      }),
    ]);

    return {
      props: {
        user,
        statistics: {
          totalUsers,
          totalLicenses,
          activeLicenses,
          expiredLicenses,
        },
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}; 