import { useState, useEffect } from 'react';

import AgencyModal from '../components/modals/AgencyModal';
import PropertyDetailsModal from '../components/modals/PropertyModal';
import React from 'react';

import apiService from '../services/ApiService';
import Table from '../components/Table';
import SearchBarModal from '../components/SearchBar.tsx';
import { useSearchParams, useLocation } from 'react-router-dom';
import MyHomeIcon from '../assets/myhome.png';
import AcquaintIcon from '../assets/acquaint.jpg';
import DaftIcon from '../assets/daft.jpg';
import WordpressIcon from '../assets/integrations/wordpress.png';

const normalizeAddressKey = (address: string) =>
  address
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '')
    .trim();

const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

const formatDateValue = (val: string): string => {
  if (!val) return '';
  const num = Number(val);
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
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
    const [datePart, timePartRaw] = val.split(/[T\s]/);
    const timePart = (timePartRaw || '').slice(0, 5);
    return timePart ? `${datePart} ${timePart}` : datePart;
  }
  const parsed = Date.parse(val);
  if (!isNaN(parsed)) {
    const iso = new Date(parsed).toISOString();
    const date = iso.split('T')[0];
    const time = iso.split('T')[1].replace('Z', '').slice(0, 5);
    return time !== '00:00' ? `${date} ${time}` : date;
  }
  return val;
};

const computeAddressTokens = (...parts: string[]) => {
  const text = parts.filter((p) => typeof p === 'string' && p.trim().length > 0).join(' ').toLowerCase();
  const unified = text
    .replace(/\bcounty\b/g, '')
    .replace(/\bco\b/g, '')
    .replace(/\bireland\b/g, '')
    .replace(/[^\w]/g, ' ');
  const tokens = unified.split(/\s+/).filter(Boolean);
  const uniqSorted = Array.from(new Set(tokens)).sort();
  return uniqSorted;
};

const buildAddressKey = (...parts: string[]) => {
  const tokens = computeAddressTokens(...parts);
  return tokens.join('');
};

const getText = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if ('#text' in val && typeof (val as any)['#text'] === 'string') return (val as any)['#text'];
    if ('value' in val) return String((val as any).value);
  }
  return '';
};

