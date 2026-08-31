package com.pitvia.api.storage.transaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Function;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronizationUtils;
import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.storage.service.StorageService;

/**
 * ストレージ操作とDBトランザクションを連携するマネージャーの単体テスト
 *
 * <p>
 * 実際のDB・ストレージへの接続は行わず、{@code StorageService} をモック化した上で、
 * アップロード後の後続処理が失敗した場合に、アップロード済みファイルが確実に
 * 削除（ロールバック）されること、および画像差し替え時の旧ファイル削除が
 * DBトランザクションのコミット後まで正しく遅延されることを検証する。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@ExtendWith(MockitoExtension.class)
class StorageTransactionManagerTest {

    /** モック化したストレージサービス */
    @Mock
    private StorageService storageService;

    /** テスト対象 */
    @InjectMocks
    private StorageTransactionManager storageTransactionManager;

    /**
     * 各テスト終了後、{@code TransactionSynchronizationManager}に登録した同期処理を必ずクリアする
     * （後続のテストへ状態が漏れ出すことを防ぐ）。
     */
    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    /**
     * アップロード後の後続処理が失敗した場合、アップロード済みファイルが削除されることを確認する。
     */
    @Test
    @DisplayName("後続処理が失敗した場合、アップロード済みファイルが削除される")
    void uploadAndExecute_shouldDeleteUploadedFile_whenOperationFails() {

        // Arrange
        MultipartFile file = new MockMultipartFile("file", "icon.png", "image/png", new byte[] { 1, 2, 3 });
        UUID resourceId = UUID.randomUUID();
        String uploadedKey = "vehicles/icons/" + resourceId + "/uuid.png";

        when(storageService.upload(file, ImageType.VEHICLE_ICON, resourceId)).thenReturn(uploadedKey);

        // 後続処理内でわざと例外を発生させ、途中失敗を再現する
        // （戻り値のないConsumer版に対する呼び出しであることを明示し、Function版とのオーバーロード曖昧さを解消する）
        Consumer<String> failingOperation = key -> {
            throw new RuntimeException("simulated downstream failure");
        };

        // Act & Assert
        assertThatThrownBy(() -> storageTransactionManager.uploadAndExecute(
                file, ImageType.VEHICLE_ICON, resourceId, failingOperation))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("simulated downstream failure");

        // アップロード済みファイルの削除（ロールバック）が呼ばれたことを確認
        verify(storageService).delete(uploadedKey);
    }

    /**
     * トランザクションがアクティブな状態で{@code replaceAndExecute}を呼んだ場合、
     * コミット前は旧ファイルが削除されず、コミット後に初めて削除されることを確認する。
     *
     * <p>
     * {@link TransactionSynchronizationManager}はスレッドローカルな仕組みのため、
     * Spring全体のトランザクション機構やDBを起動せずとも、
     * {@code initSynchronization()}で同期処理の受付を開始し、
     * {@link TransactionSynchronizationUtils#triggerAfterCommit()}でコミット完了を
     * 模擬することで、本クラス単体でこの遅延削除の挙動を検証できる。
     * </p>
     */
    @Test
    @DisplayName("差し替え成功時、旧ファイルの削除はトランザクションのコミット完了まで遅延される")
    void replaceAndExecute_shouldDeferOldFileDeletion_untilAfterCommit() {

        // Arrange
        MultipartFile file = new MockMultipartFile("file", "work.png", "image/png", new byte[] { 1, 2, 3 });
        UUID resourceId = UUID.randomUUID();
        String oldKey = "maintenance/images/" + resourceId + "/old.png";
        String newKey = "maintenance/images/" + resourceId + "/new.png";
        Function<String, String> operation = key -> key;

        when(storageService.upload(file, ImageType.MAINTENANCE_IMAGE, resourceId)).thenReturn(newKey);

        // トランザクションがアクティブな状態を模擬する
        TransactionSynchronizationManager.initSynchronization();

        // Act
        String result = storageTransactionManager.replaceAndExecute(
                file, ImageType.MAINTENANCE_IMAGE, resourceId, oldKey, operation);

        // Assert: コミット前は、後続処理（DB更新）が成功していても旧ファイルは削除されない
        assertThat(result).isEqualTo(newKey);
        verify(storageService, never()).delete(oldKey);

        // Act: トランザクションのコミット完了を模擬する
        TransactionSynchronizationUtils.triggerAfterCommit();

        // Assert: コミット完了後に初めて旧ファイルが削除される
        verify(storageService).delete(oldKey);
    }

    /**
     * トランザクションがロールバックされた場合（＝コミットが一度も呼ばれない場合）、
     * 旧ファイルの削除が一切実行されないことを確認する。
     *
     * <p>
     * これが今回の不具合（後続の作業項目の検証エラーでDBがロールバックされたにもかかわらず、
     * 先に処理した作業項目の旧画像がストレージから削除済みになってしまう）の再発防止テストにあたる。
     * </p>
     */
    @Test
    @DisplayName("トランザクションがロールバックされた場合、旧ファイルは削除されない")
    void replaceAndExecute_shouldNotDeleteOldFile_whenTransactionRollsBack() {

        // Arrange
        MultipartFile file = new MockMultipartFile("file", "work.png", "image/png", new byte[] { 1, 2, 3 });
        UUID resourceId = UUID.randomUUID();
        String oldKey = "maintenance/images/" + resourceId + "/old.png";
        String newKey = "maintenance/images/" + resourceId + "/new.png";

        when(storageService.upload(file, ImageType.MAINTENANCE_IMAGE, resourceId)).thenReturn(newKey);

        TransactionSynchronizationManager.initSynchronization();

        // Act: 差し替え自体はこの時点では成功する（後続の別作業項目の検証エラーは、
        // 呼び出し元のサービス層でこの後スローされる想定のため、ここでは模擬しない）
        storageTransactionManager.replaceAndExecute(
                file, ImageType.MAINTENANCE_IMAGE, resourceId, oldKey, key -> key);

        // Assert: コミットが一度も行われない（＝ロールバックされる）場合、
        // 登録した同期処理のafterCommit()は呼ばれないため、旧ファイルは一切削除されない
        verify(storageService, never()).delete(oldKey);
    }

    /**
     * アクティブなトランザクションが存在しない状態で呼び出された場合は、
     * 遅延させる先が無いため、従来通り即座に旧ファイルが削除されることを確認する
     * （呼び出し元の実装ミス等、本来想定しない使い方に対するフォールバック）。
     */
    @Test
    @DisplayName("アクティブなトランザクションが無い場合、旧ファイルは即座に削除される")
    void replaceAndExecute_shouldDeleteOldFileImmediately_whenNoActiveTransaction() {

        // Arrange
        MultipartFile file = new MockMultipartFile("file", "work.png", "image/png", new byte[] { 1, 2, 3 });
        UUID resourceId = UUID.randomUUID();
        String oldKey = "maintenance/images/" + resourceId + "/old.png";
        String newKey = "maintenance/images/" + resourceId + "/new.png";

        when(storageService.upload(file, ImageType.MAINTENANCE_IMAGE, resourceId)).thenReturn(newKey);

        // Act（TransactionSynchronizationManager.initSynchronization()を呼ばない = トランザクション外）
        storageTransactionManager.replaceAndExecute(
                file, ImageType.MAINTENANCE_IMAGE, resourceId, oldKey, key -> key);

        // Assert
        verify(storageService).delete(oldKey);
    }

}
