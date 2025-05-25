import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { prisma } from '../lib/prisma';
import { verify } from 'jsonwebtoken';

interface DashboardProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  stats: {
    totalUsers: number;
    totalLicenses: number;
    activeLicenses: number;
    expiredLicenses: number;
  };
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
      prisma.license.count({ where: { status: 'ACTIVE' } }),
      prisma.license.count({ where: { status: 'EXPIRED' } }),
    ]);

    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
        stats: {
          totalUsers,
          totalLicenses,
          activeLicenses,
          expiredLicenses,
        },
      },
    };
  } catch (error) {
    console.error('Dashboard error:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default function Dashboard({ user, stats }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Dashboard - License System</title>
      </Head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">License System</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="/dashboard"
                  className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </a>
                {user.role === 'ADMIN' && (
                  <>
                    <a
                      href="/users"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Users
                    </a>
                    <a
                      href="/licenses"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Licenses
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {user.name}</span>
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
        {/* Statistics */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Licenses</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalLicenses}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Active Licenses</dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">{stats.activeLicenses}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Expired Licenses</dt>
                <dd className="mt-1 text-3xl font-semibold text-red-600">{stats.expiredLicenses}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
              </h3>
              <div className="mt-5">
                {user.role === 'ADMIN' ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          User Management
                        </h3>
                        <div className="mt-2 max-w-xl text-sm text-gray-500">
                          <p>Create and manage user accounts.</p>
                        </div>
                        <div className="mt-5">
                          <button
                            onClick={() => router.push('/users')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Manage Users
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          License Management
                        </h3>
                        <div className="mt-2 max-w-xl text-sm text-gray-500">
                          <p>Create and manage software licenses.</p>
                        </div>
                        <div className="mt-5">
                          <button
                            onClick={() => router.push('/licenses')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Manage Licenses
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Create New License
                        </h3>
                        <div className="mt-2 max-w-xl text-sm text-gray-500">
                          <p>Generate a new license for a user.</p>
                        </div>
                        <div className="mt-5">
                          <button
                            onClick={() => router.push('/licenses/create')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Create License
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Your Licenses
                      </h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>View and manage your active licenses.</p>
                      </div>
                      <div className="mt-5">
                        <button
                          onClick={() => router.push('/licenses')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Licenses
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
