'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { generationApi, templatesApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    ArrowRight,
    Sparkles,
    FileText,
    Upload,
    AlertCircle,
    Loader2,
} from 'lucide-react';

const STEPS = ['입력', '옵션', '생성'] as const;

export default function CreatePage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Input state
    const [inputType, setInputType] = useState<'text' | 'file'>('text');
    const [textContent, setTextContent] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    // Options state
    const [slideCount, setSlideCount] = useState(10);
    const [language, setLanguage] = useState('ko');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [includeImages, setIncludeImages] = useState(true);
    const [includeCharts, setIncludeCharts] = useState(true);

    // Generation state
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setUploadedFile(acceptedFiles[0]);
            setInputType('file');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'text/markdown': ['.md'],
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
        maxSize: 50 * 1024 * 1024, // 50MB
    });

    const getSourceType = () => {
        if (inputType === 'text') return 'TEXT';
        if (!uploadedFile) return 'TEXT';
        const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
        const typeMap: Record<string, string> = {
            pdf: 'PDF',
            docx: 'DOCX',
            doc: 'DOCX',
            txt: 'TEXT',
            md: 'MARKDOWN',
            csv: 'CSV',
        };
        return typeMap[ext || ''] || 'TEXT';
    };

    const handleGenerate = async () => {
        if (!textContent && !uploadedFile) {
            toast({ title: '오류', description: '내용을 입력하거나 파일을 업로드해주세요.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        setStep(2);

        try {
            // For file upload, we'd need to read the file content
            // For now, just use text content
            const content = inputType === 'text' ? textContent : `File: ${uploadedFile?.name}`;

            const response = await generationApi.start({
                sourceType: getSourceType(),
                content,
                slideCount,
                language,
                templateId: selectedTemplateId,
                options: {
                    includeImages,
                    includeCharts,
                    style: 'professional',
                    tone: 'informative',
                },
            });

            setJobId(response.data.jobId);
            pollJobStatus(response.data.jobId, response.data.presentationId);
        } catch (error: any) {
            toast({
                title: '생성 실패',
                description: error.response?.data?.message || '프레젠테이션 생성에 실패했습니다.',
                variant: 'destructive',
            });
            setLoading(false);
            setStep(1);
        }
    };

    const pollJobStatus = async (jobId: string, presentationId: string) => {
        const poll = async () => {
            try {
                const response = await generationApi.status(jobId);
                const { status: jobStatus, progress: jobProgress } = response.data;

                setStatus(jobStatus);
                setProgress(jobProgress);

                if (jobStatus === 'COMPLETED') {
                    toast({ title: '생성 완료', description: '프레젠테이션이 생성되었습니다!' });
                    router.push(`/editor/${presentationId}`);
                } else if (jobStatus === 'FAILED') {
                    toast({ title: '생성 실패', description: '프레젠테이션 생성에 실패했습니다.', variant: 'destructive' });
                    setLoading(false);
                    setStep(1);
                } else {
                    setTimeout(poll, 2000);
                }
            } catch (error) {
                toast({ title: '오류', description: '상태 확인에 실패했습니다.', variant: 'destructive' });
                setLoading(false);
                setStep(1);
            }
        };

        poll();
    };

    const estimatedCredits = slideCount + (includeImages ? Math.ceil(slideCount * 0.3) : 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-4 w-4" />
                        대시보드로
                    </Link>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                        <span className="text-xl font-bold">새 프레젠테이션</span>
                    </div>
                    <div className="w-24" /> {/* Spacer */}
                </div>
            </header>

            {/* Progress Steps */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-center gap-8">
                        {STEPS.map((stepName, index) => (
                            <div key={stepName} className="flex items-center gap-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index <= step
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    {index + 1}
                                </div>
                                <span className={index <= step ? 'text-gray-900' : 'text-gray-400'}>
                                    {stepName}
                                </span>
                                {index < STEPS.length - 1 && (
                                    <div className={`w-12 h-0.5 ${index < step ? 'bg-purple-600' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Step 1: Input */}
                {step === 0 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">콘텐츠 입력</h2>
                            <p className="text-gray-500">프레젠테이션의 주제나 내용을 입력하세요</p>
                        </div>

                        {/* Tab buttons */}
                        <div className="flex gap-2">
                            <Button
                                variant={inputType === 'text' ? 'default' : 'outline'}
                                onClick={() => setInputType('text')}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                텍스트 입력
                            </Button>
                            <Button
                                variant={inputType === 'file' ? 'default' : 'outline'}
                                onClick={() => setInputType('file')}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                파일 업로드
                            </Button>
                        </div>

                        {inputType === 'text' ? (
                            <textarea
                                value={textContent}
                                onChange={(e) => setTextContent(e.target.value)}
                                placeholder="프레젠테이션 주제나 내용을 입력하세요...

예시:
- 2024년 AI 기술 트렌드와 비즈니스 적용 방안
- 스타트업 투자 유치를 위한 피칭 자료
- 마케팅 전략 분석 보고서"
                                className="w-full h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        ) : (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                {uploadedFile ? (
                                    <div>
                                        <FileText className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                                        <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <Button variant="ghost" className="mt-4" onClick={() => setUploadedFile(null)}>
                                            다른 파일 선택
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="font-medium text-gray-700">파일을 드래그하거나 클릭하여 업로드</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            PDF, DOCX, TXT, MD, CSV (최대 50MB)
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                onClick={() => setStep(1)}
                                disabled={!textContent && !uploadedFile}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                다음
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Options */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">생성 옵션</h2>
                            <p className="text-gray-500">프레젠테이션 스타일을 설정하세요</p>
                        </div>

                        <div className="bg-white rounded-lg border p-6 space-y-6">
                            {/* Slide count */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    슬라이드 수
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min={3}
                                        max={30}
                                        value={slideCount}
                                        onChange={(e) => setSlideCount(Number(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="w-12 text-center font-medium">{slideCount}</span>
                                </div>
                            </div>

                            {/* Language */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    언어
                                </label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={language === 'ko' ? 'default' : 'outline'}
                                        onClick={() => setLanguage('ko')}
                                    >
                                        한국어
                                    </Button>
                                    <Button
                                        variant={language === 'en' ? 'default' : 'outline'}
                                        onClick={() => setLanguage('en')}
                                    >
                                        English
                                    </Button>
                                </div>
                            </div>

                            {/* Options */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    추가 옵션
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={includeImages}
                                            onChange={(e) => setIncludeImages(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>이미지 포함</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={includeCharts}
                                            onChange={(e) => setIncludeCharts(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>차트 포함</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Cost estimate */}
                        <div className="bg-purple-50 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-purple-600" />
                                <span className="text-purple-900">예상 크레딧 비용</span>
                            </div>
                            <span className="font-bold text-purple-600">{estimatedCredits} 크레딧</span>
                        </div>

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(0)}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                이전
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                생성하기
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Generating */}
                {step === 2 && (
                    <div className="text-center py-12">
                        <Loader2 className="h-16 w-16 text-purple-600 animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">프레젠테이션 생성 중</h2>
                        <p className="text-gray-500 mb-8">
                            AI가 프레젠테이션을 생성하고 있습니다. 잠시만 기다려주세요...
                        </p>

                        <div className="max-w-md mx-auto">
                            <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-purple-600 h-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-sm text-gray-500">
                                <span>{status}</span>
                                <span>{progress}%</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
