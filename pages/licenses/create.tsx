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
}

interface CreateLicensePageProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
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
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      props: {
        user: JSON.parse(JSON.stringify(admin)),
        users: JSON.parse(JSON.stringify(users)),
      },
    };
  } catch (error) {
    console.error('Create license page error:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default function CreateLicensePage({ user, users }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userId: '',
    type: 'ONE_MONTH',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/licenses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create license');
      }

      toast.success('License created successfully');
      router.push('/licenses');
    } catch (error) {
      console.error('Create license error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create license');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Create License - License System</title>
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
          <div className="max-w-3xl mx-auto">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New License
                </h3>
                <div className="mt-5">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                        User
                      </label>
                      <div className="mt-1">
                        <select
                          id="userId"
                          name="userId"
                          required
                          value={formData.userId}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="">Select a user</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        License Type
                      </label>
                      <div className="mt-1">
                        <select
                          id="type"
                          name="type"
                          required
                          value={formData.type}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="ONE_MONTH">One Month</option>
                          <option value="ONE_YEAR">One Year</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="notes"
                          name="notes"
                          rows={3}
                          value={formData.notes}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => router.push('/licenses')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {isLoading ? 'Creating...' : 'Create License'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 