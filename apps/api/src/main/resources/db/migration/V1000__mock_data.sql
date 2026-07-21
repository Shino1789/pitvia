-- =============================================================================
-- V1000__mock_dashboard_data.sql
-- ダッシュボードおよび全機能検証用 高高度モックデータ
-- パスワードハッシュ: 'password123' (BCrypt $2a$10$...)
-- =============================================================================

-- 固定UUIDの定義 (参照整合性を保つため)
-- OWNER User: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
-- SHOP User : 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
-- Owner 車両: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
-- Shop  車両: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'

-- -----------------------------------------------------------------------------
-- 1. USERS (オーナーテスト & ショップテスト)
-- -----------------------------------------------------------------------------
INSERT INTO users (id, role, user_name, email, password_hash, created_at, updated_at) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'OWNER', 'オーナーテスト', 'owner@example.com', '$2a$10$BP8UFJ9l1qvrWOyklTTIMO5/Oyzo1NQJOWmVMnOnMeri1aVgFuMXC', '2025-01-01 10:00:00+09', '2025-01-01 10:00:00+09'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SHOP',  'ショップテスト',  'shop@example.com',  '$2a$10$BP8UFJ9l1qvrWOyklTTIMO5/Oyzo1NQJOWmVMnOnMeri1aVgFuMXC', '2025-01-01 10:00:00+09', '2025-01-01 10:00:00+09');

-- -----------------------------------------------------------------------------
-- 2. SHOPS (ショップ詳細)
-- -----------------------------------------------------------------------------
INSERT INTO shops (id, phone_number, postal_code, address, website_url, description, created_at, updated_at) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '03-1234-5678', '100-0001', '東京都千代田区1-1', 'https://shop-test.example.com', 'ショップテストの整備工場です。', '2025-01-01 10:00:00+09', '2025-01-01 10:00:00+09');

-- -----------------------------------------------------------------------------
-- 3. VEHICLES (マイカー1台 + デモカー1台)
-- -----------------------------------------------------------------------------
INSERT INTO vehicles (id, user_id, vehicle_type, name, manufacturer_id, model, model_code, model_year, license_plate, current_mileage, transmission_type, drive_type, memo, created_at, updated_at) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'CAR', 'マイカー (RX-7)', 4, 'RX-7', 'FD3S', 2002, '品川 300 な 77-77', 85000, 'MT', 'FR', 'オーナーのメイン車両', '2025-01-05 10:00:00+09', '2025-01-05 10:00:00+09'),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'CAR', 'デモカー (GT-R)', 2, 'GT-R', 'BNR34', 2001, '品川 300 す 34-34', 45000, 'MT', 'AWD', 'ショップのデモカー', '2025-01-05 10:00:00+09', '2025-01-05 10:00:00+09');

-- -----------------------------------------------------------------------------
-- 4. VEHICLE_SHOP_LINKS (車両とショップの連携: APPROVED)
-- -----------------------------------------------------------------------------
INSERT INTO vehicle_shop_links (vehicle_id, shop_id, status, invite_code, approved_at, created_at, updated_at) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'APPROVED', 'INV-OWNER-SHOP-01', '2025-01-10 10:00:00+09', '2025-01-10 10:00:00+09', '2025-01-10 10:00:00+09');

-- -----------------------------------------------------------------------------
-- 5. MAINTENANCE_RECORDS & WORK_ITEMS & PARTS (オーナー所有車両: 20件)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_rec_id UUID;
    v_item_id BIGINT;
    v_owner_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_shop_id  UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    v_veh_id   UUID := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
