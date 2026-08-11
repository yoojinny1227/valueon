-- ==========================================
-- 가치온(Value On) 데이터베이스
-- 감정평가 의뢰 시스템
-- ==========================================

-- 1. 감정평가 의뢰 테이블
CREATE TABLE IF NOT EXISTS appraisal_requests (
    id BIGSERIAL PRIMARY KEY,
    application_no VARCHAR(30) UNIQUE NOT NULL,

    -- 의뢰 기본정보
    purpose VARCHAR(100) NOT NULL,
    property_type VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    owner_name VARCHAR(100),
    valuation_date DATE,
    property_size NUMERIC(15, 2),
    case_number VARCHAR(100),
    detail TEXT,

    -- 부동산 상세정보
    jibun_address TEXT,
    road_address TEXT,
    land_area NUMERIC(15, 2),
    building_area NUMERIC(15, 2),
    gross_floor_area NUMERIC(15, 2),
    building_use VARCHAR(200),
    building_structure VARCHAR(200),
    building_floor VARCHAR(100),
    building_year INTEGER,
    land_category VARCHAR(100),
    zoning VARCHAR(200),
    land_use_area VARCHAR(200),
    road_condition VARCHAR(200),
    land_shape VARCHAR(200),
    land_topography VARCHAR(200),

    -- 집합건물 상세정보
    building_name VARCHAR(200),
    building_dong VARCHAR(100),
    building_floor_detail VARCHAR(100),
    building_unit VARCHAR(100),
    exclusive_area NUMERIC(15, 2),
    common_area NUMERIC(15, 2),
    supply_area NUMERIC(15, 2),

    -- 의뢰인 정보
    client_name VARCHAR(100) NOT NULL,
    client_phone VARCHAR(30) NOT NULL,
    client_email VARCHAR(200),

    -- 첨부자료
    attachment_path TEXT,

    -- 의뢰 상태
    status VARCHAR(50) NOT NULL DEFAULT '접수완료',

    -- 담당자 및 메모
    assigned_appraiser VARCHAR(100),
    assigned_at TIMESTAMP,
    admin_memo TEXT,

    -- 시간정보
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS admin_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. 상태 변경 이력
CREATE TABLE IF NOT EXISTS appraisal_status_history (
    id BIGSERIAL PRIMARY KEY,
    appraisal_request_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100),
    memo TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_status_request
        FOREIGN KEY (appraisal_request_id)
        REFERENCES appraisal_requests(id)
        ON DELETE CASCADE
);

-- 4. 문자 발송 이력
CREATE TABLE IF NOT EXISTS sms_logs (
    id BIGSERIAL PRIMARY KEY,
    appraisal_request_id BIGINT,
    receiver VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50),
    response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sms_request
        FOREIGN KEY (appraisal_request_id)
        REFERENCES appraisal_requests(id)
        ON DELETE SET NULL
);

-- 5. 검색 성능을 위한 INDEX
CREATE INDEX IF NOT EXISTS idx_appraisal_application_no ON appraisal_requests(application_no);
CREATE INDEX IF NOT EXISTS idx_appraisal_client_phone ON appraisal_requests(client_phone);
CREATE INDEX IF NOT EXISTS idx_appraisal_status ON appraisal_requests(status);
CREATE INDEX IF NOT EXISTS idx_appraisal_created_at ON appraisal_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appraisal_address ON appraisal_requests(address);

SELECT '가치온 데이터베이스 테이블 생성 완료!' AS message;