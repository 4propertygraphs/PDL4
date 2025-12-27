import React from 'react';
import { FaSearch, FaSyncAlt } from "react-icons/fa"; // Import refresh icon

interface SearchBarModalProps {
    searchText: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRefresh?: () => void; // Make onRefresh optional
    filterValue?: string;
    onFilterChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    autoSyncEnabled?: boolean;
    onToggleAutoSync?: () => void;
    nextSyncLabel?: string;
    agency?: any; // Make optional
    title?: string; // Optional title prop
    placeholder?: string; // Optional placeholder prop
    rightSlot?: React.ReactNode; // Optional right aligned content
}

const SearchBarModal: React.FC<SearchBarModalProps> = ({
    searchText,
    onSearchChange,
    onRefresh,
    filterValue,
    onFilterChange,
    autoSyncEnabled,
    onToggleAutoSync,
    nextSyncLabel,
    placeholder,
    title, // Destructure onRefresh
    rightSlot,
}) => {
    return (
        <>
            <div className="w-full px-4 py-3">
                <div className="shadow-lg w-full bg-white dark:bg-gray-900 dark:text-gray-300 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {title}
                        </h1>
                        <div className="flex items-center gap-2 flex-wrap">
                            {onFilterChange && (
                                <select
                                    className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={filterValue}
                                    onChange={onFilterChange}
                                    title="Filter by connector"
                                >
                                    <option value="all">All Connectors</option>
                                    <option value="acquaint">Acquaint</option>
                                    <option value="myhome">MyHome</option>
                                    <option value="daft">Daft</option>
                                    <option value="findahome">FindAHome</option>
                                    <option value="wordpress">WordPress</option>
                                </select>
                            )}
                            {onToggleAutoSync && (
                                <button
                                    className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all ${
                                        autoSyncEnabled
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'border-gray-300 text-gray-700 hover:border-blue-500 dark:border-gray-700 dark:text-gray-300'
                                    }`}
                                    onClick={onToggleAutoSync}
                                    title="Start/Stop auto sync"
                                >
                                    {autoSyncEnabled ? 'Auto sync: ON' : 'Auto sync: OFF'}
                                </button>
                            )}
                            {nextSyncLabel && (
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 px-2">{nextSyncLabel}</span>
                            )}
                            {onRefresh && (
                                <button
                                    className="p-2.5 text-gray-700 dark:text-gray-300 transition-all cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                    onClick={onRefresh}
                                    title="Refresh"
                                >
                                    <FaSyncAlt className="text-lg" />
                                </button>
                            )}
                            {rightSlot}
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 py-2">
                <div className="flex items-center relative">
                    <input
                        id="search"
                        type="text"
                        className="shadow-lg w-full bg-white dark:bg-gray-900 dark:text-gray-300 p-4 pl-12 rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder={placeholder}
                        value={searchText}
                        onChange={onSearchChange}
                    />
                    <span className="absolute left-4 text-gray-400 dark:text-gray-500">
                        <FaSearch />
                    </span>
                </div>
            </div>
        </>
    );
};

export default SearchBarModal;