BEGIN

    -- [1] 過去データ（canMoveBackward検証用: 2025-05-10 / ショップ依頼）
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, work_date_to, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, v_shop_id, '12ヶ月法定点検', 3, '2025-05-10', '2025-05-11', 70000, FALSE, '2025-05-10 10:00:00+09', '2025-05-11 17:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 5, '足回り点検・ブレーキ清掃', 'ショップテスト', 15000.00, '2025-05-10 10:00:00+09', '2025-05-10 10:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', 'ブレーキフルード DOT4', 1.0, 3000.00, '2025-05-10 10:00:00+09', '2025-05-10 10:00:00+09');


    -- [2] 2026-01: 定期メンテナンス (DIY / shop_id = NULL)
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, NULL, '定期オイル交換', 1, '2026-01-15', 78000, FALSE, '2026-01-15 14:00:00+09', '2026-01-15 14:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 1, 'エンジンオイル・エレメント交換', 'DIY', 0.00, '2026-01-15 14:00:00+09', '2026-01-15 14:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', '10W-50 化学合成油 4L', 1.0, 8500.00, '2026-01-15 14:00:00+09', '2026-01-15 14:00:00+09'),
           (v_item_id, 'NEW', 'オイルフィルター', 1.0, 1500.00, '2026-01-15 14:00:00+09', '2026-01-15 14:00:00+09');


    -- [3] 2026-02: 車検（複数日跨ぎ / 高額データ / ショップ依頼）
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, work_date_to, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, v_shop_id, '継続車検整備', 2, '2026-02-10', '2026-02-12', 79500, FALSE, '2026-02-10 09:00:00+09', '2026-02-12 18:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 5, '車検法定点検一式', 'ショップテスト', 45000.00, '2026-02-10 09:00:00+09', '2026-02-10 09:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', 'ワイパーゴム左右', 2.0, 1200.00, '2026-02-10 09:00:00+09', '2026-02-10 09:00:00+09'),
           (v_item_id, 'NEW', 'ブレーキパッド フロント', 1.0, 18000.00, '2026-02-10 09:00:00+09', '2026-02-10 09:00:00+09');


    -- [4] 2026-03: 修理1（同月複数件検証① / DIY / shop_id = NULL）
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, NULL, 'エアコン不調チェック', 4, '2026-03-05', 80200, FALSE, '2026-03-05 11:00:00+09', '2026-03-05 11:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 10, 'エアコンガス点検', 'DIY', 0.00, '2026-03-05 11:00:00+09', '2026-03-05 11:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', 'エアコンガス R134a', 2.0, 2000.00, '2026-03-05 11:00:00+09', '2026-03-05 11:00:00+09');


    -- [5] 2026-03: 修理2（同月複数件かつ同一MaintenanceType(REPAIR)検証② / DIY）
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, NULL, 'プラグ・ホース交換修理', 4, '2026-03-18', 80500, FALSE, '2026-03-18 15:00:00+09', '2026-03-18 15:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 1, 'スパークプラグ交換', 'DIY', 0.00, '2026-03-18 15:00:00+09', '2026-03-18 15:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', 'レーシングプラグ 9番', 4.0, 2500.00, '2026-03-18 15:00:00+09', '2026-03-18 15:00:00+09');


    -- [6] 2026-03: カスタム（同月複数種別検証③ / DIY）
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, NULL, '社外マフラー取り付け', 5, '2026-03-25', 80800, FALSE, '2026-03-25 13:00:00+09', '2026-03-25 13:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 2, 'リアピースマフラー交換', 'DIY', 0.00, '2026-03-25 13:00:00+09', '2026-03-25 13:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', 'チタンマフラー', 1.0, 128000.00, '2026-03-25 13:00:00+09', '2026-03-25 13:00:00+09');


    -- [7] 2026-04: 点検（完全無料・金額0円・COALESCE検証用 / DIY）
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, NULL, '日常点検・タイヤ空気圧チェック', 3, '2026-04-10', 81500, FALSE, '2026-04-10 10:00:00+09', '2026-04-10 10:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 5, 'タイヤ空気圧調整・増し締め', 'DIY', 0.00, '2026-04-10 10:00:00+09', '2026-04-10 10:00:00+09') RETURNING id INTO v_item_id;
    -- ※部品なし (unit_price/labor_costともに0円)


    -- [8] 2026-05: チューニング (ショップ依頼)
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, work_date_to, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, v_shop_id, '車高調装着・アライメント調整', 6, '2026-05-18', '2026-05-19', 82300, FALSE, '2026-05-18 09:00:00+09', '2026-05-19 17:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 5, 'サスペンション交換・アライメント測定', 'ショップテスト', 35000.00, '2026-05-18 09:00:00+09', '2026-05-18 09:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', 'フルタップ車高調キット', 1.0, 160000.00, '2026-05-18 09:00:00+09', '2026-05-18 09:00:00+09');


    -- [9] 2026-06: セッティング (ショップ依頼)
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, v_shop_id, 'シャシダイ現車ECUセッティング', 7, '2026-06-25', 83000, FALSE, '2026-06-25 10:00:00+09', '2026-06-25 18:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 1, 'ECUセッティング作業代', 'ショップテスト', 80000.00, '2026-06-25 10:00:00+09', '2026-06-25 10:00:00+09') RETURNING id INTO v_item_id;


    -- [10] 2026-07: その他 (OTHER種別検証 / DIY)
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, NULL, '洗車・コーティングメンテナンス', 8, '2026-07-05', 84200, FALSE, '2026-07-05 16:00:00+09', '2026-07-05 16:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 12, '手洗い洗車・ガラス撥水施工', 'DIY', 0.00, '2026-07-05 16:00:00+09', '2026-07-05 16:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', 'ガラスコーティング剤', 1.0, 3500.00, '2026-07-05 16:00:00+09', '2026-07-05 16:00:00+09');


    -- [11] 下書きデータ（is_draft = TRUE 検証用: 集計や一覧から除外されるべき1件）
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, NULL, '【下書き】次回のオイル交換メモ', 1, '2026-07-20', 85000, TRUE, '2026-07-20 09:00:00+09', '2026-07-20 09:00:00+09');


    -- [12] 論理削除データ（deleted_at IS NOT NULL 検証用: 集計から除外されるべき1件）
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at, deleted_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, NULL, '【削除済み】誤って登録したデータ', 4, '2026-03-01', 80000, FALSE, '2026-03-01 10:00:00+09', '2026-03-01 10:30:00+09', '2026-03-01 10:30:00+09');


    -- [13] 残り8件を2025年に分散挿入（MaintenanceType全種別を均等に散らしつつ合計20件到達）
    FOR i IN 1..8 LOOP
        v_rec_id := gen_random_uuid();
        INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
        VALUES (
            v_rec_id,
            v_veh_id,
            v_owner_id,
            NULL, -- ショップ画面のノイズを防ぐためDIY(NULL)で統一
            'オーナー過去記録 #' || i,
            (i % 8) + 1, -- MaintenanceType 1〜8 を万遍なく循環
            TO_DATE('2025-06-01', 'YYYY-MM-DD') + (i * 20),
            71000 + (i * 800),
            FALSE,
            (TO_DATE('2025-06-01', 'YYYY-MM-DD') + (i * 20)) + TIME '10:00:00',
            (TO_DATE('2025-06-01', 'YYYY-MM-DD') + (i * 20)) + TIME '10:00:00'
        );

        INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
        VALUES (v_rec_id, (i % 12) + 1, '過去点検作業 #' || i, 'DIY', 0.00, (TO_DATE('2025-06-01', 'YYYY-MM-DD') + (i * 20)) + TIME '10:00:00', (TO_DATE('2025-06-01', 'YYYY-MM-DD') + (i * 20)) + TIME '10:00:00') RETURNING id INTO v_item_id;

        INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
        VALUES (v_item_id, 'NEW', '交換用パーツ #' || i, 1.0, 2000.00 * i, (TO_DATE('2025-06-01', 'YYYY-MM-DD') + (i * 20)) + TIME '10:00:00', (TO_DATE('2025-06-01', 'YYYY-MM-DD') + (i * 20)) + TIME '10:00:00');
    END LOOP;


    -- [14] 未来データ（canMoveForwardの検証用: 2027-01-10）
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_owner_id, v_shop_id, '来年予定の車検予約（仮登録）', 2, '2027-01-10', 90000, FALSE, '2026-07-01 10:00:00+09', '2026-07-01 10:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 5, '事前事前点検', 'ショップテスト', 5000.00, '2026-07-01 10:00:00+09', '2026-07-01 10:00:00+09') RETURNING id INTO v_item_id;

