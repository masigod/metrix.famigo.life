-- Airtable metrix_beauty 테이블 스키마 (SQL 형식)
-- 이 파일은 Airtable 구조를 SQL로 표현한 참조용입니다

-- 메인 테이블
CREATE TABLE metrix_beauty (
    -- 기본 식별자
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id VARCHAR(20) GENERATED ALWAYS AS (CONCAT('MX-', YEAR(created_time), '-', id)),

    -- 핵심 정보
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,

    -- 개인 정보
    gender ENUM('남성', '여성', '기타', '응답거부'),
    birth_date DATE,
    age_group VARCHAR(10) GENERATED ALWAYS AS (
        CASE
            WHEN birth_date IS NULL THEN NULL
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 20 THEN '10대'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 30 THEN '20대'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 40 THEN '30대'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 50 THEN '40대'
            ELSE '50대 이상'
        END
    ),
    nationality VARCHAR(50),
    culture VARCHAR(100),
    race SET('Asian', 'Caucasian', 'African', 'Hispanic', 'Middle Eastern', 'Other'),

    -- 예약 정보
    reservation_date DATE,
    reservation_time ENUM('10:00','10:30','11:00','11:30','12:00','12:30',
                          '13:00','13:30','14:00','14:30','15:00','15:30',
                          '16:00','16:30','17:00','17:30','18:00'),
    location ENUM('서울(Seoul)', '수원(Suwon)'),

    -- 상태 관리
    status ENUM('예약대기', '예약확정', '신청완료', '참여완료', '취소', '노쇼') NOT NULL DEFAULT '예약대기',
    participation_result ENUM('참여', '불참', '불가', '중복', '거부', '변경', '보류'),
    group_name ENUM('PANEL1', 'PANEL2', 'PANEL3', 'PANEL4', 'PANEL5'),
    confirmation ENUM('o', 'x'),

    -- 신청 정보
    submission_date DATETIME,
    preferred_dates TEXT,
    preferred_time VARCHAR(100),

    -- 연락 관리
    first_response VARCHAR(100),
    last_contact DATE,
    contact_count INTEGER DEFAULT 0,
    contact_method SET('전화', '문자', '이메일', '카카오톡'),
    contact_info VARCHAR(255),

    -- 부가 정보
    visa_status VARCHAR(100),
    payment_method ENUM('현금', '계좌이체', '상품권', '기타'),
    referral_code VARCHAR(50),

    -- 메모
    notes TEXT,
    additional_notes TEXT,
    tags SET('VIP', '재참여', '신규', '주의', '우선처리'),

    -- 시스템 필드
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    modified_by VARCHAR(100),
    sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced',

    -- 계산 필드 (뷰로 구현 권장)
    priority VARCHAR(10) GENERATED ALWAYS AS (
        CASE
            WHEN status = '예약대기' AND DATEDIFF(CURDATE(), submission_date) > 7 THEN '🔴 높음'
            WHEN status = '예약대기' AND DATEDIFF(CURDATE(), submission_date) > 3 THEN '🟡 중간'
            ELSE '🟢 낮음'
        END
    ),
    days_waiting INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN status = '예약대기' AND submission_date IS NOT NULL
            THEN DATEDIFF(CURDATE(), submission_date)
            ELSE NULL
        END
    ),
    days_until INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN reservation_date IS NOT NULL AND status != '취소'
            THEN DATEDIFF(reservation_date, CURDATE())
            ELSE NULL
        END
    ),
    status_emoji VARCHAR(5) GENERATED ALWAYS AS (
        CASE status
            WHEN '예약대기' THEN '⏳'
            WHEN '예약확정' THEN '✅'
            WHEN '신청완료' THEN '📝'
            WHEN '참여완료' THEN '🎉'
            WHEN '취소' THEN '❌'
            WHEN '노쇼' THEN '👻'
            ELSE '❓'
        END
    ),

    -- 인덱스
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_reservation_date (reservation_date),
    INDEX idx_group (group_name),
    INDEX idx_submission_date (submission_date),
    INDEX idx_created_time (created_time)
);

-- 뷰: 오늘 예약
CREATE VIEW today_reservations AS
SELECT
    record_id,
    name,
    phone,
    reservation_time,
    location,
    status,
    status_emoji
FROM metrix_beauty
WHERE reservation_date = CURDATE()
    AND status != '취소'
ORDER BY reservation_time;

-- 뷰: 예약 대기
CREATE VIEW pending_reservations AS
SELECT
    record_id,
    name,
    email,
    phone,
    days_waiting,
    priority,
    preferred_dates,
    submission_date
FROM metrix_beauty
WHERE status = '예약대기'
ORDER BY days_waiting DESC;

-- 뷰: Panel5 그룹
CREATE VIEW panel5_group AS
SELECT
    record_id,
    name,
    email,
    status,
    participation_result,
    reservation_date,
    reservation_time
FROM metrix_beauty
WHERE group_name = 'PANEL5'
    OR group_name IS NULL
ORDER BY status, name;

-- 뷰: 이번 주 예약
CREATE VIEW this_week_reservations AS
SELECT
    record_id,
    name,
    phone,
    reservation_date,
    reservation_time,
    location,
    status
FROM metrix_beauty
WHERE YEARWEEK(reservation_date, 1) = YEARWEEK(CURDATE(), 1)
    AND status != '취소'
ORDER BY reservation_date, reservation_time;

-- 뷰: 통계
CREATE VIEW statistics AS
SELECT
    COUNT(*) as total_records,
    SUM(CASE WHEN status = '예약대기' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN status = '예약확정' THEN 1 ELSE 0 END) as confirmed_count,
    SUM(CASE WHEN status = '신청완료' THEN 1 ELSE 0 END) as applied_count,
    SUM(CASE WHEN status = '참여완료' THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN status = '취소' THEN 1 ELSE 0 END) as cancelled_count,
    SUM(CASE WHEN group_name = 'PANEL5' THEN 1 ELSE 0 END) as panel5_count,
    SUM(CASE WHEN reservation_date = CURDATE() THEN 1 ELSE 0 END) as today_count,
    SUM(CASE WHEN YEARWEEK(reservation_date, 1) = YEARWEEK(CURDATE(), 1) THEN 1 ELSE 0 END) as week_count
FROM metrix_beauty;

-- 트리거: 상태 자동 업데이트
DELIMITER $$
CREATE TRIGGER auto_update_status
BEFORE UPDATE ON metrix_beauty
FOR EACH ROW
BEGIN
    -- 예약 날짜와 시간이 모두 있으면 예약확정으로 변경
    IF NEW.reservation_date IS NOT NULL
        AND NEW.reservation_time IS NOT NULL
        AND NEW.status = '예약대기' THEN
        SET NEW.status = '예약확정';
    END IF;

    -- 참여결과가 '참여'면 상태를 참여완료로 변경
    IF NEW.participation_result = '참여' THEN
        SET NEW.status = '참여완료';
    END IF;
END$$
DELIMITER ;

-- 트리거: 수정 시간 자동 업데이트
DELIMITER $$
CREATE TRIGGER update_modified_time
BEFORE UPDATE ON metrix_beauty
FOR EACH ROW
BEGIN
    SET NEW.modified_time = CURRENT_TIMESTAMP;
END$$
DELIMITER ;