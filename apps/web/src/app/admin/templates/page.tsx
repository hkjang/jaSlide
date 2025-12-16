'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText, Palette, Layout, ToggleLeft, ToggleRight, Trash2, Edit, Eye, X, Check, Loader2 } from 'lucide-react';

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
    config: any;
    isDefault: boolean;
}

type Tab = 'templates' | 'palettes' | 'layouts';

const CATEGORIES = ['BUSINESS', 'EDUCATION', 'CREATIVE', 'MINIMAL', 'TECH', 'MARKETING', 'CUSTOM'];
const SLIDE_TYPES = ['TITLE', 'CONTENT', 'TWO_COLUMN', 'IMAGE', 'CHART', 'QUOTE', 'BULLET_LIST', 'COMPARISON', 'TIMELINE', 'SECTION_HEADER', 'BLANK'];

export default function AdminTemplatesPage() {
    const [tab, setTab] = useState<Tab>('templates');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [palettes, setPalettes] = useState<ColorPalette[]>([]);
    const [layouts, setLayouts] = useState<LayoutRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal states
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showPaletteModal, setShowPaletteModal] = useState(false);
    const [showLayoutModal, setShowLayoutModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: string; id: string } | null>(null);

    // Form states
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [editingPalette, setEditingPalette] = useState<ColorPalette | null>(null);
    const [editingLayout, setEditingLayout] = useState<LayoutRule | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

    // Template form
    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        category: 'BUSINESS',
        isPublic: true,
        config: {
            colors: { primary: '#2563eb', secondary: '#64748b', accent: '#0ea5e9', background: '#ffffff', text: '#1e293b', textSecondary: '#64748b' },
            typography: { titleFont: 'Inter', bodyFont: 'Inter', titleSize: { xl: 44, lg: 36, md: 28, sm: 24, xs: 20 }, bodySize: { xl: 24, lg: 20, md: 18, sm: 16, xs: 14 }, lineHeight: 1.5 },
            layouts: { margins: { top: 40, right: 40, bottom: 40, left: 40 }, spacing: 20, contentWidth: 880, contentAlignment: 'left' },
            backgrounds: { type: 'solid', value: '#ffffff' }
        }
    });

    // Palette form
    const [paletteForm, setPaletteForm] = useState({
        name: '',
        colors: ['#2563eb', '#64748b', '#0ea5e9', '#ffffff', '#1e293b'],
        isPublic: true
    });

    // Layout form
    const [layoutForm, setLayoutForm] = useState({
        name: '',
        slideType: 'CONTENT',
        isDefault: false,
        config: {}
    });

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('accessToken');
        return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    };

    useEffect(() => {
        fetchData();
    }, [tab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            if (tab === 'templates') {
                const res = await fetch(`${API_URL}/admin/templates`, { headers });
                if (res.ok) setTemplates((await res.json()).data || []);
            } else if (tab === 'palettes') {
                const res = await fetch(`${API_URL}/admin/templates/palettes/list`, { headers });
                if (res.ok) setPalettes((await res.json()).data || []);
            } else {
                const res = await fetch(`${API_URL}/admin/templates/layouts/list`, { headers });
                if (res.ok) setLayouts((await res.json()).data || []);
            }
        } catch (err) {
            showToast('데이터를 불러오는데 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Template CRUD
    const handleCreateTemplate = () => {
        setEditingTemplate(null);
        setTemplateForm({
            name: '',
            description: '',
            category: 'BUSINESS',
            isPublic: true,
            config: {
                colors: { primary: '#2563eb', secondary: '#64748b', accent: '#0ea5e9', background: '#ffffff', text: '#1e293b', textSecondary: '#64748b' },
                typography: { titleFont: 'Inter', bodyFont: 'Inter', titleSize: { xl: 44, lg: 36, md: 28, sm: 24, xs: 20 }, bodySize: { xl: 24, lg: 20, md: 18, sm: 16, xs: 14 }, lineHeight: 1.5 },
                layouts: { margins: { top: 40, right: 40, bottom: 40, left: 40 }, spacing: 20, contentWidth: 880, contentAlignment: 'left' },
                backgrounds: { type: 'solid', value: '#ffffff' }
            }
        });
        setShowTemplateModal(true);
    };

    const handleEditTemplate = (template: Template) => {
        setEditingTemplate(template);
        setTemplateForm({
            name: template.name,
            description: template.description || '',
            category: template.category,
            isPublic: template.isPublic,
            config: template.config
        });
        setShowTemplateModal(true);
    };

    const handleSaveTemplate = async () => {
        if (!templateForm.name.trim()) {
            showToast('템플릿 이름을 입력하세요.', 'error');
            return;
        }
        setSaving(true);
        try {
            const headers = getAuthHeaders();
            if (editingTemplate) {
                const res = await fetch(`${API_URL}/admin/templates/${editingTemplate.id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(templateForm)
                });
                if (!res.ok) throw new Error('Update failed');
                showToast('템플릿이 수정되었습니다.');
            } else {
                const res = await fetch(`${API_URL}/admin/templates`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(templateForm)
                });
                if (!res.ok) throw new Error('Create failed');
                showToast('템플릿이 생성되었습니다.');
            }
            setShowTemplateModal(false);
            fetchData();
        } catch (err) {
            showToast('저장에 실패했습니다.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/admin/templates/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Delete failed');
            showToast('템플릿이 삭제되었습니다.');
            setShowDeleteConfirm(null);
            fetchData();
        } catch (err) {
            showToast('삭제에 실패했습니다. 사용 중인 템플릿은 삭제할 수 없습니다.', 'error');
        }
    };

    const handleToggleTemplatePublic = async (template: Template) => {
        try {
            const res = await fetch(`${API_URL}/admin/templates/${template.id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isPublic: !template.isPublic })
            });
            if (!res.ok) throw new Error('Update failed');
            showToast(`템플릿이 ${template.isPublic ? '비공개' : '공개'}로 변경되었습니다.`);
            fetchData();
        } catch (err) {
            showToast('변경에 실패했습니다.', 'error');
        }
    };

    // Palette CRUD
    const handleCreatePalette = () => {
        setEditingPalette(null);
        setPaletteForm({ name: '', colors: ['#2563eb', '#64748b', '#0ea5e9', '#ffffff', '#1e293b'], isPublic: true });
        setShowPaletteModal(true);
    };

    const handleEditPalette = (palette: ColorPalette) => {
        setEditingPalette(palette);
        setPaletteForm({ name: palette.name, colors: palette.colors, isPublic: palette.isPublic });
        setShowPaletteModal(true);
    };

    const handleSavePalette = async () => {
        if (!paletteForm.name.trim()) {
            showToast('팔레트 이름을 입력하세요.', 'error');
            return;
        }
        setSaving(true);
        try {
            const headers = getAuthHeaders();
            if (editingPalette) {
                // Note: Update endpoint may need to be added to backend
                showToast('팔레트 수정 기능은 준비 중입니다.', 'error');
            } else {
                const res = await fetch(`${API_URL}/admin/templates/palettes`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(paletteForm)
                });
                if (!res.ok) throw new Error('Create failed');
                showToast('팔레트가 생성되었습니다.');
            }
            setShowPaletteModal(false);
            fetchData();
        } catch (err) {
            showToast('저장에 실패했습니다.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePalette = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/admin/templates/palettes/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Delete failed');
            showToast('팔레트가 삭제되었습니다.');
            setShowDeleteConfirm(null);
            fetchData();
        } catch (err) {
            showToast('삭제에 실패했습니다.', 'error');
        }
    };

    // Layout CRUD
    const handleCreateLayout = () => {
        setEditingLayout(null);
        setLayoutForm({ name: '', slideType: 'CONTENT', isDefault: false, config: {} });
        setShowLayoutModal(true);
    };

    const handleEditLayout = (layout: LayoutRule) => {
        setEditingLayout(layout);
        setLayoutForm({ name: layout.name, slideType: layout.slideType, isDefault: layout.isDefault, config: layout.config });
        setShowLayoutModal(true);
    };

    const handleSaveLayout = async () => {
        if (!layoutForm.name.trim()) {
            showToast('레이아웃 이름을 입력하세요.', 'error');
            return;
        }
        setSaving(true);
        try {
            const headers = getAuthHeaders();
            if (editingLayout) {
                // Note: Update endpoint may need to be added to backend
                showToast('레이아웃 수정 기능은 준비 중입니다.', 'error');
            } else {
                const res = await fetch(`${API_URL}/admin/templates/layouts`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(layoutForm)
                });
                if (!res.ok) throw new Error('Create failed');
                showToast('레이아웃이 생성되었습니다.');
            }
            setShowLayoutModal(false);
            fetchData();
        } catch (err) {
            showToast('저장에 실패했습니다.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLayout = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/admin/templates/layouts/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Delete failed');
            showToast('레이아웃이 삭제되었습니다.');
            setShowDeleteConfirm(null);
            fetchData();
        } catch (err) {
            showToast('삭제에 실패했습니다.', 'error');
        }
    };

    const categoryIcons: Record<string, string> = {
        BUSINESS: '💼',
        EDUCATION: '📚',
        CREATIVE: '🎨',
        MINIMAL: '⚪',
        PROFESSIONAL: '📊',
        TECH: '💻',
        MARKETING: '📢',
        CUSTOM: '✨',
    };

    return (
        <div className="p-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">템플릿 관리</h1>
                    <p className="text-sm text-gray-500">템플릿, 색상 팔레트, 레이아웃 규칙</p>
                </div>
                <button
                    onClick={() => {
                        if (tab === 'templates') handleCreateTemplate();
                        else if (tab === 'palettes') handleCreatePalette();
                        else handleCreateLayout();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
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
                    {templates.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p>등록된 템플릿이 없습니다.</p>
                            <button onClick={handleCreateTemplate} className="mt-4 text-purple-600 hover:underline">
                                첫 템플릿 추가하기
                            </button>
                        </div>
                    ) : templates.map((template) => (
                        <div key={template.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div
                                className="h-32 flex items-center justify-center text-4xl"
                                style={{ background: template.config?.backgrounds?.value || template.config?.colors?.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            >
                                {categoryIcons[template.category] || '📄'}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                    <button
                                        onClick={() => handleToggleTemplatePublic(template)}
                                        title={template.isPublic ? '공개 중' : '비공개'}
                                    >
                                        {template.isPublic ? (
                                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded cursor-pointer hover:bg-green-200">공개</span>
                                        ) : (
                                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded cursor-pointer hover:bg-gray-200">비공개</span>
                                        )}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">{template.description || '설명 없음'}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{template.category}</span>
                                    <span>{template._count?.presentations || 0}개 사용중</span>
                                </div>
                            </div>
                            <div className="px-4 py-3 border-t bg-gray-50 flex gap-2">
                                <button
                                    onClick={() => { setPreviewTemplate(template); setShowPreviewModal(true); }}
                                    className="flex-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-100"
                                >
                                    <Eye size={14} className="inline mr-1" />미리보기
                                </button>
                                <button
                                    onClick={() => handleEditTemplate(template)}
                                    className="p-1.5 border rounded hover:bg-gray-100"
                                >
                                    <Edit size={14} />
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm({ type: 'template', id: template.id })}
                                    className="p-1.5 border rounded hover:bg-red-50"
                                >
                                    <Trash2 size={14} className="text-red-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : tab === 'palettes' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {palettes.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <Palette size={48} className="mx-auto mb-4 opacity-50" />
                            <p>등록된 팔레트가 없습니다.</p>
                            <button onClick={handleCreatePalette} className="mt-4 text-purple-600 hover:underline">
                                첫 팔레트 추가하기
                            </button>
                        </div>
                    ) : palettes.map((palette) => (
                        <div key={palette.id} className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-gray-900">{palette.name}</h3>
                                {palette.isPublic && <span className="text-xs text-green-600">공개</span>}
                            </div>
                            <div className="flex gap-1 mb-3">
                                {(palette.colors || []).map((color, i) => (
                                    <div key={i} className="w-8 h-8 rounded border" style={{ backgroundColor: color }} title={color} />
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditPalette(palette)} className="flex-1 px-2 py-1 text-xs border rounded hover:bg-gray-100">수정</button>
                                <button onClick={() => setShowDeleteConfirm({ type: 'palette', id: palette.id })} className="px-2 py-1 text-xs border rounded hover:bg-red-50">
                                    <Trash2 size={12} className="text-red-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {layouts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Layout size={48} className="mx-auto mb-4 opacity-50" />
                            <p>등록된 레이아웃이 없습니다.</p>
                            <button onClick={handleCreateLayout} className="mt-4 text-purple-600 hover:underline">
                                첫 레이아웃 추가하기
                            </button>
                        </div>
                    ) : (
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
                                            <button onClick={() => handleEditLayout(layout)} className="p-1.5 hover:bg-gray-100 rounded">
                                                <Edit size={16} className="text-gray-500" />
                                            </button>
                                            <button onClick={() => setShowDeleteConfirm({ type: 'layout', id: layout.id })} className="p-1.5 hover:bg-red-50 rounded">
                                                <Trash2 size={16} className="text-red-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">{editingTemplate ? '템플릿 수정' : '새 템플릿'}</h2>
                            <button onClick={() => setShowTemplateModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                                <input
                                    type="text"
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="템플릿 이름"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                                <textarea
                                    value={templateForm.description}
                                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    rows={3}
                                    placeholder="템플릿 설명"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                                <select
                                    value={templateForm.category}
                                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                                    <input
                                        type="color"
                                        value={templateForm.config.colors.primary}
                                        onChange={(e) => setTemplateForm({ ...templateForm, config: { ...templateForm.config, colors: { ...templateForm.config.colors, primary: e.target.value } } })}
                                        className="w-full h-10 rounded cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                                    <input
                                        type="color"
                                        value={templateForm.config.colors.background}
                                        onChange={(e) => setTemplateForm({ ...templateForm, config: { ...templateForm.config, colors: { ...templateForm.config.colors, background: e.target.value }, backgrounds: { type: 'solid', value: e.target.value } } })}
                                        className="w-full h-10 rounded cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                                    <input
                                        type="color"
                                        value={templateForm.config.colors.text}
                                        onChange={(e) => setTemplateForm({ ...templateForm, config: { ...templateForm.config, colors: { ...templateForm.config.colors, text: e.target.value } } })}
                                        className="w-full h-10 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    checked={templateForm.isPublic}
                                    onChange={(e) => setTemplateForm({ ...templateForm, isPublic: e.target.checked })}
                                    className="rounded"
                                />
                                <label htmlFor="isPublic" className="text-sm text-gray-700">공개 (모든 사용자에게 표시)</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                취소
                            </button>
                            <button onClick={handleSaveTemplate} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                {editingTemplate ? '수정' : '생성'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Palette Modal */}
            {showPaletteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">{editingPalette ? '팔레트 수정' : '새 팔레트'}</h2>
                            <button onClick={() => setShowPaletteModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                                <input
                                    type="text"
                                    value={paletteForm.name}
                                    onChange={(e) => setPaletteForm({ ...paletteForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="팔레트 이름"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">색상 (5개)</label>
                                <div className="flex gap-2">
                                    {paletteForm.colors.map((color, i) => (
                                        <div key={i} className="relative">
                                            <input
                                                type="color"
                                                value={color}
                                                onChange={(e) => {
                                                    const newColors = [...paletteForm.colors];
                                                    newColors[i] = e.target.value;
                                                    setPaletteForm({ ...paletteForm, colors: newColors });
                                                }}
                                                className="w-12 h-12 rounded cursor-pointer"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="palettePublic"
                                    checked={paletteForm.isPublic}
                                    onChange={(e) => setPaletteForm({ ...paletteForm, isPublic: e.target.checked })}
                                    className="rounded"
                                />
                                <label htmlFor="palettePublic" className="text-sm text-gray-700">공개</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button onClick={() => setShowPaletteModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                취소
                            </button>
                            <button onClick={handleSavePalette} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                {editingPalette ? '수정' : '생성'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Layout Modal */}
            {showLayoutModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">{editingLayout ? '레이아웃 수정' : '새 레이아웃'}</h2>
                            <button onClick={() => setShowLayoutModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                                <input
                                    type="text"
                                    value={layoutForm.name}
                                    onChange={(e) => setLayoutForm({ ...layoutForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="레이아웃 이름"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">슬라이드 타입</label>
                                <select
                                    value={layoutForm.slideType}
                                    onChange={(e) => setLayoutForm({ ...layoutForm, slideType: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    {SLIDE_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={layoutForm.isDefault}
                                    onChange={(e) => setLayoutForm({ ...layoutForm, isDefault: e.target.checked })}
                                    className="rounded"
                                />
                                <label htmlFor="isDefault" className="text-sm text-gray-700">기본 레이아웃으로 설정</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button onClick={() => setShowLayoutModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                취소
                            </button>
                            <button onClick={handleSaveLayout} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                                {saving && <Loader2 size={16} className="animate-spin" />}
                                {editingLayout ? '수정' : '생성'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && previewTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">템플릿 미리보기: {previewTemplate.name}</h2>
                            <button onClick={() => setShowPreviewModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <div
                                className="aspect-[16/9] rounded-lg flex items-center justify-center"
                                style={{
                                    background: previewTemplate.config?.backgrounds?.value || previewTemplate.config?.colors?.background || '#ffffff',
                                    color: previewTemplate.config?.colors?.text || '#000000'
                                }}
                            >
                                <div className="text-center p-8">
                                    <h1 style={{ fontFamily: previewTemplate.config?.typography?.titleFont || 'Inter', fontSize: '36px', fontWeight: 'bold', color: previewTemplate.config?.colors?.primary || '#2563eb' }}>
                                        {previewTemplate.name}
                                    </h1>
                                    <p style={{ fontFamily: previewTemplate.config?.typography?.bodyFont || 'Inter', fontSize: '18px', marginTop: '16px', color: previewTemplate.config?.colors?.textSecondary || '#64748b' }}>
                                        {previewTemplate.description || '템플릿 미리보기'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium">카테고리:</span> {previewTemplate.category}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium">상태:</span> {previewTemplate.isPublic ? '공개' : '비공개'}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium">Primary:</span>
                                    <span className="inline-block w-4 h-4 ml-2 rounded" style={{ backgroundColor: previewTemplate.config?.colors?.primary || '#2563eb' }}></span>
                                    {previewTemplate.config?.colors?.primary || '#2563eb'}
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium">폰트:</span> {previewTemplate.config?.typography?.titleFont || 'Inter'}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end p-4 border-t">
                            <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">삭제 확인</h3>
                        <p className="text-gray-600 mb-6">정말 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    if (showDeleteConfirm.type === 'template') handleDeleteTemplate(showDeleteConfirm.id);
                                    else if (showDeleteConfirm.type === 'palette') handleDeletePalette(showDeleteConfirm.id);
                                    else handleDeleteLayout(showDeleteConfirm.id);
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
