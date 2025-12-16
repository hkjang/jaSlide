'use client';

import { useMemo } from 'react';

/**
 * 전문 용어를 쉬운 표현으로 변환하는 사용자 언어 사전 시스템
 * UX 레이어에서 기술 용어를 자동 치환합니다.
 */

// 용어 변환 사전
const TERM_DICTIONARY: Record<string, string> = {
    // 기술 용어 → 쉬운 표현
    'rendering': '화면 그리기',
    'API': '서버 연결',
    'token': '사용량',
    'LLM': 'AI 모델',
    'fallback': '대체 방법',
    'cache': '임시 저장',
    'sync': '동기화',
    'async': '백그라운드 처리',
    'timeout': '시간 초과',
    'rate limit': '요청 한도 초과',
    'authentication': '로그인 인증',
    'authorization': '접근 권한',
    'parsing': '내용 분석',
    'validation': '검증',
    'optimization': '최적화',
    'configuration': '설정',
    'deployment': '배포',
    'repository': '저장소',
    'endpoint': '서버 주소',
    'payload': '전송 데이터',
    'callback': '후속 처리',
    'middleware': '중간 처리',
    'schema': '데이터 구조',
    'migration': '데이터 이전',
    'transaction': '작업 단위',
    'query': '조회',
    'mutation': '변경',
    'throttling': '요청 제한',
    'debounce': '입력 대기',
    'latency': '응답 지연',
    'bandwidth': '전송 용량',
    'compression': '압축',
    'encryption': '암호화',
    'decryption': '복호화',
    'serialization': '데이터 변환',
    'deserialization': '데이터 복원',
    // 에러 메시지 관련
    'Internal Server Error': '서버에 일시적인 문제가 발생했습니다',
    'Bad Request': '요청 형식이 올바르지 않습니다',
    'Unauthorized': '로그인이 필요합니다',
    'Forbidden': '접근 권한이 없습니다',
    'Not Found': '요청한 정보를 찾을 수 없습니다',
    'Service Unavailable': '서비스 점검 중입니다',
    'Gateway Timeout': '서버 응답이 지연되고 있습니다',
    'Connection refused': '서버에 연결할 수 없습니다',
    'Network Error': '네트워크 연결을 확인해주세요',
};

// 정규식으로 매칭할 패턴들
const PATTERN_DICTIONARY: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /status code (\d{3})/gi, replacement: '오류 코드 $1' },
    { pattern: /HTTP (\d{3})/gi, replacement: '오류 상태 $1' },
    { pattern: /retry after (\d+) seconds/gi, replacement: '$1초 후 다시 시도해주세요' },
];

/**
 * 텍스트에서 전문 용어를 쉬운 표현으로 변환
 */
export function translateTerm(text: string): string {
    let result = text;

    // 정확한 용어 매칭
    Object.entries(TERM_DICTIONARY).forEach(([term, replacement]) => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        result = result.replace(regex, replacement);
    });

    // 패턴 매칭
    PATTERN_DICTIONARY.forEach(({ pattern, replacement }) => {
        result = result.replace(pattern, replacement);
    });

    return result;
}

/**
 * 에러 메시지를 사용자 친화적으로 변환
 */
export function translateErrorMessage(error: string | Error): string {
    const message = typeof error === 'string' ? error : error.message;

    // 기본 변환
    let result = translateTerm(message);

    // 기술적 스택 트레이스 제거
    result = result.replace(/at\s+\w+.*\n?/g, '');
    result = result.replace(/Error:\s*/g, '');

    // 빈 줄 정리
    result = result.replace(/\n{2,}/g, '\n').trim();

    // 메시지가 비어있거나 너무 기술적인 경우 기본 메시지
    if (!result || result.length < 5) {
        return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }

    return result;
}

interface UserTermDictionaryProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * 자식 요소의 텍스트 콘텐츠를 자동으로 번역하는 래퍼 컴포넌트
 */
export function UserTermDictionary({ children, className }: UserTermDictionaryProps) {
    return <div className={className}>{children}</div>;
}

/**
 * 단일 텍스트를 번역하여 표시하는 컴포넌트
 */
export function TranslatedText({ text }: { text: string }) {
    const translated = useMemo(() => translateTerm(text), [text]);
    return <>{translated}</>;
}

/**
 * 에러 메시지를 번역하여 표시하는 컴포넌트
 */
export function TranslatedError({ error }: { error: string | Error }) {
    const translated = useMemo(() => translateErrorMessage(error), [error]);
    return <span className="text-red-600">{translated}</span>;
}

// 커스텀 훅: 용어 번역
export function useTermTranslation() {
    return {
        translate: translateTerm,
        translateError: translateErrorMessage,
    };
}

export default UserTermDictionary;
