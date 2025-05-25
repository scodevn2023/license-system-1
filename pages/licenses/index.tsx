import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { prisma } from '../../lib/prisma';
import { verify } from 'jsonwebtoken';
import { toast } from 'react-hot-toast';

interface License {
  id: string;
  key: string;
  userId: string;
  hardwareId: string | null;
  status: string;
  type: string;
  expirationDate: string;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface LicensesPageProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  licenses: License[];
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

    const licenses = await prisma.license.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
        licenses: JSON.parse(JSON.stringify(licenses)),
      },
    };
  } catch (error) {
    console.error('Licenses page error:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default function LicensesPage({ user, licenses }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  const filteredLicenses = licenses.filter(license => 
    license.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateLicense = () => {
    router.push('/licenses/create');
  };

  const handleViewLicense = (license: License) => {
    setSelectedLicense(license);
  };

  const handleCloseModal = () => {
    setSelectedLicense(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'REVOKED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>License Management - License System</title>
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
            <h2 className="text-2xl font-bold text-gray-900">License Management</h2>
            <button
              onClick={handleCreateLicense}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Create New License
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by license key, email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredLicenses.map((license) => (
                <li key={license.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {license.key}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          User: {license.user.name} ({license.user.email})
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Type: {license.type}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Expires: {formatDate(license.expirationDate)}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(license.status)}`}>
                          {license.status}
                        </span>
                        <button
                          onClick={() => handleViewLicense(license)}
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

      {/* License Details Modal */}
      {selectedLicense && (
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
                      License Details
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">License Key</p>
                        <p className="mt-1 text-sm text-gray-900">{selectedLicense.key}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">User</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedLicense.user.name} ({selectedLicense.user.email})
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <p className="mt-1 text-sm text-gray-900">{selectedLicense.status}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Type</p>
                        <p className="mt-1 text-sm text-gray-900">{selectedLicense.type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Expiration Date</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(selectedLicense.expirationDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Hardware ID</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedLicense.hardwareId || 'Not activated'}
                        </p>
                      </div>
                      {selectedLicense.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Notes</p>
                          <p className="mt-1 text-sm text-gray-900">{selectedLicense.notes}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-500">Created At</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(selectedLicense.createdAt)}
                        </p>
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