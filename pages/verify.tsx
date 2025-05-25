import { useState } from 'react';
import { format } from 'date-fns';

interface VerificationResult {
  valid: boolean;
  license: {
    id: string;
    key: string;
    status: string;
    expiresAt: string | null;
    user: {
      email: string;
      name: string | null;
    };
  };
}

export default function Verify(props) {
  const [licenseKey, setLicenseKey] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: licenseKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to verify license');
        return;
      }

      setResult(data);
    } catch (error) {
      setError('Failed to verify license');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8">Verify License</h2>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Key</label>
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify License'}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {result && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="text-lg font-medium text-green-800 mb-2">License Details</h3>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        <span className={result.license.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                          {result.license.status}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">User:</span> {result.license.user.email}
                      </p>
                      {result.license.user.name && (
                        <p>
                          <span className="font-medium">Name:</span> {result.license.user.name}
                        </p>
                      )}
                      {result.license.expiresAt && (
                        <p>
                          <span className="font-medium">Expires:</span>{' '}
                          {format(new Date(result.license.expiresAt), 'PPpp')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 