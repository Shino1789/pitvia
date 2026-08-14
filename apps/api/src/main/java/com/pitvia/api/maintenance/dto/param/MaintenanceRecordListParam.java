package com.pitvia.api.maintenance.dto.param;

import java.util.Set;
import java.util.UUID;

import com.pitvia.api.maintenance.constant.MaintenanceRecordSort;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 整備履歴一覧取得リクエストパラメータ
 *
 * @author pitvia
 * @version 1.0
 */
public record MaintenanceRecordListParam(

        /**
         * 対象車両ID（任意）
         */
        UUID vehicleId,

        /**
         * 対象オーナーのユーザーID（任意、SHOP専用）
         */
        UUID ownerId,

        /**
         * 整備種別コードによる絞り込み（任意、複数指定可）
         */
        Set<String> maintenanceType,

        /**
         * 整備タイトルの部分一致キーワード（任意）
         */
        String keyword,

        /**
         * 並び替え条件（未指定時は{@link #getSort()}でデフォルト値を返す）
         */
        MaintenanceRecordSort sort,

        /**
         * ページ番号（1始まり、未指定時は{@link #getPage()}でデフォルト値を返す）
         */
        @Min(1) Integer page,

        /**
         * 1ページあたりの件数（未指定時は{@link #getSize()}でデフォルト値を返す）
         */
        @Min(1) @Max(100) Integer size) {

    /**
     * ページ番号のデフォルト値
     */
    private static final int DEFAULT_PAGE = 1;

    /**
     * 1ページあたりの件数のデフォルト値
     */
    private static final int DEFAULT_SIZE = 20;

    /**
     * ページ番号を返す
     * フィールドの {@code page} が指定されていない場合は、デフォルト値を返す
     *
     * @return ページ番号（1始まり）
     */
    public int getPage() {
        return page == null ? DEFAULT_PAGE : page;
    }

    /**
     * 1ページあたりの件数を返す
     * フィールドの {@code size} が指定されていない場合は、デフォルト値を返す
     *
     * @return 1ページあたりの件数
     */
    public int getSize() {
        return size == null ? DEFAULT_SIZE : size;
    }

    /**
     * 並び替え条件を返す
     * フィールドの {@code sort} が指定されていない場合は、デフォルト値を返す
     *
     * @return 並び替え条件
     */
    public MaintenanceRecordSort getSort() {
        return sort == null ? MaintenanceRecordSort.WORK_DATE_DESC : sort;
    }
}
