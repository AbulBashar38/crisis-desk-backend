export interface ICreateReport {
  name?: string;
  contact?: string;
  location: string;
  description: string;
  language?: "bn" | "en" | "unknown";
}
