-- =============================================================================
-- V3__Insert_demo_data.sql
-- 本番デモ用データ（採用担当者・面接官がPitviaを実際に触るためのデモシナリオ）
--
-- 【重要】このMigrationは本番を含む全環境で実行される（db/migration配下のため）。
--   開発用モックデータ(V1000/V1001)とは無関係で、それらには依存しない（V3はV1000より先に実行される）。
--
-- 【デモアカウント】ログイン可能なのは以下の2つのみ（パスワードはREADMEのDemo Account参照）。
--   OWNER: demo-owner@example.com  (デモオーナー)
--   SHOP : demo-shop@example.com   (デモショップ)
--   佐藤 太郎 / 鈴木 一郎 / 田中 次郎 はSHOPの顧客一覧表示用で、ログインできない
--   （ランダムなBCryptハッシュを設定しており、平文は保存していない）。
--   パスワードハッシュはアプリと同一の BCryptPasswordEncoder（強度10）で事前生成している。
--
-- 【データの流れ】 users → shops → vehicles → vehicle_shop_links
--                  → maintenance_records → maintenance_work_items → maintenance_parts
--
-- 【日付設計】固定日付を使わず、実行日(CURRENT_DATE)を基準とした相対日付にしている。
--   いつ本番環境を構築しても「当月を含む直近6ヶ月」のダッシュボードにデータが表示される。
--   ・当月(0ヶ月前)の記録は LEAST(月初+N日, 今日) で今日を超えないよう丸める（月初に実行しても未来日にならない）
--   ・当月の記録は作業終了日(work_date_to)を設定しない
--   ・6ヶ月より前の記録(8ヶ月前の車検)を1件置き、グラフの「前の期間へ」を確認できるようにしている
--
-- 【その他の設計】
--   ・vehicles.image_key は全てNULL（S3への画像登録は行わない。画面ではデフォルトアイコンが表示される）
--   ・shop_invite_codes はシードしない（デモ環境でSHOPが招待コードを発行する操作を確認できるようにする）
--   ・マスタは数値IDを直接指定せず、必ずcodeで参照する
--   ・ナンバープレートは実在車両との偶然の一致を避けるためNULL
--   ・GR86はSHOPと未連携（後からデモオーナーが招待コードで連携するデモ用）
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. 一時ヘルパー関数（このMigrationの実行中のみ有効。末尾で削除する）
--    ・整備記録/作業項目/部品を1回の呼び出しで登録し、SQLの繰り返しを減らす
--    ・pg_temp（一時スキーマ）に作成するため、永続的なスキーマには影響しない
-- -----------------------------------------------------------------------------

-- N ヶ月前の D 日 を返す（当月は今日を超えないよう丸める。D は1〜28で指定すること）
CREATE FUNCTION pg_temp.demo_date(p_months_ago INT, p_day INT) RETURNS DATE AS $$
    SELECT CASE
        WHEN p_months_ago = 0 THEN
            LEAST(
                (date_trunc('month', CURRENT_DATE)::date + make_interval(days => p_day - 1))::date,
                CURRENT_DATE)
        ELSE
            (date_trunc('month', CURRENT_DATE)::date
                - make_interval(months => p_months_ago)
                + make_interval(days => p_day - 1))::date
    END;
$$ LANGUAGE sql STABLE;

-- 日付から登録日時(JST 10:00)を返す（未来日時にならないよう現在時刻で丸める）
CREATE FUNCTION pg_temp.demo_ts(p_date DATE) RETURNS TIMESTAMPTZ AS $$
    SELECT LEAST((p_date + TIME '10:00') AT TIME ZONE 'Asia/Tokyo', now());
$$ LANGUAGE sql STABLE;

-- 整備記録を1件登録し、そのIDを返す
--   p_shop_id       : SHOPが作成した記録はSHOPのusers.id、DIYの場合はNULL
--   p_span_days     : 作業が複数日にまたがる場合の日数（0で作業終了日なし。当月は常になし）
CREATE FUNCTION pg_temp.demo_add_record(
    p_vehicle_id UUID, p_created_by UUID, p_shop_id UUID,
    p_title TEXT, p_type_code TEXT,
    p_months_ago INT, p_day INT, p_span_days INT,
    p_mileage INT, p_remarks TEXT
) RETURNS UUID AS $$
DECLARE
    v_id   UUID := gen_random_uuid();
    v_from DATE := pg_temp.demo_date(p_months_ago, p_day);
    v_to   DATE := CASE WHEN p_months_ago = 0 OR p_span_days = 0 THEN NULL ELSE v_from + p_span_days END;
    v_ts   TIMESTAMPTZ := pg_temp.demo_ts(v_from);
