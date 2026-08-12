package com.pitvia.api.vehicle.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;

import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.master.entity.Manufacturer;
import com.pitvia.api.master.repository.ManufacturerRepository;
import com.pitvia.api.vehicle.dto.response.ManufacturerOption;
import com.pitvia.api.vehicle.dto.response.VehicleFormOptionsResponse;
import com.pitvia.api.vehicle.dto.response.VehicleSelectOption;
import com.pitvia.api.vehicle.enums.DriveType;
import com.pitvia.api.vehicle.enums.TransmissionType;
import com.pitvia.api.vehicle.enums.VehicleType;

import lombok.RequiredArgsConstructor;

/**
 * 車両登録フォームの選択肢取得サービス
 *
 * <p>
 * 現時点では{@link VehicleType#CAR}のみ対応する。将来MOTORCYCLE・KART等に対応する際、
 * 種別ごとに選択肢の構成が大きく異なる見込みであれば、{@code DashboardQuery}等と同様の
 * Strategyパターン（種別ごとのProviderをMapで切り替える構成）へのリファクタリングを検討する。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class VehicleFormOptionsService {

    /** メーカーリポジトリ */
    private final ManufacturerRepository manufacturerRepository;

    /**
     * 車両登録フォームの選択肢一式を取得する
     *
     * @param vehicleType 対象の車両種別
     * @return フォーム選択肢一式（メーカー、トランスミッション形式、駆動方式）
     * @throws BusinessException 現時点で未対応の車両種別が指定された場合
     */
    public VehicleFormOptionsResponse getFormOptions(VehicleType vehicleType) {

        // 現状はCARのみ対応。それ以外は明示的にエラーとする
        if (vehicleType != VehicleType.CAR) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_VEHICLE_TYPE);
        }

        List<ManufacturerOption> manufacturers = manufacturerRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toManufacturerOption)
                .toList();

        return new VehicleFormOptionsResponse(
                manufacturers,
                toSelectOptions(TransmissionType.values()),
                toSelectOptions(DriveType.values()));
    }

    /**
     * Manufacturerエンティティを選択肢用DTOへ変換する
     *
     * @param manufacturer メーカーエンティティ
     * @return メーカー選択肢
     */
    private ManufacturerOption toManufacturerOption(Manufacturer manufacturer) {
        return new ManufacturerOption(manufacturer.getId(), manufacturer.getName());
    }

    /**
     * Enumの全定数をvalue/labelペアの選択肢一覧へ変換する
     *
     * @param values 変換対象のEnum定数配列
     * @return 選択肢一覧
     */
    private List<VehicleSelectOption> toSelectOptions(Enum<?>[] values) {
        return Arrays.stream(values)
                .map(value -> new VehicleSelectOption(value.name(), value.name()))
                .toList();
    }

}
