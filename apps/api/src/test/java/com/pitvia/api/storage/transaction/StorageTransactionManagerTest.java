package com.pitvia.api.storage.transaction;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;
import java.util.function.Consumer;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.storage.service.StorageService;

/**
 * ストレージ操作とDBトランザクションを連携するマネージャーの単体テスト
 *
 * <p>
 * 実際のDB・ストレージへの接続は行わず、{@code StorageService} をモック化した上で、
 * アップロード後の後続処理が失敗した場合に、アップロード済みファイルが確実に
 * 削除（ロールバック）されることのみを検証する。
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

}
