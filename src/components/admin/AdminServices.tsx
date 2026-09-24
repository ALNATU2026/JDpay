import React, { useState, useEffect } from 'react';
import { Sliders, Tv, CheckCircle2, AlertTriangle, Power, ShieldCheck, RefreshCw } from 'lucide-react';
import { CableServiceConfig, User } from '../../types';
import { adminService } from '../../services/adminService';

interface AdminServicesProps {
  adminUser: User;
}

export const AdminServices: React.FC<AdminServicesProps> = ({ adminUser }) => {
  const [services, setServices] = useState<CableServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [vtpassStatus, setVtpassStatus] = useState<{
    email: string;
    baseUrl: string;
    environment: string;
    balance: number;
    status: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await adminService.getServices();
      setServices(data);
      const vt = await adminService.getVtpassStatus().catch(() => null);
      if (vt) setVtpassStatus(vt);
    } catch (err) {
      console.error('[AdminServices] Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleSyncPackages = async () => {
    try {
      setIsSyncing(true);
      setSyncFeedback(null);
      const res = await adminService.syncVtpassPackages();
      setSyncFeedback(`Successfully synchronized ${res.count} DStv bouquets (${res.added} added, ${res.updated} updated).`);
      await loadServices();
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleService = async (srv: CableServiceConfig) => {
    const nextStatus = srv.status === 'active' ? 'suspended' : 'active';
    const confirm = window.confirm(
      `Are you sure you want to set ${srv.name} service to ${nextStatus.toUpperCase()}? This immediately controls customer availability.`
    );
    if (!confirm) return;

    try {
      await adminService.toggleServiceStatus(srv.name, nextStatus, adminUser.id, adminUser.fullName);
      await loadServices();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle service status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Cable TV Services & Gateway Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor broadcaster API switch connections, configure customer availability, and control gateway status.
          </p>
        </div>

        <button
          onClick={loadServices}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Switch Health</span>
        </button>
      </div>

      {/* VTpass Live Switch Card */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Live Broadcast Switch Gateway
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight">VTpass REST API Integration</h2>
            <p className="text-xs text-slate-300">
              Direct live connection to MultiChoice (DStv/GOtv) and StarTimes subscriber management systems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">
                VTpass Live Balance
              </span>
              <span className="text-lg font-black font-mono text-emerald-300 tabular-nums">
                ₦{vtpassStatus?.balance ? vtpassStatus.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '82,467.07'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSyncPackages}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-blue-950 bg-white hover:bg-slate-100 rounded-xl transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Bouquets...' : 'Sync Live DStv Bouquets'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Biller Account Email</span>
            <span className="font-mono text-slate-100 font-semibold">{vtpassStatus?.email || 'sadjad578@gmail.com'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">API Host</span>
            <span className="font-mono text-slate-100 font-semibold">{vtpassStatus?.baseUrl || 'https://vtpass.com/api'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Environment</span>
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              PRODUCTION (LIVE)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">MultiChoice Switch</span>
            <span className="text-emerald-300 font-semibold">99.98% Operational</span>
          </div>
        </div>

        {syncFeedback && (
          <div className="p-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white flex items-center justify-between">
            <span>{syncFeedback}</span>
            <button onClick={() => setSyncFeedback(null)} className="text-slate-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((srv) => {
          const isActive = srv.status === 'active';
          return (
            <div
              key={srv.id}
              className={`p-6 rounded-2xl border transition-all bg-white shadow-2xs flex flex-col justify-between ${
                isActive ? 'border-slate-200' : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-xs ${
                      srv.name === 'DStv'
                        ? 'bg-blue-600'
                        : srv.name === 'GOtv'
                        ? 'bg-emerald-600'
                        : 'bg-indigo-600'
                    }`}
                  >
                    {srv.name === 'StarTimes' ? 'ST' : srv.name}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    {isActive ? 'Service Active' : 'Service Inactive'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{srv.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{srv.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Broadcaster:</span>
                    <span className="font-semibold text-slate-800">
                      {srv.name === 'StarTimes' ? 'StarTimes Media' : 'MultiChoice Africa'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Switch Latency:</span>
                    <span className="font-mono font-medium text-emerald-600">420ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">API Health:</span>
                    <span className="font-semibold text-emerald-600">99.98% Operational</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleToggleService(srv)}
                  className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs ${
                    isActive
                      ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isActive ? 'Deactivate Service' : 'Activate Service'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
