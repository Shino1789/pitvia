package com.pitvia.api.common.exception;

import lombok.Getter;

/**
 * 業務エラーコード定義
 *
 * クライアントへ返却するエラーコードおよびメッセージを管理する。
 *
 * @author pitvia
 * @version 1.0
 */
@Getter
public enum ErrorCode {

    /**
     * バリデーションエラー
     */
    VALIDATION_ERROR("入力値に誤りがあります"),

    /**
     * JSONパースエラー
     */
    MALFORMED_JSON("JSON形式が不正です"),

    /**
     * サポート対象外のContent-Type（415）
     */
    UNSUPPORTED_MEDIA_TYPE("サポートされていないContent-Typeです"),

    /**
     * 未認証エラー（401）
     */
    UNAUTHORIZED("認証が必要です"),

    /**
     * 権限不足エラー（403）
     */
    FORBIDDEN("この操作を実行する権限がありません"),

    /**
     * リソース未検出エラー（404）
     */
    RESOURCE_NOT_FOUND("リソースが見つかりません"),

    /**
     * 想定外エラー
     */
    INTERNAL_SERVER_ERROR("予期しないエラーが発生しました"),

    /**
     * 不正なロール指定
     */
    INVALID_ROLE("不正なロールが指定されました"),

    /**
     * ユーザーが存在しない
     */
    USER_NOT_FOUND("ユーザーが存在しません"),

    /**
     * ユーザーが既に存在する
     */
    USER_ALREADY_EXISTS("ユーザーは既に存在します"),

    /**
     * 認証情報の不一致
     */
    INVALID_CREDENTIALS("メールアドレスまたはパスワードが正しくありません"),

    /**
     * リフレッシュトークンが存在しない
     */
    NO_REFRESH_TOKEN("ログインしてください"),

    /**
     * リフレッシュトークンが不正
     */
    INVALID_REFRESH_TOKEN("無効なリフレッシュトークンです"),

    /**
     * ファイルのアップロード失敗
     */
    FILE_UPLOAD_FAILED("ファイルのアップロードに失敗しました"),

    /**
     * ファイルの削除失敗
     */
    FILE_DELETE_FAILED("ファイルの削除に失敗しました"),

    /**
     * ファイルが空
     */
    FILE_EMPTY("ファイルが空です"),

    /**
     * サポート対象外の画像形式
     */
    UNSUPPORTED_IMAGE_TYPE("サポートされていない画像形式です"),

    /**
     * 画像の解像度（幅・高さ・総画素数のいずれか）が上限を超過
     */
    IMAGE_RESOLUTION_EXCEEDED("画像の解像度が上限を超えています"),

    /**
     * ファイルサイズが上限を超過
     */
    FILE_SIZE_EXCEEDED("ファイルサイズが上限を超えています"),

    /**
     * ファイル一覧の取得失敗
     */
    FILE_LIST_FAILED("ファイル一覧の取得に失敗しました"),

    /**
     * メーカーが存在しない
     */
    MANUFACTURER_NOT_FOUND("指定されたメーカーが見つかりません"),

    /**
     * 未対応の車両種別
     */
    UNSUPPORTED_VEHICLE_TYPE("現在対応していない車両種別が指定されました"),

    /**
     * オーナー権限でownerIdパラメータが指定された（SHOP専用パラメータ）
     */
    OWNER_ID_NOT_ALLOWED("この権限では他のユーザーの車両一覧を取得できません"),

    /**
     * 指定されたownerIdのユーザーが存在しない、またはログインユーザーと車両共有関係にない
     *
     * <p>
     * 「存在しない」と「共有関係が無い」を区別せず同一のエラーとして扱うことで、
     * 対象ユーザーの存在有無を外部から推測できないようにする。
     * </p>
     */
    VEHICLE_OWNER_NOT_FOUND("指定されたユーザーが見つかりません"),

    /**
     * 指定された車両が存在しない、またはログインユーザーに閲覧権限がない（404）
     */
    VEHICLE_NOT_FOUND("指定された車両が見つかりません"),

    /**
     * 車両は閲覧できるが、編集・削除の権限が無い（403）
     */
    VEHICLE_EDIT_NOT_ALLOWED("この車両を編集する権限がありません"),

    /**
     * vehicleIdとownerIdが同時に指定された（400）
     *
     * <p>
     * vehicleIdが指定されていれば対象車両の所有者は一意に決まるため、
     * 両方を同時に指定すること自体を不正なリクエストとして扱う。
     * </p>
     */
    VEHICLE_ID_OWNER_ID_CONFLICT("vehicleIdとownerIdは同時に指定できません"),

    /**
     * 指定された整備種別が存在しない
     */
    MAINTENANCE_TYPE_NOT_FOUND("指定された整備種別が見つかりません"),

    /**
     * 指定された整備カテゴリが存在しない
     */
    MAINTENANCE_CATEGORY_NOT_FOUND("指定された整備カテゴリが見つかりません");

    /**
     * クライアント向けデフォルトメッセージ
     */
    private final String defaultMessage;

    ErrorCode(String message) {
        this.defaultMessage = message;
    }

}
