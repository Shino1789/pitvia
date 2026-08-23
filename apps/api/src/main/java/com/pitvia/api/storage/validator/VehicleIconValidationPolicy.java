package com.pitvia.api.storage.validator;

import org.springframework.stereotype.Component;

import com.pitvia.api.storage.constant.ImageType;

/**
 * 車両アイコン画像用バリデーションポリシー
 *
 * @author pitvia
 * @version 1.0
 */
@Component
public class VehicleIconValidationPolicy extends AbstractStandardImageValidationPolicy {

    @Override
    public ImageType supports() {
        return ImageType.VEHICLE_ICON;
    }

}
