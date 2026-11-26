"use client";

import { useCallback, useEffect, useState } from "react";
import { adminInventoryApi, getErrorMessage, type BranchResponse } from "@/lib/api";
import { AdminModal, AdminPagination, AlertBanner, formatDateTime } from "@/components/admin/AdminUi";

const PAGE_SIZE = 10;

export default function AdminBranchesPage() {
  const [items, setItems] = useState<BranchResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BranchResponse | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminInventoryApi.listBranches({ q, page, size: PAGE_SIZE });
      setItems(res.items);
      setTotalItems(res.totalItems);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách chi nhánh."));
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
    setAddress("");
    setPhone("");
    setModalOpen(true);
  };

  const openEdit = (item: BranchResponse) => {
    setEditing(item);
    setName(item.name);
    setAddress(item.address);
    setPhone(item.phone ?? "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setError("Tên chi nhánh và địa chỉ là bắt buộc.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || null,
      };
      if (editing) {
        await adminInventoryApi.updateBranch(editing.id, payload);
        setSuccess(`Đã cập nhật chi nhánh "${payload.name}".`);
      } else {
        await adminInventoryApi.createBranch(payload);
        setSuccess(`Đã tạo chi nhánh "${payload.name}".`);
      }
      setModalOpen(false);
      await fetchList();
    } catch (err) {
      setError(getErrorMessage(err, "Lưu chi nhánh thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: BranchResponse) => {
    if (!window.confirm(`Xác nhận xóa chi nhánh "${item.name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await adminInventoryApi.deleteBranch(item.id);
      setSuccess(`Đã xóa chi nhánh "${item.name}".`);
      await fetchList();
    } catch (err) {
      setError(getErrorMessage(err, "Không thể xóa chi nhánh (có thể đang còn xe trong kho)."));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Kho bãi — Inventory Service</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">
            Quản lý Chi nhánh Showroom
          </h1>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary py-2.5 text-xs">
          + Thêm chi nhánh
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
          placeholder="Tìm theo tên hoặc địa chỉ chi nhánh..."
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
                <th className="px-5 py-3.5">Tên chi nhánh</th>
                <th className="px-5 py-3.5">Địa chỉ</th>
                <th className="px-5 py-3.5">Số điện thoại</th>
                <th className="px-5 py-3.5">Ngày tạo</th>
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
                    Chưa có chi nhánh nào.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-cream-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-ink-600">#{item.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-ink-950">{item.name}</td>
                    <td className="px-5 py-3.5 text-ink-700">{item.address}</td>
                    <td className="px-5 py-3.5 text-ink-600">{item.phone || "—"}</td>
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
        title={editing ? `Cập nhật chi nhánh #${editing.id}` : "Thêm chi nhánh mới"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="field-label">Tên chi nhánh *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              required
              placeholder="Ví dụ: Showroom Hà Nội..."
              className="field"
            />
          </div>
          <div>
            <label className="field-label">Địa chỉ *</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={500}
              required
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
              className="field"
            />
          </div>
          <div>
            <label className="field-label">Số điện thoại</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              placeholder="024..."
              className="field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline py-2 text-xs">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn-primary py-2 text-xs">
              {submitting ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo chi nhánh"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
