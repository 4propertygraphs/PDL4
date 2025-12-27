import axios from 'axios';
import { Property } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://pdlapi.4projectss.com';

const api = axios.create({
  baseURL: BASE_URL,
});

export const fetchLiveProperties = async (key: string, sources?: string): Promise<Property[]> => {
  const params = new URLSearchParams({ key });
  if (sources) params.set('sources', sources);
  const res = await api.get(`/properties/live?${params.toString()}`);
  const items: any[] = res.data?.items || res.data || [];
  return items.map((p, idx) => ({
    id: p.id ?? p.uniquereferencenumber ?? idx,
    addressText: p.displayaddress || p.address || p.house_location || '',
    priceText: p.price ?? p.priceText ?? '',
    saleType: p.saleType || p.PropertyStatus || '',
    propertyType: p.propertyType || p.type || p.house_extra_info_1 || '',
    agentText: p.agency_agent_name || p.agent || '',
    bathroomsText: p.house_bathrooms || p.bathrooms || '',
    bedroomsText: p.house_bedrooms || p.bedrooms || '',
    pictureCount: Array.isArray(p.photos) ? p.photos.length : p.photoCount || p.PhotoCount || 0,
    photoUrls: Array.isArray(p.photos) ? p.photos : [],
    updatedText: p.updateddate || p.updatedText || '',
    sourceText: p.source || p.sourceText || '',
  }));
};
