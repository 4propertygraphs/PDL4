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
            <div className="w-full px-4 py-2">
                <div className="shadow-md w-full bg-white dark:bg-gray-900 dark:text-gray-300 p-4 rounded">
                    <div className="flex justify-between items-center">
                        <h1 className="text-lg font-medium">
                            {title}
                        </h1>
                        <div className="flex items-center gap-2">
                            {onFilterChange && (
                                <select
                                    className="border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    value={filterValue}
                                    onChange={onFilterChange}
                                    title="Filter by connector"
                                >
                                    <option value="all">All</option>
                                    <option value="acquaint">Acquaint</option>
                                    <option value="myhome">MyHome</option>
                                    <option value="daft">Daft</option>
                                    <option value="findahome">FindAHome</option>
                                    <option value="wordpress">WordPress</option>
                                </select>
                            )}
                            {onToggleAutoSync && (
                                <button
                                    className={`px-3 py-2 text-sm rounded border ${autoSyncEnabled ? 'border-purple-500 text-purple-600' : 'border-gray-300 text-gray-700'} hover:border-purple-500`}
                                    onClick={onToggleAutoSync}
                                    title="Start/Stop auto sync"
                                >
                                    {autoSyncEnabled ? 'Auto sync: ON' : 'Auto sync: OFF'}
                                </button>
                            )}
                            {nextSyncLabel && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">{nextSyncLabel}</span>
                            )}
                            {onRefresh && ( // Conditionally render refresh button
                                <button
                                    className="p-2 text-black dark:text-gray-300 transition-colors cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                    onClick={onRefresh}
                                    title="Refresh Agencies"
                                >
                                    <FaSyncAlt className="text-xl" />
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
                        className="shadow-md w-full bg-white dark:bg-gray-900 dark:text-gray-300 p-4 pl-12 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder={placeholder} // Updated placeholder
                        value={searchText}
                        onChange={onSearchChange}
                    />
                    <span className="absolute left-4 text-gray-500 dark:text-gray-300">
                        <FaSearch />
                    </span>
                </div>
            </div>
        </>
    );
};

export default SearchBarModal;
