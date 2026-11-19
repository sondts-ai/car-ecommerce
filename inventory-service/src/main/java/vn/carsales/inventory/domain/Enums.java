package vn.carsales.inventory.domain;

/** Các enum dùng chung (mỗi enum là một kiểu lồng nhau để gọn file). */
public final class Enums {
    private Enums() {
    }

    public enum VehicleCondition { NEW, USED }

    public enum VehicleStatus { AVAILABLE, RESERVED, SOLD, MAINTENANCE }

    public enum HoldStatus { ACTIVE, RELEASED, CONVERTED }

    public enum DocumentType { REGISTRATION, INSPECTION, INSURANCE, INVOICE, OTHER }
}
