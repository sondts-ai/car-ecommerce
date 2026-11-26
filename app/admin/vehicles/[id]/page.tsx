"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  adminInventoryApi,
  getErrorMessage,
  type BranchResponse,
  type DocumentType,
  type VehicleCondition,
  type VehicleDetail,
  type VehicleHistoryResponse,
  type VehicleStatus,
} from "@/lib/api";
import {
  AlertBanner,
  ConditionBadge,
  DOCUMENT_TYPE_LABELS,
  formatDateTime,
  formatVnd,
  STATUS_META,
  VehicleStatusBadge,
} from "@/components/admin/AdminUi";

const STATUSES: VehicleStatus[] = ["AVAILABLE", "RESERVED", "SOLD", "MAINTENANCE"];
const DOC_TYPES: DocumentType[] = ["REGISTRATION", "INSPECTION", "INSURANCE", "INVOICE", "OTHER"];

export default function AdminVehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const vehicleId = Number(params.id);

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [history, setHistory] = useState<VehicleHistoryResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit info form
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [condition, setCondition] = useState<VehicleCondition>("NEW");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [mileage, setMileage] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  // Status form
  const [nextStatus, setNextStatus] = useState<VehicleStatus>("AVAILABLE");
  const [statusReason, setStatusReason] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Branch transfer form
  const [nextBranchId, setNextBranchId] = useState("");
  const [branchReason, setBranchReason] = useState("");
  const [savingBranch, setSavingBranch] = useState(false);

  // Add image form
  const [imageUrl, setImageUrl] = useState("");
  const [isThumbnail, setIsThumbnail] = useState(false);
  const [sortOrder, setSortOrder] = useState("1");
  const [savingImage, setSavingImage] = useState(false);

  // Add document form
  const [docType, setDocType] = useState<DocumentType>("REGISTRATION");
  const [fileUrl, setFileUrl] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);

  const loadAll = useCallback(async () => {
    if (!vehicleId) return;
    setLoading(true);
    setError("");
    try {
      const [detail, hist, branchPage] = await Promise.all([
        adminInventoryApi.getVehicle(vehicleId),
        adminInventoryApi.getHistory(vehicleId),
        adminInventoryApi.listBranches({ page: 0, size: 100 }),
      ]);
      setVehicle(detail);
      setHistory(hist);
      setBranches(branchPage.items);

      // Sync forms
      setVin(detail.vin);
      setLicensePlate(detail.licensePlate ?? "");
      setCondition(detail.condition);
      setYear(String(detail.year));
      setColor(detail.color ?? "");
      setMileage(String(detail.mileage ?? 0));
      setPrice(String(detail.price));
      setDescription(detail.description ?? "");
      setNextStatus(detail.status);
      setNextBranchId(detail.branch ? String(detail.branch.id) : "");
      setSortOrder(String((detail.images?.length ?? 0) + 1));
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được thông tin chi tiết xe."));
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    setSavingInfo(true);
    setError("");
    setSuccess("");
    try {
      await adminInventoryApi.updateVehicle(vehicle.id, {
        versionId: vehicle.versionId,
        vin: vin.trim().toUpperCase(),
        licensePlate: licensePlate.trim() || null,
        condition,
        year: Number(year),
        color: color.trim() || null,
        mileage: condition === "NEW" ? 0 : Math.max(0, Number(mileage) || 0),
        price: Number(price),
        description: description.trim() || null,
      });
      setSuccess("Đã cập nhật thông tin xe thành công.");
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err, "Cập nhật thông tin xe thất bại."));
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangeStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    setSavingStatus(true);
    setError("");
    setSuccess("");
    try {
      await adminInventoryApi.changeStatus(vehicle.id, {
        status: nextStatus,
        reason: statusReason.trim() || null,
      });
      setStatusReason("");
      setSuccess(`Đã chuyển trạng thái xe sang ${STATUS_META[nextStatus].label}.`);
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err, "Đổi trạng thái thất bại."));
    } finally {
      setSavingStatus(false);
    }
  };

  const handleChangeBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !nextBranchId) return;
    setSavingBranch(true);
    setError("");
    setSuccess("");
    try {
      await adminInventoryApi.changeBranch(vehicle.id, {
        branchId: Number(nextBranchId),
        reason: branchReason.trim() || null,
      });
      setBranchReason("");
      setSuccess("Đã chuyển chi nhánh showroom thành công.");
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err, "Chuyển chi nhánh thất bại."));
    } finally {
      setSavingBranch(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !imageUrl.trim()) return;
    setSavingImage(true);
    setError("");
    setSuccess("");
    try {
      await adminInventoryApi.addImage(vehicle.id, {
        imageUrl: imageUrl.trim(),
        isThumbnail,
        sortOrder: Number(sortOrder) || 0,
      });
      setImageUrl("");
      setIsThumbnail(false);
      setSuccess("Đã thêm ảnh xe thành công.");
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err, "Thêm ảnh thất bại."));
    } finally {
      setSavingImage(false);
    }
  };

  const handleSetThumbnail = async (imageId: number) => {
    setError("");
    setSuccess("");
    try {
      await adminInventoryApi.setThumbnail(imageId);
      setSuccess("Đã đặt ảnh đại diện thành công.");
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err, "Không đặt được ảnh đại diện."));
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm("Xác nhận xóa ảnh này?")) return;
    setError("");
    setSuccess("");
    try {
      await adminInventoryApi.deleteImage(imageId);
      setSuccess("Đã xóa ảnh xe.");
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err, "Xóa ảnh thất bại."));
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !fileUrl.trim()) return;
    setSavingDoc(true);
    setError("");
    setSuccess("");
    try {
      await adminInventoryApi.addDocument(vehicle.id, {
        documentType: docType,
        fileUrl: fileUrl.trim(),
      });
      setFileUrl("");
      setSuccess("Đã thêm giấy tờ xe thành công.");
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err, "Thêm giấy tờ thất bại."));
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!window.confirm("Xác nhận xóa giấy tờ này?")) return;
    setError("");
    setSuccess("");
    try {
      await adminInventoryApi.deleteDocument(docId);
      setSuccess("Đã xóa giấy tờ xe.");
      await loadAll();
    } catch (err) {
      setError(getErrorMessage(err, "Xóa giấy tờ thất bại."));
    }
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink-600">Đang tải chi tiết xe...</p>;
  }

  if (!vehicle) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-red-700">{error || "Không tìm thấy xe."}</p>
        <Link href="/admin/vehicles" className="btn-outline mt-4 py-2 text-xs">
          ← Quay lại danh sách xe
        </Link>
      </div>
    );
  }

  const isSold = vehicle.status === "SOLD";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/vehicles" className="text-xs font-medium text-champagne-600 hover:underline">
            ← Quay lại Kho xe
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold text-ink-950">
              {vehicle.name || `Xe #${vehicle.id}`}
            </h1>
            <VehicleStatusBadge status={vehicle.status} />
            <ConditionBadge condition={vehicle.condition} />
          </div>
          <p className="mt-1 text-xs text-ink-600">
            VIN: <strong className="font-mono text-ink-900">{vehicle.vin}</strong> • Chi nhánh:{" "}
            <strong className="text-ink-900">{vehicle.branch?.name ?? "—"}</strong> • Giá:{" "}
            <strong className="text-ink-900">{formatVnd(vehicle.price)}</strong>
          </p>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError("")} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess("")} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1-2: Edit Info + Images + Documents */}
        <div className="space-y-6 lg:col-span-2">
          {/* Edit Info */}
          <form onSubmit={handleSaveInfo} className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-ink-950">
                Thông tin cơ bản
              </h2>
              {isSold && (
                <span className="text-xs font-medium text-amber-700">
                  Xe đã bán (SOLD): khóa chỉnh sửa giá
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Số khung (VIN — 17 ký tự)</label>
                <input
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  minLength={17}
                  maxLength={17}
                  required
                  className="field font-mono uppercase"
                />
              </div>
              <div>
                <label className="field-label">Biển số</label>
                <input
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  maxLength={20}
                  className="field"
                />
              </div>
              <div>
                <label className="field-label">Tình trạng</label>
                <select
                  value={condition}
                  onChange={(e) => {
                    const val = e.target.value as VehicleCondition;
                    setCondition(val);
                    if (val === "NEW") setMileage("0");
                  }}
                  className="field"
                >
                  <option value="NEW">Xe mới (NEW)</option>
                  <option value="USED">Xe đã qua sử dụng (USED)</option>
                </select>
              </div>
              <div>
                <label className="field-label">Năm sản xuất</label>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  className="field"
                />
              </div>
              <div>
                <label className="field-label">Màu sắc</label>
                <input value={color} onChange={(e) => setColor(e.target.value)} className="field" />
              </div>
              <div>
                <label className="field-label">Số km (Mileage)</label>
                <input
                  type="number"
                  min={0}
                  disabled={condition === "NEW"}
                  value={condition === "NEW" ? "0" : mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className="field disabled:bg-cream-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Giá bán (VND)</label>
                <input
                  type="number"
                  min={0}
                  disabled={isSold}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="field disabled:bg-cream-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="field"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={savingInfo} className="btn-primary py-2.5 text-xs">
                {savingInfo ? "Đang cập nhật..." : "Lưu thông tin xe"}
              </button>
            </div>
          </form>

          {/* Images Manager */}
          <div className="card space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold text-ink-950">
              Hình ảnh xe ({vehicle.images.length})
            </h2>

            <form onSubmit={handleAddImage} className="grid gap-3 rounded-xl border border-cream-200 bg-cream-50 p-4 sm:grid-cols-12">
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                placeholder="Dán đường dẫn ảnh (https://...)"
                className="field py-2 text-sm sm:col-span-6"
              />
              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="Thứ tự"
                className="field py-2 text-sm sm:col-span-2"
              />
              <label className="flex items-center gap-1.5 text-xs text-ink-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={isThumbnail}
                  onChange={(e) => setIsThumbnail(e.target.checked)}
                />
                Thumbnail
              </label>
              <button
                type="submit"
                disabled={savingImage}
                className="btn-gold py-2 text-xs sm:col-span-2"
              >
                {savingImage ? "..." : "+ Thêm"}
              </button>
            </form>

            {vehicle.images.length === 0 ? (
              <p className="text-sm text-ink-600">Chưa có ảnh nào cho xe này.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {vehicle.images.map((img) => (
                  <div
                    key={img.id}
                    className={`overflow-hidden rounded-xl border ${
                      img.isThumbnail ? "border-champagne-400 ring-2 ring-champagne-400/20" : "border-cream-200"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.imageUrl}
                      alt={`Vehicle image ${img.id}`}
                      className="h-40 w-full object-cover"
                    />
                    <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 text-xs">
                      <span className="font-medium text-ink-700">
                        {img.isThumbnail ? "★ Ảnh đại diện" : `Thứ tự #${img.sortOrder}`}
                      </span>
                      <div className="flex gap-1.5">
                        {!img.isThumbnail && (
                          <button
                            type="button"
                            onClick={() => handleSetThumbnail(img.id)}
                            className="rounded border border-champagne-400/60 px-2 py-1 text-[11px] font-semibold text-champagne-600 hover:bg-champagne-50"
                          >
                            Đặt đại diện
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700 hover:bg-red-100"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents Manager */}
          <div className="card space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold text-ink-950">
              Giấy tờ xe ({vehicle.documents.length})
            </h2>

            <form onSubmit={handleAddDoc} className="grid gap-3 rounded-xl border border-cream-200 bg-cream-50 p-4 sm:grid-cols-12">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="field py-2 text-sm sm:col-span-4"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DOCUMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                required
                placeholder="Đường dẫn file giấy tờ (PDF/URL)..."
                className="field py-2 text-sm sm:col-span-6"
              />
              <button
                type="submit"
                disabled={savingDoc}
                className="btn-gold py-2 text-xs sm:col-span-2"
              >
                {savingDoc ? "..." : "+ Thêm"}
              </button>
            </form>

            {vehicle.documents.length === 0 ? (
              <p className="text-sm text-ink-600">Chưa có giấy tờ nào được lưu.</p>
            ) : (
              <ul className="divide-y divide-cream-200 rounded-xl border border-cream-200">
                {vehicle.documents.map((doc) => (
                  <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs">
                    <div>
                      <p className="font-semibold text-ink-900">
                        {DOCUMENT_TYPE_LABELS[doc.documentType]}
                      </p>
                      <p className="mt-0.5 break-all font-mono text-[11px] text-ink-600">
                        {doc.fileUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-red-700 hover:bg-red-100"
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Column 3: Status, Branch Transfer, History */}
        <div className="space-y-6">
          {/* Change Status */}
          <form onSubmit={handleChangeStatus} className="card space-y-3.5 p-5">
            <h2 className="font-display text-lg font-semibold text-ink-950">Đổi trạng thái xe</h2>
            <div>
              <label className="field-label text-xs">Trạng thái mới</label>
              <select
                disabled={isSold}
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as VehicleStatus)}
                className="field py-2 text-sm disabled:bg-cream-100"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label} ({s})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label text-xs">Lý do thay đổi</label>
              <input
                disabled={isSold}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                maxLength={500}
                placeholder="Ghi chú lý do..."
                className="field py-2 text-sm disabled:bg-cream-100"
              />
            </div>
            <button
              type="submit"
              disabled={isSold || savingStatus}
              className="btn-primary w-full py-2 text-xs"
            >
              {isSold ? "Xe đã bán (không thể đổi)" : savingStatus ? "Đang cập nhật..." : "Cập nhật trạng thái"}
            </button>
          </form>

          {/* Change Branch */}
          <form onSubmit={handleChangeBranch} className="card space-y-3.5 p-5">
            <h2 className="font-display text-lg font-semibold text-ink-950">Chuyển chi nhánh</h2>
            <div>
              <label className="field-label text-xs">Chi nhánh đích</label>
              <select
                value={nextBranchId}
                onChange={(e) => setNextBranchId(e.target.value)}
                required
                className="field py-2 text-sm"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label text-xs">Lý do điều chuyển</label>
              <input
                value={branchReason}
                onChange={(e) => setBranchReason(e.target.value)}
                maxLength={500}
                placeholder="Điều chuyển theo yêu cầu showroom..."
                className="field py-2 text-sm"
              />
            </div>
            <button type="submit" disabled={savingBranch} className="btn-gold w-full py-2 text-xs">
              {savingBranch ? "Đang chuyển..." : "Chuyển chi nhánh"}
            </button>
          </form>

          {/* Status History */}
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-ink-950">
              Lịch sử trạng thái ({history.length})
            </h2>
            <div className="mt-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-xs text-ink-600">Chưa có lịch sử thay đổi.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="rounded-xl border border-cream-200 bg-cream-50 p-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5 font-semibold text-ink-900">
                      <span>{h.oldStatus ? STATUS_META[h.oldStatus].label : "Khởi tạo"}</span>
                      <span>→</span>
                      <span>{STATUS_META[h.newStatus].label}</span>
                    </div>
                    {h.reason && <p className="mt-1 text-ink-700">{h.reason}</p>}
                    <p className="mt-1 text-[11px] text-ink-600/70">{formatDateTime(h.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
