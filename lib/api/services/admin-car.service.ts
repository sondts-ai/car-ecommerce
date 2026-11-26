import { API_CONFIG } from "../config";
import { buildQuery, http } from "../http";
import type {
  AdminListParams,
  AdminPageResponse,
  BrandRequest,
  BrandResponse,
  CarModelDetail,
  CarModelListParams,
  CarModelRequest,
  CarModelSummary,
  CarVersionRequest,
  CarVersionResponse,
  CategoryRequest,
  CategoryResponse,
} from "../admin-types";

function carBaseUrl(): string {
  return API_CONFIG.useBackendServices ? API_CONFIG.services.adminCar : API_CONFIG.baseUrl;
}

export const adminCarApi = {
  // ---------------------------- Brands ---------------------------------
  async listBrands(params: AdminListParams = {}): Promise<AdminPageResponse<BrandResponse>> {
    const qs = buildQuery({ q: params.q, page: params.page ?? 0, size: params.size ?? 20 });
    const { data } = await http.get<AdminPageResponse<BrandResponse>>(`/admin/brands${qs}`, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async getBrand(id: number): Promise<BrandResponse> {
    const { data } = await http.get<BrandResponse>(`/admin/brands/${id}`, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async createBrand(payload: BrandRequest): Promise<BrandResponse> {
    const { data } = await http.post<BrandResponse>("/admin/brands", payload, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async updateBrand(id: number, payload: BrandRequest): Promise<BrandResponse> {
    const { data } = await http.put<BrandResponse>(`/admin/brands/${id}`, payload, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async deleteBrand(id: number): Promise<void> {
    await http.delete<null>(`/admin/brands/${id}`, { baseUrl: carBaseUrl() });
  },

  // -------------------------- Categories -------------------------------
  async listCategories(params: AdminListParams = {}): Promise<AdminPageResponse<CategoryResponse>> {
    const qs = buildQuery({ q: params.q, page: params.page ?? 0, size: params.size ?? 20 });
    const { data } = await http.get<AdminPageResponse<CategoryResponse>>(`/admin/categories${qs}`, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async createCategory(payload: CategoryRequest): Promise<CategoryResponse> {
    const { data } = await http.post<CategoryResponse>("/admin/categories", payload, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async updateCategory(id: number, payload: CategoryRequest): Promise<CategoryResponse> {
    const { data } = await http.put<CategoryResponse>(`/admin/categories/${id}`, payload, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async deleteCategory(id: number): Promise<void> {
    await http.delete<null>(`/admin/categories/${id}`, { baseUrl: carBaseUrl() });
  },

  // -------------------------- Car Models -------------------------------
  async listModels(params: CarModelListParams = {}): Promise<AdminPageResponse<CarModelSummary>> {
    const qs = buildQuery({
      brandId: params.brandId,
      categoryId: params.categoryId,
      q: params.q,
      page: params.page ?? 0,
      size: params.size ?? 20,
    });
    const { data } = await http.get<AdminPageResponse<CarModelSummary>>(`/admin/car-models${qs}`, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async getModel(id: number): Promise<CarModelDetail> {
    const { data } = await http.get<CarModelDetail>(`/admin/car-models/${id}`, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async createModel(payload: CarModelRequest): Promise<CarModelSummary> {
    const { data } = await http.post<CarModelSummary>("/admin/car-models", payload, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async updateModel(id: number, payload: CarModelRequest): Promise<CarModelSummary> {
    const { data } = await http.put<CarModelSummary>(`/admin/car-models/${id}`, payload, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async deleteModel(id: number): Promise<void> {
    await http.delete<null>(`/admin/car-models/${id}`, { baseUrl: carBaseUrl() });
  },

  // --------------------------- Versions --------------------------------
  async listVersions(modelId: number): Promise<CarVersionResponse[]> {
    const { data } = await http.get<CarVersionResponse[]>(`/admin/car-models/${modelId}/versions`, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async createVersion(modelId: number, payload: CarVersionRequest): Promise<CarVersionResponse> {
    const { data } = await http.post<CarVersionResponse>(
      `/admin/car-models/${modelId}/versions`,
      payload,
      { baseUrl: carBaseUrl() },
    );
    return data;
  },

  async updateVersion(versionId: number, payload: CarVersionRequest): Promise<CarVersionResponse> {
    const { data } = await http.put<CarVersionResponse>(`/admin/versions/${versionId}`, payload, {
      baseUrl: carBaseUrl(),
    });
    return data;
  },

  async deleteVersion(versionId: number): Promise<void> {
    await http.delete<null>(`/admin/versions/${versionId}`, { baseUrl: carBaseUrl() });
  },
};
