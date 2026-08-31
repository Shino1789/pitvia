-- =============================================================================
-- V1001__test_chart_scale.sql
-- グラフの目盛り（Y軸スケール拡張）動作検証用テストデータ
-- =============================================================================

DO $$
DECLARE
    v_rec_id UUID;
    v_item_id BIGINT;
    v_owner_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_shop_id  UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    v_veh_id   UUID := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
    v_demo_veh UUID := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
BEGIN

    -- -------------------------------------------------------------------------
    -- 1. オーナー(金額) 検証データ: 月次 50万円オーバー (2026年7月)
    --    合計費用: 工賃 200,000 + 部品 600,000 = 800,000円
    --    【期待結果】月次グラフのY軸上限が 50万 -> 100万（50万単位で拡張）へ変更
    -- -------------------------------------------------------------------------
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_shop_id, v_shop_id, 'エンジンフルリビルド＆フルコンセッティング', 4, '2026-07-20', 85000, FALSE, '2026-07-20 10:00:00+09', '2026-07-20 10:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 1, 'エンジンオーバーホール工賃', 'ショップテスト', 200000.00, '2026-07-20 10:00:00+09', '2026-07-20 10:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', '鍛造ピストン・H断面コンロッドキット', 1.0, 600000.00, '2026-07-20 10:00:00+09', '2026-07-20 10:00:00+09');


    -- -------------------------------------------------------------------------
    -- 2. オーナー(金額) 検証データ: 年次 100万円オーバー (2026年通年)
    --    2026年8月に追加で 600,000円分 を投入 (2026年合計が 約180万円 に到達)
    --    【期待結果】年次グラフのY軸上限が 100万 -> 200万（50万単位で拡張）へ変更
    -- -------------------------------------------------------------------------
    v_rec_id := gen_random_uuid();
    INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
    VALUES (v_rec_id, v_veh_id, v_shop_id, v_shop_id, 'ビッグタービンキット導入＆全塗装', 5, '2026-08-01', 85200, FALSE, '2026-08-01 10:00:00+09', '2026-08-01 10:00:00+09');

    INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
    VALUES (v_rec_id, 2, 'タービンキット取付・ボディオールペン', 'ショップテスト', 300000.00, '2026-08-01 10:00:00+09', '2026-08-01 10:00:00+09') RETURNING id INTO v_item_id;

    INSERT INTO maintenance_parts (maintenance_work_item_id, part_condition, part_name, quantity, unit_price, created_at, updated_at)
    VALUES (v_item_id, 'NEW', 'ウエストゲート式タービンキット', 1.0, 300000.00, '2026-08-01 10:00:00+09', '2026-08-01 10:00:00+09');


    -- -------------------------------------------------------------------------
    -- 3. ショップ(件数) 検証データ: 月次 50件オーバー (2026年7月)
    --    2026年7月にショップの整備実績を 55件分 ループ生成
    --    【期待結果】ショップ画面の月次件数グラフのY軸上限が 50件 -> 100件（50件単位で拡張）へ変更
    -- -------------------------------------------------------------------------
    FOR i IN 1..55 LOOP
        v_rec_id := gen_random_uuid();
        INSERT INTO maintenance_records (id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id, work_date_from, mileage, is_draft, created_at, updated_at)
        VALUES (
            v_rec_id,
            v_demo_veh,
            'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
            'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
            'スケールテスト用件数量産整備 #' || i,
            (i % 8) + 1,
            '2026-07-15',
            45000 + i,
            FALSE,
            '2026-07-15 10:00:00+09',
            '2026-07-15 10:00:00+09'
        );

        INSERT INTO maintenance_work_items (maintenance_record_id, maintenance_category_id, work_content, performed_by, labor_cost, created_at, updated_at)
        VALUES (v_rec_id, 1, '定期点検・作業 #' || i, 'ショップテストメカニック', 5000.00, '2026-07-15 10:00:00+09', '2026-07-15 10:00:00+09');
    END LOOP;

END $$;
