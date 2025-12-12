import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor for errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth
export const authApi = {
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    register: (data: { email: string; password: string; name?: string }) =>
        api.post('/auth/register', data),
    me: () => api.get('/auth/me'),
};

// Presentations
export const presentationsApi = {
    list: (page = 1, limit = 10) =>
        api.get('/presentations', { params: { page, limit } }),
    get: (id: string) => api.get(`/presentations/${id}`),
    create: (data: any) => api.post('/presentations', data),
    update: (id: string, data: any) => api.put(`/presentations/${id}`, data),
    delete: (id: string) => api.delete(`/presentations/${id}`),
    duplicate: (id: string) => api.post(`/presentations/${id}/duplicate`),
    share: (id: string) => api.post(`/presentations/${id}/share`),
};

// Slides
export const slidesApi = {
    list: (presentationId: string) =>
        api.get(`/presentations/${presentationId}/slides`),
    get: (presentationId: string, slideId: string) =>
        api.get(`/presentations/${presentationId}/slides/${slideId}`),
    create: (presentationId: string, data: any) =>
        api.post(`/presentations/${presentationId}/slides`, data),
    update: (presentationId: string, slideId: string, data: any) =>
        api.put(`/presentations/${presentationId}/slides/${slideId}`, data),
    delete: (presentationId: string, slideId: string) =>
        api.delete(`/presentations/${presentationId}/slides/${slideId}`),
    reorder: (presentationId: string, data: any) =>
        api.post(`/presentations/${presentationId}/slides/reorder`, data),
};

// Generation
export const generationApi = {
    start: (data: any) => api.post('/generation/start', data),
    status: (jobId: string) => api.get(`/generation/${jobId}/status`),
    edit: (data: { slideId: string; instruction: string }) =>
        api.post('/generation/edit', data),
};

// Templates
export const templatesApi = {
    list: (category?: string) =>
        api.get('/templates', { params: { category } }),
    defaults: () => api.get('/templates/defaults'),
    get: (id: string) => api.get(`/templates/${id}`),
};

// Credits
export const creditsApi = {
    balance: () => api.get('/credits/balance'),
    history: (page = 1, limit = 20) =>
        api.get('/credits/history', { params: { page, limit } }),
    usage: (days = 30) => api.get('/credits/usage', { params: { days } }),
};

// Export
export const exportApi = {
    pptx: (presentationId: string) =>
        api.post(`/export/${presentationId}/pptx`, {}, { responseType: 'blob' }),
    pdf: (presentationId: string) =>
        api.post(`/export/${presentationId}/pdf`, {}, { responseType: 'blob' }),
    googleSlides: (presentationId: string, accessToken: string) =>
        api.post(`/export/${presentationId}/google-slides`, null, {
            params: { accessToken },
        }),
    preview: (presentationId: string, slideIndex = 0) =>
        api.get(`/export/${presentationId}/preview`, {
            params: { slide: slideIndex },
            responseType: 'blob',
        }),
};

// Assets
export const assetsApi = {
    upload: (file: File, type = 'IMAGE') => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/assets/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            params: { type },
        });
    },
    list: (type?: string) => api.get('/assets', { params: { type } }),
    delete: (id: string) => api.delete(`/assets/${id}`),
    searchStock: (query: string) =>
        api.get('/assets/stock', { params: { q: query } }),
    searchIcons: (query: string) =>
        api.get('/assets/icons', { params: { q: query } }),
};

export default api;
