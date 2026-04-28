'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Camera,
  Home,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface KYCDocument {
  id: string;
  documentType: string;
  fileName: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

interface KYCStatus {
  kycStatus: string;
  kycRejectionReason?: string;
  documents: KYCDocument[];
}

const DOCUMENT_TYPES = [
  {
    id: 'id_document',
    label: 'Valid ID',
    description: 'NIN Slip, International Passport, or Driver\'s License',
    icon: CreditCard,
    accept: 'image/*',
  },
  {
    id: 'proof_of_address',
    label: 'Proof of Address',
    description: 'Utility bill or bank statement (not older than 3 months)',
    icon: Home,
    accept: 'image/*,.pdf',
  },
  {
    id: 'selfie',
    label: 'Selfie with ID',
    description: 'Clear photo of yourself holding your ID document',
    icon: Camera,
    accept: 'image/*',
  },
  {
    id: 'bvn_slip',
    label: 'BVN Slip (Optional)',
    description: 'Bank Verification Number slip for faster verification',
    icon: FileText,
    accept: 'image/*,.pdf',
    optional: true,
  },
];

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchKYCStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/kyc/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setKycStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch KYC status:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchKYCStatus();
  }, [fetchKYCStatus]);

  const handleFileChange = (docType: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [docType]: file }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required files
    const requiredDocs = DOCUMENT_TYPES.filter(d => !d.optional);
    const missingDocs = requiredDocs.filter(d => !files[d.id]);

    if (missingDocs.length > 0) {
      setError(`Please upload: ${missingDocs.map(d => d.label).join(', ')}`);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Add all files to form data
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        fetchKYCStatus();
      } else {
        setError(data.error || 'Failed to submit KYC');
      }
    } catch (err) {
      setError('Failed to submit KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Already verified
  if (kycStatus?.kycStatus === 'verified') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">KYC Verified</h2>
              <p className="text-gray-600 mb-6">
                Your identity has been verified. You can now place bids on vehicles.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending review
  if (kycStatus?.kycStatus === 'pending' && kycStatus.documents.length > 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">KYC Under Review</h2>
              <p className="text-gray-600 mb-6">
                Your documents are being reviewed. This usually takes 24-48 hours.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                <h3 className="font-semibold mb-3">Submitted Documents:</h3>
                <ul className="space-y-2">
                  {kycStatus.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between">
                      <span className="text-sm">{doc.documentType?.replace(/_/g, ' ').toUpperCase() || 'Document'}</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {doc.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected - allow resubmission
  const isRejected = kycStatus?.kycStatus === 'rejected';

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
          <CardDescription>
            Verify your identity to start bidding on vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRejected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">KYC Rejected</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {kycStatus?.kycRejectionReason || 'Your documents could not be verified. Please resubmit.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Documents Submitted!</h2>
              <p className="text-gray-600 mb-6">
                We'll review your documents within 24-48 hours and notify you via email.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {DOCUMENT_TYPES.map((docType) => (
                <div key={docType.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <docType.icon className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <label className="font-medium">
                        {docType.label}
                        {!docType.optional && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <p className="text-sm text-gray-500">{docType.description}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <input
                      type="file"
                      accept={docType.accept}
                      onChange={(e) => handleFileChange(docType.id, e.target.files?.[0] || null)}
                      className="hidden"
                      id={`file-${docType.id}`}
                    />
                    <label
                      htmlFor={`file-${docType.id}`}
                      className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
                        files[docType.id]
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {files[docType.id] ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-700">{files[docType.id]?.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-500">Click to upload</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              ))}

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full bg-brand-dark hover:bg-primary-700"
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit KYC Documents
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
