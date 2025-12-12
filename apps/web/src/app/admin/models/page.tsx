'use client';

import { useEffect, useState } from 'react';
import { Plus, Cpu, Trash2, Edit, Star, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface LlmModel {
    id: string;
    name: string;
    provider: string;
    modelId: string;
    endpoint: string | null;
    apiKeyEnvVar: string;
    maxTokens: number;
    rateLimit: number | null;
    costPerToken: number;
    isActive: boolean;
    isDefault: boolean;
    config: any;
    createdAt: string;
}

export default function AdminModelsPage() {
    const [models, setModels] = useState<LlmModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingModel, setEditingModel] = useState<LlmModel | null>(null);
    const [formData, setFormData] = useState({
        name: '', provider: 'openai', modelId: '', endpoint: '', apiKeyEnvVar: 'OPENAI_API_KEY',
        maxTokens: 4096, rateLimit: '', costPerToken: 0.002
    });

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/admin/models`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setModels((await res.json()).data);
        } finally {
            setLoading(false);
        }
    };

    const setDefault = async (id: string) => {
        const token = localStorage.getItem('auth_token');
        await fetch(`${API_URL}/admin/models/${id}/set-default`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchModels();
    };

    const toggleActive = async (id: string, isActive: boolean) => {
        const token = localStorage.getItem('auth_token');
        await fetch(`${API_URL}/admin/models/${id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !isActive }),
        });
        fetchModels();
    };

    const deleteModel = async (id: string) => {
        if (!confirm('이 모델을 삭제하시겠습니까?')) return;
        const token = localStorage.getItem('auth_token');
        await fetch(`${API_URL}/admin/models/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        fetchModels();
    };

    const providerColors: Record<string, string> = {
        openai: 'bg-green-100 text-green-800',
        anthropic: 'bg-orange-100 text-orange-800',
        google: 'bg-blue-100 text-blue-800',
        azure: 'bg-sky-100 text-sky-800',
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">모델 설정</h1>
                    <p className="text-sm text-gray-500">LLM 모델 레지스트리 관리</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchModels} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                        <RefreshCw size={20} />
                    </button>
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <Plus size={20} />
                        모델 추가
                    </button>
                </div>
            </div>

            {/* Models Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
                    </div>
                ) : (
                    models.map((model) => (
                        <div key={model.id} className={`bg-white rounded-lg shadow-sm p-6 ${!model.isActive ? 'opacity-50' : ''}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Cpu className="text-purple-600" size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{model.name}</h3>
                                            {model.isDefault && <Star className="text-yellow-500 fill-yellow-500" size={16} />}
                                        </div>
                                        <p className="text-sm text-gray-500">{model.modelId}</p>
                                    </div>
                                </div>
                                <button onClick={() => toggleActive(model.id, model.isActive)}>
                                    {model.isActive ? <ToggleRight className="text-green-500" size={24} /> : <ToggleLeft className="text-gray-400" size={24} />}
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${providerColors[model.provider] || 'bg-gray-100'}`}>
                                    {model.provider}
                                </span>
                                <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">{model.maxTokens} tokens</span>
                            </div>

                            <div className="text-sm text-gray-500 space-y-1">
                                <div className="flex justify-between">
                                    <span>Cost/token:</span>
                                    <span className="text-gray-900">${model.costPerToken}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Rate limit:</span>
                                    <span className="text-gray-900">{model.rateLimit || '없음'}/min</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 mt-4 border-t">
                                {!model.isDefault && (
                                    <button onClick={() => setDefault(model.id)} className="flex-1 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm hover:bg-yellow-100">
                                        기본 설정
                                    </button>
                                )}
                                <button className="p-2 hover:bg-gray-100 rounded-lg"><Edit size={16} className="text-gray-500" /></button>
                                <button onClick={() => deleteModel(model.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} className="text-red-500" /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