BEGIN
    INSERT INTO maintenance_records (
        id, vehicle_id, created_by_user_id, shop_id, title, maintenance_type_id,
        work_date_from, work_date_to, mileage, remarks, is_draft, created_at, updated_at)
    VALUES (
        v_id, p_vehicle_id, p_created_by, p_shop_id, p_title,
        (SELECT id FROM maintenance_types WHERE code = p_type_code),
        v_from, v_to, p_mileage, p_remarks, FALSE, v_ts, v_ts);
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 作業項目を1件登録し、そのIDを返す
CREATE FUNCTION pg_temp.demo_add_item(
    p_record_id UUID, p_category_code TEXT, p_work_content TEXT,
    p_performed_by TEXT, p_labor_cost NUMERIC, p_sort_order INT
) RETURNS BIGINT AS $$
DECLARE
    v_id BIGINT;
    v_ts TIMESTAMPTZ;
BEGIN
    SELECT created_at INTO v_ts FROM maintenance_records WHERE id = p_record_id;
    INSERT INTO maintenance_work_items (
        maintenance_record_id, maintenance_category_id, work_content, performed_by,
        labor_cost, sort_order, created_at, updated_at)
    VALUES (
        p_record_id,
        (SELECT id FROM maintenance_categories WHERE code = p_category_code),
        p_work_content, p_performed_by, p_labor_cost, p_sort_order, v_ts, v_ts)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 部品を1件登録する
CREATE FUNCTION pg_temp.demo_add_part(
    p_item_id BIGINT, p_condition TEXT, p_part_name TEXT, p_manufacturer TEXT,
    p_model_number TEXT, p_quantity NUMERIC, p_unit_price NUMERIC, p_sort_order INT
) RETURNS VOID AS $$
DECLARE
    v_ts TIMESTAMPTZ;
BEGIN
    SELECT r.created_at INTO v_ts
    FROM maintenance_work_items wi
    JOIN maintenance_records r ON r.id = wi.maintenance_record_id
    WHERE wi.id = p_item_id;
    INSERT INTO maintenance_parts (
        maintenance_work_item_id, part_condition, part_name, manufacturer_name,
        part_model_number, quantity, unit_price, sort_order, created_at, updated_at)
    VALUES (
        p_item_id, p_condition, p_part_name, p_manufacturer,
        p_model_number, p_quantity, p_unit_price, p_sort_order, v_ts, v_ts);
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------------------------------------------
-- デモデータ本体
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    -- 固定UUID（デモデータであることが分かる 'de000000-...' 。V1000の固定UUIDとは衝突しない）
    c_owner_01 CONSTANT UUID := 'de000000-0000-4000-8000-000000000a01'; -- デモオーナー（ログイン可）
    c_owner_02 CONSTANT UUID := 'de000000-0000-4000-8000-000000000a02'; -- 佐藤 太郎（顧客）
    c_owner_03 CONSTANT UUID := 'de000000-0000-4000-8000-000000000a03'; -- 鈴木 一郎（顧客）
    c_owner_04 CONSTANT UUID := 'de000000-0000-4000-8000-000000000a04'; -- 田中 次郎（顧客）
    c_shop     CONSTANT UUID := 'de000000-0000-4000-8000-000000000b01'; -- デモショップ（ログイン可）

    c_veh_rx7   CONSTANT UUID := 'de000000-0000-4000-8000-000000000c01'; -- RX-7（デモオーナー / SHOP連携）
    c_veh_gr86  CONSTANT UUID := 'de000000-0000-4000-8000-000000000c02'; -- GR86（デモオーナー / 未連携）
    c_veh_gtr   CONSTANT UUID := 'de000000-0000-4000-8000-000000000c03'; -- GT-R（佐藤 / SHOP連携）
    c_veh_civic CONSTANT UUID := 'de000000-0000-4000-8000-000000000c04'; -- シビック（鈴木 / SHOP連携）
    c_veh_s15   CONSTANT UUID := 'de000000-0000-4000-8000-000000000c05'; -- シルビア（田中 / SHOP連携）
    c_veh_yaris CONSTANT UUID := 'de000000-0000-4000-8000-000000000c06'; -- GRヤリス（SHOP自社車両）

    -- 作業項目の担当者名
    c_staff CONSTANT TEXT := 'デモショップ整備担当';
    c_diy   CONSTANT TEXT := 'オーナー本人（DIY）';

    v_rec  UUID;
    v_item BIGINT;
