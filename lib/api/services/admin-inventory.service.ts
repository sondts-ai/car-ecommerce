import { API_CONFIG } from "../config";
import { buildQuery, http } from "../http";
import type {
  AdminListParams,
  AdminPageResponse,
  BranchRequest,
  BranchResponse,
  VehicleBranchChangeRequest,
  VehicleCreateRequest,
  VehicleDetail,
  VehicleDocumentRequest,
  VehicleDocumentResponse,
  VehicleHistoryResponse,
  VehicleImageRequest,
  VehicleImageResponse,
  VehicleListParams,
  VehicleStats,
  VehicleStatusChangeRequest,
  VehicleSummary,
  VehicleUpdateRequest,
} from "../admin-types";

function inventoryBaseUrl(): string {
  return API_CONFIG.useBackendServices ? API_CONFIG.services.adminInventory : API_CONFIG.baseUrl;
}

export const adminInventoryApi = {
  // --------------------------- Vehicles --------------------------------
  async listVehicles(params: VehicleListParams = {}): Promise<AdminPageResponse<VehicleSummary>> {
    const qs = buildQuery({
      status: params.status || undefined,
      branchId: params.branchId,
      versionId: params.versionId,
      condition: params.condition || undefined,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      q: params.q,
      page: params.page ?? 0,
      size: params.size ?? 20,
    });
    const { data } = await http.get<AdminPageResponse<VehicleSummary>>(`/admin/vehicles${qs}`, {
      baseUrl: inventoryBaseUrl(),
    });
    return data;
  },

  async getVehicle(id: number): Promise<VehicleDetail> {
    const { data } = await http.get<VehicleDetail>(`/admin/vehicles/${id}`, {
      baseUrl: inventoryBaseUrl(),
    });
    return data;
  },

  async createVehicle(payload: VehicleCreateRequest): Promise<VehicleDetail> {
    const { data } = await http.post<VehicleDetail>("/admin/vehicles", payload, {
      baseUrl: inventoryBaseUrl(),
    });
    return data;
  },

  async updateVehicle(id: number, payload: VehicleUpdateRequest): Promise<VehicleDetail> {
    const { data } = await http.put<VehicleDetail>(`/admin/vehicles/${id}`, payload, {
      baseUrl: inventoryBaseUrl(),
    });
    return data;
  },

  async deleteVehicle(id: number): Promise<void> {
    await http.delete<null>(`/admin/vehicles/${id}`, { baseUrl: inventoryBaseUrl() });
  },

  async changeStatus(
    id: number,
    payload: VehicleStatusChangeRequest,
  ): Promise<VehicleHistoryResponse> {
    const { data } = await http.patch<VehicleHistoryResponse>(
      `/admin/vehicles/${id}/status`,
      payload,
      { baseUrl: inventoryBaseUrl() },
    );
    return data;
  },

  async getHistory(id: number): Promise<VehicleHistoryResponse[]> {
    const { data } = await http.get<VehicleHistoryResponse[]>(`/admin/vehicles/${id}/history`, {
      baseUrl: inventoryBaseUrl(),
    });
    return data;
  },

  async changeBranch(
    id: number,
    payload: VehicleBranchChangeRequest,
  ): Promise<VehicleHistoryResponse> {
    const { data } = await http.patch<VehicleHistoryResponse>(
      `/admin/vehicles/${id}/branch`,
      payload,
      { baseUrl: inventoryBaseUrl() },
    );
    return data;
  },

  // ---------------------- Images & Documents ---------------------------
  async addImage(vehicleId: number, payload: VehicleImageRequest): Promise<VehicleImageResponse> {
    const { data } = await http.post<VehicleImageResponse>(
      `/admin/vehicles/${vehicleId}/images`,
      payload,
      { baseUrl: inventoryBaseUrl() },
    );
    return data;
  },

  async setThumbnail(imageId: number): Promise<VehicleImageResponse> {
    const { data } = await http.patch<VehicleImageResponse>(
      `/admin/vehicle-images/${imageId}/thumbnail`,
      undefined,
      { baseUrl: inventoryBaseUrl() },
    );
    return data;
  },

  async deleteImage(imageId: number): Promise<void> {
    await http.delete<null>(`/admin/vehicle-images/${imageId}`, { baseUrl: inventoryBaseUrl() });
  },

  async addDocument(
    vehicleId: number,
    payload: VehicleDocumentRequest,
  ): Promise<VehicleDocumentResponse> {
    const { data } = await http.post<VehicleDocumentResponse>(
      `/admin/vehicles/${vehicleId}/documents`,
      payload,
      { baseUrl: inventoryBaseUrl() },
    );
    return data;
  },

  async deleteDocument(documentId: number): Promise<void> {
    await http.delete<null>(`/admin/vehicle-documents/${documentId}`, {
      baseUrl: inventoryBaseUrl(),
    });
  },

  // --------------------------- Branches --------------------------------
  async listBranches(params: AdminListParams = {}): Promise<AdminPageResponse<BranchResponse>> {
    const qs = buildQuery({ q: params.q, page: params.page ?? 0, size: params.size ?? 20 });
    const { data } = await http.get<AdminPageResponse<BranchResponse>>(`/admin/branches${qs}`, {
      baseUrl: inventoryBaseUrl(),
    });
    return data;
  },

  async createBranch(payload: BranchRequest): Promise<BranchResponse> {
    const { data } = await http.post<BranchResponse>("/admin/branches", payload, {
      baseUrl: inventoryBaseUrl(),
    });
    return data;
  },

  async updateBranch(id: number, payload: BranchRequest): Promise<BranchResponse> {
    const { data } = await http.put<BranchResponse>(`/admin/branches/${id}`, payload, {
      baseUrl: inventoryBaseUrl(),
    });
    return data;
  },

  async deleteBranch(id: number): Promise<void> {
    await http.delete<null>(`/admin/branches/${id}`, { baseUrl: inventoryBaseUrl() });
  },

  // ----------------------------- Stats ---------------------------------
  async getStats(): Promise<VehicleStats> {
    const { data } = await http.get<VehicleStats>("/admin/stats/vehicles", {
      baseUrl: inventoryBaseUrl(),
    });
    return data;
  },
};
