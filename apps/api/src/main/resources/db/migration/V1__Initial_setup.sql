CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- USERS (ユーザー情報テーブル)
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
    icon_key VARCHAR(500),
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT ck_users_role
        CHECK (role IN ('OWNER', 'SHOP', 'ADMIN'))
);

-- 部分ユニークインデックスで論理削除を考慮
CREATE UNIQUE INDEX uk_users_email_active
ON users(email)
WHERE deleted_at IS NULL;

CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- ==========================================
-- SHOPS (整備ショップ情報テーブル)
-- ==========================================
CREATE TABLE shops (
    id UUID PRIMARY KEY,
    phone_number VARCHAR(30),
    postal_code VARCHAR(20),
    address VARCHAR(500),
    website_url VARCHAR(500),
    description TEXT,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_shops_user
        FOREIGN KEY(id)
        REFERENCES users(id)
        ON DELETE RESTRICT -- ユーザーの物理削除をブロック
);

-- ==========================================
-- REFRESH TOKENS (リフレッシュトークン管理テーブル)
-- ==========================================
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    jti UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    user_agent VARCHAR(1000),
    ip_address VARCHAR(100),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE, -- ユーザー削除時に連動してトークンを物理削除
    CONSTRAINT uk_refresh_jti
        UNIQUE(jti),
    CONSTRAINT uk_refresh_token
        UNIQUE(token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ==========================================
-- MANUFACTURERS (メーカーマスタ)
-- ==========================================
CREATE TABLE manufacturers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_manufacturers_code
        UNIQUE(code),
    CONSTRAINT uk_manufacturers_name
        UNIQUE(name)
);

-- ==========================================
-- MAINTENANCE TYPES (整備種別マスタ)
-- ==========================================
CREATE TABLE maintenance_types (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_maintenance_types_code
        UNIQUE(code),
    CONSTRAINT uk_maintenance_types_name
        UNIQUE(name)
);

-- ==========================================
-- MAINTENANCE CATEGORIES (整備カテゴリマスタ)
-- ==========================================
CREATE TABLE maintenance_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_maintenance_categories_code
        UNIQUE(code),
    CONSTRAINT uk_maintenance_categories_name
        UNIQUE(name)
);

-- ==========================================
-- VEHICLES (ユーザーが所有する車両情報テーブル)
-- ==========================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    manufacturer_id BIGINT NOT NULL,
    model VARCHAR(255) NOT NULL,
    model_code VARCHAR(100),
    model_year SMALLINT,
    license_plate VARCHAR(100),
    image_key VARCHAR(500),
    current_mileage INTEGER NOT NULL,
    transmission_type VARCHAR(20),
    drive_type VARCHAR(20),
    memo TEXT,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_vehicles_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_vehicles_manufacturer
        FOREIGN KEY(manufacturer_id)
        REFERENCES manufacturers(id)
        ON DELETE RESTRICT,
    CONSTRAINT ck_vehicles_vehicle_type
        CHECK (vehicle_type IN ('CAR', 'MOTORCYCLE', 'KART', 'OTHER')),
    CONSTRAINT ck_vehicles_current_mileage
        CHECK (current_mileage >= 0),
    CONSTRAINT ck_vehicles_transmission_type
        CHECK (transmission_type IN ('MT', 'AT', 'CVT', 'DCT')),
    CONSTRAINT ck_vehicles_drive_type
        CHECK (drive_type IN ('FR', 'FF', 'AWD', 'MR', 'RR'))
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_deleted_at ON vehicles(deleted_at);

