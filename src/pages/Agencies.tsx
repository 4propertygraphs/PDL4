import { useState, useEffect } from 'react';
import AgencyModal from '../components/modals/AgencyModal';
import apiService from '../services/ApiService';
import { Agency } from '../interfaces/Models';
import { useNavigate } from 'react-router-dom';
import SearchBarModal from '../components/SearchBar'; // Import SearchBarModal
import { FaWordpress } from 'react-icons/fa';
import MyHomeIcon from '../assets/myhome.png';
import AcquaintIcon from '../assets/acquaint.jpg';
import DaftIcon from '../assets/daft.jpg';
import WordpressIcon from '../assets/integrations/wordpress.svg';
import { useRef } from 'react';

function Agencies() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]); // Add filtered agencies state
    const [searchText, setSearchText] = useState(''); // Add search text state
    const [connectorFilter, setConnectorFilter] = useState<string>('all');
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
    const [nextSyncAt, setNextSyncAt] = useState<number | null>(null);
    const [countdown, setCountdown] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [hideEmpty, setHideEmpty] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [modalStack, setModalStack] = useState<
        { type: 'agency' | 'agencyPipelines'; data?: any }[]
    >([]);
    const navigate = useNavigate();
    const syncTimerRef = useRef<number | undefined>(undefined);
    const tickTimerRef = useRef<number | undefined>(undefined);
    const nextSyncRef = useRef<number | null>(null);
    const SYNC_INTERVAL = 10 * 60 * 1000; // 10 minutes

    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                const cachedAgencies = localStorage.getItem('agencies');
                if (cachedAgencies) {
                    setAgencies(JSON.parse(cachedAgencies));
                    setFilteredAgencies(JSON.parse(cachedAgencies)); // Initialize filtered agencies
                    setIsLoading(false);
                } else {
                    const agenciesResponse = await apiService.getAgencies();
                    setAgencies(agenciesResponse.data);
                    setFilteredAgencies(agenciesResponse.data); // Initialize filtered agencies
                    localStorage.setItem('agencies', JSON.stringify(agenciesResponse.data));
                }
            } catch (error) {
                console.error('Error fetching agencies:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAgencies();
    }, []);

    useEffect(() => {
        const sync = () => setIsMobile(window.innerWidth < 768);
        sync();
        window.addEventListener('resize', sync);
        return () => window.removeEventListener('resize', sync);
    }, []);

    const matchesConnector = (agency: Agency) => {
        const hasAcquaint = Boolean(agency.fourpm_branch_id);
        const hasMyHome = Boolean(agency.myhome_api_key);
        const hasDaft = Boolean(agency.daft_api_key);
        const hasFindAHome =
            (agency.site_name && agency.site_name.toLowerCase().includes('find')) ||
            (agency.site_prefix && agency.site_prefix.toLowerCase().includes('find'));
        const hasWordPress =
            (agency.site_name && agency.site_name.toLowerCase().includes('wp')) ||
            (agency.site_prefix && agency.site_prefix.toLowerCase().includes('wp')) ||
            (agency.site_name && agency.site_name.toLowerCase().includes('word'));

        switch (connectorFilter) {
            case 'acquaint':
                return hasAcquaint;
            case 'myhome':
                return hasMyHome;
            case 'daft':
                return hasDaft;
            case 'findahome':
                return hasFindAHome;
            case 'wordpress':
                return hasWordPress;
            default:
                return true;
        }
    };

    const integrationIcons = (agency: Agency) => {
        const icons: { key: string; src?: string; title: string; IconComp?: React.ComponentType<any> }[] = [];
        if (agency.fourpm_branch_id) icons.push({ key: 'acquaint', src: AcquaintIcon, title: 'Acquaint' });
        if (agency.myhome_api_key) icons.push({ key: 'myhome', src: MyHomeIcon, title: 'MyHome' });
        if (agency.daft_api_key) icons.push({ key: 'daft', src: DaftIcon, title: 'Daft' });
        if ((agency as any).wordpress_endpoint || (agency.site_name && agency.site_name.toLowerCase().includes('wordpress')) || (agency.site_prefix && agency.site_prefix.toLowerCase().includes('wp'))) {
            icons.push({ key: 'wordpress', src: WordpressIcon, title: 'WordPress' });
        }
        if ((agency.site_name && agency.site_name.toLowerCase().includes('wp')) ||
            (agency.site_prefix && agency.site_prefix.toLowerCase().includes('wp')) ||
            (agency.site_name && agency.site_name.toLowerCase().includes('word'))) {
            icons.push({ key: 'wordpress', IconComp: FaWordpress, title: 'WordPress' });
        }
        return icons;
    };

    useEffect(() => {
        setFilteredAgencies(
            agencies.filter((agency) => {
                const nameMatch = agency.name.toLowerCase().includes(searchText.toLowerCase());
                if (!nameMatch) return false;
                if (!matchesConnector(agency)) return false;
                if (hideEmpty && (!agency || (agency as any).property_count === 0 || (agency as any).properties_count === 0 || (agency as any).total_properties === 0 || (agency as any).propertyCount === 0 || (agency as any).count === 0)) {
                    return false;
                }
                return true;
            })
        );
    }, [searchText, agencies, connectorFilter, hideEmpty]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value); // Update search text
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setConnectorFilter(e.target.value);
    };

    const formatCountdown = (ms: number) => {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const updateCountdown = () => {
        if (nextSyncRef.current) {
            const diff = nextSyncRef.current - Date.now();
            setCountdown(formatCountdown(diff));
        } else {
            setCountdown('');
        }
    };

    const startAutoSync = () => {
        setAutoSyncEnabled(true);
        refreshAgencies();
        const next = Date.now() + SYNC_INTERVAL;
        nextSyncRef.current = next;
        setNextSyncAt(next);

        syncTimerRef.current = window.setInterval(() => {
            refreshAgencies();
            const newNext = Date.now() + SYNC_INTERVAL;
            nextSyncRef.current = newNext;
            setNextSyncAt(newNext);
        }, SYNC_INTERVAL);

        tickTimerRef.current = window.setInterval(() => {
            updateCountdown();
        }, 1000);
    };

    const stopAutoSync = () => {
        setAutoSyncEnabled(false);
        setNextSyncAt(null);
        nextSyncRef.current = null;
        if (syncTimerRef.current) window.clearInterval(syncTimerRef.current);
        if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
        syncTimerRef.current = undefined;
        tickTimerRef.current = undefined;
        setCountdown('');
    };

    const toggleAutoSync = () => {
        if (autoSyncEnabled) {
            stopAutoSync();
        } else {
            startAutoSync();
        }
    };

    useEffect(() => {
        updateCountdown();
    }, [nextSyncAt]);

    useEffect(() => {
        return () => {
            stopAutoSync();
        };
    }, []);

    const refreshAgencies = async () => {
        setIsLoading(true);
        try {
            const agenciesResponse = await apiService.getAgencies();
            setAgencies(agenciesResponse.data);
            localStorage.setItem('agencies', JSON.stringify(agenciesResponse.data));
        } catch (error) {
            console.error('Error refreshing agencies:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (type: 'agency' | 'agencyPipelines', data?: any) => {
        setModalStack((prevStack) => [...prevStack, { type, data }]);
    };

    const closeModal = () => {
        setModalStack((prevStack) => prevStack.slice(0, -1));
    };

    const currentModal = modalStack[modalStack.length - 1];

    const handleAgencyClick = (agency: Agency) => {
        navigate(`/properties?key=${encodeURIComponent(agency.key)}`, { state: { agency } }); // Pass agency object in state
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <SearchBarModal
                searchText={searchText}
                onSearchChange={handleSearchChange}
                onRefresh={refreshAgencies} // Pass refresh function
                filterValue={connectorFilter}
                onFilterChange={handleFilterChange}
                autoSyncEnabled={autoSyncEnabled}
                onToggleAutoSync={toggleAutoSync}
                nextSyncLabel={autoSyncEnabled && countdown ? `Next sync in ${countdown}` : undefined}
                agency={null}
                title='Agencies'
                placeholder='Search agencies...'
                rightSlot={
                    <label className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={hideEmpty}
                            onChange={(e) => setHideEmpty(e.target.checked)}
                        />
                        Hide empty property list
                    </label>
                }
            />

            <div className="flex-1 overflow-hidden px-4 py-2">
                <div className="h-full overflow-y-auto overflow-x-hidden shadow-lg bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Loading agencies...</p>
                        </div>
                    ) : (
                        <div className="p-4 h-full">
                            <div className={isMobile ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'}>
                                {filteredAgencies.map((agency: Agency) => (
                                    <div
                                        key={agency.id}
                                        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-xl rounded-xl p-5 cursor-pointer transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-1"
                                        onClick={() => handleAgencyClick(agency)}
                                    >
                                        <div className="flex justify-between items-start gap-2 mb-3">
                                            <div className="flex-1">
                                                <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight mb-1">{agency.name}</h2>
                                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{agency.address}</p>
                                            </div>
                                            <button
                                                className="text-blue-600 dark:text-blue-400 cursor-pointer font-semibold text-xs md:text-sm hover:underline flex-shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openModal('agency', agency);
                                                }}
                                            >
                                                Details
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 flex-wrap pt-3 border-t border-gray-200 dark:border-gray-700">
                                            {integrationIcons(agency).map((item) =>
                                                item.src ? (
                                                    <span
                                                        key={item.key}
                                                        className="h-10 w-10 flex items-center justify-center rounded-lg border-2 border-blue-100 dark:border-blue-900/30 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                                                        title={item.title}
                                                    >
                                                        <img
                                                            src={item.src}
                                                            alt={item.title}
                                                            className="h-6 w-6 object-contain"
                                                        />
                                                    </span>
                                                ) : item.IconComp ? (
                                                    <span
                                                        key={item.key}
                                                        className="h-10 w-10 flex items-center justify-center rounded-lg border-2 border-blue-100 dark:border-blue-900/30 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                                                        title={item.title}
                                                    >
                                                        <item.IconComp className="text-blue-600 dark:text-blue-400 text-xl" />
                                                    </span>
                                                ) : null
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {currentModal?.type === 'agency' && currentModal.data && (
                <AgencyModal
                    show={currentModal?.type === 'agency'}
                    agency={currentModal.data}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

export default Agencies;
