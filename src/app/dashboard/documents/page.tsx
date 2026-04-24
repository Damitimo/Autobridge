'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  FileText,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Car,
  Calendar,
  DollarSign
} from 'lucide-react';

interface VinReport {
  id: string;
  type: string;
  vin: string;
  provider: string;
  vehicleInfo: {
    year?: number;
    make?: string;
    model?: string;
  };
  summary: {
    totalLoss: boolean;
    odometerRollback: boolean;
    accidentCount: number;
    ownerCount?: number;
    odometer?: number;
    titleBrands?: string[];
  };
  reportUrl?: string;
  reportPdf?: string;
  chargedAmount: string;
  purchasedAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<VinReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<VinReport | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDocuments(data.documents);
      } else {
        setError(data.error || 'Failed to fetch documents');
      }
    } catch (err) {
      setError('An error occurred while fetching documents');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (report: VinReport) => {
    if (report.summary.totalLoss) {
      return (
        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
          <XCircle className="h-3 w-3" />
          Total Loss
        </span>
      );
    }
    if (report.summary.odometerRollback) {
      return (
        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
          <AlertTriangle className="h-3 w-3" />
          Odometer Issue
        </span>
      );
    }
    if ((report.summary.accidentCount || 0) > 0) {
      return (
        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
          <AlertTriangle className="h-3 w-3" />
          {report.summary.accidentCount} Accident(s)
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
        <CheckCircle className="h-3 w-3" />
        Clean
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <p className="text-gray-600">Your purchased VIN history reports and documents</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Yet</h3>
            <p className="text-gray-600 mb-4">
              When you purchase VIN history reports, they will appear here.
            </p>
            <a
              href="/dashboard/bids/new"
              className="inline-flex items-center px-4 py-2 bg-brand-dark text-white rounded-lg hover:bg-brand-dark/90 transition-colors"
            >
              Look Up a Vehicle
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-brand-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Car className="h-6 w-6 text-brand-gold" />
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-gray-900">
                          {doc.vehicleInfo.year} {doc.vehicleInfo.make} {doc.vehicleInfo.model}
                        </h3>
                        {getStatusBadge(doc)}
                      </div>
                      <p className="text-sm text-gray-500 font-mono mb-2">VIN: {doc.vin}</p>

                      {/* Quick Stats */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(doc.purchasedAt).toLocaleDateString()}
                        </span>
                        {doc.summary.ownerCount && (
                          <span>{doc.summary.ownerCount} Owner(s)</span>
                        )}
                        {doc.summary.odometer && (
                          <span>{doc.summary.odometer.toLocaleString()} mi</span>
                        )}
                        <span className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-4 w-4" />
                          {doc.chargedAmount} paid
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {doc.reportUrl && (
                      <a
                        href={doc.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-brand-dark text-white rounded-lg hover:bg-brand-dark/90 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>
                    )}
                    {doc.reportPdf && (
                      <a
                        href={doc.reportPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="px-3 py-2 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>

                {/* Title Brands Warning */}
                {doc.summary.titleBrands && doc.summary.titleBrands.length > 0 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Title Brands:</p>
                    <div className="flex flex-wrap gap-2">
                      {doc.summary.titleBrands.map((brand, idx) => (
                        <span key={idx} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedDoc.vehicleInfo.year} {selectedDoc.vehicleInfo.make} {selectedDoc.vehicleInfo.model}
                </h3>
                <p className="text-sm text-gray-500 font-mono">{selectedDoc.vin}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Key Findings */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-4 ${selectedDoc.summary.totalLoss ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedDoc.summary.totalLoss ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <span className="font-semibold text-sm">Total Loss</span>
                  </div>
                  <p className={`text-lg font-bold ${selectedDoc.summary.totalLoss ? 'text-red-700' : 'text-green-700'}`}>
                    {selectedDoc.summary.totalLoss ? 'YES - Salvage/Total Loss' : 'No Record'}
                  </p>
                </div>

                <div className={`rounded-lg p-4 ${selectedDoc.summary.odometerRollback ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedDoc.summary.odometerRollback ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <span className="font-semibold text-sm">Odometer Rollback</span>
                  </div>
                  <p className={`text-lg font-bold ${selectedDoc.summary.odometerRollback ? 'text-red-700' : 'text-green-700'}`}>
                    {selectedDoc.summary.odometerRollback ? 'WARNING - Rollback Detected' : 'No Issues'}
                  </p>
                </div>

                <div className={`rounded-lg p-4 ${(selectedDoc.summary.accidentCount || 0) > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {(selectedDoc.summary.accidentCount || 0) > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <span className="font-semibold text-sm">Accidents</span>
                  </div>
                  <p className={`text-lg font-bold ${(selectedDoc.summary.accidentCount || 0) > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                    {selectedDoc.summary.accidentCount || 0} Record(s)
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-sm">Previous Owners</span>
                  </div>
                  <p className="text-lg font-bold text-blue-700">
                    {selectedDoc.summary.ownerCount || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-3">
                {selectedDoc.summary.odometer && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 text-xs block">Last Reported Odometer</span>
                    <span className="font-semibold">{selectedDoc.summary.odometer.toLocaleString()} mi</span>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs block">Report Provider</span>
                  <span className="font-semibold">{selectedDoc.provider?.toUpperCase() || 'VinAudit'}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs block">Purchase Date</span>
                  <span className="font-semibold">{new Date(selectedDoc.purchasedAt).toLocaleDateString()}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs block">Amount Paid</span>
                  <span className="font-semibold">${selectedDoc.chargedAmount}</span>
                </div>
              </div>

              {/* Title Brands */}
              {selectedDoc.summary.titleBrands && selectedDoc.summary.titleBrands.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Title Brands
                  </h4>
                  <ul className="space-y-1">
                    {selectedDoc.summary.titleBrands.map((brand, idx) => (
                      <li key={idx} className="text-yellow-700 text-sm">• {brand}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedDoc.reportUrl && (
                  <a
                    href={selectedDoc.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-brand-dark hover:bg-brand-dark/90 text-white text-center py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Full Report
                  </a>
                )}
                {selectedDoc.reportPdf && (
                  <a
                    href={selectedDoc.reportPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-center py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
