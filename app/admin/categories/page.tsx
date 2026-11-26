"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCarApi, getErrorMessage, type CategoryResponse } from "@/lib/api";
import { AdminModal, AdminPagination, AlertBanner, formatDateTime } from "@/components/admin/AdminUi";

const PAGE_SIZE = 10;

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<CategoryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminCarApi.listCategories({ q, page, size: PAGE_SIZE });
      setItems(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách phân loại."));
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setModalOpen(true);
  };

  const openEdit = (item: CategoryResponse) => {
    setEditing(item);
    setName(item.name);
    setDescription(item.description ?? "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Tên phân loại không được để trống.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
      };
      if (editing) {
        await adminCarApi.updateCategory(editing.id, payload);
        setSuccess(`Đã cập nhật phân loại "${payload.name}".`);
      } else {
        await adminCarApi.createCategory(payload);
        setSuccess(`Đã tạo phân loại "${payload.name}".`);
      }
      setModalOpen(false);
      await fetchList();
    } catch (err) {
      setError(getErrorMessage(err, "Lưu phân loại thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: CategoryResponse) => {
    if (
      !window.confirm(
        `Xác nhận xóa phân loại "${item.name}"? (Hệ thống sẽ tự gỡ phân loại này khỏi các dòng xe đang gắn)`,
      )
    ) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await adminCarApi.deleteCategory(item.id);
      setSuccess(`Đã xóa phân loại "${item.name}".`);
      await fetchList();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể xóa phân loại."));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Danh mục — Car Service</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">
            Quản lý Phân loại xe
          </h1>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary py-2.5 text-xs">
          + Thêm phân loại
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
        className="card flex flex-wrap items-center gap-3 p-4"
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên phân loại (Sedan, SUV...)"
          className="field max-w-sm py-2 text-sm"
        />
        <button type="submit" className="btn-gold py-2 text-xs">
          Tìm kiếm
        </button>
        {q && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setQ("");
              setPage(0);
            }}
            className="btn-outline py-2 text-xs"
          >
            Xóa lọc
          </button>
        )}
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cream-200 bg-cream-50 text-xs uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Tên phân loại</th>
                <th className="px-5 py-3.5">Mô tả</th>
                <th className="px-5 py-3.5">Ngày tạo</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-600">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-600">
                    Chưa có phân loại nào.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-cream-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-ink-600">#{item.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-ink-950">{item.name}</td>
                    <td className="px-5 py-3.5 text-ink-600">{item.description || "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-ink-600">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-medium text-ink-800 hover:border-ink-900"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
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

      <AdminModal
        open={modalOpen}
        title={editing ? `Cập nhật phân loại #${editing.id}` : "Thêm phân loại mới"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="field-label">Tên phân loại *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              placeholder="Ví dụ: Sedan, SUV, Coupe..."
              className="field"
            />
          </div>
          <div>
            <label className="field-label">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={255}
              rows={3}
              className="field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline py-2 text-xs">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn-primary py-2 text-xs">
              {submitting ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo phân loại"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
