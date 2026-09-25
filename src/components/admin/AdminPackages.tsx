import React, { useState, useEffect } from 'react';
import { Package, Search, PlusCircle, Edit3, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { CablePackage, CableServiceName, User } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminPackagesProps {
  adminUser: User;
}

export const AdminPackages: React.FC<AdminPackagesProps> = ({ adminUser }) => {
  const [selectedService, setSelectedService] = useState<CableServiceName | 'all'>('all');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [packages, setPackages] = useState<CablePackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [editPackage, setEditPackage] = useState<CablePackage | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [savingPrice, setSavingPrice] = useState(false);

  // Add Package Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPkgService, setNewPkgService] = useState<CableServiceName>('DStv');
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState<number>(10000);
  const [newPkgChannels, setNewPkgChannels] = useState<number>(80);
  const [newPkgDesc, setNewPkgDesc] = useState('');

  // Sync Live State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const handleSyncVtpass = async () => {
    try {
      setIsSyncing(true);
      setSyncStatusMsg('');
      const res = await adminService.syncVtpassPackages();
      setSyncStatusMsg(res.message || 'Live packages synchronized from VTpass!');
      await loadPackages();
      setTimeout(() => setSyncStatusMsg(''), 6000);
    } catch (err: any) {
      alert(err.message || 'VTpass synchronization failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPackages(selectedService === 'all' ? undefined : selectedService);
      setPackages(data);
    } catch (err) {
      console.error('[AdminPackages] Error loading packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [selectedService, refreshKey]);

  let filteredPackages = packages;
  if (search.trim()) {
    const q = search.toLowerCase();
    filteredPackages = filteredPackages.filter(
      (p) => p.packageName.toLowerCase().includes(q) || p.service.toLowerCase().includes(q)
    );
  }

  const handleOpenEdit = (pkg: CablePackage) => {
    setEditPackage(pkg);
    setEditPrice(pkg.price);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPackage) return;
    if (editPrice <= 0) {
      alert('Price must be greater than zero.');
      return;
    }

    try {
      setSavingPrice(true);
      await adminService.updatePackagePrice(editPackage.id, editPrice, adminUser.id, adminUser.fullName);
      setEditPackage(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update package price');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim() || newPkgPrice <= 0) return;

    // Trigger refresh to sync
    setShowAddModal(false);
    setNewPkgName('');
    setNewPkgDesc('');
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Cable Bouquet Packages & Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official broadcaster subscriber pricing, channel bouquets, and live VTpass variations for DStv, StarTimes, and GOtv.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncVtpass}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs disabled:opacity-50"
            title="Fetch live official prices and packages from VTpass REST API"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing VTpass...' : 'Sync Live VTpass'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Bouquet</span>
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search package name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 bg-white"
          >
            <option value="all">All Cable Services</option>
            <option value="DStv">DStv Only</option>
            <option value="GOtv">GOtv Only</option>
            <option value="StarTimes">StarTimes Only</option>
          </select>
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Service</th>
                <th className="py-3 px-6">Bouquet / Package Name</th>
                <th className="py-3 px-6 text-right">Official Price (NGN)</th>
                <th className="py-3 px-6 text-center">Channels</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-blue-600 whitespace-nowrap">
                    {pkg.service}
                  </td>
                  <td className="py-3.5 px-6 whitespace-nowrap">
                    <span className="font-bold text-slate-900">{pkg.packageName}</span>
                    <span className="block text-[11px] text-slate-400">{pkg.description}</span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-black text-slate-900 tabular-nums whitespace-nowrap text-sm">
                    ₦{pkg.price.toLocaleString('en-NG')}.00
                  </td>
                  <td className="py-3.5 px-6 text-center tabular-nums whitespace-nowrap">
                    {pkg.channelsCount || '—'} HD
                  </td>
                  <td className="py-3.5 px-6 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(pkg)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Price</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Price Modal */}
      {editPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Update Package Price</h3>
                <p className="text-xs text-slate-500">
                  {editPackage.service} - {editPackage.packageName}
                </p>
              </div>
              <button
                onClick={() => setEditPackage(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Price (NGN) *
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-base font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 tabular-nums"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditPackage(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
                >
                  Save New Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Bouquet Package</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPackage} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cable Service *</label>
                <select
                  value={newPkgService}
                  onChange={(e) => setNewPkgService(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/30 bg-white"
                >
                  <option value="DStv">DStv</option>
                  <option value="GOtv">GOtv</option>
                  <option value="StarTimes">StarTimes</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  placeholder="e.g. DStv Prestige"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (NGN) *</label>
                  <input
                    type="number"
                    min="500"
                    required
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/30 tabular-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Channel Count</label>
                  <input
                    type="number"
                    value={newPkgChannels}
                    onChange={(e) => setNewPkgChannels(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/30 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newPkgDesc}
                  onChange={(e) => setNewPkgDesc(e.target.value)}
                  placeholder="e.g. Complete premium bouquet with European leagues"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs"
                >
                  Create Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
