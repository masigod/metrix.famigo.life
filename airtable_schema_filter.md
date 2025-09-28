# Airtable Table Schema for K-Beauty_Panel_Updated

## Table Name: MetrixTable2 (Filtered Data)
**Environment Variable:** `Airtable_MetrixTable2_ID`

## Field Definitions

### Primary Fields
| Field Name (Airtable) | Field Type | Description | Source Column |
|----------------------|------------|-------------|---------------|
| email | Email | 이메일 주소 | 이메일 |
| name | Single line text | 참가자 이름 | 이름 |
| response_time | Date | 응답 시간 | 응답시간 |
| nationality | Single line text | 국적 | 국적 |
| culture_region | Long text | 문화권 | 문화권 |
| gender | Single select | 성별 (Female/Male) | 성별 |
| birth_date | Date | 생년월일 | 생년 |
| ethnicity | Single line text | 인종 | 인종 |
| visa_type | Single line text | 비자 유형 | 비자 |

### Contact Information
| Field Name (Airtable) | Field Type | Description | Source Column |
|----------------------|------------|-------------|---------------|
| payment_method | Single line text | 수령 방식 | 수령 방식 |
| contact_method | Single line text | 연락 방법 | 연락방법 |
| contact_info | Single line text | 연락처 | 연락처 |
| phone | Phone number | 전화번호 | 전화번호 |

### Reservation Details
| Field Name (Airtable) | Field Type | Description | Source Column |
|----------------------|------------|-------------|---------------|
| reservation_location | Single select | 예약 지점 (서울/수원) | 예약 지점 |
| reservation_date | Date | 예약 날짜 | 예약 날짜 |
| reservation_time | Single line text | 예약 시간 | 예약시간 |
| first_contact | Date | 최초 응대 | 최초 응대 |

### Status Fields
| Field Name (Airtable) | Field Type | Description | Source Column |
|----------------------|------------|-------------|---------------|
| confirmation_status | Single line text | 확정 여부 | 확정 여부 |
| initial_registration | Single line text | 최초 등록 여부 | 최초 등록 여부 |
| participation_result | Single select | 참여여부결과 (참여/불참/보류/거부/변경) | 참여여부결과 |

### Additional Information
| Field Name (Airtable) | Field Type | Description | Source Column |
|----------------------|------------|-------------|---------------|
| referrer_code | Single line text | 추천인 코드 | 추천인 코드 |
| notes | Long text | 비고 | 비고 |
| comments | Long text | 첨언 | 첨언 |
| application_date | Date | 신청 날짜 | 신청 날짜 |
| appointment_time | Single line text | 예약 시간 (별도) | 예약 시간 |

## Single Select Options

### gender
- Female
- Male

### reservation_location
- 서울(Seoul)
- 수원(Suwon)

### participation_result
- 참여
- 불참
- 보류
- 거부
- 변경
- 중복
- 취소

## Notes for Airtable Setup

1. **Primary Field**: Set `name` as the primary field
2. **Date Format**: Use ISO format (YYYY-MM-DD) for all date fields
3. **Required Fields**: Consider making `email`, `name`, and `phone` required
4. **Unique Fields**: Consider making `email` unique
5. **View Settings**: Create views for:
   - All Records
   - Participated (participation_result = "참여")
   - Not Participated (participation_result = "불참")
   - Pending (participation_result = "보류")
   - Seoul Location
   - Suwon Location

## CSV to Airtable Import Mapping

When importing the CSV file, map the columns as follows:

```javascript
const fieldMapping = {
    '이메일': 'email',
    '이름': 'name',
    '응답시간': 'response_time',
    '국적': 'nationality',
    '문화권': 'culture_region',
    '성별': 'gender',
    '생년': 'birth_date',
    '인종': 'ethnicity',
    '비자': 'visa_type',
    '수령 방식': 'payment_method',
    '연락방법': 'contact_method',
    '연락처': 'contact_info',
    '전화번호': 'phone',
    '예약 지점': 'reservation_location',
    '예약 날짜': 'reservation_date',
    '예약시간': 'reservation_time',
    '최초 응대': 'first_contact',
    '확정 여부': 'confirmation_status',
    '최초 등록 여부': 'initial_registration',
    '참여여부결과': 'participation_result',
    '추천인 코드': 'referrer_code',
    '비고': 'notes',
    '첨언': 'comments',
    '신청 날짜': 'application_date',
    '예약 시간': 'appointment_time'
};
```