END $$;


-- -----------------------------------------------------------------------------
-- 6. MAINTENANCE_RECORDS (ショップの整備実績データ: 10件)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_rec_id UUID;
    v_item_id BIGINT;
    v_shop_user_id UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    v_demo_veh_id  UUID := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
BEGIN

    -- 2026年7月（今月売上集計のテスト用データ）
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_demo_veh_id, v_shop_user_id, v_shop_user_id, 'デモカーエンジンオーバーホール', 4, '2026-07-10', 45000, FALSE, '2026-07-10 09:00:00+09', '2026-07-10 09:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 1, 'RB26 脱着・精密分解', 'ショップテストメカニック', 200000.00, '2026-07-10 09:00:00+09', '2026-07-10 09:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', '強化メタル・ガスケットフルセット', 1.0, 85000.00, '2026-07-10 09:00:00+09', '2026-07-10 09:00:00+09');


    -- 残り9件を過去〜今月に分散して生成 (MaintenanceType 全種別をカバー)
    FOR i IN 1..9 LOOP
        v_rec_id := gen_random_uuid();
        INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
        VALUES (
            v_rec_id,
            v_demo_veh_id,
            v_shop_user_id,
            v_shop_user_id,
            'デモカー整備実績 #' || i,
            (i % 8) + 1,
            TO_DATE('2026-01-10', 'YYYY-MM-DD') + (i * 20),
            40000 + (i * 500),
            FALSE,
            (TO_DATE('2026-01-10', 'YYYY-MM-DD') + (i * 20)) + TIME '09:00:00',
            (TO_DATE('2026-01-10', 'YYYY-MM-DD') + (i * 20)) + TIME '09:00:00'
        );

        INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
        VALUES (v_rec_id, (i % 12) + 1, 'デモカー作業明細内容 #' || i, 'ショップテストメカニック', 12000.00 * i, (TO_DATE('2026-01-10', 'YYYY-MM-DD') + (i * 20)) + TIME '09:00:00', (TO_DATE('2026-01-10', 'YYYY-MM-DD') + (i * 20)) + TIME '09:00:00') RETURNING id INTO v_item_id;

        INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
        VALUES (v_item_id, 'NEW', '性能向上パーツ #' || i, 1.0, 20000.00 * i, (TO_DATE('2026-01-10', 'YYYY-MM-DD') + (i * 20)) + TIME '09:00:00', (TO_DATE('2026-01-10', 'YYYY-MM-DD') + (i * 20)) + TIME '09:00:00');
    END LOOP;

END $$;