const normalizeProperties = (items: any[] = [], agencyHint?: any) => {
  const collectPhotos = (p: any): string[] => {
    const urls: string[] = [];
    const pushUrl = (u: any) => {
      if (!u) return;
      if (Array.isArray(u)) return u.forEach(pushUrl);
      if (typeof u === 'object') return Object.values(u).forEach(pushUrl);
      if (typeof u === 'string') {
        let val = u.trim().replace(/^['"]|['"]$/g, '');
        if (!val) return;
        const low = val.toLowerCase();
        if (low.includes('thumbnail') || low.includes('ipad')) return; // skip thumbs/ipad
        if (val.startsWith('//')) val = 'https:' + val;
        if (!/^https?:\/\//i.test(val)) return;
        urls.push(val);
      }
    };
    const fields = [
      p.MainPhoto,
      p.MainPhotoWeb,
      p.Photos,
      p.Photo,
      p.PhotoList,
      p.images_url_house,
      p.pictures,
      p.picturethumbnails,
      p.photos,
    ];
    fields.forEach(pushUrl);
    return Array.from(new Set(urls));
  };

  const pick = (obj: any, keys: string[]): string => {
    const normalizedMap = new Map<string, any>();
    Object.entries(obj || {}).forEach(([k, v]) => {
      normalizedMap.set(normalizeKey(k), v);
    });
    for (const k of keys) {
      const hit = normalizedMap.get(normalizeKey(k));
      if (hit !== undefined) return getText(hit);
    }
    return '';
  };

  return items.map((p, idx) => {
    const id = p.id ?? p.uniquereferencenumber ?? idx;
    const addressParts = [
      pick(p, ['house_location', 'displayaddress', 'DisplayAddress', 'OrderedDisplayAddress', 'full address', 'address']),
      getText(p.address?.area),
      getText(p.address?.street),
      getText(p.address?.propertyname),
      getText(p.address?.town ?? p.city),
      getText(p.address?.region ?? p.county),
      getText((p as any).eircode ?? (p as any).Eircode ?? (p as any).postcode),
    ].filter((part: string) => typeof part === 'string' && part.trim().length > 0);
    const addressText = addressParts.join(', ');
    const addressTokens = computeAddressTokens(
      addressText,
      p.house_location,
      p.displayaddress,
      p.DisplayAddress,
      p.OrderedDisplayAddress,
      p.address?.area,
      p.address?.street,
      p.address?.propertyname,
      p.address?.town,
      p.address?.region,
      p.city,
      p.county
    );
    const typeText =
      getText(p.house_extra_info_1) ||
      getText(p.type) ||
      pick(p, ['house type', 'PropertyClass']);
    const priceFreq = getText(p.pricefrequency);
    const priceValue = pick(p, ['house_price', 'price', 'PriceAsString', 'price as string']);
    const priceText = priceValue && priceValue !== '0' ? `${priceValue}`.trim() : '';
    const agentText = pick(p, ['agency_agent_name', 'username', 'useremail', 'agent', 'contact name']);
    const statusText = pick(p, ['house_extra_info_3', 'status', 'PropertyStatus', 'Selling type']);
    const saleType =
      (priceFreq && String(priceFreq).toLowerCase().includes('pcm')) ||
      (statusText && /let|rent/i.test(statusText)) ||
      (getText(p.PropertyStatus).toLowerCase().includes('rent'))
        ? 'To Let'
        : 'For Sale';
    const liveState = statusText && /sold|let/i.test(statusText) ? 'Archived' : 'Available';
    const propertyType =
      getText(p.category) ||
      getText(p.type) ||
      getText(p.PropertyClass) ||
      getText(p.house_extra_info_1) ||
      pick(p, ['Property type']);
    const agencyHasMyhome = Boolean(agencyHint?.myhome_api_key);
    const agencyHasAcquaint = Boolean(agencyHint?.site_prefix);
    const sourceRawCandidates = [
      typeof p.source === 'string' ? p.source : '',
      typeof p.sourceLabel === 'string' ? p.sourceLabel : '',
      typeof p.feedto === 'object' ? p.feedto?.['#text'] : '',
    ].filter(Boolean) as string[];
    const sourceRaw = (sourceRawCandidates[0] || '').trim();
    const sourceNormalized = sourceRaw.toLowerCase().replace(/[^a-z]/g, '');
    let sourceLabel = 'FindAHome';
    let sourceCode: string = 'findahome';

    if (sourceNormalized.includes('wordpress') || sourceNormalized.includes('wp')) {
      sourceLabel = 'WordPress';
      sourceCode = 'wordpress';
    } else if (sourceNormalized.includes('myhome')) {
      sourceLabel = 'MyHome';
      sourceCode = 'myhome';
    } else if (sourceNormalized.includes('acquaint') || sourceNormalized.includes('acqauint') || sourceNormalized.startsWith('acq')) {
      sourceLabel = 'Acquaint';
      sourceCode = 'acquaint';
    } else if (sourceNormalized.includes('daft')) {
      sourceLabel = 'Daft';
      sourceCode = 'daft';
    } else if (agencyHasMyhome) {
      sourceLabel = 'MyHome';
      sourceCode = 'myhome';
    } else if (agencyHasAcquaint) {
      sourceLabel = 'Acquaint';
      sourceCode = 'acquaint';
    } else {
      sourceLabel = 'FindAHome';
      sourceCode = 'findahome';
    }
    const squareText = getText(p.house_mt_squared ?? p.floorarea ?? p.SizeStringMeters ?? p.SizeString ?? '');
    const bathroomsText = getText(p.house_bathrooms ?? p.bathrooms ?? p.BathString ?? '');
    const bedroomsText = getText(p.house_bedrooms ?? p.bedrooms ?? p.BedsString ?? '');

    const sanitizedSquare = squareText && squareText !== '0' ? squareText : '';
    const sanitizedBaths = bathroomsText && bathroomsText !== '0' ? bathroomsText : '';
    const sanitizedBeds = bedroomsText && bedroomsText !== '0' ? bedroomsText : '';
    const updatedTextRaw = pick(p, ['updateddate', 'addeddate', 'ModifiedOnDate', 'Listing date']);
    const updatedText = formatDateValue(updatedTextRaw);
    const photoUrls = collectPhotos(p);
    const pictureCount = photoUrls.length || p.PhotoCount || p.photoCount || 0;
    const info1Text = getText(p.house_extra_info_2 ?? p.house_extra_info_4 ?? '');
    const isOffline = typeof info1Text === 'string' && /sold|archived/i.test(info1Text);
    const statusNormalized = (statusText || '').toLowerCase();
    const displayStatus = isOffline
      ? 'Offline'
      : statusNormalized.includes('live')
        ? 'Available'
        : (statusText || liveState);
    // info2 removed per request
    const addressKey = buildAddressKey(
      addressText,
      p.house_location,
      p.displayaddress,
      p.DisplayAddress,
      p.OrderedDisplayAddress,
      p.address?.area,
      p.address?.street,
      p.address?.propertyname,
      p.address?.town,
      p.address?.region,
      p.city,
      p.county
    ) || normalizeAddressKey(addressText || p.house_location || p.displayaddress || String(id));
    const eircodeNormalized =
      getText((p as any).eircode ?? (p as any).Eircode ?? (p as any).postcode)
        .replace(/\s+/g, '')
        .toUpperCase();
    return {
      ...p,
      id,
      addressText,
      addressKey,
      addressTokens,
      eircodeNormalized,
      typeText: typeText || '',
      priceText,
      agentText,
      bathroomsText: sanitizedBaths,
      bedroomsText: sanitizedBeds,
      saleType,
      propertyType,
      pictureCount,
      photoUrls,
      sourceText: sourceLabel,
      sourceLabel,
      sourceCode,
      statusText,
      displayStatus,
      updatedText,
      squareText: sanitizedSquare,
      info1Text,
    };
  });
};

const buildStatusNode = (sourceList: string[], displayStatus: string) => {
  const statusIcons: Record<string, string | null> = {
    myhome: MyHomeIcon,
    acquaint: AcquaintIcon,
    daft: DaftIcon,
    wordpress: WordpressIcon,
    findahome: null,
  };

  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-1">
        {sourceList.map((s) => {
          const icon = statusIcons[s as keyof typeof statusIcons];
          if (!icon) return null;
          return (
            <img
              key={s}
              src={icon}
              alt={s}
              className="object-contain flex-shrink-0"
              style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px' }}
            />
          );
        })}
      </span>
      <span>{displayStatus}</span>
    </span>
  );
};

const aggregateSources = (normalized: any[]) => {
  const grouped = new Map<string, any>();

  const tokensToSet = (arr: string[] = []) => new Set(arr.filter(Boolean));
  const isSimilarTokens = (a: Set<string>, b: Set<string>) => {
    if (!a.size || !b.size) return false;
    const intersection = Array.from(a).filter((t) => b.has(t)).length;
    const maxSize = Math.max(a.size, b.size);
    const minSize = Math.min(a.size, b.size);
    const ratio = intersection / maxSize;
    const minRatio = intersection / (minSize || 1);
    return ratio >= 0.65 || (intersection >= 3 && minRatio >= 0.75);
  };

  normalized.forEach((item) => {
    const key = item.addressKey || item.addressText || String(item.id);
    const itemTokens = tokensToSet(item.addressTokens || []);
    const itemEircode = item.eircodeNormalized || '';

    const findMatchKey = () => {
      if (grouped.has(key)) return key;
      for (const [groupKey, groupVal] of grouped.entries()) {
        if (itemEircode && groupVal.eircodeNormalized && itemEircode === groupVal.eircodeNormalized) {
          return groupKey;
        }
        const groupTokens = tokensToSet(groupVal.addressTokens || []);
        if (isSimilarTokens(itemTokens, groupTokens)) return groupKey;
        const a = (item.addressText || '').toLowerCase().replace(/\s+/g, '');
        const b = (groupVal.addressText || '').toLowerCase().replace(/\s+/g, '');
        if (a && b && (a.includes(b) || b.includes(a))) return groupKey;
      }
      return null;
    };

    const matchKey = findMatchKey();
    const targetKey = matchKey || key;
    const existing = grouped.get(targetKey);
    if (!existing) {
      grouped.set(targetKey, {
        ...item,
        sourceList: [item.sourceCode],
        variants: [item],
      });
    } else {
      const mergedSources = Array.from(new Set([...(existing.sourceList || []), item.sourceCode]));
      grouped.set(targetKey, {
        ...existing,
        sourceList: mergedSources,
        variants: [...(existing.variants || []), item],
      });
    }
  });

  return Array.from(grouped.values()).map((item) => {
    const sourceList = item.sourceList || [item.sourceCode];
    const sourceText = sourceList
      .map((s: string) =>
        s === 'myhome' ? 'MyHome' : s === 'acquaint' ? 'Acquaint' : s === 'daft' ? 'Daft' : 'FindAHome'
      )
      .join(', ');

    return {
      ...item,
      sourceList,
      sourceText,
      statusNode: buildStatusNode(sourceList, item.displayStatus),
    };
  });
};

const buildRowsFromGroups = (groups: any[], agencyHint?: any) => {
  return groups
    .map((group) => {
      const variants = group.variants || [];
      if (!variants.length) return null;
      const normalized = normalizeProperties([variants[0]], agencyHint)[0];
      const sourceList = group.sources?.length ? group.sources : [normalized.sourceCode];
      const sourceText = sourceList
        .map((s: string) =>
          s === 'myhome' ? 'MyHome' : s === 'acquaint' ? 'Acquaint' : s === 'daft' ? 'Daft' : 'FindAHome'
        )
        .join(', ');
      const statusNode = buildStatusNode(sourceList, normalized.displayStatus);
      return {
        ...normalized,
        id: group.group_key || normalized.id,
        sourceList,
        sourceText,
        statusNode,
        variants,
      };
    })
    .filter(Boolean);
};

function Properties() {
  const [searchParams] = useSearchParams();
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const agencyKey = searchParams.get('key'); // Get agency Key from query params
  const location = useLocation();
  const agency = location.state?.agency || null; // Retrieve agency from state

  const [properties, setProperties] = useState<any[]>([]); // Use `any[]` to handle dynamic data
  const [originalProperties, setOriginalProperties] = useState<any[]>([]); // Add state for original properties
  const [searchText, setSearchText] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<(string | number)[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [groupedMode, setGroupedMode] = useState(false);
  const [liveSources, setLiveSources] = useState('');
  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [groupedFilters, setGroupedFilters] = useState({
    onlyDupes: false,
    minCount: 1,
    sources: '',
    limit: '',
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [saleFilter, setSaleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isMobile, setIsMobile] = useState(false);




  const columns = [
    { key: 'addressText', label: 'Address', sortable: true },
    { key: 'typeText', label: 'Type', sortable: true, className: 'hidden sm:table-cell' },
    { key: 'priceText', label: 'Price', sortable: true },
    { key: 'agentText', label: 'Agent', sortable: true, className: 'hidden lg:table-cell' },
    { key: 'bathroomsText', label: 'Bathrooms', sortable: true, className: 'hidden md:table-cell' },
    { key: 'bedroomsText', label: 'Bedrooms', sortable: true, className: 'hidden md:table-cell' },
    { key: 'pictureCount', label: 'Pics', sortable: true, className: 'hidden sm:table-cell' },
    { key: 'saleType', label: 'Sale/Rent', sortable: true },
    { key: 'updatedText', label: 'Updated', sortable: true, className: 'hidden md:table-cell' },
    { key: 'squareText', label: 'Area (m²)', sortable: true, className: 'hidden lg:table-cell' },
    { key: 'info1Text', label: 'Info 1', sortable: true, className: 'hidden xl:table-cell' },
    { key: 'sourceText', label: 'Source', sortable: true, className: 'hidden sm:table-cell' },
    { key: 'statusNode', label: 'Status', sortable: true },
  ];
  const [modalStack, setModalStack] = useState<
    { type: 'createOffice' | 'editOffice' | 'createAgent' | 'editAgent' | 'agency' | 'agencyPipelines'; data?: any }[]
  >([]);


  const closeModal = () => {
    setModalStack((prevStack) => prevStack.slice(0, -1));
  };

  const currentModal = modalStack[modalStack.length - 1];

  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setSelectedLog(null);
  };

  const handleLogDetailsClick = (logId: string) => {
    setSelectedLog(logId);
    setIsLogModalOpen(true);
  };




  useEffect(() => {
    const fetchData = async () => {
      if (groupedMode) {
        await fetchGrouped();
      } else {
        await fetchLive();
      }
    };

    fetchData();
  }, [agencyKey, groupedMode]); // Add agencyKey as a dependency

  const fetchGrouped = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (groupedFilters.onlyDupes) params.set('only_dupes', '1');
      if (groupedFilters.minCount && Number(groupedFilters.minCount) > 1) {
        params.set('min_count', String(groupedFilters.minCount));
      }
      if (groupedFilters.sources.trim().length > 0) {
        params.set('sources', groupedFilters.sources);
      }
      if (groupedFilters.limit.trim().length > 0) {
        params.set('limit', groupedFilters.limit);
      }
      if (agencyKey) params.set('key', agencyKey);

      const res = await fetch(
        `${import.meta.env.VITE_REACT_APP_API_URL}/properties/grouped?${params.toString()}`
      ).then((r) => r.json());
      const groups = Array.isArray(res) ? res : res?.value || [];
      setGroupedData(groups);
      const rows = buildRowsFromGroups(groups, agency);
      setOriginalProperties(rows);
      setProperties(rows);
    } catch (error) {
      console.error('Error fetching grouped properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLive = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getLiveProperties(agencyKey || '', liveSources || undefined);
      const items = res.data?.items || res.data || [];
      const normalized = normalizeProperties(items, agency);
      const aggregated = aggregateSources(normalized);
      setGroupedData([]); // clear grouped cache when in live mode
      setOriginalProperties(aggregated);
      setProperties(aggregated);
    } catch (error) {
      console.error('Error fetching live properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property); // Pass the clicked property
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProperty(null);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProperties(properties.map(property => property.id));
    } else {
      setSelectedProperties([]);
    }
  };

  const handleSelectProperty = (Id: string | number) => {
    setSelectedProperties(prevSelected =>
      prevSelected.includes(Id)
        ? prevSelected.filter(propertyId => propertyId !== Id)
        : [...prevSelected, Id]
    );
  };



  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);

  };

  useEffect(() => {
    // treat narrower viewports as "mobile" so cards render instead of table
    const sync = () => setIsMobile(window.innerWidth < 1024);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const toggleGrouped = () => {
    const next = !groupedMode;
    setGroupedMode(next);
    if (next && groupedData.length === 0) {
      fetchGrouped();
    } else if (!next) {
      fetchLive();
    }
  };

  const applyGroupedFilters = () => {
    fetchGrouped();
  };




  useEffect(() => {
    if (searchText.trim() === '') {
      // Reset properties to original when search text is empty
      setProperties(originalProperties);
    } else {
      // Filter properties based on search text
      setProperties(
        originalProperties.filter((property) =>
          (property.addressText || '').toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, originalProperties]);


  const refreshProperties = async () => {
      setIsLoading(true); // Set loading state to true
      try {
        console.log('Refreshing properties with agencyKey:', agencyKey); // Debug log
        const propertiesResponse = await apiService.getProperties(agencyKey || '');
        console.log('Refreshed properties:', propertiesResponse.data); // Debug log

      const normalized = normalizeProperties(propertiesResponse.data, agency);
      const aggregated = aggregateSources(normalized);
      setOriginalProperties(aggregated); // Update original properties
      setProperties(aggregated); // Update displayed properties
      } catch (error) {
        console.error('Error refreshing properties:', error);
      } finally {
        setIsLoading(false); // Set loading state to false
      }
  };

  const displayedProperties = properties.filter((property) => {
    const searchMatch = (property.addressText || '').toLowerCase().includes(searchText.toLowerCase());
    if (!searchMatch) return false;
    const statusVal = (property.displayStatus || property.statusText || '').toLowerCase();
    if (statusFilter !== 'all') {
      if (statusFilter === 'available') {
        const isAvailable =
          statusVal === 'available' ||
          statusVal.includes('available');
        const looksUnavailable =
          statusVal.includes('unavail') ||
          statusVal.includes('not avail') ||
          statusVal.includes('not-available');
        if (!isAvailable || looksUnavailable) return false;
      }
      if (statusFilter === 'not_available' && !(statusVal.includes('unavail') || statusVal.includes('not'))) return false;
      if (statusFilter === 'under_offer' && !statusVal.includes('offer')) return false;
      if (statusFilter === 'sold' && !statusVal.includes('sold')) return false;
      if (statusFilter === 'valuation' && !statusVal.includes('valuation')) return false;
      if (statusFilter === 'archived' && !statusVal.includes('archiv')) return false;
    }
    if (saleFilter !== 'all') {
      const saleVal = (property.saleType || '').toLowerCase();
      if (saleFilter === 'sale' && !saleVal.includes('sale')) return false;
      if (saleFilter === 'rent' && !saleVal.includes('rent') && !saleVal.includes('let')) return false;
    }
    if (typeFilter !== 'all') {
      const typeVal = (property.typeText || property.propertyType || '').toLowerCase();
      if (!typeVal.includes(typeFilter.toLowerCase())) return false;
    }
    if (sourceFilter !== 'all') {
      const src = (property.sourceLabel || property.sourceText || property.sourceCode || '').toLowerCase();
      if (!src.includes(sourceFilter.toLowerCase())) return false;
    }
    return true;
  });

  const parseNumeric = (val: any) => {
    if (val === null || val === undefined) return NaN;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/[^\d.-]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? NaN : num;
  };

  const sortedProperties = [...displayedProperties].sort((a: any, b: any) => {
    if (!sortKey) return 0;
    const aVal = (a as any)[sortKey];
    const bVal = (b as any)[sortKey];
    const numericKeys = ['price', 'bathroom', 'bedroom', 'square', 'pic', 'updated'];
    const isNumberKey =
      typeof aVal === 'number' ||
      typeof bVal === 'number' ||
      numericKeys.some((k) => String(sortKey).toLowerCase().includes(k));

    if (isNumberKey) {
      const na = parseNumeric(aVal);
      const nb = parseNumeric(bVal);
      if (isNaN(na) && isNaN(nb)) return 0;
      if (isNaN(na)) return 1;
      if (isNaN(nb)) return -1;
      return sortDir === 'asc' ? na - nb : nb - na;
    }
    const sa = (aVal || '').toString().toLowerCase();
    const sb = (bVal || '').toString().toLowerCase();
    if (sa === sb) return 0;
    return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
  });

  const handleHeaderSort = (key: any) => {
    const k = String(key);
    if (sortKey === k) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setSortDir('asc');
    }
  };


  return (
    <>
      {/* Debug log for properties */}


      {/* Search Bar */}
      <SearchBarModal
        searchText={searchText}
        agency={agency} // Pass the agency object
        onSearchChange={handleSearchChange}
        onRefresh={refreshProperties} // Pass refresh function
        title={"Properties of " + agency?.name}
        placeholder="Search properties..."
        rightSlot={
          <div className="flex items-center gap-2">
            {!groupedMode && (
              <>
                <input
                  type="text"
                  placeholder="sources (e.g. myhome,acquaint)"
                  className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800"
                  value={liveSources}
                  onChange={(e) => setLiveSources(e.target.value)}
                />
                <button
                  className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-500"
                  onClick={fetchLive}
                >
                  Fresh fetch
                </button>
                <select
                  className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Status: All</option>
                  <option value="available">Available</option>
                  <option value="not_available">Not available</option>
                  <option value="under_offer">Under offer</option>
                  <option value="sold">Sold</option>
                  <option value="valuation">Valuation</option>
                  <option value="archived">Archived</option>
                </select>
                <select
                  className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800"
                  value={saleFilter}
                  onChange={(e) => setSaleFilter(e.target.value)}
                >
                  <option value="all">Sale/Rent: All</option>
                  <option value="sale">Sale</option>
                  <option value="rent">Rent</option>
                </select>
                <select
                  className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Type: All</option>
                  <option value="detached">Detached</option>
                  <option value="semi">Semi</option>
                  <option value="apartment">Apartment</option>
                  <option value="commercial">Commercial</option>
                </select>
                <select
                  className="text-sm border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="all">Source: All</option>
                  <option value="daft">Daft</option>
                  <option value="myhome">MyHome</option>
                  <option value="acquaint">Acquaint</option>
                  <option value="findahome">FindAHome</option>
                </select>
              </>
            )}
            <button
              className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-500"
              onClick={toggleGrouped}
            >
              {groupedMode ? 'Live view' : 'Grouped view'}
            </button>
          </div>
        }
      />

      {!groupedMode && (
        <div className="flex-1 overflow-hidden px-4 py-2">
          {isMobile ? (
            <div className="h-[calc(100vh-240px)] overflow-y-auto space-y-3">
              {isLoading && <div className="text-sm text-gray-500">Loading...</div>}
              {!isLoading && sortedProperties.length === 0 && (
                <div className="text-sm text-gray-500">No data available.</div>
              )}
              {!isLoading &&
                sortedProperties.map((property) => (
                  <div
                    key={property.id}
                    className="bg-white dark:bg-gray-900 rounded shadow border border-gray-200 dark:border-gray-800 p-3 space-y-2"
                    onClick={() => handlePropertyClick(property)}
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{property.addressText}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {property.priceText ? (
                        <span className="px-2 py-1 rounded bg-purple-100 text-purple-800">{property.priceText}</span>
                      ) : null}
                      {property.saleType ? (
                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">{property.saleType}</span>
                      ) : null}
                      {property.typeText ? (
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">{property.typeText}</span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
                      {property.bedroomsText && <span>{property.bedroomsText} bd</span>}
                      {property.bathroomsText && <span>{property.bathroomsText} ba</span>}
                      {typeof property.pictureCount === 'number' && <span>{property.pictureCount} pics</span>}
                      {property.squareText && <span>{property.squareText} m²</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {property.agentText && <span>Agent: {property.agentText}</span>}
                      {property.updatedText && <span>Updated: {property.updatedText}</span>}
                      {property.sourceText && <span>Source: {property.sourceText}</span>}
                    </div>
                    <div className="text-sm">{property.statusNode}</div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="h-[calc(100vh-240px)] overflow-y-auto shadow-md bg-white dark:bg-gray-900 rounded">
              <Table
                data={sortedProperties}
                columns={columns}
                keyField="id" // Use id as the unique key
                onRowClick={handlePropertyClick}
                selectedItems={selectedProperties}
                onSelectItem={handleSelectProperty}
                onSelectAll={handleSelectAll}
                isLoading={isLoading} // Pass isLoading to Table
                sortKey={sortKey as any}
                sortDir={sortDir}
                onHeaderClick={(k) => handleHeaderSort(k)}
              />
            </div>
          )}
        </div>
      )}

      {groupedMode && (
        <div className="px-4 py-2 h-[calc(100vh-240px)] overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={groupedFilters.onlyDupes}
                onChange={(e) =>
                  setGroupedFilters((prev) => ({ ...prev, onlyDupes: e.target.checked, minCount: e.target.checked ? Math.max(prev.minCount, 2) : prev.minCount }))
                }
              />
              Only duplicates
            </label>
            <label className="flex items-center gap-2">
              Min count
              <input
                type="number"
                min={1}
                className="w-20 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800"
                value={groupedFilters.minCount}
                onChange={(e) =>
                  setGroupedFilters((prev) => ({ ...prev, minCount: Number(e.target.value) || 1 }))
                }
              />
            </label>
            <label className="flex items-center gap-2">
              Sources (csv)
              <input
                type="text"
                className="w-48 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800"
                placeholder="acquaint,myhome"
                value={groupedFilters.sources}
                onChange={(e) =>
                  setGroupedFilters((prev) => ({ ...prev, sources: e.target.value }))
                }
              />
            </label>
            <label className="flex items-center gap-2">
              Limit
              <input
                type="number"
                min={1}
                className="w-20 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800"
                value={groupedFilters.limit}
                onChange={(e) =>
                  setGroupedFilters((prev) => ({ ...prev, limit: e.target.value }))
                }
              />
            </label>
            <button
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-500"
              onClick={applyGroupedFilters}
            >
              Apply
            </button>
          </div>
          {isLoading && groupedData.length === 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-300">Loading grouped properties...</div>
          )}
          {groupedData.length === 0 && !isLoading && (
            <div className="text-sm text-gray-600 dark:text-gray-300">No grouped properties found.</div>
          )}
          {groupedData.map((group, idx) => {
            const sources: string[] = group.sources || [];
            const variants: any[] = group.variants || [];
            const sourceIcons = {
              myhome: MyHomeIcon,
              acquaint: AcquaintIcon,
              daft: DaftIcon,
              findahome: null,
            } as const;
            return (
              <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-white dark:bg-gray-900 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {group.group_key || '—'} ({group.count || variants.length || 0})
                  </div>
                  <div className="flex items-center gap-2">
                    {sources.map((s) => {
                      const icon = sourceIcons[s as keyof typeof sourceIcons];
                      return icon ? <img key={s} src={icon} alt={s} className="w-5 h-5 object-contain" /> : null;
                    })}
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {variants.map((v, vIdx) => {
                    const source = (v.source || '').toString().toLowerCase();
                    const icon = sourceIcons[source as keyof typeof sourceIcons];
                    return (
                      <div key={vIdx} className="border border-gray-100 dark:border-gray-700 rounded p-2 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          {icon ? <img src={icon} alt={source} className="w-4 h-4 object-contain" /> : null}
                          <span className="font-medium">{v.house_location || v.displayaddress || '—'}</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">
                          {v.house_extra_info_1 || v.type || ''} · {v.house_price || v.price || '-'}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {v.house_extra_info_3 || v.status || ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}


      {currentModal?.type === 'agency' && currentModal.data && (
        <AgencyModal
          show={currentModal?.type === 'agency'}
          agency={currentModal.data}
          onClose={closeModal}

        />
      )}
      {selectedProperty && (
        <PropertyDetailsModal
          show={showModal}
          property={selectedProperty} // Pass the selected property
          onClose={handleCloseModal}
          onLogDetailsClick={handleLogDetailsClick}
          isLogModalOpen={isLogModalOpen}
          selectedLog={selectedLog}
          closeLogModal={closeLogModal}
          apiKey={agency?.myhome_api_key} // Pass the MyHome API key
          acquiantKey={agency?.site_prefix} // Pass the AcquiantCustomer key

        />

      )}


    </>
  );
}

export default Properties;
