'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText, Palette, Layout, ToggleLeft, ToggleRight, Trash2, Edit, Eye } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Template {
    id: string;
    name: string;
    description: string | null;
    category: string;
    config: any;
    isPublic: boolean;
    organization: { id: string; name: string } | null;
    _count: { presentations: number };
    createdAt: string;
}

interface ColorPalette {
    id: string;
    name: string;
    colors: string[];
    isPublic: boolean;
}

interface LayoutRule {
    id: string;
    name: string;
    slideType: string;
    isDefault: boolean;
}

type Tab = 'templates' | 'palettes' | 'layouts';

export default function AdminTemplatesPage() {
    const [tab, setTab] = useState<Tab>('templates');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [palettes, setPalettes] = useState<ColorPalette[]>([]);
    const [layouts, setLayouts] = useState<LayoutRule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [tab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const headers = { Authorization: `Bearer ${token}` };

            if (tab === 'templates') {
                const res = await fetch(`${API_URL}/admin/templates`, { headers });
                if (res.ok) setTemplates((await res.json()).data);
            } else if (tab === 'palettes') {
                const res = await fetch(`${API_URL}/admin/templates/palettes/list`, { headers });
                if (res.ok) setPalettes((await res.json()).data);
            } else {
                const res = await fetch(`${API_URL}/admin/templates/layouts/list`, { headers });
                if (res.ok) setLayouts((await res.json()).data);
            }
        } finally {
            setLoading(false);
        }
    };

    const categoryIcons: Record<string, string> = {
        BUSINESS: '💼',
        EDUCATION: '📚',
        CREATIVE: '🎨',
        MINIMAL: '⚪',
        PROFESSIONAL: '📊',
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">템플릿 관리</h1>
                    <p className="text-sm text-gray-500">템플릿, 색상 팔레트, 레이아웃 규칙</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <Plus size={20} />
                    {tab === 'templates' ? '템플릿 추가' : tab === 'palettes' ? '팔레트 추가' : '레이아웃 추가'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button onClick={() => setTab('templates')} className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px ${tab === 'templates' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'}`}>
                    <FileText size={18} />
                    템플릿
                </button>
                <button onClick={() => setTab('palettes')} className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px ${tab === 'palettes' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'}`}>
                    <Palette size={18} />
                    색상 팔레트
                </button>
                <button onClick={() => setTab('layouts')} className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-px ${tab === 'layouts' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'}`}>
                    <Layout size={18} />
                    레이아웃 규칙
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
                </div>
            ) : tab === 'templates' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div key={template.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="h-32 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-4xl">
                                {categoryIcons[template.category] || '📄'}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                    {template.isPublic ? (
                                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">공개</span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">비공개</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mb-3">{template.description || '설명 없음'}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{template.category}</span>
                                    <span>{template._count.presentations}개 사용중</span>
                                </div>
                            </div>
                            <div className="px-4 py-3 border-t bg-gray-50 flex gap-2">
                                <button className="flex-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-100"><Eye size={14} className="inline mr-1" />미리보기</button>
                                <button className="p-1.5 border rounded hover:bg-gray-100"><Edit size={14} /></button>
                                <button className="p-1.5 border rounded hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : tab === 'palettes' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {palettes.map((palette) => (
                        <div key={palette.id} className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-gray-900">{palette.name}</h3>
                                {palette.isPublic && <span className="text-xs text-green-600">공개</span>}
                            </div>
                            <div className="flex gap-1 mb-3">
                                {palette.colors.map((color, i) => (
                                    <div key={i} className="w-8 h-8 rounded" style={{ backgroundColor: color }} title={color} />
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 px-2 py-1 text-xs border rounded hover:bg-gray-100">수정</button>
                                <button className="px-2 py-1 text-xs border rounded hover:bg-red-50"><Trash2 size={12} className="text-red-500" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">슬라이드 타입</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기본값</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {layouts.map((layout) => (
                                <tr key={layout.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{layout.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{layout.slideType}</td>
                                    <td className="px-6 py-4">
                                        {layout.isDefault ? <ToggleRight className="text-green-500" size={24} /> : <ToggleLeft className="text-gray-400" size={24} />}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 hover:bg-gray-100 rounded"><Edit size={16} className="text-gray-500" /></button>
                                        <button className="p-1.5 hover:bg-red-50 rounded"><Trash2 size={16} className="text-red-500" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
