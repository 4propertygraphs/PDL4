import { useEffect, useMemo, useState } from 'react';
import apiService from '../services/ApiService';
import { Agency } from '../interfaces/Models';

type ActivityItem = {
  id?: number | string;
  source?: string;
  agency_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  finished_at?: string;
};

const stageNames = ['Source', 'Ingest', 'AI Orchestrator', 'Normalizer', 'DB', 'API'] as const;
type Stage = (typeof stageNames)[number];

const statusColor = (status: string) => {
  if (status === 'healthy') return 'from-green-400 via-emerald-500 to-green-600';
  if (status === 'warning') return 'from-amber-300 via-amber-400 to-amber-500';
  return 'from-red-400 via-rose-500 to-red-600';
};

export default function AdminOverview() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [agency, setAgency] = useState('');
  const [agencyKey, setAgencyKey] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [compareResult, setCompareResult] = useState<string>('');
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [propsLoading, setPropsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareDelta, setCompareDelta] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await apiService.getActivity(100);
        const list = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.value || [];
        setActivity(list as ActivityItem[]);
      } catch (e) {
        console.error('activity fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const cached = localStorage.getItem('agencies');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setAgencies(parsed);
            }
          } catch {
            // ignore cache parse error
          }
        }
        const res = await apiService.getAgencies();
        const payload = res.data || [];
        const list = Array.isArray(payload)
          ? payload
          : payload.items || payload.value || payload.results || [];
        setAgencies(list);
        if (Array.isArray(list)) {
          localStorage.setItem('agencies', JSON.stringify(list));
        }
      } catch (e) {
        console.error('agencies fetch failed', e);
        setAgencies([]);
      }
    };
    fetchAgencies();
  }, []);

  useEffect(() => {
    const fetchProps = async () => {
      if (!agencyKey) {
        setProperties([]);
        return;
      }
      setPropsLoading(true);
      try {
        const res = await apiService.getProperties(agencyKey);
        const items = res.data || [];
        setProperties(items);
      } catch (e) {
        console.error('properties fetch failed', e);
        setProperties([]);
      } finally {
        setPropsLoading(false);
      }
    };
    fetchProps();
  }, [agencyKey]);

  const stageStatuses: Record<Stage, 'healthy' | 'warning' | 'down'> = useMemo(() => {
    const hasError = activity.some((a) => String(a.status || '').toLowerCase().includes('fail'));
    const hasRunning = activity.some((a) => String(a.status || '').toLowerCase().includes('progress'));
    return {
      Source: hasError ? 'warning' : 'healthy',
      Ingest: hasError ? 'warning' : 'healthy',
      'AI Orchestrator': hasError ? 'warning' : 'healthy',
      Normalizer: hasError ? 'warning' : 'healthy',
      DB: hasError ? 'warning' : 'healthy',
      API: hasRunning ? 'warning' : hasError ? 'down' : 'healthy',
    };
  }, [activity]);

  const normalizeProp = (p: any) => {
    if (!p) return {};
    return {
      id: p.id ?? p.uniquereferencenumber ?? '',
      price: p.priceText || p.price || p.house_price || '',
      status: p.statusText || p.status || p.house_extra_info_3 || '',
      address: p.addressText || p.displayaddress || p.house_location || '',
    };
  };

  const handleCompare = async () => {
    if (!agencyKey || !propertyId) {
      setCompareResult('Please select agency and property.');
      return;
    }
    setIsComparing(true);
    setCompareResult(`Comparing property ${propertyId} for ${agency || agencyKey} against live web data...`);
    setCompareDelta([]);
    try {
      const selected = properties.find((p) => String(p.id ?? p.uniquereferencenumber ?? '') === String(propertyId));
      const localNorm = normalizeProp(selected);
      const liveRes = await apiService.getLiveProperties(agencyKey);
      const liveItems = liveRes.data?.items || liveRes.data || [];
      const liveMatch = liveItems.find((p: any) => String(p.id ?? p.uniquereferencenumber ?? '') === String(propertyId));
      const webNorm = normalizeProp(liveMatch);

      if (!selected) {
        setCompareResult('Selected property not found in local feed.');
        return;
      }
      if (!liveMatch) {
        setCompareResult('Property not found in live web feed for this agency.');
        return;
      }

      const deltas: string[] = [];
      if (localNorm.price !== webNorm.price) deltas.push(`Price local: "${localNorm.price}" vs web: "${webNorm.price}"`);
      if (localNorm.status !== webNorm.status) deltas.push(`Status local: "${localNorm.status}" vs web: "${webNorm.status}"`);
      if (localNorm.address !== webNorm.address) deltas.push(`Address local: "${localNorm.address}" vs web: "${webNorm.address}"`);

      setCompareDelta(deltas);
      setCompareResult(deltas.length === 0 ? 'No delta detected. Data matches web.' : 'Delta detected:');
    } catch (e: any) {
      console.error('compare failed', e);
      setCompareResult(`Compare failed: ${e?.message || 'unknown error'}`);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Admin overview</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Live pipeline schema with status colors and AI orchestrator to compare app data vs. web (delta).
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <style>{`
          @keyframes flowPulse {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes flowDot {
            0% { transform: translateX(0); opacity: 0.2; }
            50% { transform: translateX(10px); opacity: 1; }
            100% { transform: translateX(0); opacity: 0.2; }
          }
        `}</style>
        <div className="min-w-[720px] flex items-center gap-4 p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {stageNames.map((stage, idx) => {
            const st = stageStatuses[stage];
            const gradient = statusColor(st);
            return (
              <div key={stage} className="flex items-center gap-3">
                <div
                  className={`px-4 py-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-white bg-gradient-to-r ${gradient}`}
                  style={{
                    backgroundSize: '200% 200%',
                    animation: 'flowPulse 4s linear infinite',
                  }}
                >
                  <div className="text-xs font-semibold">{stage}</div>
                  <div className="text-[11px] opacity-90">{st === 'healthy' ? 'Running' : st === 'warning' ? 'Busy' : 'Down'}</div>
                </div>
                {idx < stageNames.length - 1 && (
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-14 bg-gradient-to-r from-green-200 via-green-400 to-green-200 rounded-full animate-pulse" />
                    <div className="h-1 w-4 bg-green-500 rounded-full" style={{ animation: 'flowDot 1.6s ease-in-out infinite' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">AI orchestrator compare</div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">Select agency and property ID; orchestrator will fetch web data and compute delta.</p>
          <div className="space-y-2">
            <select
              value={agencyKey}
              onChange={(e) => {
                const key = e.target.value;
                setAgencyKey(key);
                const found = agencies.find((a) => a.key === key);
                setAgency(found?.name || key);
                setPropertyId('');
              }}
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">Select agency</option>
              {agencies.length === 0 && <option value="" disabled>(No agencies found)</option>}
              {agencies.map((a) => (
                <option key={a.id ?? a.key} value={a.key}>
                  {a.name}
                </option>
              ))}
            </select>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              disabled={!agencyKey || propsLoading}
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">{propsLoading ? 'Loading properties…' : 'Select property'}</option>
              {properties.map((p, idx) => (
                <option key={p.id ?? idx} value={p.id ?? idx}>
                  {p.id ?? idx} — {p.addressText || p.displayaddress || p.house_location || 'Property'}
                </option>
              ))}
            </select>
            <button
              onClick={handleCompare}
              className="w-full bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 text-sm disabled:opacity-60"
              disabled={isComparing}
            >
              {isComparing ? 'Comparing...' : 'Compare vs web'}
            </button>
            {compareResult && <div className="text-xs text-gray-700 dark:text-gray-300">{compareResult}</div>}
            {compareDelta.length > 0 && (
              <ul className="list-disc ml-5 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                {compareDelta.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="p-4 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Live log snapshot</div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Recent activity (source/agency/status).</p>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {loading && <div className="text-xs text-gray-500">Loading logs...</div>}
            {!loading && activity.slice(0, 8).map((a, i) => (
              <div key={a.id ?? i} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-200">
                <div className="font-semibold">{a.source || 'source ?'}</div>
                <div className="text-gray-500 dark:text-gray-400">{a.agency_name || 'agency ?'}</div>
                <div className="text-[11px]">{a.status || 'status ?'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
