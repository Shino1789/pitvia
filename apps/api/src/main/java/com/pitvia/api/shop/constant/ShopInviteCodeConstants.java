package com.pitvia.api.shop.constant;

/**
 * ショップ招待コードに関する定数を管理するクラス
 *
 * @author pitvia
 * @version 1.0
 */
public final class ShopInviteCodeConstants {

    private ShopInviteCodeConstants() {
        // インスタンス化を防止するためのプライベートコンストラクタ
    }

    /** 招待コードの有効期限（時間） */
    public static final int EXPIRATION_HOURS = 24;

    /** 招待コードのハイフン区切り1ブロックあたりの文字数（例: "A7X9-K2LM"の場合は4） */
    public static final int CODE_SEGMENT_LENGTH = 4;

    /** 招待コードのブロック数（例: "A7X9-K2LM"の場合は2） */
    public static final int CODE_SEGMENT_COUNT = 2;

    /**
     * 招待コードの文字集合
     *
     * <p>
     * 見間違えやすい文字（{@code 0/O}, {@code 1/I/L}）を除いた大文字英数字のみを使用する。
     * </p>
     */
    public static final String CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

}