BEGIN

    -- 既にデモ用メールアドレスのユーザーが存在する場合は、参照整合性の破損や起動失敗を避けるため何もしない
    IF EXISTS (
        SELECT 1 FROM users
        WHERE email IN ('demo-owner@example.com', 'demo-shop@example.com',
                        'demo-owner-02@example.com', 'demo-owner-03@example.com', 'demo-owner-04@example.com')
    ) THEN
        RAISE NOTICE 'V3: デモ用メールアドレスのユーザーが既に存在するため、デモデータの投入をスキップします。';
        RETURN;
    END IF;

    -- =========================================================================
    -- 1. USERS（OWNER 4人 + SHOP 1人）
    --    demo-owner / demo-shop はログイン可能。02〜04はログイン不可（ランダムなBCryptハッシュ）
    -- =========================================================================
    INSERT INTO users (id, role, user_name, email, password_hash, created_at, updated_at) VALUES
    (c_owner_01, 'OWNER', 'デモオーナー', 'demo-owner@example.com',    '$2a$10$e/T4n6Wd1K2sXxX9JCG7Te0HvTzTD1JSUAuxvnD5JLK2tiNGzW0VG', pg_temp.demo_ts(pg_temp.demo_date(12, 1)), pg_temp.demo_ts(pg_temp.demo_date(12, 1))),
    (c_shop,     'SHOP',  'デモショップ', 'demo-shop@example.com',     '$2a$10$fOPTHWT6TniWTeXVn3ixXOE6AHiyfUJj1IoC4qwD7khwVlXDeIiE2', pg_temp.demo_ts(pg_temp.demo_date(12, 1)), pg_temp.demo_ts(pg_temp.demo_date(12, 1))),
    (c_owner_02, 'OWNER', '佐藤 太郎',   'demo-owner-02@example.com', '$2a$10$jfEvHEnICHw0h4P9nLi6N.9Kl2gZQ1ZvD9un7X3NLDkTdP6nhPlU6', pg_temp.demo_ts(pg_temp.demo_date(8, 1)),  pg_temp.demo_ts(pg_temp.demo_date(8, 1))),
    (c_owner_03, 'OWNER', '鈴木 一郎',   'demo-owner-03@example.com', '$2a$10$u.DAJyZMkVZls.FSYDKDmO0M9lyeqgcBrfmC22slcTb3a0tBwUipa', pg_temp.demo_ts(pg_temp.demo_date(7, 1)),  pg_temp.demo_ts(pg_temp.demo_date(7, 1))),
    (c_owner_04, 'OWNER', '田中 次郎',   'demo-owner-04@example.com', '$2a$10$f5qAfWuDRi2fN6aQnwEDdOIqovIRNHdd5ldhs3DzGEL7RsiVQQNQq', pg_temp.demo_ts(pg_temp.demo_date(8, 1)),  pg_temp.demo_ts(pg_temp.demo_date(8, 1)));

    -- =========================================================================
    -- 2. SHOPS（ショップ詳細。shops.id = users.id）。住所・電話番号は架空の値
    -- =========================================================================
    INSERT INTO shops (id, phone_number, postal_code, address, website_url, description, created_at, updated_at) VALUES
    (c_shop, '045-000-0000', '231-0000', '神奈川県横浜市中区デモ町1-2-3', 'https://example.com',
     'Pitviaのデモ用ショップです。スポーツカー・旧車の整備、カスタム、ECUセッティングに対応しています。',
     pg_temp.demo_ts(pg_temp.demo_date(12, 1)), pg_temp.demo_ts(pg_temp.demo_date(12, 1)));

    -- =========================================================================
    -- 3. VEHICLES（6台）。image_key / license_plate は全てNULL
    -- =========================================================================
    INSERT INTO vehicles (
        id, user_id, vehicle_type, model_name, manufacturer_id, model_code, engine_code, model_year,
        license_plate, image_key, current_mileage, transmission_type, drive_type, memo, created_at, updated_at
    ) VALUES
    -- デモオーナー: RX-7（SHOP連携済み。整備記録が最も多い）
    (c_veh_rx7, c_owner_01, 'CAR', 'RX-7', (SELECT id FROM manufacturers WHERE code = 'MAZDA'),
     'FD3S', '13B-REW', 2002, NULL, NULL, 86900, 'MT', 'FR',
     'サーキット走行も楽しむメイン車両。13B-REWのメンテナンスを継続中。',
     pg_temp.demo_ts(pg_temp.demo_date(11, 1)), pg_temp.demo_ts(pg_temp.demo_date(11, 1))),
    -- デモオーナー: GR86（SHOP未連携。招待コードによる連携デモ用）
    (c_veh_gr86, c_owner_01, 'CAR', 'GR86', (SELECT id FROM manufacturers WHERE code = 'TOYOTA'),
     'ZN8', 'FA24', 2023, NULL, NULL, 13800, 'MT', 'FR',
     '街乗りとワインディング用。ショップ連携前のDIY管理車両。',
     pg_temp.demo_ts(pg_temp.demo_date(6, 1)), pg_temp.demo_ts(pg_temp.demo_date(6, 1))),
    -- 佐藤 太郎: スカイラインGT-R（SHOP連携済み）
    (c_veh_gtr, c_owner_02, 'CAR', 'スカイラインGT-R', (SELECT id FROM manufacturers WHERE code = 'NISSAN'),
     'BNR34', 'RB26DETT', 2000, NULL, NULL, 64300, 'MT', 'AWD',
     'ノーマルに近い仕様を維持しつつ、定期的にショップで点検。',
     pg_temp.demo_ts(pg_temp.demo_date(7, 1)), pg_temp.demo_ts(pg_temp.demo_date(7, 1))),
    -- 鈴木 一郎: シビック TYPE R（SHOP連携済み）
    (c_veh_civic, c_owner_03, 'CAR', 'シビック TYPE R', (SELECT id FROM manufacturers WHERE code = 'HONDA'),
     'FL5', 'K20C', 2023, NULL, NULL, 10900, 'MT', 'FF',
     'サーキット走行が中心。ブレーキとホイールをカスタム。',
     pg_temp.demo_ts(pg_temp.demo_date(6, 1)), pg_temp.demo_ts(pg_temp.demo_date(6, 1))),
    -- 田中 次郎: シルビア（SHOP連携済み）
    (c_veh_s15, c_owner_04, 'CAR', 'シルビア', (SELECT id FROM manufacturers WHERE code = 'NISSAN'),
     'S15', 'SR20DET', 2001, NULL, NULL, 121900, 'MT', 'FR',
     '長く乗り続けている愛車。消耗品を計画的に交換。',
     pg_temp.demo_ts(pg_temp.demo_date(7, 1)), pg_temp.demo_ts(pg_temp.demo_date(7, 1))),
    -- デモショップ: GRヤリス（SHOP自社車両。連携は不要）
    (c_veh_yaris, c_shop, 'CAR', 'GRヤリス', (SELECT id FROM manufacturers WHERE code = 'TOYOTA'),
     'GXPA16', 'G16E-GTS', 2021, NULL, NULL, 8900, 'MT', 'AWD',
     'デモショップのデモカー。',
     pg_temp.demo_ts(pg_temp.demo_date(8, 1)), pg_temp.demo_ts(pg_temp.demo_date(8, 1)));

    -- =========================================================================
    -- 4. VEHICLE_SHOP_LINKS（APPROVED 4件）
    --    GR86 と SHOP自社車両(GRヤリス)は連携しない。承認日は各車両の最初のSHOP整備より前
    -- =========================================================================
    INSERT INTO vehicle_shop_links (vehicle_id, shop_id, status, approved_at, created_at, updated_at) VALUES
    (c_veh_rx7,   c_shop, 'APPROVED', pg_temp.demo_ts(pg_temp.demo_date(10, 1)), pg_temp.demo_ts(pg_temp.demo_date(10, 1)), pg_temp.demo_ts(pg_temp.demo_date(10, 1))),
    (c_veh_gtr,   c_shop, 'APPROVED', pg_temp.demo_ts(pg_temp.demo_date(6, 1)),  pg_temp.demo_ts(pg_temp.demo_date(6, 1)),  pg_temp.demo_ts(pg_temp.demo_date(6, 1))),
    (c_veh_civic, c_shop, 'APPROVED', pg_temp.demo_ts(pg_temp.demo_date(5, 1)),  pg_temp.demo_ts(pg_temp.demo_date(5, 1)),  pg_temp.demo_ts(pg_temp.demo_date(5, 1))),
    (c_veh_s15,   c_shop, 'APPROVED', pg_temp.demo_ts(pg_temp.demo_date(6, 1)),  pg_temp.demo_ts(pg_temp.demo_date(6, 1)),  pg_temp.demo_ts(pg_temp.demo_date(6, 1)));

    -- =========================================================================
    -- 5. 整備記録 → 作業項目 → 部品
    --    demo_add_record(車両, 作成者, ショップ, タイトル, 整備種別コード, N ヶ月前, D 日, 作業日数, 走行距離, 備考)
    --    demo_add_item  (記録, カテゴリコード, 作業内容, 担当者, 工賃, 表示順)
    --    demo_add_part  (作業項目, 状態, 部品名, メーカー, 型番, 数量, 単価, 表示順)
    --    ・SHOP作成の記録: created_by_user_id = shop_id = デモショップ
    --    ・DIYの記録     : created_by_user_id = OWNER, shop_id = NULL
    -- =========================================================================

    -- -------------------------------------------------------------------------
    -- 5-1. デモオーナー RX-7（7件: SHOP作成5 + DIY 2）
    -- -------------------------------------------------------------------------

    -- [8ヶ月前] 車検（6ヶ月より前。「前の期間へ」の確認用）
    v_rec := pg_temp.demo_add_record(c_veh_rx7, c_shop, c_shop, '継続車検整備（24か月点検）', 'VEHICLE_INSPECTION',
                8, 15, 1, 82100, '年式相応にゴム類が劣化。次回はブッシュ類の交換も検討。');
    v_item := pg_temp.demo_add_item(v_rec, 'OTHER', '法定24か月点検・継続検査代行', c_staff, 45000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ワイパーブレード', 'PIAA', NULL, 2, 1200, 0);
    v_item := pg_temp.demo_add_item(v_rec, 'BRAKE', 'ブレーキフルード全量交換', c_staff, 5000, 1);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ブレーキフルード DOT4（1L）', 'ENDLESS', 'RF650', 1, 3300, 0);

    -- [5ヶ月前] 定期メンテナンス（DIY）
    v_rec := pg_temp.demo_add_record(c_veh_rx7, c_owner_01, NULL, 'エンジンオイル・オイルフィルター交換', 'PERIODIC_MAINTENANCE',
                5, 6, 0, 83000, '3,000kmごとの定期交換。');
    v_item := pg_temp.demo_add_item(v_rec, 'ENGINE', 'エンジンオイル・エレメント交換', c_diy, 0, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'エンジンオイル 15W-50（4L）', 'MOTUL', '300V', 1, 8800, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'オイルフィルター', 'マツダ純正', NULL, 1, 1650, 1);

    -- [4ヶ月前] 修理（冷却系）
    v_rec := pg_temp.demo_add_record(c_veh_rx7, c_shop, c_shop, '冷却系リフレッシュ（ラジエーター・ウォーターポンプ交換）', 'REPAIR',
                4, 12, 1, 83900, '水温が不安定になったため冷却系を一新。');
    v_item := pg_temp.demo_add_item(v_rec, 'COOLING', 'ラジエーター交換', c_staff, 28000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ラジエーター（アルミ大容量タイプ）', 'KOYO', NULL, 1, 42000, 0);
    v_item := pg_temp.demo_add_item(v_rec, 'COOLING', 'ウォーターポンプ・サーモスタット交換', c_staff, 18000, 1);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ウォーターポンプ', 'マツダ純正', NULL, 1, 21000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ロングライフクーラント（1L）', 'マツダ純正', NULL, 2, 1800, 1);

    -- [3ヶ月前] カスタム（DIY）
    v_rec := pg_temp.demo_add_record(c_veh_rx7, c_owner_01, NULL, 'リアピースマフラー交換', 'CUSTOM',
                3, 18, 0, 84600, '音量とレスポンスを重視してチタンマフラーに変更。');
    v_item := pg_temp.demo_add_item(v_rec, 'INTAKE_EXHAUST', 'リアピースマフラー取り付け', c_diy, 0, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'チタンリアピースマフラー', 'FUJITSUBO', NULL, 1, 118000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ガスケット・ボルトセット', NULL, NULL, 1, 1500, 1);

    -- [2ヶ月前] チューニング（タービン交換。比較的高額な整備）
    v_rec := pg_temp.demo_add_record(c_veh_rx7, c_shop, c_shop, 'タービン交換（ボルトオンタービン）', 'TUNING',
                2, 9, 1, 85300, 'ブースト立ち上がり改善のためタービンを交換。ECUセッティングは別途実施予定。');
    v_item := pg_temp.demo_add_item(v_rec, 'ENGINE', 'タービン交換・ブースト配管点検', c_staff, 90000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ボルトオンタービン', 'HKS', NULL, 1, 298000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'タービンガスケットセット', NULL, NULL, 1, 9800, 1);

    -- [1ヶ月前] 修理（ブレーキ）
    v_rec := pg_temp.demo_add_record(c_veh_rx7, c_shop, c_shop, 'ブレーキパッド・ローター交換（フロント）', 'REPAIR',
                1, 14, 0, 86000, 'パッドの摩耗限度に到達したため、ローターとあわせて交換。');
    v_item := pg_temp.demo_add_item(v_rec, 'BRAKE', 'フロントブレーキパッド交換', c_staff, 8000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ブレーキパッド フロント', 'ENDLESS', 'MX72', 1, 24800, 0);
    v_item := pg_temp.demo_add_item(v_rec, 'BRAKE', 'フロントブレーキローター交換', c_staff, 6000, 1);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ブレーキローター フロント（1枚）', 'DIXCEL', 'PD', 2, 14500, 0);

    -- [当月] セッティング（ECUセッティング。今月売上に計上される）
    v_rec := pg_temp.demo_add_record(c_veh_rx7, c_shop, c_shop, 'シャシダイ ECUセッティング', 'SETTING',
                0, 8, 0, 86700, 'タービン交換後の燃調・点火時期を現車合わせで最適化。');
    v_item := pg_temp.demo_add_item(v_rec, 'ENGINE', 'ECUセッティング（シャシダイ測定・燃調点火マップ調整）', c_staff, 120000, 0);

    -- -------------------------------------------------------------------------
    -- 5-2. デモオーナー GR86（3件: 全てDIY。SHOP未連携）
    -- -------------------------------------------------------------------------

    -- [4ヶ月前] 定期メンテナンス
    v_rec := pg_temp.demo_add_record(c_veh_gr86, c_owner_01, NULL, '初回オイル交換', 'PERIODIC_MAINTENANCE',
                4, 20, 0, 5200, 'ならし運転後の初回交換。');
    v_item := pg_temp.demo_add_item(v_rec, 'ENGINE', 'エンジンオイル・エレメント交換', c_diy, 0, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'エンジンオイル 0W-30（5L）', 'ENEOS', NULL, 1, 6600, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'オイルフィルター', 'トヨタ純正', NULL, 1, 1200, 1);

    -- [1ヶ月前] カスタム（タイヤ4本）
    v_rec := pg_temp.demo_add_record(c_veh_gr86, c_owner_01, NULL, 'スポーツタイヤ交換（4本）', 'CUSTOM',
                1, 24, 0, 12300, 'ホイール脱着はDIY、タイヤの組み替えはタイヤ専門店で実施。');
    v_item := pg_temp.demo_add_item(v_rec, 'SUSPENSION', 'タイヤ交換（4輪）', c_diy, 0, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'スポーツタイヤ 215/45R17', 'YOKOHAMA', 'ADVAN A052', 4, 27500, 0);

    -- [当月] その他（洗車・コーティング）
    v_rec := pg_temp.demo_add_record(c_veh_gr86, c_owner_01, NULL, '洗車・ガラスコーティング', 'OTHER',
                0, 5, 0, 13800, NULL);
    v_item := pg_temp.demo_add_item(v_rec, 'CLEANING', '手洗い洗車・ガラスコーティング施工', c_diy, 0, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ガラスコーティング剤', 'KURE', NULL, 1, 3300, 0);

    -- -------------------------------------------------------------------------
    -- 5-3. 佐藤 太郎 スカイラインGT-R（4件: SHOP作成）
    -- -------------------------------------------------------------------------

    -- [5ヶ月前] 定期メンテナンス
    v_rec := pg_temp.demo_add_record(c_veh_gtr, c_shop, c_shop, 'エンジンオイル・デフオイル交換', 'PERIODIC_MAINTENANCE',
                5, 10, 0, 61500, 'サーキット走行後の定期メンテナンス。');
    v_item := pg_temp.demo_add_item(v_rec, 'ENGINE', 'エンジンオイル・エレメント交換', c_staff, 6000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'エンジンオイル 10W-50（5L）', 'MOTUL', '300V', 1, 13500, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'オイルフィルター', 'NISMO', NULL, 1, 2200, 1);
    v_item := pg_temp.demo_add_item(v_rec, 'DRIVETRAIN', '前後デフオイル交換', c_staff, 7000, 1);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ギヤオイル 75W-90（1L）', 'MOTUL', NULL, 2, 3600, 0);

    -- [3ヶ月前] 修理（クラッチ）
    v_rec := pg_temp.demo_add_record(c_veh_gtr, c_shop, c_shop, 'クラッチ・フライホイール交換', 'REPAIR',
                3, 22, 1, 63000, 'クラッチの滑りが出たため、キットで交換。');
    v_item := pg_temp.demo_add_item(v_rec, 'DRIVETRAIN', 'ミッション脱着・クラッチ交換', c_staff, 75000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'メタルクラッチキット', 'ORC', NULL, 1, 128000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'レリーズベアリング', '日産純正', NULL, 1, 6500, 1);
    v_item := pg_temp.demo_add_item(v_rec, 'DRIVETRAIN', 'フライホイール面研', c_staff, 12000, 1);

    -- [2ヶ月前] チューニング（アライメント）
    v_rec := pg_temp.demo_add_record(c_veh_gtr, c_shop, c_shop, '車高調整・4輪アライメント調整', 'TUNING',
                2, 20, 0, 63500, '路面に合わせてキャンバー・トーを調整。');
    v_item := pg_temp.demo_add_item(v_rec, 'SUSPENSION', '車高調整（前後）', c_staff, 15000, 0);
    v_item := pg_temp.demo_add_item(v_rec, 'SUSPENSION', '4輪アライメント測定・調整', c_staff, 12000, 1);

    -- [当月] 車検
    v_rec := pg_temp.demo_add_record(c_veh_gtr, c_shop, c_shop, '継続車検整備', 'VEHICLE_INSPECTION',
                0, 10, 0, 64300, '次回車検は2年後。');
    v_item := pg_temp.demo_add_item(v_rec, 'OTHER', '法定24か月点検・継続検査代行', c_staff, 48000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ワイパーブレード', 'PIAA', NULL, 2, 1200, 0);
    v_item := pg_temp.demo_add_item(v_rec, 'BRAKE', 'ブレーキフルード全量交換', c_staff, 8000, 1);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ブレーキフルード DOT4（1L）', 'ENDLESS', 'RF650', 1, 3300, 0);
    v_item := pg_temp.demo_add_item(v_rec, 'COOLING', 'クーラント交換', c_staff, 6000, 2);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ロングライフクーラント（4L）', '日産純正', NULL, 1, 4800, 0);

    -- -------------------------------------------------------------------------
    -- 5-4. 鈴木 一郎 シビック TYPE R（3件: SHOP作成）
    -- -------------------------------------------------------------------------

    -- [4ヶ月前] 点検（部品なし）
    v_rec := pg_temp.demo_add_record(c_veh_civic, c_shop, c_shop, 'サーキット走行前点検', 'INSPECTION',
                4, 16, 0, 7800, 'ブレーキ・足回り・冷却系の状態を確認。異常なし。');
    v_item := pg_temp.demo_add_item(v_rec, 'BRAKE', 'ブレーキ・足回り点検', c_staff, 8000, 0);
    v_item := pg_temp.demo_add_item(v_rec, 'COOLING', '冷却水・オイル量点検', c_staff, 4000, 1);

    -- [2ヶ月前] カスタム（ブレーキパッド）
    v_rec := pg_temp.demo_add_record(c_veh_civic, c_shop, c_shop, 'スポーツブレーキパッドへ交換', 'CUSTOM',
                2, 11, 0, 9100, NULL);
    v_item := pg_temp.demo_add_item(v_rec, 'BRAKE', 'フロントブレーキパッド交換', c_staff, 10000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'ブレーキパッド フロント', 'DIXCEL', 'Zタイプ', 1, 22800, 0);

    -- [1ヶ月前] カスタム（ホイール。中古品）
    v_rec := pg_temp.demo_add_record(c_veh_civic, c_shop, c_shop, 'ホイール交換（サーキット用）', 'CUSTOM',
                1, 5, 0, 10400, '軽量ホイールへ変更。中古品を使用。');
    v_item := pg_temp.demo_add_item(v_rec, 'SUSPENSION', 'ホイール交換・バランス調整', c_staff, 10000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'USED', 'アルミホイール 19インチ', 'RAYS', 'TE37', 4, 38000, 0);

    -- -------------------------------------------------------------------------
    -- 5-5. 田中 次郎 シルビア（3件: SHOP作成）
    -- -------------------------------------------------------------------------

    -- [5ヶ月前] 修理（クラッチ）
    v_rec := pg_temp.demo_add_record(c_veh_s15, c_shop, c_shop, 'クラッチ交換', 'REPAIR',
                5, 18, 0, 118500, 'クラッチの滑りが出たため、強化クラッチに交換。');
    v_item := pg_temp.demo_add_item(v_rec, 'DRIVETRAIN', 'ミッション脱着・クラッチ交換', c_staff, 55000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'クラッチキット（強化）', 'EXEDY', NULL, 1, 64000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'レリーズベアリング', '日産純正', NULL, 1, 5800, 1);

    -- [3ヶ月前] 修理（板金塗装）
    v_rec := pg_temp.demo_add_record(c_veh_s15, c_shop, c_shop, 'フロントバンパー補修・板金塗装', 'REPAIR',
                3, 7, 0, 119800, '小さな接触傷を補修して再塗装。');
    v_item := pg_temp.demo_add_item(v_rec, 'BODY_REPAIR', 'バンパー補修・パテ整形・塗装', c_staff, 65000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', '塗料・パテ材料一式', NULL, NULL, 1, 12000, 0);

    -- [当月] 定期メンテナンス
    v_rec := pg_temp.demo_add_record(c_veh_s15, c_shop, c_shop, 'オイル・エレメント・プラグ交換', 'PERIODIC_MAINTENANCE',
                0, 4, 0, 121800, NULL);
    v_item := pg_temp.demo_add_item(v_rec, 'ENGINE', 'エンジンオイル・エレメント交換', c_staff, 4000, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'エンジンオイル 5W-40（4L）', 'MOTUL', NULL, 1, 8800, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'オイルフィルター', '日産純正', NULL, 1, 1700, 1);
    v_item := pg_temp.demo_add_item(v_rec, 'ENGINE', 'スパークプラグ交換', c_staff, 6000, 1);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'イリジウムプラグ', 'NGK', NULL, 4, 1650, 0);

    -- -------------------------------------------------------------------------
    -- 5-6. デモショップ 自社車両 GRヤリス（2件: SHOP作成。売上には計上されない）
    -- -------------------------------------------------------------------------

    -- [4ヶ月前] チューニング
    v_rec := pg_temp.demo_add_record(c_veh_yaris, c_shop, c_shop, 'デモカー サスペンション・アライメントセッティング', 'TUNING',
                4, 25, 0, 4200, NULL);
    v_item := pg_temp.demo_add_item(v_rec, 'SUSPENSION', 'サスペンション調整・アライメント', c_staff, 30000, 0);

    -- [2ヶ月前] 定期メンテナンス
    v_rec := pg_temp.demo_add_record(c_veh_yaris, c_shop, c_shop, 'デモカー オイル・エレメント交換', 'PERIODIC_MAINTENANCE',
                2, 27, 0, 6900, NULL);
    v_item := pg_temp.demo_add_item(v_rec, 'ENGINE', 'エンジンオイル・エレメント交換', c_staff, 3500, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'エンジンオイル 0W-30（3L）', 'ENEOS', NULL, 1, 9800, 0);
    PERFORM pg_temp.demo_add_part(v_item, 'NEW', 'オイルフィルター', 'トヨタ純正', NULL, 1, 1700, 1);

END $$;


-- -----------------------------------------------------------------------------
-- 6. 一時ヘルパー関数の削除
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS pg_temp.demo_add_part(BIGINT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, INT);
DROP FUNCTION IF EXISTS pg_temp.demo_add_item(UUID, TEXT, TEXT, TEXT, NUMERIC, INT);
DROP FUNCTION IF EXISTS pg_temp.demo_add_record(UUID, UUID, UUID, TEXT, TEXT, INT, INT, INT, INT, TEXT);
DROP FUNCTION IF EXISTS pg_temp.demo_ts(DATE);
DROP FUNCTION IF EXISTS pg_temp.demo_date(INT, INT);
