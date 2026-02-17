import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { adminApi, malikApi, bhadotApi } from '../services/api';
import AdminChat from '../components/AdminChat';
import { useLanguage } from '../contexts/LanguageContext';
import type { AdminStats, User, Transaction, Malik, Bhadot, RentRequestWithDetails } from '../types';

const ITEMS_PER_PAGE = 10;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<{ maliks: User[]; bhadots: User[] }>({ maliks: [], bhadots: [] });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'transactions'>('stats');

  // Pagination states
  const [malikPage, setMalikPage] = useState(1);
  const [bhadotPage, setBhadotPage] = useState(1);

  // Edit states
  const [editingMalik, setEditingMalik] = useState<string | null>(null);
  const [editingBhadot, setEditingBhadot] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // View details modal state
  const [viewRole, setViewRole] = useState<'Malik' | 'Bhadot' | null>(null);
  const [viewUser, setViewUser] = useState<Malik | Bhadot | null>(null);
  const [viewRequests, setViewRequests] = useState<RentRequestWithDetails[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, transactionsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getTransactions(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setTransactions(transactionsRes.data);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error.status === 401 || error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (role: 'Malik' | 'Bhadot', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${role}?`)) return;

    try {
      await adminApi.deleteUser(role, id);
      await loadData();
      setToast({
        message: `${role} deleted successfully!`,
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: 'Failed to delete user',
        type: 'error'
      });
    }
  };

  const handleEditMalik = (user: User) => {
    setEditingMalik(user.id);
    setEditFormData({
      name: user.name,
      whatsapp: user.whatsapp,
      address: user.address,
    });
  };

  const handleEditBhadot = (user: User) => {
    setEditingBhadot(user.id);
    setEditFormData({
      name: user.name,
      mobile: user.mobile,
      status: user.status,
    });
  };

  const handleSaveMalik = async (id: string) => {
    setSaving(true);
    try {
      await malikApi.update(id, editFormData);
      await loadData();
      setEditingMalik(null);
      setToast({
        message: 'Malik updated successfully!',
        type: 'success'
      });
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to update Malik',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBhadot = async (id: string) => {
    setSaving(true);
    try {
      await bhadotApi.update(id, editFormData);
      await loadData();
      setEditingBhadot(null);
      setToast({
        message: 'Bhadot updated successfully!',
        type: 'success'
      });
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to update Bhadot',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMalik(null);
    setEditingBhadot(null);
    setEditFormData({});
  };

  const handleViewMalik = async (id: string) => {
    setViewRole('Malik');
    setViewLoading(true);
    try {
      const [malikRes, requestsRes] = await Promise.all([
        malikApi.getById(id),
        malikApi.getRequests(id),
      ]);
      setViewUser(malikRes.data);
      setViewRequests(requestsRes.data);
    } catch (error) {
      setToast({
        message: 'Failed to load Malik details',
        type: 'error'
      });
      setViewRole(null);
      setViewUser(null);
      setViewRequests([]);
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewBhadot = async (id: string) => {
    setViewRole('Bhadot');
    setViewLoading(true);
    try {
      const [bhadotRes, requestsRes] = await Promise.all([
        bhadotApi.getById(id),
        bhadotApi.getRequests(id),
      ]);
      setViewUser(bhadotRes.data);
      setViewRequests(requestsRes.data);
    } catch (error) {
      setToast({
        message: 'Failed to load Bhadot details',
        type: 'error'
      });
      setViewRole(null);
      setViewUser(null);
      setViewRequests([]);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setViewRole(null);
    setViewUser(null);
    setViewRequests([]);
  };

  // Pagination calculations
  const malikStartIndex = (malikPage - 1) * ITEMS_PER_PAGE;
  const malikEndIndex = malikStartIndex + ITEMS_PER_PAGE;
  const paginatedMaliks = users.maliks.slice(malikStartIndex, malikEndIndex);
  const totalMalikPages = Math.ceil(users.maliks.length / ITEMS_PER_PAGE);

  const bhadotStartIndex = (bhadotPage - 1) * ITEMS_PER_PAGE;
  const bhadotEndIndex = bhadotStartIndex + ITEMS_PER_PAGE;
  const paginatedBhadots = users.bhadots.slice(bhadotStartIndex, bhadotEndIndex);
  const totalBhadotPages = Math.ceil(users.bhadots.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Header
        title="Admin Dashboard"
        showLanguageSwitcher={false}
        onLogout={() => {
          localStorage.removeItem('token');
          navigate('/admin/login')
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-3xl shadow-lg mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition ${activeTab === 'stats'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition ${activeTab === 'users'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Master Database
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 px-4 rounded-2xl font-semibold transition ${activeTab === 'transactions'
              ? 'bg-purple-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Transaction Log
          </button>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-2">Total Landlords</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalMaliks}</div>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-2">Total Tenants</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalBhadots}</div>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-2">Total Requests</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalRequests}</div>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-2">Pending</div>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingRequests}</div>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-2">Accepted</div>
              <div className="text-3xl font-bold text-green-600">{stats.acceptedRequests}</div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            <div className="space-y-6">
              {/* Landlords (Maliks) Section - Green Theme */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl shadow-lg p-6 border-2 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-green-900 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Landlords (Maliks) - {users.maliks.length}
                  </h3>
                </div>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-green-600 text-white">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold">ID</th>
                          <th className="text-left py-3 px-4 font-semibold">Name</th>
                          <th className="text-left py-3 px-4 font-semibold">WhatsApp</th>
                          <th className="text-left py-3 px-4 font-semibold">Address</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedMaliks.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              No landlords found
                            </td>
                          </tr>
                        ) : (
                          paginatedMaliks.map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-green-50 transition">
                              {editingMalik === user.id ? (
                                <>
                                  <td className="py-3 px-4 font-mono text-sm">{user.id}</td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="text"
                                      value={editFormData.name}
                                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="text"
                                      value={editFormData.whatsapp}
                                      onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="text"
                                      value={editFormData.address}
                                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveMalik(user.id)}
                                        disabled={saving}
                                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                                      >
                                        {saving ? <LoadingSpinner size="sm" /> : 'Save'}
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition text-sm font-medium disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-3 px-4 font-mono text-sm">{user.id}</td>
                                  <td className="py-3 px-4 font-medium">{user.name}</td>
                                  <td className="py-3 px-4">{user.whatsapp}</td>
                                  <td className="py-3 px-4">{user.address}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleViewMalik(user.id)}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium flex items-center gap-1.5"
                                        title="View Details"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View
                                      </button>
                                      <button
                                        onClick={() => handleEditMalik(user)}
                                        className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium flex items-center gap-1.5"
                                        title="Edit"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser('Malik', user.id)}
                                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium flex items-center gap-1.5"
                                        title="Delete"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination for Maliks */}
                  {totalMalikPages > 1 && (
                    <div className="px-4 py-3 bg-green-50 border-t border-green-200 flex items-center justify-between">
                      <div className="text-sm text-green-700">
                        Showing {malikStartIndex + 1} to {Math.min(malikEndIndex, users.maliks.length)} of {users.maliks.length} landlords
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMalikPage(prev => Math.max(1, prev - 1))}
                          disabled={malikPage === 1}
                          className="px-3 py-1 bg-white border border-green-300 rounded hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium">
                          Page {malikPage} of {totalMalikPages}
                        </span>
                        <button
                          onClick={() => setMalikPage(prev => Math.min(totalMalikPages, prev + 1))}
                          disabled={malikPage === totalMalikPages}
                          className="px-3 py-1 bg-white border border-green-300 rounded hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tenants (Bhadots) Section - Blue Theme */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-lg p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Tenants (Bhadots) - {users.bhadots.length}
                  </h3>
                </div>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-blue-600 text-white">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold">ID</th>
                          <th className="text-left py-3 px-4 font-semibold">Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Mobile</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedBhadots.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              No tenants found
                            </td>
                          </tr>
                        ) : (
                          paginatedBhadots.map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-blue-50 transition">
                              {editingBhadot === user.id ? (
                                <>
                                  <td className="py-3 px-4 font-mono text-sm">{user.id}</td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="text"
                                      value={editFormData.name}
                                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="text"
                                      value={editFormData.mobile}
                                      onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <select
                                      value={editFormData.status}
                                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                      className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                      <option value="Waiting">Waiting</option>
                                      <option value="Approved">Approved</option>
                                    </select>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSaveBhadot(user.id)}
                                        disabled={saving}
                                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                                      >
                                        {saving ? <LoadingSpinner size="sm" /> : 'Save'}
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition text-sm font-medium disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-3 px-4 font-mono text-sm">{user.id}</td>
                                  <td className="py-3 px-4 font-medium">{user.name}</td>
                                  <td className="py-3 px-4">{user.mobile}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                      {user.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleViewBhadot(user.id)}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium flex items-center gap-1.5"
                                        title="View Details"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View
                                      </button>
                                      <button
                                        onClick={() => handleEditBhadot(user)}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium flex items-center gap-1.5"
                                        title="Edit"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser('Bhadot', user.id)}
                                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium flex items-center gap-1.5"
                                        title="Delete"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination for Bhadots */}
                  {totalBhadotPages > 1 && (
                    <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                      <div className="text-sm text-blue-700">
                        Showing {bhadotStartIndex + 1} to {Math.min(bhadotEndIndex, users.bhadots.length)} of {users.bhadots.length} tenants
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBhadotPage(prev => Math.max(1, prev - 1))}
                          disabled={bhadotPage === 1}
                          className="px-3 py-1 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium">
                          Page {bhadotPage} of {totalBhadotPages}
                        </span>
                        <button
                          onClick={() => setBhadotPage(prev => Math.min(totalBhadotPages, prev + 1))}
                          disabled={bhadotPage === totalBhadotPages}
                          className="px-3 py-1 bg-white border border-blue-300 rounded hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messaging Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Messages</h2>
              <AdminChat />
            </div>

          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Landlord</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{tx.id}</td>
                      <td className="py-3 px-4">{tx.malikName}</td>
                      <td className="py-3 px-4">{tx.bhadotName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${tx.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                          tx.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>

      {viewRole && viewUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {viewRole === 'Malik' ? 'Malik Details' : 'Bhadot Details'}
              </h2>
              <button
                type="button"
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {viewLoading ? (
                <div className="py-20 flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  {/* User Details - Two Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {viewRole === 'Malik' ? (
                      <>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID</div>
                          <div className="font-mono text-sm text-gray-900 font-medium">{(viewUser as Malik).id}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">NAME</div>
                          <div className="text-gray-900 font-semibold">{(viewUser as Malik).name}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">WHATSAPP</div>
                          <div className="text-gray-900">{(viewUser as Malik).whatsapp}</div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">ADDRESS</div>
                          <div className="text-gray-900">{(viewUser as Malik).address}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID</div>
                          <div className="font-mono text-sm text-gray-900 font-medium">{(viewUser as Bhadot).id}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">NAME</div>
                          <div className="text-gray-900 font-semibold">{(viewUser as Bhadot).name}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">MOBILE</div>
                          <div className="text-gray-900">{(viewUser as Bhadot).mobile}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">STATUS</div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(viewUser as Bhadot).status === 'Approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {(viewUser as Bhadot).status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">CAST</div>
                          <div className="text-gray-900">{(viewUser as Bhadot).cast || '-'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">FAMILY MEMBERS</div>
                          <div className="text-gray-900">{(viewUser as Bhadot).totalFamilyMembers ?? '-'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">AREA</div>
                          <div className="text-gray-900">{(viewUser as Bhadot).area || '-'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">ACTIVE</div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(viewUser as Bhadot).isActive === false
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                              }`}>
                              {(viewUser as Bhadot).isActive === false ? 'Inactive' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Requests Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Requests</h3>
                    {viewRequests.length === 0 ? (
                      <div className="bg-gray-50 rounded-2xl p-8 text-center">
                        <p className="text-sm text-gray-500">No requests found.</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto max-h-80">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b border-gray-200">
                              <tr>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase">ID</th>
                                {viewRole === 'Malik' ? (
                                  <>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Bhadot</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Mobile</th>
                                  </>
                                ) : (
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Malik</th>
                                )}
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Status</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Time</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {viewRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition">
                                  <td className="py-3 px-4 font-mono text-xs text-gray-600">{req.id}</td>
                                  {viewRole === 'Malik' ? (
                                    <>
                                      <td className="py-3 px-4 font-medium text-gray-900">{req.bhadotName || '-'}</td>
                                      <td className="py-3 px-4 text-gray-600">{req.bhadotMobile || '-'}</td>
                                    </>
                                  ) : (
                                    <td className="py-3 px-4 font-medium text-gray-900">{req.malikName || '-'}</td>
                                  )}
                                  <td className="py-3 px-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${req.status === 'Accepted'
                                      ? 'bg-green-100 text-green-800'
                                      : req.status === 'Rejected'
                                        ? 'bg-red-100 text-red-800'
                                        : req.status === 'Expired'
                                          ? 'bg-gray-100 text-gray-700'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                      {req.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-gray-600 text-xs">
                                    {new Date(req.timestamp).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
