import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Calendar from '../components/Calendar';
import apiService from '../services/ApiService';
import DaftIcon from '../assets/daft.jpg';
import MyHomeIcon from '../assets/myhome.png';
import AcquaintIcon from '../assets/acquaint.jpg';
import WordpressIcon from '../assets/integrations/wordpress.png';

function Dashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [logs, setLogs] = useState<{ date: string; note: string }[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const feeds = [
    { name: 'Daft', icon: DaftIcon, status: 'Busy', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { name: 'MyHome', icon: MyHomeIcon, status: 'OK', color: 'bg-green-100 text-green-700 border-green-300' },
    { name: 'Acquaint', icon: AcquaintIcon, status: 'OK', color: 'bg-green-100 text-green-700 border-green-300' },
    { name: 'WordPress', icon: WordpressIcon, status: 'Not working', color: 'bg-red-100 text-red-700 border-red-300' },
  ];

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLogsLoading(true);
      try {
        const res = await apiService.getActivity(200);
        const list = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.value || [];
        const mapped = (list as any[])
          .map((item) => {
            const rawTs = item.finished_at || item.updated_at || item.created_at;
            const d = rawTs ? new Date(rawTs) : null;
            if (!d || isNaN(d.getTime())) return null;
            const date = d.toISOString().split('T')[0];
            const noteParts = [
              item.source ? `source: ${item.source}` : null,
              item.agency_name ? `agency: ${item.agency_name}` : null,
              item.status ? `status: ${item.status}` : null,
            ].filter(Boolean);
            const note = noteParts.join(' • ') || 'log entry';
            return { date, note };
          })
          .filter(Boolean) as { date: string; note: string }[];
        setLogs(mapped);
      } catch (err) {
        console.error('Failed to load logs', err);
      } finally {
        setIsLogsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const selectedLogs = useMemo(
    () => logs.filter((l: { date: string; note: string }) => l.date === selectedDate),
    [logs, selectedDate]
  );

  return (
    <div className="p-6 min-h-screen space-y-6">
      <div className="shadow-md bg-white dark:bg-gray-900 rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">API status</h2>
          <button
            type="button"
            className="px-3 py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700"
            onClick={() => navigate('/admin-overview')}
          >
            Open admin overview
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {feeds.map((feed) => (
            <div
              key={feed.name}
              className={`border rounded p-3 flex items-center gap-3 ${feed.color} bg-opacity-60`}
            >
              <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                <img src={feed.icon} alt={feed.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">{feed.name}</span>
                <span className="text-sm">Status: {feed.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="shadow-md bg-white dark:bg-gray-900 rounded p-6 space-y-4 flex flex-col lg:items-start lg:justify-start">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Property change calendar</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Quick view of uploads/changes per day. Click a date to see logs.
          </p>
          <div className="w-full max-w-[360px]">
            <Calendar
              year={year}
              month={month}
              highlightedDates={logs.map((l) => l.date)}
              onDayClick={(date) => setSelectedDate(date)}
            />
          </div>
          <div className="mt-3 space-y-2 w-full max-w-[360px]">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Logs {selectedDate ? `for ${selectedDate}` : '(select a date)'}
            </div>
            {isLogsLoading && (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading logs...</div>
            )}
            {selectedLogs.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No logs for this date.</div>
            )}
            {selectedLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200"
              >
                {log.note}
              </div>
            ))}
          </div>
        </div>
        <div className="shadow-md bg-white dark:bg-gray-900 rounded p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-300 mb-2">Admin view includes</h3>
          <ul className="list-disc ml-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <li>Pipeline dashboard (sources, schedules, toggles).</li>
            <li>Live monitor (current runs, countdown, statuses).</li>
            <li>In-time logs and error board with filters.</li>
            <li>AI orchestrators: statistics, comparing fetched properties vs. live web, anomalies.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
