export interface ICreateReport {
  name?: string;
  contact?: string;
  location: string;
  description: string;
  language?: "bn" | "en" | "unknown";
}

export interface IReportFilters {
  category?: string;
  urgency?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface IUpdateReportStatus {
  status: "pending" | "in_review" | "assigned" | "resolved" | "rejected";
}
