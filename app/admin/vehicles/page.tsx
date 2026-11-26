"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  adminCarApi,
  adminInventoryApi,
  getErrorMessage,
  type BranchResponse,
  type CarModelSummary,
  type CarVersionResponse,
  type VehicleCondition,
  type VehicleStatus,
  type VehicleSummary,
} from "@/lib/api";
import {
  AdminModal,
  AdminPagination,
  AlertBanner,
  CONDITION_LABELS,
  ConditionBadge,
  formatVnd,
  STATUS_META,
  VehicleStatusBadge,
} from "@/components/admin/AdminUi";

const PAGE_SIZE = 10;
const STATUS_LIST: VehicleStatus[] = ["AVAILABLE", "RESERVED", "SOLD", "MAINTENANCE"];
const CONDITION_LIST: VehicleCondition[] = ["NEW", "USED"];

export default function AdminVehiclesPage() {
  const [items, setItems] = useState<VehicleSummary[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [models, setModels] = useState<CarModelSummary[]>([]);
  const [versionsForModel, setVersionsForModel] = useState<CarVersionResponse[]>([]);

  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<VehicleStatus | "">("");
  const [branchId, setBranchId] = useState<string>("");
  const [condition, setCondition] = useState<VehicleCondition | "">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [fVersionId, setFVersionId] = useState<string>("");
  const [fBranchId, setFBranchId] = useState<string>("");
  const [fVin, setFVin] = useState("");
  const [fPlate, setFPlate] = useState("");
  const [fCondition, setFCondition] = useState<VehicleCondition>("NEW");
  const [fYear, setFYear] = useState(String(new Date().getFullYear()));
  const [fColor, setFColor] = useState("");
  const [fMileage, setFMileage] = useState("0");
  const [fPrice, setFPrice] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      adminInventoryApi.listBranches({ page: 0, size: 100 }),
      adminCarApi.listModels({ page: 0, size: 100 }),
    ])
      .then(([bRes, mRes]) => {
        setBranches(bRes.items);
        setModels(mRes.items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedModelId) {
      setVersionsForModel([]);
      setFVersionId("");
      return;
    }
    adminCarApi
      .listVersions(Number(selectedModelId))
      .then((vs) => {
        setVersionsForModel(vs);
        setFVersionId(vs[0] ? String(vs[0].id) : "");
      })
      .catch(() => {
        setVersionsForModel([]);
        setFVersionId("");
      });
  }, [selectedModelId]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminInventoryApi.listVehicles({
        q: q || undefined,
        status: status || undefined,
        branchId: branchId ? Number(branchId) : undefined,
        condition: condition || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        page,
        size: PAGE_SIZE,
      });
      setItems(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách xe trong kho."));
    } finally {
      setLoading(false);
    }
  }, [q, status, branchId, condition, minPrice, maxPrice, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreateModal = () => {
    setSelectedModelId(models[0] ? String(models[0].id) : "");
    setFBranchId(branches[0] ? String(branches[0].id) : "");
    setFVin("");
    setFPlate("");
    setFCondition("NEW");
    setFYear(String(new Date().getFullYear()));
    setFColor("");
    setFMileage("0");
    setFPrice("");
    setFDesc("");
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVin = fVin.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      setError("Số khung (VIN) bắt buộc phải có đúng 17 ký tự.");
      return;
    }
    if (!fVersionId || !fBranchId) {
      setError("Vui lòng chọn đầy đủ phiên bản xe và chi nhánh.");
      return;
    }
    const priceNum = Number(fPrice);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Giá bán không hợp lệ.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const created = await adminInventoryApi.createVehicle({
        versionId: Number(fVersionId),
        branchId: Number(fBranchId),
        vin: cleanVin,
        licensePlate: fPlate.trim() || null,
        condition: fCondition,
        year: Number(fYear),
        color: fColor.trim() || null,
        mileage: fCondition === "NEW" ? 0 : Math.max(0, Number(fMileage) || 0),
        price: priceNum,
        description: fDesc.trim() || null,
      });
      setModalOpen(false);
      setSuccess(`Đã nhập xe mới thành công (VIN: ${created.vin}).`);
      await fetchList();
    } catch (err) {
      setError(getErrorMessage(err, "Nhập xe mới thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (v: VehicleSummary) => {
    if (!window.confirm(`Xác nhận xóa xe VIN "${v.vin}"? (Ảnh, giấy tờ và lịch sử của xe sẽ bị xóa)`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await adminInventoryApi.deleteVehicle(v.id);
      setSuccess(`Đã xóa xe VIN "${v.vin}".`);
      await fetchList();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể xóa xe (xe đang RESERVED hoặc SOLD không được xóa)."));
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setQ("");
    setStatus("");
    setBranchId("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setPage(0);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Tồn kho — Inventory Service</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">
            Quản lý Kho xe cụ thể
          </h1>
        </div>
        <button type="button" onClick={openCreateModal} className="btn-primary py-2.5 text-xs">
          + Nhập xe mới vào kho
        </button>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError("")} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess("")} />

      {/* Multi-criteria Filter */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setQ(searchInput.trim());
        }}
        className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm VIN / Biển số..."
          className="field py-2 text-sm lg:col-span-2"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as VehicleStatus | "");
            setPage(0);
          }}
          className="field py-2 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setPage(0);
          }}
          className="field py-2 text-sm"
        >
          <option value="">Tất cả chi nhánh</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={condition}
          onChange={(e) => {
            setCondition(e.target.value as VehicleCondition | "");
            setPage(0);
          }}
          className="field py-2 text-sm"
        >
          <option value="">Mới & Đã qua SD</option>
          {CONDITION_LIST.map((c) => (
            <option key={c} value={c}>
              {CONDITION_LABELS[c]}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="btn-gold flex-1 py-2 text-xs">
            Lọc
          </button>
          <button type="button" onClick={resetFilters} className="btn-outline px-3 py-2 text-xs">
            Đặt lại
          </button>
        </div>

        <input
          type="number"
          min={0}
          value={minPrice}
          onChange={(e) => {
            setMinPrice(e.target.value);
            setPage(0);
          }}
          placeholder="Giá tối thiểu (VND)"
          className="field py-2 text-sm lg:col-span-3"
        />
        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value);
            setPage(0);
          }}
          placeholder="Giá tối đa (VND)"
          className="field py-2 text-sm lg:col-span-3"
        />
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cream-200 bg-cream-50 text-xs uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-4 py-3.5">Xe</th>
                <th className="px-4 py-3.5">VIN / Biển số</th>
                <th className="px-4 py-3.5">Chi nhánh</th>
                <th className="px-4 py-3.5">Tình trạng</th>
                <th className="px-4 py-3.5">Giá niêm yết</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-ink-600">
                    Đang tải danh sách xe...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-ink-600">
                    Không có xe nào khớp điều kiện lọc.
                  </td>
                </tr>
              ) : (
                items.map((v) => (
                  <tr key={v.id} className="hover:bg-cream-50/70">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {v.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.thumbnailUrl}
                            alt={v.name ?? v.vin}
                            className="h-11 w-16 shrink-0 rounded-lg border border-cream-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg border border-cream-200 bg-cream-100 text-[10px] text-ink-600">
                            No Img
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-ink-950">
                            {v.name || `Phiên bản #${v.versionId}`}
                          </p>
                          <p className="text-xs text-ink-600">
                            Năm {v.year} • {v.color || "Chưa rõ màu"} •{" "}
                            {(v.mileage ?? 0).toLocaleString("vi-VN")} km
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-xs font-semibold text-ink-900">{v.vin}</p>
                      <p className="text-xs text-ink-600">{v.licensePlate || "Chưa bấm biển"}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-700">{v.branchName || "—"}</td>
                    <td className="px-4 py-3.5">
                      <ConditionBadge condition={v.condition} />
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink-950">
                      {formatVnd(v.price)}
                    </td>
                    <td className="px-4 py-3.5">
                      <VehicleStatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex gap-1.5">
                        <Link
                          href={`/admin/vehicles/${v.id}`}
                          className="rounded-lg border border-champagne-400/60 bg-champagne-50 px-3 py-1.5 text-xs font-semibold text-champagne-600 hover:bg-champagne-100"
                        >
                          Chi tiết
                        </Link>
                        <button
                          type="button"
                          disabled={v.status === "RESERVED" || v.status === "SOLD"}
                          onClick={() => handleDelete(v)}
                          title={
                            v.status === "RESERVED" || v.status === "SOLD"
                              ? "Không thể xóa xe đang giữ chỗ hoặc đã bán"
                              : "Xóa xe"
                          }
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          size={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Modal Create Vehicle */}
      <AdminModal
        open={modalOpen}
        title="Nhập xe mới vào kho"
        subtitle="Trạng thái khởi tạo mặc định là AVAILABLE và tự động ghi nhận lịch sử Nhập xe."
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Dòng xe *</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                required
                className="field"
              >
                <option value="">-- Chọn dòng xe --</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.brandName} {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Phiên bản (versionId) *</label>
              <select
                value={fVersionId}
                onChange={(e) => setFVersionId(e.target.value)}
                required
                className="field"
              >
                <option value="">-- Chọn phiên bản --</option>
                {versionsForModel.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.versionName} (#{v.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Chi nhánh nhập kho *</label>
              <select
                value={fBranchId}
                onChange={(e) => setFBranchId(e.target.value)}
                required
                className="field"
              >
                <option value="">-- Chọn chi nhánh --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">
                Số khung (VIN — đúng 17 ký tự) *{" "}
                <span className="font-mono text-xs text-ink-600">({fVin.trim().length}/17)</span>
              </label>
              <input
                value={fVin}
                onChange={(e) => setFVin(e.target.value.toUpperCase())}
                minLength={17}
                maxLength={17}
                required
                placeholder="JTNB11HK0M3000099"
                className="field font-mono uppercase"
              />
            </div>
            <div>
              <label className="field-label">Biển số (tùy chọn)</label>
              <input
                value={fPlate}
                onChange={(e) => setFPlate(e.target.value)}
                maxLength={20}
                placeholder="30K-888.99"
                className="field"
              />
            </div>
            <div>
              <label className="field-label">Tình trạng xe *</label>
              <select
                value={fCondition}
                onChange={(e) => {
                  const val = e.target.value as VehicleCondition;
                  setFCondition(val);
                  if (val === "NEW") setFMileage("0");
                }}
                className="field"
              >
                <option value="NEW">Xe mới (NEW — ODO = 0)</option>
                <option value="USED">Xe đã qua sử dụng (USED)</option>
              </select>
            </div>
            <div>
              <label className="field-label">Năm sản xuất (1900–2100) *</label>
              <input
                type="number"
                min={1900}
                max={2100}
                value={fYear}
                onChange={(e) => setFYear(e.target.value)}
                required
                className="field"
              />
            </div>
            <div>
              <label className="field-label">Màu sắc</label>
              <input
                value={fColor}
                onChange={(e) => setFColor(e.target.value)}
                maxLength={50}
                placeholder="Trắng ngọc trai, Đen..."
                className="field"
              />
            </div>
            <div>
              <label className="field-label">Số km đã đi (Mileage)</label>
              <input
                type="number"
                min={0}
                disabled={fCondition === "NEW"}
                value={fCondition === "NEW" ? "0" : fMileage}
                onChange={(e) => setFMileage(e.target.value)}
                className="field disabled:bg-cream-100"
              />
            </div>
            <div>
              <label className="field-label">Giá niêm yết (VND) *</label>
              <input
                type="number"
                min={0}
                step={1000000}
                value={fPrice}
                onChange={(e) => setFPrice(e.target.value)}
                required
                placeholder="1200000000"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="field-label">Mô tả chi tiết</label>
            <textarea
              value={fDesc}
              onChange={(e) => setFDesc(e.target.value)}
              rows={3}
              className="field"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline py-2 text-xs">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn-primary py-2 text-xs">
              {submitting ? "Đang lưu..." : "Nhập xe vào kho"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
