import React, { useEffect, useState } from 'react';
import Modal from '../Modal';
import apiService from '../../services/ApiService';

interface PropertyDetailsModalProps {
    show: boolean;
    property: any | null;
    onClose: () => void;
    onLogDetailsClick: (logId: string) => void;
    isLogModalOpen: boolean;
    selectedLog: string | null;
    closeLogModal: () => void;
    apiKey: string | null; // MyHome API key
    acquiantKey: string | null; // AcquiantCustomer key
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
    show,
    property,
    onClose,
    apiKey,
    acquiantKey,
}) => {
    const [additionalInfo, setAdditionalInfo] = useState<any | null>('Loading...');
    const [acquaintInfo, setAcquaintInfo] = useState<any | null>('Loading...');
    const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({});
    const toggleImage = (id: string) =>
        setExpandedImages((prev) => ({ ...prev, [id]: !prev[id] }));
    const formatDateValue = (val: any): string => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        const num = Number(str);
        if (!isNaN(num) && num > 0) {
            const ts = num > 1e12 ? num : num * 1000;
            const d = new Date(ts);
            if (!isNaN(d.getTime())) {
                const iso = d.toISOString();
                const date = iso.split('T')[0];
                const time = iso.split('T')[1].replace('Z', '').slice(0, 5);
                return time !== '00:00' ? `${date} ${time}` : date;
            }
        }
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            const [datePart, timePartRaw] = str.split(/[T\s]/);
            const timePart = (timePartRaw || '').slice(0, 5);
            return timePart ? `${datePart} ${timePart}` : datePart;
        }
        const parsed = Date.parse(str);
        if (!isNaN(parsed)) {
            const iso = new Date(parsed).toISOString();
            const date = iso.split('T')[0];
            const time = iso.split('T')[1].replace('Z', '').slice(0, 5);
            return time !== '00:00' ? `${date} ${time}` : date;
        }
        return str;
    };

    const cleanString = (text: string) => {
        const withNewlines = text
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<p[^>]*>/gi, '');
        const stripped = withNewlines.replace(/<[^>]+>/g, '');
        return stripped.trim();
    };

    const renderTextLines = (text: string) => {
        const lines = cleanString(text).split(/\n+/);
        return (
            <div className="whitespace-pre-wrap break-words text-xs">
                {lines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                ))}
            </div>
        );
    };

    const toImageUrls = (value: any): string[] => {
        const normalize = (v: string) => {
            let url = v.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            if (!url) return '';
            const lower = url.toLowerCase();
            if (lower.includes('thumbnail') || lower.includes('ipad')) return '';
            if (url.startsWith('//')) url = 'https:' + url;
            if (!/^https?:\/\//i.test(url)) return '';
            return url;
        };
        const cleanList = (arr: any[]) =>
            arr
                .filter((v) => typeof v === 'string')
                .map(normalize)
                .filter((v) => v.length > 0);

        if (!value) return [];
        if (Array.isArray(value)) return cleanList(value);

        if (typeof value === 'string') {
            // try JSON array
            const trimmed = value.trim();
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) return cleanList(parsed);
                    if (typeof parsed === 'object') return cleanList(Object.values(parsed));
                } catch {
                    // fall through to CSV parsing
                }
            }
            // CSV or space separated
            return cleanList(trimmed.split(/,|\s+/));
        }

        if (typeof value === 'object') {
            return cleanList(Object.values(value));
        }
        return [];
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (property?.ListReff) {
                    if (apiKey) {
                        try {
                            const myhome = await apiService.getMyHome(apiKey, property.ListReff);
                            setAdditionalInfo(myhome.data.Property);
                        } catch (error: any) {
                            if (error.response?.data?.message) {
                                setAdditionalInfo({ message: error.response.data.message });
                            } else {
                                setAdditionalInfo({ message: 'Failed to fetch MyHome data.' });
                            }
                        }
                    } else {
                        setAdditionalInfo({ message: 'MyHome API key is missing.' });
                    }

                    if (acquiantKey) {
                        try {
                            const acquaint = await apiService.GetAcquaint(acquiantKey, property.ListReff);
                            setAcquaintInfo(acquaint.data);
                        } catch (error: any) {
                            if (error.response?.data?.error) {
                                setAcquaintInfo({ message: error.response.data.error });
                            } else {
                                setAcquaintInfo({ message: error.response.data.message });
                            }
                        }
                    } else {
                        setAcquaintInfo({ message: 'Acquaint API key is missing.' });
                    }
                }
            } catch (error) {
                console.error('Error fetching property info:', error);
            }
        };

        fetchData();
    }, [property, apiKey, acquiantKey]);

    if (!property) return null;

    const CollapsibleText: React.FC<{ text: string }> = ({ text }) => {
        const [isCollapsed, setIsCollapsed] = useState(true);
        const maxLength = 100;

        const cleaned = cleanString(text);

        if (cleaned.length <= maxLength) return renderTextLines(cleaned);

        return (
            <div className="break-words text-xs">
                {isCollapsed ? `${cleaned.slice(0, maxLength)}...` : cleaned}
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-blue-500 ml-2 underline text-xs">
                    {isCollapsed ? 'Show more' : 'Show less'}
                </button>
            </div>
        );
    };

    const formatLabel = (key: string) => {
        const map: Record<string, string> = {
            house_location: 'Location',
            displayaddress: 'Address',
            addressText: 'Address',
            house_price: 'Price',
            priceText: 'Price',
            pricefrequency: 'Price Frequency',
            house_extra_info_1: 'Type',
            house_extra_info_2: 'Notes',
            house_extra_info_3: 'Status',
            house_extra_info_4: 'Info',
            house_bedrooms: 'Bedrooms',
            house_bathrooms: 'Bathrooms',
            house_mt_squared: 'Area (m²)',
            floorarea: 'Area (m²)',
            updateddate: 'Updated',
            addeddate: 'Added',
            agency_agent_name: 'Agent',
            username: 'Agent',
            useremail: 'Agent email',
            ber_rating: 'BER rating',
            ber_code: 'BER code',
            ber_epi: 'BER EPI',
            ber: 'BER',
            description: 'Description',
            descriptionfull: 'Description',
            descriptionbrief: 'Description',
        };
        const cleaned = key.replace(/_/g, ' ');
        const pretty = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        return map[key] || pretty;
    };

    const shouldSkip = (value: any) => {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (typeof value === 'number' && value === 0) return true;
        if (typeof value === 'object' && !Array.isArray(value)) {
            const keys = Object.keys(value);
            if (keys.length === 0) return true;
            if (keys.length === 1 && value['#text'] !== undefined) {
                const t = String(value['#text']).trim();
                return t === '';
            }
        }
        return false;
    };

    const fieldMappings: { label: string; paths: string[]; isImages?: boolean }[] = [
        { label: 'Address', paths: ['address', 'house_location', 'displayaddress', 'addressText', 'seoFriendlyPath', 'post_title'] },
        { label: 'Price', paths: ['price', 'house_price', 'priceText', 'price.amount', 'meta_price'] },
        { label: 'Bedrooms', paths: ['beds', 'house_bedrooms', 'bedrooms', 'numBedrooms', 'meta_bedrooms'] },
        { label: 'Bathrooms', paths: ['baths', 'house_bathrooms', 'bathrooms', 'numBathrooms', 'meta_bathrooms'] },
        { label: 'Property Type', paths: ['type', 'house_extra_info_1', 'propertyType', 'meta_property_type'] },
        { label: 'Description', paths: ['description', 'descriptionfull', 'sections.0.content', 'post_content'] },
        { label: 'BER Rating', paths: ['ber', 'ber.rating', 'ber_rating', 'meta_ber_rating'] },
        { label: 'Floor Area', paths: ['size', 'house_mt_squared', 'floorarea', 'floorArea.value', 'meta_floor_area'] },
        { label: 'Status', paths: ['status', 'house_extra_info_3', 'state', 'post_status'] },
        { label: 'Date Uploaded', paths: ['createdDate', 'createddate', 'created', 'post_date', 'addeddate'] },
        { label: 'Date Updated', paths: ['lastUpdateDate', 'lastupdatedate', 'post_modified', 'updateddate', 'ModifiedOnDate'] },
        { label: 'Created', paths: ['created', 'createdDate', 'post_date'] },
        { label: 'Latitude', paths: ['latitude', 'point.coordinates.1', 'meta_lat'] },
        { label: 'Longitude', paths: ['longitude', 'point.coordinates.0', 'meta_lng'] },
        { label: 'Pictures', paths: ['photoUrls', 'images', 'Pictures', 'Photos', 'Photo', 'MainPhoto', 'MainPhotoWeb', 'media.images', 'mediaImages', 'meta_images', 'pictures', 'picturethumbnails'], isImages: true },
        { label: 'Agent Name', paths: ['agent_name', 'agency_agent_name', 'seller.name', 'agent', 'meta_agent_name'] },
        { label: 'Agent Email', paths: ['agent_email', 'seller.email', 'meta_agent_email'] },
        { label: 'Agent Phone', paths: ['agent_phone', 'seller.phone', 'meta_agent_phone'] },
    ];

    const getByPath = (obj: any, path: string): any => {
        if (!obj) return undefined;
        const parts = path.split('.');
        let cur: any = obj;
        for (const p of parts) {
            if (cur === null || cur === undefined) return undefined;
            if (Array.isArray(cur)) {
                const idx = Number(p);
                if (Number.isInteger(idx) && idx < cur.length) {
                    cur = cur[idx];
                } else {
                    return undefined;
                }
            } else {
                cur = (cur as any)[p];
            }
        }
        return cur;
    };

    const findFirstValue = (obj: any, paths: string[]) => {
        for (const p of paths) {
            const v = getByPath(obj, p);
            if (!shouldSkip(v)) return v;
        }
        return undefined;
    };

    const summaryValueToString = (val: any): string => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return cleanString(val);
        if (typeof val === 'number') return String(val);
        if (Array.isArray(val)) {
            return val.map((v) => summaryValueToString(v)).filter(Boolean).join(', ');
        }
        if (typeof val === 'object') {
            if (val['#text']) return cleanString(String(val['#text']));
            return '';
        }
        return String(val);
    };

    const parseDescriptionSections = (text: string) => {
        const normalized = cleanString(text);
        const sectionRegex = /(ACCOMMODATION|GROUND FLOOR|FIRST FLOOR|SECOND FLOOR|OUTSIDE|SITE AREA|DIRECTIONS)/gi;
        const parts: Record<string, string> = {};

        let lastIndex = 0;
        let lastTitle = 'Description';
        let match;
        while ((match = sectionRegex.exec(normalized)) !== null) {
            const title = match[1].toUpperCase();
            const segment = normalized.slice(lastIndex, match.index).trim();
            if (segment) parts[lastTitle] = segment;
            lastTitle = title;
            lastIndex = match.index + match[0].length;
        }
        const tail = normalized.slice(lastIndex).trim();
        if (tail) parts[lastTitle] = tail;

        const standardOrder = ['Description', 'ACCOMMODATION', 'GROUND FLOOR', 'FIRST FLOOR', 'SECOND FLOOR', 'OUTSIDE', 'SITE AREA', 'DIRECTIONS'];
        const ordered = standardOrder.map((title) => ({
            title,
            value: parts[title] || '',
        }));
        return ordered;
    };

    const renderDescription = (text: string) => {
        const sections = parseDescriptionSections(text);
        const hasAny = sections.some((s) => s.value);
        if (!hasAny) return <CollapsibleText text={text} />;
        return (
            <div className="flex flex-col gap-2 text-xs">
                {sections.map((section) => (
                    <div key={section.title} className="border-b border-gray-200 dark:border-gray-700 pb-1">
                        {section.title !== 'Description' && <div className="font-semibold mb-1">{section.title}</div>}
                        <div className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-200">
                            {section.value ? section.value : <span className="text-gray-400">-</span>}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderData = (data: any, compareTo?: any, diffClass?: string) => {
        if (typeof data === 'string') {
            return <CollapsibleText text={data} />;
        } else if (typeof data === 'object' && data !== null) {
            if (Object.keys(data).length === 1 && data['#text']) {
                return renderTextLines(String(data['#text']));
            }

            const renderedFields = fieldMappings.map((field) => {
                const value = findFirstValue(data, field.paths);
                if (shouldSkip(value)) return null;
                const compareValue = compareTo ? findFirstValue(compareTo, field.paths) : undefined;
                const normalizeNum = (v: any) => {
                    if (typeof v === 'number') return v;
                    if (typeof v === 'string') {
                        const cleaned = v.replace(/[^\d.-]/g, '');
                        if (!cleaned) return NaN;
                        const num = Number(cleaned);
                        return Number.isFinite(num) ? num : NaN;
                    }
                    return NaN;
                };

                const valNum = normalizeNum(value);
                const cmpNum = normalizeNum(compareValue);
                const numericEqual = Number.isFinite(valNum) && Number.isFinite(cmpNum) && valNum === cmpNum;

                const isDifferent =
                    !numericEqual &&
                    typeof value === 'string' &&
                    typeof compareValue === 'string' &&
                    value.trim() !== compareValue.trim();

                if (field.isImages) {
                    const urls = toImageUrls(value);
                    if (!urls.length) return null;
                    const uploadedAt =
                        data?.updatedText ||
                        data?.ModifiedOnDate ||
                        data?.updateddate ||
                        data?.addeddate ||
                        'n/a';
                    return (
                        <div key={field.label} className="flex flex-col border-b border-gray-200 dark:border-gray-700 pb-1">
                            <div className="font-medium break-words">{field.label}</div>
                            <div className="flex flex-wrap gap-2">
                                {urls.map((u, idx) => {
                                    const id = `${field.label}-${idx}`;
                                    const expanded = expandedImages[id] || false;
                                    return (
                                        <div key={id} className="flex flex-col items-center gap-1">
                                            <img
                                                src={u}
                                                alt={field.label}
                                                onClick={() => toggleImage(id)}
                                                className="rounded border cursor-zoom-in"
                                                style={{
                                                    width: expanded ? '220px' : '90px',
                                                    height: expanded ? '150px' : '60px',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                                Updated: {uploadedAt}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }

                if (typeof value === 'string' && field.label === 'Description') {
                    return (
                        <div key={field.label} className="flex flex-col border-b border-gray-200 dark:border-gray-700 pb-1">
                            <div className="font-medium break-words">{field.label}</div>
                            {renderDescription(value)}
                        </div>
                    );
                }

                const lowerKey = field.label.toLowerCase();
                if (typeof value === 'string' && (lowerKey.includes('date') || lowerKey.includes('modified') || lowerKey.includes('created'))) {
                    return (
                        <div key={field.label} className="flex flex-col border-b border-gray-200 dark:border-gray-700 pb-1">
                            <div className="font-medium break-words">{field.label}</div>
                            <div className="text-right break-words">{formatDateValue(value)}</div>
                        </div>
                    );
                }
                if (typeof value === 'number' && (lowerKey.includes('date') || lowerKey.includes('modified') || lowerKey.includes('created'))) {
                    return (
                        <div key={field.label} className="flex flex-col border-b border-gray-200 dark:border-gray-700 pb-1">
                            <div className="font-medium break-words">{field.label}</div>
                            <div className="text-right break-words">{formatDateValue(value)}</div>
                        </div>
                    );
                }

                if (Array.isArray(value)) {
                    const list = value.map((v) => (typeof v === 'string' ? v.trim() : JSON.stringify(v))).filter(Boolean);
                    if (!list.length) return null;
                    return (
                        <div key={field.label} className="flex flex-col border-b border-gray-200 dark:border-gray-700 pb-1">
                            <div className="font-medium break-words">{field.label}</div>
                            <div className="flex flex-col gap-1 text-right">
                                {list.map((v, i) => (
                                    <div key={i} className="break-words">{v}</div>
                                ))}
                            </div>
                        </div>
                    );
                }

                return (
                    <div
                        key={field.label}
                        className={`flex justify-between gap-2 border-b border-gray-200 dark:border-gray-700 pb-1 ${
                            isDifferent ? diffClass || '' : ''
                        }`}
                    >
                        <div className="font-medium break-words">{field.label}</div>
                        <div className="flex-1 text-right break-words">
                            {value === null || value === undefined
                                ? null
                                : typeof value === 'object'
                                    ? renderData(value, compareValue, diffClass)
                                    : renderTextLines(value?.toString() || '')}
                        </div>
                    </div>
                );
            }).filter(Boolean);

            return <div className="w-full text-left text-xs dark:text-gray-300 space-y-1">{renderedFields}</div>;

        } else {
            return <span>{data}</span>;
        }
    };

    const detectSource = (item: any): string => {
        const candidates = [
            typeof item?.sourceText === 'string' ? item.sourceText : '',
            typeof item?.source === 'string' ? item.source : '',
            typeof item?.sourceLabel === 'string' ? item.sourceLabel : '',
            typeof item?.feedto === 'object' ? item.feedto?.['#text'] : '',
        ].filter(Boolean) as string[];
        const normalized = (candidates[0] || '').trim().toLowerCase().replace(/[^a-z]/g, '');
        if (normalized.includes('myhome')) return 'MyHome';
        if (normalized.includes('acquaint') || normalized.includes('acqauint') || normalized.startsWith('acq')) return 'Acquaint';
        if (normalized.includes('daft')) return 'Daft';
        if (normalized.includes('wordpress') || normalized.includes('wp')) return 'WordPress';
        return 'FindAHome';
    };

    const primarySource = detectSource(property);

    const isDataLoaded = (data: any) =>
        data && data !== 'Loading...' && !(typeof data === 'object' && data.message);

    const toTimestamp = (val: any): number => {
        if (val === null || val === undefined) return 0;
        const num = Number(val);
        if (!isNaN(num) && num > 0) {
            return num > 1e12 ? num : num * 1000;
        }
        const parsed = Date.parse(String(val));
        return isNaN(parsed) ? 0 : parsed;
    };

    const pickPreferredVariant = (list: any[]) => {
        if (!list || list.length === 0) return null;
        return list.reduce((best, curr) => {
            if (!best) return curr;
            const bestTs =
                toTimestamp(best?.updateddate || best?.ModifiedOnDate || best?.ListingDate || best?.addeddate || best?.updatedText) || 0;
            const currTs =
                toTimestamp(curr?.updateddate || curr?.ModifiedOnDate || curr?.ListingDate || curr?.addeddate || curr?.updatedText) || 0;
            if (currTs > bestTs) return curr;
            if (currTs === bestTs) {
                const bestPhotos = Array.isArray(best?.photoUrls) ? best.photoUrls.length : 0;
                const currPhotos = Array.isArray(curr?.photoUrls) ? curr.photoUrls.length : 0;
                if (currPhotos > bestPhotos) return curr;
            }
            return best;
        }, null as any);
    };

    const variants = Array.isArray(property?.variants) ? property.variants : null;
    const infoSections: { title: string; data: any; compareTo?: any }[] = [];
    const sourceColor = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('acquaint')) return 'bg-red-100 border-red-400 text-red-700';
        if (t.includes('myhome')) return 'bg-blue-100 border-blue-400 text-blue-700';
        if (t.includes('daft')) return 'bg-orange-100 border-orange-400 text-orange-700';
        if (t.includes('wordpress')) return 'bg-purple-100 border-purple-400 text-purple-700';
        return 'bg-gray-100 border-gray-300';
    };

    const sourceDiffClass = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('acquaint')) return 'text-red-600 font-semibold';
        if (t.includes('myhome')) return 'text-blue-600 font-semibold';
        if (t.includes('daft')) return 'text-orange-600 font-semibold';
        if (t.includes('wordpress')) return 'text-purple-600 font-semibold';
        return 'text-gray-700 font-semibold';
    };

    const summaryFields = (data: any) => {
        if (!data || typeof data !== 'object') return [];
        const pairs: { label: string; value: string }[] = [];
        const summaryKeys = [
            'Address',
            'Price',
            'Bedrooms',
            'Bathrooms',
            'Property Type',
            'Status',
            'Floor Area',
            'Date Uploaded',
            'Date Updated',
            'Updated',
            'Agent Name',
        ];
        summaryKeys.forEach((label) => {
            const field = fieldMappings.find((f) => f.label === label);
            if (!field) return;
            const val = findFirstValue(data, field.paths);
            if (shouldSkip(val)) return;
            const str = summaryValueToString(val);
            if (str) pairs.push({ label, value: str });
        });
        return pairs;
    };

    if (variants && variants.length > 0) {
        const groupedBySource = variants.reduce((acc: Record<string, any[]>, v: any) => {
            const title = detectSource(v);
            acc[title] = acc[title] || [];
            acc[title].push(v);
            return acc;
        }, {});

        const preferredBySource: { title: string; data: any }[] = Object.entries(groupedBySource).map(
            ([title, list]) => ({ title, data: pickPreferredVariant(list as any[]) || (list as any[])[0] })
        );

        const baseline = preferredBySource[0]?.data;
        preferredBySource.forEach(({ title, data }) => {
            infoSections.push({ title, data, compareTo: baseline });
        });
    } else {
        if (primarySource === 'MyHome') {
            infoSections.push({ title: 'MyHome', data: property });
            if (apiKey && isDataLoaded(additionalInfo)) {
                infoSections.push({ title: 'MyHome Live', data: additionalInfo });
            }
            if (acquiantKey && isDataLoaded(acquaintInfo)) {
                infoSections.push({ title: 'Acquaint', data: acquaintInfo });
            }
        } else if (primarySource === 'Acquaint') {
            infoSections.push({ title: 'Acquaint', data: property });
            if (acquiantKey && isDataLoaded(acquaintInfo)) {
                infoSections.push({ title: 'Acquaint Live', data: acquaintInfo });
            }
            if (apiKey && isDataLoaded(additionalInfo)) {
                infoSections.push({ title: 'MyHome', data: additionalInfo });
            }
        } else if (primarySource === 'Daft') {
            infoSections.push({ title: 'Daft', data: property });
            if (apiKey && isDataLoaded(additionalInfo)) {
                infoSections.push({ title: 'MyHome', data: additionalInfo });
            }
            if (acquiantKey && isDataLoaded(acquaintInfo)) {
                infoSections.push({ title: 'Acquaint', data: acquaintInfo });
            }
        } else {
            // FindAHome / unknown
            infoSections.push({ title: 'Results', data: property });
            if (apiKey && isDataLoaded(additionalInfo)) {
                infoSections.push({ title: 'MyHome', data: additionalInfo });
            }
            if (acquiantKey && isDataLoaded(acquaintInfo)) {
                infoSections.push({ title: 'Acquaint', data: acquaintInfo });
            }
        }
    }

    return (
        <Modal show={show} onClose={onClose} title={property.Address}>
            <div className="grid gap-4 h-[80vh] overflow-y-auto pr-4 w-full grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-max">
                {infoSections.map((section, index) => {
                    const compareTo = section.compareTo;
                    const diffClass = sourceDiffClass(section.title);

                    return (
                        <div key={index} className="flex flex-col h-full">
                            <h3 className={`text-sm font-semibold mb-2 z-10 p-2 w-full border rounded ${sourceColor(section.title)} dark:text-gray-900`}>
                                {section.title}
                            </h3>
                            <div className="flex-1 overflow-y-auto h-full border border-gray-200 dark:border-gray-700 rounded p-2 bg-white dark:bg-gray-900 space-y-2">
                                {/* Summary chips */}
                                <div className="flex flex-wrap gap-2 text-xs text-gray-700 dark:text-gray-200">
                                    {summaryFields(section.data).map((item) => (
                                        <span key={item.label} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                            <span className="font-semibold">{item.label}:</span> {item.value}
                                        </span>
                                    ))}
                                </div>
                                {section.data.message ? (
                                    <p className="dark:text-gray-300">{section.data.message}</p>
                                ) : (
                                    renderData(section.data, compareTo, diffClass)
                                )}
                            </div>
                        </div>
                    );
                })}

            </div>
        </Modal>
    );
};

export default PropertyDetailsModal;

