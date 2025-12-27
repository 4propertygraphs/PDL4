import React from 'react';

interface Column<T> {
    key: keyof T;
    label: string;
    sortable?: boolean;
    className?: string; // optional responsive classes
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyField: keyof T; // Field to uniquely identify each row
    onRowClick?: (item: T) => void;
    selectedItems?: T[keyof T][]; // Array of selected item keys
    onSelectItem?: (id: T[keyof T]) => void;
    onSelectAll?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading?: boolean; // Add isLoading prop
    sortKey?: keyof T | null;
    sortDir?: 'asc' | 'desc';
    onHeaderClick?: (key: keyof T) => void;
}

const Table = <T,>({
    columns,
    data = [],
    keyField,
    onRowClick,
    selectedItems = [],
    onSelectItem,
    onSelectAll,
    isLoading = false, // Default to false
    sortKey = null,
    sortDir = 'asc',
    onHeaderClick,
}: TableProps<T>) => {
    const renderArrow = (active: boolean, dir: 'asc' | 'desc') => {
        if (!active) return '';
        return dir === 'asc' ? '↑' : '↓';
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full table-auto min-w-[720px]">
                <thead className="text-gray-600 dark:text-gray-300 text-xs md:text-sm leading-normal bg-purple-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                        {onSelectAll && (
                            <th className="py-3 px-4 text-left">
                                <input
                                    id="checkbox_all"
                                    className="w-4 h-4"
                                    type="checkbox"
                                    onChange={onSelectAll}
                                    checked={selectedItems.length === data.length && data.length > 0}
                                />
                            </th>
                        )}
                        {columns.map((column) => {
                            const isActive = sortKey === column.key;
                            const arrow = renderArrow(isActive, sortDir);
                            return (
                                <th key={String(column.key)} className={`py-3 px-4 md:px-6 text-left ${column.className || ''}`}>
                                    {column.sortable ? (
                                        <button
                                            type="button"
                                            className="flex items-center gap-1"
                                            onClick={() => onHeaderClick && onHeaderClick(column.key)}
                                        >
                                            <span>{column.label}</span>
                                            <span className="text-xs">{arrow}</span>
                                        </button>
                                    ) : (
                                        column.label
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300 text-xs md:text-sm font-medium cursor-pointer">
                    {isLoading ? (
                        <tr>
                            <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="py-3 px-6">
                                <div className="animate-pulse">
                                    {Array.from({ length: 10 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="h-10 bg-gray-300 dark:bg-gray-700 rounded mb-2"
                                            style={{ width: '100%' }}
                                        ></div>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ) : (!Array.isArray(data) || data.length === 0) ? (
                        <tr>
                            <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="py-3 px-6 text-center">
                                <div className="h-10 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    No data available.
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => {
                            const rawKey = (item as any)?.[keyField as string];
                            const rowKey = rawKey ?? index; // fallback to index to avoid missing keys
                            return (
                                <tr
                                    key={String(rowKey)}
                                    className="border-b border-gray-200 dark:border-gray-700"
                                    onClick={() => onRowClick && onRowClick(item)}
                                >
                                    {onSelectItem && (
                                        <td className="py-3 px-4 text-left">
                                            <input
                                                id={`checkbox_${String(rowKey)}`}
                                                className="w-4 h-4"
                                                type="checkbox"
                                                checked={selectedItems.includes(rowKey)}
                                                onChange={() => onSelectItem(rowKey)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                    )}

                                    {columns.map((column) => {
                                        const cellValue = (item as any)?.[column.key as string];
                                        if (React.isValidElement(cellValue)) {
                                            return (
                                                <td key={String(column.key)} className={`py-3 px-4 md:px-6 text-left whitespace-normal break-words ${column.className || ''}`}>
                                                    {cellValue}
                                                </td>
                                            );
                                        }
                                        const formatValue = (value: any) => {
                                            if (value === null || value === undefined) return '';
                                            if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                                            if (typeof value === 'number') return value === 0 ? '' : value;
                                            if (typeof value === 'object') return JSON.stringify(value);
                                            if (typeof value === 'string') {
                                                const trimmed = value.trim();
                                                return trimmed === '0' ? '' : trimmed;
                                            }
                                            return value;
                                        };
                                        const displayValue = formatValue(cellValue);
                                        return (
                                            <td key={String(column.key)} className={`py-3 px-4 md:px-6 text-left whitespace-normal break-words ${column.className || ''}`}>
                                                {column.key === 'Price' && typeof cellValue === 'number'
                                                    ? `€${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cellValue)}`
                                                    : displayValue}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
