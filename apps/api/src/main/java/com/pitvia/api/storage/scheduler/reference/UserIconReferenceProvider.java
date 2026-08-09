package com.pitvia.api.storage.scheduler.reference;

import java.util.Set;

import org.springframework.stereotype.Component;

import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * ユーザーアイコン画像用の参照キー取得実装
 *
 * @author pitvia
 * @version 1.0
 */
@Component
@RequiredArgsConstructor
public class UserIconReferenceProvider implements StorageKeyReferenceProvider {

    /** ユーザーリポジトリ */
    private final UserRepository userRepository;

    @Override
    public ImageType supports() {
        return ImageType.USER_ICON;
    }

    @Override
    public Set<String> findAllReferencedKeys() {
        return userRepository.findAllStorageKeys();
    }

}
