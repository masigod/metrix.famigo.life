// Airtable Configuration
const AIRTABLE_CONFIG = {
    // API Key는 보안을 위해 환경변수나 별도 설정 파일에서 관리해야 합니다
    // ⚠️ 실제 값은 HTML의 입력 필드에서 입력받습니다
    apiKey: '', // 런타임에 입력
    baseId: '', // 런타임에 입력
    tableName: 'tblyCqebagr8XkLeT', // Table ID (테이블 이름이 아닌 ID 사용)
    viewName: 'Grid view', // 뷰 이름 (선택사항)

    // API 엔드포인트
    get apiUrl() {
        // Table ID는 인코딩이 필요 없음
        return `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;
    }
};

// Airtable 필드 매핑
const FIELD_MAPPING = {
    // Airtable 필드명 : 로컬 필드명
    'ID': 'index',
    'Name': '작성자',
    'Email': '아이디',
    'Phone': '21-1, Please write your phone number.',
    'Nationality': '회원정보국가',
    'Location': '예약 지점',
    'Reservation_Date': '예약 날짜',
    'Reservation_Time': '예약시간',
    'Status': '상태',
    'Participation_Result': '참여여부결과',
    'Submission_Date': '응답시간',
    'Preferred_Dates': '25. When can you visit the site? Please select all available dates, and we will confirm your appointment. (Please choose maximum of 2)',
    'Preferred_Time': '26. Which time slot do you prefer?',
    'First_Response': '최초 응대',
    'Confirmation': '확정 여부',
    'Group': '그룹구분',
    'Notes': '비고',
    'Additional_Notes': '첨언',
    'Gender': '2.  What is your gender?',
    'Birth_Date': '3. Please enter your date of birth. (YYYY/MM/DD)- ⚠️ Note: Please do not enter the registration date',
    'Culture': '4. What is your nationality?',
    'Race': '6. Please check one or more of the following groups in which you consider yourself to be a member',
    'Visa_Status': '22. What is your current visa status?',
    'Payment_Method': '23. In what form would you like to receive the participation fee for the survey?',
    'Contact_Method': '20. How can I contact you?',
    'Contact_Info': '21-2. Please write you email information',
    'Referral_Code': '28. Who recommended you? Please write that person\'s  referral code. (Optional)'
};

// 상태 매핑
const STATUS_MAPPING = {
    'waiting': '예약대기',
    'confirmed': '예약확정',
    'applied': '신청완료',
    'completed': '참여완료',
    'cancelled': '취소'
};

// 역방향 상태 매핑
const REVERSE_STATUS_MAPPING = {
    '예약대기': 'waiting',
    '예약확정': 'confirmed',
    '신청완료': 'applied',
    '참여완료': 'completed',
    '취소': 'cancelled'
};