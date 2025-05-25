import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { prisma } from '../../lib/prisma';
import { verify } from 'jsonwebtoken';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  licenses: {
    id: string;
    key: string;
    status: string;
    type: string;
    expirationDate: string;
  }[];
}

interface UsersPageProps {
  user: User;
  users: User[];
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

    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        },
      };
    }

    const users = await prisma.user.findMany({
      include: {
        licenses: {
          select: {
            id: true,
            key: true,
            status: true,
            type: true,
            expirationDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      props: {
        user: JSON.parse(JSON.stringify(admin)),
        users: JSON.parse(JSON.stringify(users)),
      },
    };
  } catch (error) {
    console.error('Users page error:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default function UsersPage({ user, users }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = () => {
    router.push('/users/create');
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>User Management - License System</title>
      </Head>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">License System</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {user.name}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/api/auth/logout')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <button
              onClick={handleCreateUser}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Create New User
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {user.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Email: {user.email}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Role: {user.role}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Created: {formatDate(user.createdAt)}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                        <button
                          onClick={() => handleViewUser(user)}
                          className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      User Details
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Name</p>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Role</p>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.role}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Created At</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(selectedUser.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Licenses</p>
                        <div className="mt-2 space-y-2">
                          {selectedUser.licenses.length > 0 ? (
                            selectedUser.licenses.map((license) => (
                              <div key={license.id} className="bg-gray-50 p-2 rounded">
                                <p className="text-sm text-gray-900">Key: {license.key}</p>
                                <p className="text-sm text-gray-500">Type: {license.type}</p>
                                <p className="text-sm text-gray-500">Status: {license.status}</p>
                                <p className="text-sm text-gray-500">
                                  Expires: {formatDate(license.expirationDate)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No licenses found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 