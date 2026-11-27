import { API_CONFIG } from "../config";
import { http } from "../http";
import type { TestDriveDto, TestDriveStatus } from "../types";

type AdminTestDriveResponse = Omit<TestDriveDto, "id" | "status"> & {
  id: number | string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "REJECTED"
    | TestDriveStatus;
};

const TEST_DRIVE_STATUS_MAP: Record<AdminTestDriveResponse["status"], TestDriveStatus> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
  rejected: "rejected",
};

const BACKEND_STATUS_MAP: Record<TestDriveStatus, "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED"> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  rejected: "REJECTED",
};

function mapTestDrive(item: AdminTestDriveResponse): TestDriveDto {
  return {
    ...item,
    id: String(item.id),
    status: TEST_DRIVE_STATUS_MAP[item.status],
  };
}

function testDriveBaseUrl(): string {
  return API_CONFIG.useBackendServices ? API_CONFIG.services.customer : API_CONFIG.baseUrl;
}

export const adminTestDriveApi = {
  async list(): Promise<TestDriveDto[]> {
    const { data } = await http.get<
      AdminTestDriveResponse[] | { items: AdminTestDriveResponse[] }
    >("/admin/test-drives", { baseUrl: testDriveBaseUrl() });
    const items = Array.isArray(data) ? data : data.items;
    return items.map(mapTestDrive);
  },

  async updateStatus(id: string, status: TestDriveStatus): Promise<void> {
    const backendStatus = API_CONFIG.useBackendServices
      ? BACKEND_STATUS_MAP[status]
      : status;
    await http.put(
      `/admin/test-drives/${encodeURIComponent(id)}/status`,
      { status: backendStatus },
      { baseUrl: testDriveBaseUrl() },
    );
  },
};
