-- =============================================================================
-- V2__Add_shop_invite_codes.sql
-- ショップ単位の招待コード管理テーブル追加（issue #48: 顧客一覧・招待コード発行機能）
-- =============================================================================

-- ==========================================
-- SHOP_INVITE_CODES (ショップ招待コード管理テーブル)
-- ==========================================
CREATE TABLE shop_invite_codes (
    id BIGSERIAL PRIMARY KEY,
    shop_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_shop_invite_codes_shop
        FOREIGN KEY(shop_id)
        REFERENCES shops(id)
        ON DELETE RESTRICT,
    CONSTRAINT uk_shop_invite_codes_code
        UNIQUE(code)
);

-- テーブル・カラムコメント
COMMENT ON TABLE shop_invite_codes IS 'ショップ招待コード管理テーブル';
COMMENT ON COLUMN shop_invite_codes.id IS '招待コードID';
COMMENT ON COLUMN shop_invite_codes.shop_id IS '発行元ショップID';
COMMENT ON COLUMN shop_invite_codes.code IS '招待コード（β版では平文保存。認証情報・パスワードではなく、有効期限付きの招待用コードとして扱う）';
COMMENT ON COLUMN shop_invite_codes.expires_at IS '有効期限（発行から24時間）';
COMMENT ON COLUMN shop_invite_codes.revoked_at IS '無効化日時（再発行時に旧コードを即時失効させる際に設定）';
COMMENT ON COLUMN shop_invite_codes.created_at IS '作成日時';
COMMENT ON COLUMN shop_invite_codes.updated_at IS '更新日時';

-- ショップIDによる検索（現在有効なコードの取得）を高速化する索引
CREATE INDEX idx_shop_invite_codes_shop_id ON shop_invite_codes(shop_id);

-- ショップごとに失効していない（revoked_at IS NULL）コードは常に1件のみに制限する部分一意インデックス。
-- 有効期限切れかどうかは問わない（発行時は revoked_at IS NULL の既存コードを無条件で失効させて
-- から新規発行するため、失効判定と有効期限判定を混同しないことでこのインデックスとの整合を保つ）。
CREATE UNIQUE INDEX uk_shop_invite_codes_active_per_shop
ON shop_invite_codes(shop_id)
WHERE revoked_at IS NULL;
