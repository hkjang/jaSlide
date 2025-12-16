'use client';

import { useState } from 'react';

interface StylePropertiesProps {
    value: any;
    onChange: (updates: any) => void;
}

const PRESET_COLORS = [
    '#000000', '#FFFFFF', '#6366F1', '#8B5CF6', '#EC4899',
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6B7280',
];

export function StyleProperties({ value, onChange }: StylePropertiesProps) {
    const content = value?.content || {};
    const style = content.style || {};

    const handleStyleChange = (key: string, val: any) => {
        onChange({
            content: {
                ...content,
                style: {
                    ...style,
                    [key]: val,
                },
            },
        });
    };

    return (
        <div className="space-y-4">
            {/* Fill Color */}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    채우기 색상
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={style.backgroundColor || '#FFFFFF'}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border"
                    />
                    <input
                        type="text"
                        value={style.backgroundColor || '#FFFFFF'}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                        placeholder="#FFFFFF"
                    />
                </div>
                <div className="flex gap-1 mt-2">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color}
                            onClick={() => handleStyleChange('backgroundColor', color)}
                            className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>

            {/* Text Color */}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    텍스트 색상
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={style.color || '#000000'}
                        onChange={(e) => handleStyleChange('color', e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border"
                    />
                    <input
                        type="text"
                        value={style.color || '#000000'}
                        onChange={(e) => handleStyleChange('color', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                        placeholder="#000000"
                    />
                </div>
                <div className="flex gap-1 mt-2">
                    {PRESET_COLORS.map((color) => (
                        <button
                            key={color}
                            onClick={() => handleStyleChange('color', color)}
                            className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            </div>

            {/* Border */}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    테두리
                </label>
                <div className="grid grid-cols-3 gap-2">
                    <input
                        type="number"
                        value={style.borderWidth || 0}
                        onChange={(e) => handleStyleChange('borderWidth', Number(e.target.value))}
                        className="px-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="두께"
                        min={0}
                    />
                    <select
                        value={style.borderStyle || 'solid'}
                        onChange={(e) => handleStyleChange('borderStyle', e.target.value)}
                        className="px-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="solid">실선</option>
                        <option value="dashed">점선</option>
                        <option value="dotted">점</option>
                    </select>
                    <input
                        type="color"
                        value={style.borderColor || '#000000'}
                        onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                        className="w-full h-8 rounded cursor-pointer border"
                    />
                </div>
            </div>

            {/* Border Radius */}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    모서리 둥글기
                </label>
                <input
                    type="range"
                    min={0}
                    max={50}
                    value={style.borderRadius || 0}
                    onChange={(e) => handleStyleChange('borderRadius', Number(e.target.value))}
                    className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>각진</span>
                    <span>{style.borderRadius || 0}px</span>
                    <span>둥근</span>
                </div>
            </div>

            {/* Opacity */}
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    투명도
                </label>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={(style.opacity || 1) * 100}
                    onChange={(e) => handleStyleChange('opacity', Number(e.target.value) / 100)}
                    className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>투명</span>
                    <span>{Math.round((style.opacity || 1) * 100)}%</span>
                    <span>불투명</span>
                </div>
            </div>
        </div>
    );
}

export default StyleProperties;
