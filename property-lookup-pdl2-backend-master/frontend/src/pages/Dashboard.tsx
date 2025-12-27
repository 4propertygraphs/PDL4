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
      <div className="shadow-lg bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">API Status</h2>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => navigate('/admin-overview')}
          >
            Open Admin Overview
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {feeds.map((feed) => (
            <div
              key={feed.name}
              className={`border-2 rounded-xl p-4 flex items-center gap-3 ${feed.color} transition-all duration-200 hover:shadow-md`}
            >
              <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 overflow-hidden flex items-center justify-center shadow-sm">
                <img src={feed.icon} alt={feed.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base">{feed.name}</span>
                <span className="text-sm font-medium">Status: {feed.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="shadow-lg bg-white dark:bg-gray-900 rounded-xl p-6 space-y-4 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Property Change Calendar</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quick view of uploads and changes per day. Click a date to see detailed logs.
          </p>
          <div className="w-full max-w-[360px]">
            <Calendar
              year={year}
              month={month}
              highlightedDates={logs.map((l) => l.date)}
              onDayClick={(date) => setSelectedDate(date)}
            />
          </div>
          <div className="mt-4 space-y-3 w-full max-w-[360px]">
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Logs {selectedDate ? `for ${selectedDate}` : '(select a date)'}
            </div>
            {isLogsLoading && (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading logs...</div>
            )}
            {!isLogsLoading && selectedLogs.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No logs for this date.</div>
            )}
            {selectedLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 text-sm text-gray-700 dark:text-gray-300"
              >
                {log.note}
              </div>
            ))}
          </div>
        </div>
        <div className="shadow-lg bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Admin View Features</h3>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
              <span>Pipeline dashboard with sources, schedules, and toggles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
              <span>Live monitor showing current runs, countdown, and statuses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
              <span>Real-time logs and error board with advanced filters</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
              <span>AI orchestrators: statistics, property comparison vs. live web, anomaly detection</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
