import axios, { AxiosInstance } from 'axios';
import { Agency } from '../interfaces/Models';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        const baseURL = import.meta.env.VITE_REACT_APP_API_URL;
        console.log('API Base URL:', baseURL); // Debug log to verify the baseURL
        this.api = axios.create({
            baseURL,
        });
    }

    // URL utility functions
    static urls = {
        connectors: () => '/connectors',
        pipelines: () => '/pipelines',
        properties: () => '/properties',
        GetMyHome: () => '/myhome',
        GetAcquaint: () => '/acquaint',

        agencies: () => '/agencies',
        agency: () => '/agencies/',
        verifyToken: () => '/verify_token',
        login: () => '/login',
        toggleConnector: (id: number) => `/connectors/${id}`,
        togglePipeline: (id: number) => `/pipelines/${id}`,
    };

    getDataServices() {
        return this.api.get(ApiService.urls.connectors());
    }

    getDataPipelines() {
        return this.api.get(ApiService.urls.pipelines());
    }

    getProperties(Key: string) {
        return this.api.get(ApiService.urls.properties() + `?key=${Key}`);
    }
    getAgencies() {
        return this.api.get(ApiService.urls.agencies());
    }
    getAgency(id: number) {
        return this.api.get(ApiService.urls.agency() + id);
    }

    verifyToken(token: string) {
        return this.api.post(ApiService.urls.verifyToken(), { token });
    }

    getActivity(limit = 50) {
        return this.api.get(`/activity?limit=${limit}`);
    }

    getCountdown() {
        return this.api.get('/countdown');
    }

    getGroupedProperties() {
        return this.api.get('/properties/grouped');
    }

    getLiveProperties(key: string, sources?: string) {
        const params = new URLSearchParams({ key });
        if (sources) params.set('sources', sources);
        return this.api.get(`/properties/live?${params.toString()}`);
    }

    login(email: string, password: string) {
        return this.api.post(ApiService.urls.login(), { email, password });
    }

    addDataService(data: any) {
        return this.api.post(ApiService.urls.connectors(), data);
    }

    addDataPipeline(data: any) {
        return this.api.post(ApiService.urls.pipelines(), data);
    }

    toggleDataService(id: number, disabled: boolean) {
        return this.api.patch(ApiService.urls.toggleConnector(id), { disabled });
    }

    toggleDataPipeline(id: number, disabled: boolean) {
        return this.api.patch(ApiService.urls.togglePipeline(id), { disabled });
    }
    getMyHome(apiKey: string, Listreff: string) {
        return this.api.get(ApiService.urls.GetMyHome() + `?key=${apiKey}&id=${Listreff}`);

    }
    GetAcquaint(apiKey: string, Listreff: string) {
        return this.api.get(ApiService.urls.GetAcquaint() + `?key=${apiKey}&id=${Listreff}`);
    }
    updateAgency(id: number, data: Partial<Agency>) {
        return this.api.put(ApiService.urls.agency() + id, data);
    }

}

const apiService = new ApiService();
export default apiService;
export { ApiService };
