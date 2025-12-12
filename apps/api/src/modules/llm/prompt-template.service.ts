import { Injectable } from '@nestjs/common';
import { GenerateOutlineInput, GenerateSlideContentInput } from './llm.service';

@Injectable()
export class PromptTemplateService {
    getOutlinePrompt(input: GenerateOutlineInput): string {
        const languageInstructions =
            input.language === 'ko'
                ? '모든 내용을 한국어로 작성하세요.'
                : 'Write all content in English.';

        return `
당신은 전문 프레젠테이션 컨설턴트입니다.

다음 콘텐츠를 분석하여 ${input.slideCount}개의 슬라이드로 구성된 프레젠테이션 목차를 생성하세요.

${languageInstructions}

입력 콘텐츠:
---
${input.content.slice(0, 10000)}
---

슬라이드 타입 옵션:
- TITLE: 제목 슬라이드 (첫 슬라이드로 사용)
- CONTENT: 일반 콘텐츠
- BULLET_LIST: 글머리 기호 목록
- TWO_COLUMN: 2단 레이아웃
- IMAGE: 이미지 중심
- CHART: 차트/데이터 시각화
- QUOTE: 인용문
- COMPARISON: 비교
- SECTION_HEADER: 섹션 구분

출력 형식 (JSON):
{
  "title": "프레젠테이션 제목",
  "slides": [
    {
      "order": 1,
      "title": "슬라이드 제목",
      "type": "TITLE",
      "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"]
    }
  ]
}

규칙:
1. 첫 슬라이드는 반드시 TITLE 타입
2. 각 슬라이드별 keyPoints는 2-5개
3. 논리적인 흐름으로 구성
4. 청중이 이해하기 쉬운 언어 사용
5. 정확히 ${input.slideCount}개의 슬라이드 생성
`;
    }

    getSlideContentPrompt(input: GenerateSlideContentInput): string {
        const languageInstructions =
            input.language === 'ko'
                ? '모든 내용을 한국어로 작성하세요.'
                : 'Write all content in English.';

        const typeInstructions = this.getTypeInstructions(input.type);

        return `
슬라이드 콘텐츠를 생성하세요.

${languageInstructions}

슬라이드 정보:
- 제목: ${input.title}
- 타입: ${input.type}
- 핵심 포인트: ${input.keyPoints.join(', ')}

${typeInstructions}

출력 형식 (JSON):
{
  "heading": "메인 제목",
  "subheading": "부제목 (선택)",
  "body": "본문 텍스트 (선택)",
  "bullets": [
    { "text": "글머리 내용", "level": 0 }
  ]
}

규칙:
- 글머리 기호 텍스트는 각각 30자 이내
- 전체 글머리 기호는 5개 이하
- 명확하고 간결한 문장 사용
`;
    }

    private getTypeInstructions(type: string): string {
        const instructions: Record<string, string> = {
            TITLE: '큰 제목과 부제목만 생성. 글머리 기호 없음.',
            CONTENT: '제목과 본문 텍스트, 선택적으로 글머리 기호.',
            BULLET_LIST: '제목과 3-5개의 글머리 기호.',
            TWO_COLUMN: '제목과 2개의 섹션으로 나눌 수 있는 글머리 기호.',
            IMAGE: '제목과 이미지 설명에 적합한 짧은 텍스트.',
            CHART: '제목과 데이터 요약 텍스트.',
            QUOTE: '인용문과 출처.',
            COMPARISON: '비교 항목 리스트.',
            SECTION_HEADER: '섹션 제목만.',
        };

        return instructions[type] || instructions.CONTENT;
    }

    getEditPrompt(currentContent: string, instruction: string): string {
        return `
현재 콘텐츠:
---
${currentContent}
---

편집 지시:
${instruction}

위 지시에 따라 콘텐츠를 수정하고, 결과를 JSON 형식으로 반환하세요:
{
  "content": "수정된 콘텐츠"
}
`;
    }

    getSummaryPrompt(text: string, maxLength: number): string {
        return `
다음 텍스트를 ${maxLength}자 이내로 요약하세요:

${text}

JSON 형식으로 반환:
{
  "summary": "요약된 내용"
}
`;
    }

    getImageSearchPrompt(slideContent: string): string {
        return `
다음 슬라이드 내용에 어울리는 이미지를 찾기 위한 검색 키워드를 3개 제안하세요:

${slideContent}

JSON 형식으로 반환:
{
  "keywords": ["키워드1", "키워드2", "키워드3"]
}
`;
    }
}
