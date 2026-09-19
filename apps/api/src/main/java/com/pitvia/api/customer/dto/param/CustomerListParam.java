package com.pitvia.api.customer.dto.param;

import com.pitvia.api.common.dto.param.PageableListParam;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 顧客一覧取得リクエストパラメータ
 *
 * @author pitvia
 * @version 1.0
 */
public record CustomerListParam(

        /**
         * 顧客名（ユーザー名）の部分一致キーワード（任意）
         */
        String keyword,

        /**
         * ページ番号（1始まり、未指定時は{@link #getPage()}でデフォルト値を返す）
         */
        @Min(1) Integer page,

        /**
         * 1ページあたりの件数（未指定時は{@link #getSize()}でデフォルト値を返す）
         */
        @Min(1) @Max(100) Integer size) implements PageableListParam {

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
    @Override
    public int getPage() {
        return page == null ? DEFAULT_PAGE : page;
    }

    /**
     * 1ページあたりの件数を返す
     * フィールドの {@code size} が指定されていない場合は、デフォルト値を返す
     *
     * @return 1ページあたりの件数
     */
    @Override
    public int getSize() {
        return size == null ? DEFAULT_SIZE : size;
    }
}
