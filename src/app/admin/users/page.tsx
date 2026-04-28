'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  ExternalLink,
  User,
  Wallet,
  Loader2,
  X,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  kycStatus: string;
  signupFeePaid: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  walletBalance: string | null;
}

interface KycDocument {
  id: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

interface UserDetails {
  user: User & {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    kycRejectionReason?: string;
  };
  wallet?: {
    totalBalance: string;
    availableBalance: string;
    lockedBalance: string;
  };
  kycDocuments: KycDocument[];
  stats: {
    totalBids: number;
    totalShipments: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  nin: 'National ID (NIN)',
  passport: 'International Passport',
  drivers_license: "Driver's License",
  utility_bill: 'Utility Bill',
  selfie: 'Selfie with ID',
  bvn_slip: 'BVN Slip',
  proof_of_address: 'Proof of Address',
};

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState(searchParams.get('filter') === 'pending_kyc' ? 'pending' : 'all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'wallet'>('info');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, kycFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(kycFilter !== 'all' && { kycStatus: kycFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setDetailsLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setUserDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setUserDetails(null);
    setActiveTab('info');
    setShowModal(true);
    fetchUserDetails(user.id);
  };

  const handleKycAction = async (action: 'approve' | 'reject') => {
    if (!selectedUser) return;

    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${selectedUser.id}/kyc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setSelectedUser(null);
        setUserDetails(null);
        setRejectionReason('');
        fetchUsers();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (error) {
      console.error('KYC action error:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const isImageFile = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={kycFilter}
                onChange={(e) => {
                  setKycFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All KYC Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-dark"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signup Fee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.role}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        </td>
                        <td className="px-4 py-4">{getKycBadge(user.kycStatus)}</td>
                        <td className="px-4 py-4">
                          {user.signupFeePaid ? (
                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Unpaid</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono">
                            ${user.walletBalance ? parseFloat(user.walletBalance).toLocaleString() : '0.00'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUserModal(user)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-dark/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-brand-dark" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                  setUserDetails(null);
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'info' ? 'border-b-2 border-brand-dark text-brand-dark' : 'text-gray-500'}`}
                onClick={() => setActiveTab('info')}
              >
                User Info
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'documents' ? 'border-b-2 border-brand-dark text-brand-dark' : 'text-gray-500'}`}
                onClick={() => setActiveTab('documents')}
              >
                KYC Documents
                {userDetails?.kycDocuments && userDetails.kycDocuments.length > 0 && (
                  <span className="ml-2 bg-brand-dark text-white text-xs px-2 py-0.5 rounded-full">
                    {userDetails.kycDocuments.length}
                  </span>
                )}
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'wallet' ? 'border-b-2 border-brand-dark text-brand-dark' : 'text-gray-500'}`}
                onClick={() => setActiveTab('wallet')}
              >
                Wallet
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-dark" />
                </div>
              ) : (
                <>
                  {/* User Info Tab */}
                  {activeTab === 'info' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedUser.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{selectedUser.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Role</p>
                          <p className="font-medium capitalize">{selectedUser.role}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">KYC Status</p>
                          {getKycBadge(selectedUser.kycStatus)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Signup Fee</p>
                          {selectedUser.signupFeePaid ? (
                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Unpaid</Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Account Status</p>
                          {selectedUser.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Joined</p>
                          <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {userDetails?.user.address && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-gray-500 mb-2">Address</p>
                          <p className="font-medium">
                            {userDetails.user.address}
                            {userDetails.user.city && `, ${userDetails.user.city}`}
                            {userDetails.user.state && `, ${userDetails.user.state}`}
                            {userDetails.user.country && `, ${userDetails.user.country}`}
                          </p>
                        </div>
                      )}

                      {userDetails?.stats && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-gray-500 mb-2">Activity</p>
                          <div className="flex gap-4">
                            <div className="bg-gray-50 px-4 py-2 rounded-lg">
                              <p className="text-2xl font-bold">{userDetails.stats.totalBids}</p>
                              <p className="text-xs text-gray-500">Total Bids</p>
                            </div>
                            <div className="bg-gray-50 px-4 py-2 rounded-lg">
                              <p className="text-2xl font-bold">{userDetails.stats.totalShipments}</p>
                              <p className="text-xs text-gray-500">Shipments</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* KYC Actions */}
                      {selectedUser.kycStatus === 'pending' && (
                        <div className="border-t pt-4 mt-4">
                          <h3 className="font-semibold mb-3">KYC Actions</h3>

                          <div className="space-y-3">
                            <Button
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => handleKycAction('approve')}
                              disabled={actionLoading}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve KYC
                            </Button>

                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Rejection Reason
                              </label>
                              <textarea
                                className="w-full border rounded-md p-2 text-sm"
                                rows={3}
                                placeholder="Provide reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                              />
                            </div>

                            <Button
                              variant="outline"
                              className="w-full text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleKycAction('reject')}
                              disabled={actionLoading || !rejectionReason.trim()}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject KYC
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedUser.kycStatus === 'rejected' && userDetails?.user.kycRejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-red-800">KYC Rejected</p>
                              <p className="text-sm text-red-700 mt-1">{userDetails.user.kycRejectionReason}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* KYC Documents Tab */}
                  {activeTab === 'documents' && (
                    <div className="space-y-4">
                      {!userDetails?.kycDocuments || userDetails.kycDocuments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No KYC documents uploaded</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {userDetails.kycDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className="border rounded-lg p-4 hover:bg-gray-50"
                            >
                              <div className="flex items-start gap-4">
                                {/* Thumbnail/Preview */}
                                <div
                                  className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border"
                                  onClick={() => isImageFile(doc.fileName) && setLightboxImage(doc.fileUrl)}
                                >
                                  {isImageFile(doc.fileName) ? (
                                    <img
                                      src={doc.fileUrl}
                                      alt={doc.documentType}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <FileText className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                </div>

                                {/* Details */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-medium">
                                        {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                                      </h4>
                                      <p className="text-sm text-gray-500">{doc.fileName}</p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Badge
                                      className={
                                        doc.status === 'approved'
                                          ? 'bg-green-100 text-green-800'
                                          : doc.status === 'rejected'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                      }
                                    >
                                      {doc.status}
                                    </Badge>
                                  </div>

                                  {doc.rejectionReason && (
                                    <p className="text-sm text-red-600 mt-2">
                                      Rejection reason: {doc.rejectionReason}
                                    </p>
                                  )}

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 mt-3">
                                    {isImageFile(doc.fileName) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setLightboxImage(doc.fileUrl)}
                                      >
                                        <ImageIcon className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    )}
                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Open
                                    </a>
                                    <a
                                      href={doc.fileUrl}
                                      download={doc.fileName}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wallet Tab */}
                  {activeTab === 'wallet' && (
                    <div className="space-y-4">
                      {userDetails?.wallet ? (
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <p className="text-sm text-green-700">Available Balance</p>
                              <p className="text-2xl font-bold text-green-800">
                                ${parseFloat(userDetails.wallet.availableBalance).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm text-yellow-700">Locked Balance</p>
                              <p className="text-2xl font-bold text-yellow-800">
                                ${parseFloat(userDetails.wallet.lockedBalance).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-sm text-blue-700">Total Balance</p>
                              <p className="text-2xl font-bold text-blue-800">
                                ${parseFloat(userDetails.wallet.totalBalance).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <p className="text-sm text-gray-500 mb-3">
                              Wallet management features coming soon...
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No wallet found for this user</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={lightboxImage}
            alt="Document preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
