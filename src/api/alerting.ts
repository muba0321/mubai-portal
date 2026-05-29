import request from "@/utils/request";

const ALERTING_BASE = "/api/v1/alerting";

// ============ Interfaces ============

export interface AlertMetric {
  id: number;
  name: string;
  display_name: string;
  group: string;
  description: string;
  promql: string;
  unit: string;
  source_type: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AlertRule {
  id: number;
  name: string;
  metric_id: number | null;
  condition_operator: string;
  condition_value: number;
  condition_duration: number;
  severity: string;
  notification_channels: string | null;
  source_type: string;
  template_id: number | null;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
  metric?: AlertMetric;
}

export interface NotificationChannel {
  id: number;
  type: string;
  name: string;
  webhook_url: string | null;
  email_recipients: string | null;
  message_template: string | null;
  level_filter: string;
  silence_period: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AlertTemplate {
  id: number;
  name: string;
  description: string;
  group: string;
  source_type: string;
  metric_count: number;
  rule_count: number;
  metrics_def: string | null;
  rules_def: string | null;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
  metrics?: any[];
  rules?: any[];
}

export interface AlertingStats {
  metrics_count: number;
  templates_count: number;
  rules_count: number;
  active_rules: number;
  channels_count: number;
}

// ============ API ============

const AlertingAPI = {
  // ---- Stats ----
  getStats() {
    return request<any, AlertingStats>({
      url: `${ALERTING_BASE}/stats`,
      method: "get",
    });
  },

  // ---- Metrics ----
  listMetrics(params?: { group?: string; source_type?: string }) {
    return request<any, AlertMetric[]>({
      url: `${ALERTING_BASE}/metrics`,
      method: "get",
      params,
    });
  },
  createMetric(data: Partial<AlertMetric>) {
    return request<any, AlertMetric>({
      url: `${ALERTING_BASE}/metrics`,
      method: "post",
      data,
    });
  },
  updateMetric(id: number, data: Partial<AlertMetric>) {
    return request<any, AlertMetric>({
      url: `${ALERTING_BASE}/metrics/${id}`,
      method: "put",
      data,
    });
  },
  deleteMetric(id: number) {
    return request<any, any>({
      url: `${ALERTING_BASE}/metrics/${id}`,
      method: "delete",
    });
  },

  // ---- Alert Rules ----
  listRules(params?: { severity?: string; source_type?: string; enabled?: string }) {
    return request<any, AlertRule[]>({
      url: `${ALERTING_BASE}/rules`,
      method: "get",
      params,
    });
  },
  createRule(data: Partial<AlertRule>) {
    return request<any, AlertRule>({
      url: `${ALERTING_BASE}/rules`,
      method: "post",
      data,
    });
  },
  updateRule(id: number, data: Partial<AlertRule>) {
    return request<any, AlertRule>({
      url: `${ALERTING_BASE}/rules/${id}`,
      method: "put",
      data,
    });
  },
  deleteRule(id: number) {
    return request<any, any>({
      url: `${ALERTING_BASE}/rules/${id}`,
      method: "delete",
    });
  },
  toggleRule(id: number) {
    return request<any, AlertRule>({
      url: `${ALERTING_BASE}/rules/${id}/toggle`,
      method: "put",
    });
  },

  // ---- Notification Channels ----
  listChannels(params?: { type?: string }) {
    return request<any, NotificationChannel[]>({
      url: `${ALERTING_BASE}/channels`,
      method: "get",
      params,
    });
  },
  createChannel(data: Partial<NotificationChannel>) {
    return request<any, NotificationChannel>({
      url: `${ALERTING_BASE}/channels`,
      method: "post",
      data,
    });
  },
  updateChannel(id: number, data: Partial<NotificationChannel>) {
    return request<any, NotificationChannel>({
      url: `${ALERTING_BASE}/channels/${id}`,
      method: "put",
      data,
    });
  },
  deleteChannel(id: number) {
    return request<any, any>({
      url: `${ALERTING_BASE}/channels/${id}`,
      method: "delete",
    });
  },

  // ---- Templates ----
  listTemplates(params?: { group?: string; source_type?: string }) {
    return request<any, AlertTemplate[]>({
      url: `${ALERTING_BASE}/templates`,
      method: "get",
      params,
    });
  },
  getTemplate(id: number) {
    return request<any, AlertTemplate>({
      url: `${ALERTING_BASE}/templates/${id}`,
      method: "get",
    });
  },
  createTemplate(data: any) {
    return request<any, AlertTemplate>({
      url: `${ALERTING_BASE}/templates`,
      method: "post",
      data,
    });
  },
  updateTemplate(id: number, data: any) {
    return request<any, AlertTemplate>({
      url: `${ALERTING_BASE}/templates/${id}`,
      method: "put",
      data,
    });
  },
  deleteTemplate(id: number) {
    return request<any, any>({
      url: `${ALERTING_BASE}/templates/${id}`,
      method: "delete",
    });
  },
  applyTemplate(id: number) {
    return request<any, any>({
      url: `${ALERTING_BASE}/templates/${id}/apply`,
      method: "post",
    });
  },
};

export default AlertingAPI;
