# Management System Development Plan

## 프로젝트 개요
- **목적**: Google Sheets 데이터를 Airtable로 마이그레이션하여 통합 관리 시스템 구축
- **소스**: Google Sheets "서울 관리", "수원 관리" 탭
- **타겟**: Airtable 신규 테이블 + management.html 대시보드
- **시작일**: 2025-09-29

## 데이터 소스
- **URL**: https://docs.google.com/spreadsheets/d/1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY/
- **탭**: 서울 관리 (gid=448929090), 수원 관리

## 핵심 요구사항
1. **키 필드**: UID (고유 식별자)
2. **정렬 기준**: 예약 날짜 → 시스템 예약 시간대
3. **결과 필드**: 참여 여부 결과
4. **중복 제거**: UID 기준 중복 제거
5. **데이터 통합**: MetrixTable2와 조합

## 개발 단계

### Phase 1: 데이터 분석 및 추출
- [ ] Google Sheets API 연동 또는 CSV 추출
- [ ] 데이터 구조 분석
- [ ] 필드 매핑 정의

### Phase 2: 데이터 전처리
- [ ] 필드명 영문화
- [ ] 데이터 정규화
- [ ] 중복 제거 로직
- [ ] 데이터 검증

### Phase 3: Airtable 구성
- [ ] 테이블 스키마 설계
- [ ] API 연동 설정
- [ ] 데이터 업로드

### Phase 4: 웹 인터페이스
- [ ] management.html 개발
- [ ] 대시보드 구현
- [ ] CRUD 기능
- [ ] 실시간 동기화

### Phase 5: 테스트 및 배포
- [ ] 기능 테스트
- [ ] 성능 최적화
- [ ] Netlify 배포
- [ ] 문서화

## 기술 스택
- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **Backend**: Netlify Functions
- **Database**: Airtable
- **Data Processing**: Python (pandas)
- **Deployment**: Netlify

## 파일 구조
```
/Users/lua/Metrix/
├── management.html           # 새 관리자 페이지
├── management.js             # 프론트엔드 로직
├── scripts/
│   ├── extract_sheets_data.py    # Google Sheets 데이터 추출
│   ├── field_mapping.json        # 필드 매핑 정의
│   ├── process_management_data.py # 데이터 전처리
│   └── upload_to_airtable.py     # Airtable 업로드
├── netlify/functions/
│   └── management-api.js     # 관리 시스템 API
└── docs/
    ├── DEVELOPMENT_PLAN.md   # 본 문서
    ├── FIELD_MAPPING.md      # 필드 매핑 문서
    └── DEVELOPMENT_HISTORY.md # 개발 히스토리
```

## 진행 상태
- 작성일: 2025-09-29
- 현재 단계: Phase 1 - 데이터 분석
- 다음 단계: 필드 매핑 정의