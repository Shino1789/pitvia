CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
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

CREATE TABLE shops (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
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
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT, -- ユーザー物理削除をブロック
    CONSTRAINT uk_shops_user
        UNIQUE(user_id)
);

-- 部分ユニークインデックスで論理削除を考慮
CREATE UNIQUE INDEX uk_shops_user_active
ON shops(user_id)
WHERE deleted_at IS NULL;

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    user_agent VARCHAR(1000),
    ip_address VARCHAR(100),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE, -- ユーザー削除時に連動してトークンを物理削除
    CONSTRAINT uk_refresh_token
        UNIQUE(token_hash)
);

-- インデックス定義
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_shops_deleted_at ON shops(deleted_at);

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
