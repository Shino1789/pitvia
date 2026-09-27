package com.pitvia.api.common.dto.param;

import org.springframework.data.domain.PageRequest;

/**
 * ページング付き一覧取得リクエストパラメータの共通インターフェース
 *
 * <p>
 * APIの{@code page}は1始まりだが、Spring Dataの{@code Pageable}は0始まりであるため、
 * 各一覧取得Param recordで同じ{@code page - 1}変換処理が重複していた。本インターフェースを
 * 実装することで、{@link #toPageable()}経由でこの変換処理を一箇所に集約する。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
public interface PageableListParam {

    /**
     * ページ番号を返す（1始まり）
     *
     * @return ページ番号
     */
    int getPage();

    /**
     * 1ページあたりの件数を返す
     *
     * @return 1ページあたりの件数
     */
    int getSize();

    /**
     * API上の1始まりページ番号を、Spring Data基準（0始まり）の{@link PageRequest}へ変換する
     *
     * @return 並び替え条件を含まないPageRequest
     */
    default PageRequest toPageable() {
        return PageRequest.of(getPage() - 1, getSize());
    }

}