-- ==========================================
-- VEHICLE SHOP LINKS (車両とショップを繋ぐ中間テーブル)
-- ==========================================
CREATE TABLE vehicle_shop_links (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id UUID NOT NULL,
    shop_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    invite_code VARCHAR(100),
    approved_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_vehicle_shop_links_vehicle
        FOREIGN KEY(vehicle_id)
        REFERENCES vehicles(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_vehicle_shop_links_shop
        FOREIGN KEY(shop_id)
        REFERENCES shops(id)
        ON DELETE RESTRICT,
    CONSTRAINT uk_vehicle_shop_links_invite_code
        UNIQUE(invite_code),
    CONSTRAINT ck_vehicle_shop_links_status
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- 削除されていないデータだけを対象に、車両IDとステータスの組み合わせの部分インデックス
CREATE INDEX idx_vehicle_shop_links_active
ON vehicle_shop_links(vehicle_id, status)
WHERE deleted_at IS NULL;

-- 同じ車両とショップの重複連携を防止しつつ、再連携を可能とするための部分インデックス
CREATE UNIQUE INDEX uk_vehicle_shop_links_pair_active
ON vehicle_shop_links(vehicle_id, shop_id)
WHERE deleted_at IS NULL;

-- ショップIDとステータスによる車両連携情報の検索・集計を高速化する部分インデックス
CREATE INDEX idx_vehicle_shop_links_shop_status
ON vehicle_shop_links(shop_id, status)
WHERE deleted_at IS NULL;

-- ==========================================
-- MAINTENANCE RECORDS (整備記録ヘッダーテーブル)
-- ==========================================
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL,
    created_by_user_id UUID NOT NULL,
    shop_id UUID,
    title VARCHAR(255) NOT NULL,
    maintenance_type_id BIGINT NOT NULL,
    work_date_from DATE NOT NULL,
    work_date_to DATE,
    mileage INTEGER NOT NULL,
    remarks TEXT,
    is_draft BOOLEAN NOT NULL DEFAULT FALSE,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_maintenance_records_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_maintenance_records_creator
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_maintenance_records_shop
        FOREIGN KEY (shop_id)
        REFERENCES shops(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_maintenance_records_type
        FOREIGN KEY (maintenance_type_id)
        REFERENCES maintenance_types(id)
        ON DELETE RESTRICT,
    CONSTRAINT ck_maintenance_records_work_date_range
        CHECK (work_date_to IS NULL OR work_date_to >= work_date_from),
    CONSTRAINT ck_maintenance_records_mileage
        CHECK (mileage >= 0)
);

-- 削除されていない整備記録だけを対象にし、「日付が新しい順（DESC）」で並び替えておく部分インデックス
CREATE INDEX idx_maintenance_records_vehicle_date
ON maintenance_records(vehicle_id, work_date_from DESC)
WHERE deleted_at IS NULL;

-- 削除されていない整備記録だけを対象にし、ショップごとの売上集計や期間絞り込みを高速化する複合部分インデックス
CREATE INDEX idx_maintenance_records_shop_date
ON maintenance_records(shop_id, work_date_from)
WHERE deleted_at IS NULL;

CREATE INDEX idx_maintenance_records_creator ON maintenance_records(created_by_user_id);

-- ==========================================
-- MAINTENANCE WORK ITEMS (整備作業明細テーブル)
-- ==========================================
CREATE TABLE maintenance_work_items (
    id BIGSERIAL PRIMARY KEY,
    maintenance_record_id UUID NOT NULL,
    maintenance_category_id BIGINT NOT NULL,
    work_content VARCHAR(500) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sort_order INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_work_items_record
        FOREIGN KEY (maintenance_record_id)
        REFERENCES maintenance_records(id)
        ON DELETE CASCADE, -- 記録自体が物理削除された場合は明細も連動削除
    CONSTRAINT fk_work_items_category
        FOREIGN KEY (maintenance_category_id)
        REFERENCES maintenance_categories(id)
        ON DELETE RESTRICT,
    CONSTRAINT ck_work_items_labor_cost
        CHECK (labor_cost >= 0)
);

CREATE INDEX idx_work_items_record_id ON maintenance_work_items(maintenance_record_id);

-- ==========================================
-- MAINTENANCE PARTS (交換部品明細テーブル)
-- ==========================================
CREATE TABLE maintenance_parts (
    id BIGSERIAL PRIMARY KEY,
    maintenance_work_item_id BIGINT NOT NULL,
    part_condition VARCHAR(50),
    part_name VARCHAR(255) NOT NULL,
    manufacturer_name VARCHAR(255),
    part_model_number VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sort_order INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_parts_work_item
        FOREIGN KEY (maintenance_work_item_id)
        REFERENCES maintenance_work_items(id)
        ON DELETE CASCADE, -- 作業明細削除時に連動して部品も削除
    CONSTRAINT ck_parts_condition
        CHECK (part_condition IN ('NEW', 'USED', 'REBUILT')),
    CONSTRAINT ck_parts_quantity
        CHECK (quantity > 0),
    CONSTRAINT ck_parts_unit_price
        CHECK (unit_price >= 0)
);

CREATE INDEX idx_parts_work_item_id ON maintenance_parts(maintenance_work_item_id);

-- ==========================================
-- MAINTENANCE WORK ITEM IMAGES (整備作業画像テーブル)
-- ==========================================
CREATE TABLE maintenance_work_item_images (
    id BIGSERIAL PRIMARY KEY,
    maintenance_work_item_id BIGINT NOT NULL,
    image_key VARCHAR(500) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_work_item_images_work_item
        FOREIGN KEY (maintenance_work_item_id)
        REFERENCES maintenance_work_items(id)
        ON DELETE CASCADE -- 作業明細削除時に連動して画像データ参照も削除
);

CREATE INDEX idx_work_item_images_work_item_id ON maintenance_work_item_images(maintenance_work_item_id);

-- ==========================================
-- TRIGGERS
-- ==========================================
-- 更新日時を自動更新する関数
CREATE OR REPLACE FUNCTION refresh_updated_at_step()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルへのトリガー適用
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION refresh_updated_at_step();
CREATE TRIGGER trg_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION refresh_updated_at_step();
CREATE TRIGGER trg_manufacturers_updated_at BEFORE UPDATE ON manufacturers FOR EACH ROW EXECUTE FUNCTION refresh_updated_at_step();
CREATE TRIGGER trg_maintenance_types_updated_at BEFORE UPDATE ON maintenance_types FOR EACH ROW EXECUTE FUNCTION refresh_updated_at_step();
CREATE TRIGGER trg_maintenance_categories_updated_at BEFORE UPDATE ON maintenance_categories FOR EACH ROW EXECUTE FUNCTION refresh_updated_at_step();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION refresh_updated_at_step();
CREATE TRIGGER trg_vehicle_shop_links_updated_at BEFORE UPDATE ON vehicle_shop_links FOR EACH ROW EXECUTE FUNCTION refresh_updated_at_step();
CREATE TRIGGER trg_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION refresh_updated_at_step();
CREATE TRIGGER trg_maintenance_work_items_updated_at BEFORE UPDATE ON maintenance_work_items FOR EACH ROW EXECUTE FUNCTION refresh_updated_at_step();
CREATE TRIGGER trg_maintenance_parts_updated_at BEFORE UPDATE ON maintenance_parts FOR EACH ROW EXECUTE FUNCTION refresh_updated_at_step();

-- ==========================================
-- MASTER DATA INITIAL INSERTS (マスタ初期データ)
-- ==========================================

-- 1. MAINTENANCE TYPES (整備種別マスタ)
INSERT INTO maintenance_types (code, name, sort_order) VALUES
('PERIODIC_MAINTENANCE', '定期メンテナンス', 10),
('VEHICLE_INSPECTION',  '車検',             20),
('INSPECTION',          '点検',             30),
('REPAIR',              '修理',             40),
('CUSTOM',              'カスタム',         50),
('TUNING',              'チューニング',     60),
('SETTING',             'セッティング',     70),
('OTHER',               'その他',           99)
ON CONFLICT (code) DO NOTHING;

-- 2. MAINTENANCE CATEGORIES (整備カテゴリマスタ)
INSERT INTO maintenance_categories (code, name, sort_order) VALUES
('ENGINE',          'エンジン',     10),
('INTAKE_EXHAUST',  '吸排気',       20),
('COOLING',         '冷却',         30),
('DRIVETRAIN',      '駆動系',       40),
('SUSPENSION',      '足回り',       50),
('BRAKE',           'ブレーキ',     60),
('ELECTRICAL',      '電装',         70),
('BODY',            '外装',         80),
('INTERIOR',        '内装',         90),
('AIR_CONDITIONER', 'エアコン',     100),
('BODY_REPAIR',     '板金',         110),
('CLEANING',        '洗浄',         120),
('OTHER',           'その他',       999)
ON CONFLICT (code) DO NOTHING;

-- 3. MANUFACTURERS (主要メーカーマスタ)
INSERT INTO manufacturers (code, name) VALUES
('TOYOTA',        'トヨタ'),
('NISSAN',        '日産'),
('HONDA',         'ホンダ'),
('MAZDA',         'マツダ'),
('SUBARU',        'スバル'),
('MITSUBISHI',    '三菱'),
('SUZUKI',        'スズキ'),
('DAIHATSU',      'ダイハツ'),
('LEXUS',         'レクサス'),
('YAMAHA',        'ヤマハ'),
('KAWASAKI',      'カワサキ'),
('BMW',           'BMW'),
('PORSCHE',       'ポルシェ'),
('MERCEDES_BENZ', 'Mercedes-Benz'),
('AUDI',          'Audi'),
('VOLKSWAGEN',    'Volkswagen'),
('OTHER',         'その他')
ON CONFLICT (code) DO NOTHING;
