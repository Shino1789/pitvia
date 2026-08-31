package com.pitvia.api.common.dto.response;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * ページング付き一覧レスポンス共通型
 *
 * <p>
 * Spring Dataの{@link Page}をそのままAPIレスポンスとして返さず、この型へ変換して使用する
 * （{@code Page}はpageable/sort等の余分な内部情報を含み、本プロジェクトの最小限主義な
 * レスポンス設計と合わないため）。API上の{@code page}は1始まりとする。
 * </p>
 *
 * @param <T> 一覧要素の型
 *
 * @author pitvia
 * @version 1.0
 */
public record PageResponse<T>(

        /**
         * 現在ページの要素一覧
         */
        List<T> content,

        /**
         * 現在のページ番号（1始まり）
         */
        int page,

        /**
         * 1ページあたりの件数
         */
        int size,

        /**
         * 全件数
         */
        long totalElements,

        /**
         * 総ページ数
         */
        int totalPages) {

    /**
     * Spring Dataの{@link Page}からPageResponseを生成する
     *
     * @param <T>  一覧要素の型
     * @param page 変換元のPage
     * @return PageResponse（{@code page}はSpring Dataの0始まりから1始まりへ変換される）
     */
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
