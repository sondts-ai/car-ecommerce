"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCarApi,
  getErrorMessage,
  type BrandResponse,
  type CarModelDetail,
  type CarModelSummary,
  type CarVersionResponse,
  type CategoryResponse,
  type FuelType,
  type Transmission,
} from "@/lib/api";
import {
  AdminModal,
  AdminPagination,
  AlertBanner,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
} from "@/components/admin/AdminUi";

const PAGE_SIZE = 10;
const TRANSMISSIONS: Transmission[] = ["AUTO", "MANUAL", "CVT", "DCT"];
const FUELS: FuelType[] = ["GASOLINE", "DIESEL", "HYBRID", "ELECTRIC"];

export default function AdminCarModelsPage() {
  const [items, setItems] = useState<CarModelSummary[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterBrandId, setFilterBrandId] = useState<string>("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Model Modal
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<CarModelSummary | null>(null);
  const [mBrandId, setMBrandId] = useState<string>("");
  const [mName, setMName] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mCategoryIds, setMCategoryIds] = useState<number[]>([]);
  const [submittingModel, setSubmittingModel] = useState(false);

  // Versions Manager Modal
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [activeModel, setActiveModel] = useState<CarModelDetail | null>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [editingVersion, setEditingVersion] = useState<CarVersionResponse | null>(null);
  const [vName, setVName] = useState("");
  const [vEngine, setVEngine] = useState("");
  const [vTrans, setVTrans] = useState<Transmission | "">("AUTO");
  const [vFuel, setVFuel] = useState<FuelType | "">("GASOLINE");
  const [vSeats, setVSeats] = useState<string>("5");
  const [submittingVersion, setSubmittingVersion] = useState(false);

  // Load reference brands & categories once
  useEffect(() => {
    Promise.all([
      adminCarApi.listBrands({ page: 0, size: 100 }),
      adminCarApi.listCategories({ page: 0, size: 100 }),
    ])
      .then(([bRes, cRes]) => {
        setBrands(bRes.items);
        setCategories(cRes.items);
      })
      .catch(() => {});
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminCarApi.listModels({
        q: q || undefined,
        brandId: filterBrandId ? Number(filterBrandId) : undefined,
        categoryId: filterCategoryId ? Number(filterCategoryId) : undefined,
        page,
        size: PAGE_SIZE,
      });
      setItems(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách dòng xe."));
    } finally {
      setLoading(false);
    }
  }, [q, filterBrandId, filterCategoryId, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreateModel = () => {
    setEditingModel(null);
    setMBrandId(brands[0] ? String(brands[0].id) : "");
    setMName("");
    setMDesc("");
    setMCategoryIds([]);
    setModelModalOpen(true);
  };

  const openEditModel = (model: CarModelSummary) => {
    setEditingModel(model);
    setMBrandId(String(model.brandId));
    setMName(model.name);
    setMDesc(model.description ?? "");
    setMCategoryIds(model.categories.map((c) => c.id));
    setModelModalOpen(true);
  };

  const toggleCategory = (id: number) => {
    setMCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mBrandId || !mName.trim()) {
      setError("Vui lòng chọn hãng xe và nhập tên dòng xe.");
      return;
    }
    setSubmittingModel(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        brandId: Number(mBrandId),
        name: mName.trim(),
        description: mDesc.trim() || null,
        categoryIds: mCategoryIds,
      };
      if (editingModel) {
        await adminCarApi.updateModel(editingModel.id, payload);
        setSuccess(`Đã cập nhật dòng xe "${payload.name}".`);
      } else {
        await adminCarApi.createModel(payload);
        setSuccess(`Đã tạo dòng xe "${payload.name}".`);
      }
      setModelModalOpen(false);
      await fetchList();
    } catch (err) {
      setError(getErrorMessage(err, "Lưu dòng xe thất bại."));
    } finally {
      setSubmittingModel(false);
    }
  };

  const handleDeleteModel = async (model: CarModelSummary) => {
    if (!window.confirm(`Xác nhận xóa dòng xe "${model.brandName} ${model.name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await adminCarApi.deleteModel(model.id);
      setSuccess(`Đã xóa dòng xe "${model.name}".`);
      await fetchList();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể xóa dòng xe (có thể vẫn còn phiên bản trực thuộc)."));
    }
  };

  // -------------------- Versions Manager --------------------
  const resetVersionForm = () => {
    setEditingVersion(null);
    setVName("");
    setVEngine("");
    setVTrans("AUTO");
    setVFuel("GASOLINE");
    setVSeats("5");
  };

  const openVersions = async (modelId: number) => {
    setVersionModalOpen(true);
    setLoadingVersions(true);
    resetVersionForm();
    setError("");
    try {
      const detail = await adminCarApi.getModel(modelId);
      setActiveModel(detail);
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách phiên bản."));
    } finally {
      setLoadingVersions(false);
    }
  };

  const startEditVersion = (v: CarVersionResponse) => {
    setEditingVersion(v);
    setVName(v.versionName);
    setVEngine(v.engine ?? "");
    setVTrans(v.transmission ?? "");
    setVFuel(v.fuelType ?? "");
    setVSeats(v.seats ? String(v.seats) : "");
  };

  const handleSaveVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModel || !vName.trim()) {
      setError("Tên phiên bản không được để trống.");
      return;
    }
    const parsedSeats = vSeats.trim() ? Number(vSeats) : null;
    if (parsedSeats !== null && (parsedSeats < 2 || parsedSeats > 60)) {
      setError("Số chỗ ngồi phải nằm trong khoảng 2 đến 60.");
      return;
    }
    setSubmittingVersion(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        versionName: vName.trim(),
        engine: vEngine.trim() || null,
        transmission: vTrans || null,
        fuelType: vFuel || null,
        seats: parsedSeats,
      };
      if (editingVersion) {
        await adminCarApi.updateVersion(editingVersion.id, payload);
        setSuccess(`Đã cập nhật phiên bản "${payload.versionName}".`);
      } else {
        await adminCarApi.createVersion(activeModel.id, payload);
        setSuccess(`Đã thêm phiên bản "${payload.versionName}".`);
      }
      resetVersionForm();
      const updated = await adminCarApi.getModel(activeModel.id);
      setActiveModel(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Lưu phiên bản thất bại."));
    } finally {
      setSubmittingVersion(false);
    }
  };

  const handleDeleteVersion = async (v: CarVersionResponse) => {
    if (!activeModel) return;
    if (!window.confirm(`Xác nhận xóa phiên bản "${v.versionName}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await adminCarApi.deleteVersion(v.id);
      setSuccess(`Đã xóa phiên bản "${v.versionName}".`);
      const updated = await adminCarApi.getModel(activeModel.id);
      setActiveModel(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể xóa phiên bản (có thể đang có xe thuộc phiên bản này)."));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Danh mục — Car Service</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">
            Quản lý Dòng xe & Phiên bản
          </h1>
        </div>
        <button type="button" onClick={openCreateModel} className="btn-primary py-2.5 text-xs">
          + Thêm dòng xe
        </button>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError("")} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess("")} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setQ(searchInput.trim());
        }}
        className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên dòng xe..."
          className="field py-2 text-sm"
        />
        <select
          value={filterBrandId}
          onChange={(e) => {
            setFilterBrandId(e.target.value);
            setPage(0);
          }}
          className="field py-2 text-sm"
        >
          <option value="">Tất cả hãng xe</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={filterCategoryId}
          onChange={(e) => {
            setFilterCategoryId(e.target.value);
            setPage(0);
          }}
          className="field py-2 text-sm"
        >
          <option value="">Tất cả phân loại</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="btn-gold flex-1 py-2 text-xs">
            Lọc
          </button>
          {(q || filterBrandId || filterCategoryId) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setQ("");
                setFilterBrandId("");
                setFilterCategoryId("");
                setPage(0);
              }}
              className="btn-outline py-2 text-xs"
            >
              Đặt lại
            </button>
          )}
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cream-200 bg-cream-50 text-xs uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Hãng xe</th>
                <th className="px-5 py-3.5">Tên dòng xe</th>
                <th className="px-5 py-3.5">Phân loại</th>
                <th className="px-5 py-3.5">Mô tả</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-600">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-600">
                    Không tìm thấy dòng xe phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-cream-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-ink-600">#{item.id}</td>
                    <td className="px-5 py-3.5 font-medium text-ink-800">{item.brandName}</td>
                    <td className="px-5 py-3.5 font-semibold text-ink-950">{item.name}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {item.categories.length === 0 ? (
                          <span className="text-xs text-ink-600/60">—</span>
                        ) : (
                          item.categories.map((c) => (
                            <span key={c.id} className="chip py-0.5 text-[11px]">
                              {c.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="max-w-xs truncate px-5 py-3.5 text-ink-600">
                      {item.description || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openVersions(item.id)}
                          className="rounded-lg border border-champagne-400/60 bg-champagne-50 px-3 py-1.5 text-xs font-semibold text-champagne-600 hover:bg-champagne-100"
                        >
                          Phiên bản
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModel(item)}
                          className="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-medium text-ink-800 hover:border-ink-900"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModel(item)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
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

      {/* Modal Create / Edit Model */}
      <AdminModal
        open={modelModalOpen}
        title={editingModel ? `Cập nhật dòng xe #${editingModel.id}` : "Thêm dòng xe mới"}
        onClose={() => setModelModalOpen(false)}
      >
        <form onSubmit={handleSaveModel} className="space-y-4">
          <div>
            <label className="field-label">Hãng xe *</label>
            <select
              value={mBrandId}
              onChange={(e) => setMBrandId(e.target.value)}
              required
              className="field"
            >
              <option value="">-- Chọn hãng xe --</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Tên dòng xe *</label>
            <input
              value={mName}
              onChange={(e) => setMName(e.target.value)}
              maxLength={150}
              required
              placeholder="Ví dụ: Camry, CR-V, VF 8..."
              className="field"
            />
          </div>
          <div>
            <label className="field-label">Phân loại áp dụng</label>
            <div className="flex flex-wrap gap-2 rounded-xl border border-cream-200 bg-cream-50 p-3">
              {categories.map((c) => {
                const checked = mCategoryIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${
                      checked
                        ? "border-ink-950 bg-ink-950 text-cream-50"
                        : "border-cream-300 bg-white text-ink-700 hover:border-ink-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(c.id)}
                      className="sr-only"
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <label className="field-label">Mô tả</label>
            <textarea
              value={mDesc}
              onChange={(e) => setMDesc(e.target.value)}
              rows={3}
              className="field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModelModalOpen(false)}
              className="btn-outline py-2 text-xs"
            >
              Hủy
            </button>
            <button type="submit" disabled={submittingModel} className="btn-primary py-2 text-xs">
              {submittingModel ? "Đang lưu..." : editingModel ? "Lưu thay đổi" : "Tạo dòng xe"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Modal Versions Manager */}
      <AdminModal
        open={versionModalOpen}
        title={
          activeModel
            ? `Phiên bản của ${activeModel.brandName} ${activeModel.name}`
            : "Quản lý phiên bản"
        }
        subtitle="Thêm, chỉnh sửa thông số kỹ thuật (động cơ, hộp số, nhiên liệu, số chỗ) cho từng phiên bản."
        onClose={() => setVersionModalOpen(false)}
        maxWidth="max-w-3xl"
      >
        {loadingVersions ? (
          <p className="py-8 text-center text-sm text-ink-600">Đang tải phiên bản...</p>
        ) : (
          <div className="space-y-6">
            <form
              onSubmit={handleSaveVersion}
              className="rounded-xl border border-cream-200 bg-cream-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-800">
                  {editingVersion
                    ? `Đang sửa phiên bản #${editingVersion.id}`
                    : "Thêm phiên bản mới"}
                </h3>
                {editingVersion && (
                  <button
                    type="button"
                    onClick={resetVersionForm}
                    className="text-xs font-medium text-champagne-600 hover:underline"
                  >
                    + Chuyển sang thêm mới
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="field-label text-xs">Tên phiên bản *</label>
                  <input
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    required
                    maxLength={150}
                    placeholder="2.0Q, 2.5HEV TOP..."
                    className="field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="field-label text-xs">Động cơ</label>
                  <input
                    value={vEngine}
                    onChange={(e) => setVEngine(e.target.value)}
                    maxLength={100}
                    placeholder="2.0L, 1.5L Turbo..."
                    className="field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="field-label text-xs">Hộp số</label>
                  <select
                    value={vTrans}
                    onChange={(e) => setVTrans(e.target.value as Transmission | "")}
                    className="field py-2 text-sm"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {TRANSMISSIONS.map((t) => (
                      <option key={t} value={t}>
                        {TRANSMISSION_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label text-xs">Nhiên liệu</label>
                  <select
                    value={vFuel}
                    onChange={(e) => setVFuel(e.target.value as FuelType | "")}
                    className="field py-2 text-sm"
                  >
                    <option value="">-- Chưa chọn --</option>
                    {FUELS.map((f) => (
                      <option key={f} value={f}>
                        {FUEL_LABELS[f]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label text-xs">Số chỗ (2–60)</label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={vSeats}
                    onChange={(e) => setVSeats(e.target.value)}
                    className="field py-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={submittingVersion}
                    className="btn-primary w-full py-2 text-xs"
                  >
                    {submittingVersion
                      ? "Đang lưu..."
                      : editingVersion
                        ? "Lưu phiên bản"
                        : "+ Thêm phiên bản"}
                  </button>
                </div>
              </div>
            </form>

            <div className="overflow-x-auto rounded-xl border border-cream-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-cream-200 bg-cream-50 uppercase text-ink-600">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Phiên bản</th>
                    <th className="px-4 py-3">Động cơ</th>
                    <th className="px-4 py-3">Hộp số</th>
                    <th className="px-4 py-3">Nhiên liệu</th>
                    <th className="px-4 py-3">Chỗ</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  {(activeModel?.versions ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-ink-600">
                        Chưa có phiên bản nào cho dòng xe này.
                      </td>
                    </tr>
                  ) : (
                    (activeModel?.versions ?? []).map((v) => (
                      <tr key={v.id}>
                        <td className="px-4 py-2.5 font-mono text-ink-600">#{v.id}</td>
                        <td className="px-4 py-2.5 font-semibold text-ink-950">{v.versionName}</td>
                        <td className="px-4 py-2.5 text-ink-700">{v.engine || "—"}</td>
                        <td className="px-4 py-2.5 text-ink-700">
                          {v.transmission ? TRANSMISSION_LABELS[v.transmission] : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-ink-700">
                          {v.fuelType ? FUEL_LABELS[v.fuelType] : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-ink-700">{v.seats ?? "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditVersion(v)}
                              className="rounded border border-cream-300 px-2.5 py-1 font-medium text-ink-800 hover:border-ink-900"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVersion(v)}
                              className="rounded border border-red-200 bg-red-50 px-2.5 py-1 font-medium text-red-700 hover:bg-red-100"
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
          </div>
        )}
      </AdminModal>
    </div>
  );
}
