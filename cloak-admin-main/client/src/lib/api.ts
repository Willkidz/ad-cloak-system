import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL ?? 'https://cloak-admin-api.p525678999.workers.dev/api/v1';

export const API_KEY = import.meta.env.VITE_API_KEY ?? '';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 120s 對應大型網站採集需求
  headers: {
    'X-API-Key': API_KEY,
  },
});

// ==================== System ====================
export async function fetchSystemLinks() {
  const { data } = await api.get('/system/links');
  return data;
}

// ==================== Dashboard ====================
export async function fetchOAComparison() {
  const { data } = await api.get('/dashboard/oa-comparison');
  return data;
}

export async function fetchAdRanking(opts?: {
  date?: string;
  start_date?: string;
  end_date?: string;
  group?: string;
}) {
  const params: Record<string, string> = {};
  if (opts?.start_date) params.start_date = opts.start_date;
  if (opts?.end_date) params.end_date = opts.end_date;
  if (opts?.date) params.date = opts.date;
  if (opts?.group) params.group = opts.group;
  const { data } = await api.get('/dashboard/ad-ranking', { params });
  return data;
}


// ==================== Templates ====================
export async function fetchTemplates(params?: {
  type?: string;
  name?: string;
  page?: number;
  limit?: number;
}) {
  // Backend now supports 'type' parameter for server-side filtering
  const apiParams: Record<string, any> = {
    page: params?.page || 1,
    limit: params?.limit || 20,
  };
  if (params?.name) {
    apiParams.search = params.name;
  }
  if (params?.type) {
    apiParams.type = params.type;
  }
  const { data } = await api.get('/templates', { params: apiParams });
  return data;
}

export async function fetchTemplate(id: string | number) {
  const { data } = await api.get(`/templates/${id}`);
  return data;
}

// Fetch template preview HTML with API key authentication (for iframe blob URL)
export async function fetchTemplatePreviewHtml(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/templates/${id}/preview`, {
    headers: { 'X-API-Key': API_KEY },
  });
  if (!res.ok) throw new Error('Preview fetch failed');
  return res.text();
}

export async function createTemplate(body: Record<string, unknown>) {
  const { data } = await api.post('/templates', body);
  return data;
}

export async function updateTemplate(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put(`/templates/${id}`, body);
  return data;
}

export async function toggleTemplateStatus(id: string | number) {
  const { data } = await api.put(`/templates/${id}/toggle`);
  return data;
}

export async function uploadZipTemplate(formData: FormData) {
  const { data } = await api.post('/templates/upload-zip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteTemplate(id: string | number) {
  const { data } = await api.delete(`/templates/${id}`);
  return data;
}

export async function crawlTemplate(url: string) {
  const { data } = await api.post('/templates/crawl', { url });
  return data;
}

export async function scrapeTemplate(body: {
  url: string;
  name: string;
  country?: string;
  type?: string;
  status?: string;
}) {
  const { data } = await api.post('/templates/scrape', body);
  return data;
}

export async function batchDeleteTemplates(ids: string[]) {
  const { data } = await api.post('/templates/batch-delete', { ids });
  return data;
}

export async function fetchSystemTemplates() {
  const { data } = await api.get('/templates/system');
  return data;
}

// ==================== Campaigns ====================

// Helper: Parse array fields that may come as JSON strings from backend
function parseArrayField(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

// Helper: Normalize campaign data from backend
function normalizeCampaign(campaign: any): any {
  if (!campaign) return campaign;
  return {
    ...campaign,
    customer_links: parseArrayField(campaign.customer_links),
    line_links: parseArrayField(campaign.line_links),
    whatsapp_links: parseArrayField(campaign.whatsapp_links),
    other_links: parseArrayField(campaign.other_links),
    blacklist_rules: parseArrayField(campaign.blacklist_rules),
    ad_pixels: parseArrayField(campaign.ad_pixels),
    bc_pixels: parseArrayField(campaign.bc_pixels),
    liff_links: parseArrayField(campaign.liff_links),
  };
}
export async function fetchGroups() {
  const { data } = await api.get('/groups');
  return data;
}

export async function fetchLiffOptions() {
  const { data } = await api.get('/liff-options');
  return data;
}

// ==================== LINE Config ====================
export async function fetchLineConfigs() {
  const { data } = await api.get('/line-config');
  return data;
}

export async function fetchLineConfigsByGroup(groupName: string) {
  const { data } = await api.get('/line-config', { params: { group_name: groupName } });
  return data;
}

export async function createLineConfig(body: Record<string, unknown>) {
  const { data } = await api.post('/line-config', body);
  return data;
}

export async function updateLineConfig(id: number | string, body: Record<string, unknown>) {
  const { data } = await api.put(`/line-config/${id}`, body);
  return data;
}

export async function deleteLineConfig(id: number | string) {
  const { data } = await api.delete(`/line-config/${id}`);
  return data;
}

// ==================== LINE Groups ====================
export async function fetchLineGroups() {
  const { data } = await api.get('/line-groups');
  return data;
}

export async function createLineGroup(body: Record<string, unknown>) {
  const { data } = await api.post('/line-groups', body);
  return data;
}

export async function updateLineGroup(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put(`/line-groups/${id}`, body);
  return data;
}

export async function deleteLineGroup(id: string | number) {
  const { data } = await api.delete(`/line-groups/${id}`);
  return data;
}

export async function fetchCampaigns(params?: {
  search?: string;
  page?: number;
  limit?: number;
  group_name?: string;
}) {
  const { data } = await api.get('/campaigns', { params });
  // Backend returns {success, data: {items, total, page, limit}}
  // Normalize to {success, data: items[]}
  if (data.success && data.data?.items) {
    const normalizedItems = data.data.items.map(normalizeCampaign);
    return { success: true, data: normalizedItems };
  }
  return data;
}

export async function fetchCampaign(id: string | number) {
  const { data } = await api.get(`/campaigns/${id}`);
  // Normalize campaign data to ensure array fields are properly parsed
  if (data.success && data.data) {
    data.data = normalizeCampaign(data.data);
  }
  return data;
}

export async function createCampaign(body: Record<string, unknown>) {
  const { data } = await api.post('/campaigns', body);
  return data;
}

export async function updateCampaign(id: string | number, body: Record<string, unknown>) {
  const { data } = await api.put(`/campaigns/${id}`, body);
  return data;
}

export async function updateCampaignApprovedAt(id: string | number, approved_at: string | null) {
  const { data } = await api.patch(`/campaigns/${id}/approved_at`, { approved_at });
  return data;
}

export async function deleteCampaign(id: string | number) {
  const { data } = await api.delete(`/campaigns/${id}`);
  return data;
}

// Fetch campaign metrics / device stats for campaign list
export async function fetchCampaignMetrics(since?: string) {
  const params: Record<string, string> = {};
  if (since) params.since = since;
  const { data } = await api.get('/campaigns/stats', { params });
  return data;
}

// ==================== Domains ====================
export async function fetchDomains() {
  const { data } = await api.get('/domains');
  // Backend returns {success, data: {domains: []}}
  if (data.success && data.data?.domains) {
    return { success: true, data: { domains: data.data.domains } };
  }
  return data;
}

export async function resolveDomain(domain: string) {
  // POST /domains/zones: creates zone in Cloudflare, saves NS + zone_id to D1, returns {zoneId, domain, nameServers, status}
  const { data } = await api.post('/domains/zones', { domain });
  return data;
}

export async function deleteDomain(id: number) {
  const { data } = await api.delete(`/domains/${id}`);
  return data;
}

export async function checkZone(zoneId: string) {
  const { data } = await api.post(`/domains/zones/${zoneId}/check`);
  return data;
}

// ==================== Short Links ====================
export async function fetchShortLinks(params?: { page?: number; limit?: number }) {
  const { data } = await api.get('/shortlinks', { params });
  // Backend returns {success, data: {items, total, page, limit}}
  if (data.success && data.data?.items) {
    return { success: true, data: data.data.items };
  }
  return data;
}

export async function createShortLink(body: Record<string, unknown>) {
  // Backend expects camelCase: targetLinks (array), not target_links (string)
  const payload = { ...body };
  if (typeof payload.target_links === 'string') {
    try {
      payload.targetLinks = JSON.parse(payload.target_links as string);
    } catch {
      payload.targetLinks = [];
    }
    delete payload.target_links;
  }
  const { data } = await api.post('/shortlinks', payload);
  return data;
}

export async function updateShortLink(id: number, body: Record<string, unknown>) {
  const { data } = await api.put(`/shortlinks/${id}`, body);
  return data;
}

export async function deleteShortLink(id: number) {
  const { data } = await api.delete(`/shortlinks/${id}`);
  return data;
}

// ==================== Visit Logs (Layered) ====================
export async function fetchVisitLogs(params?: {
  tab?: string; // all, visit, button_click, safe_page_click, cloak_blocked
  search?: string;
  campaign_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get('/visit-logs', { params });
  return data;
}

// ==================== Clicks ====================
export async function fetchClicks(params?: {
  matched?: string | number; // 'all', 1, 0
  search?: string;
  tag?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get('/clicks', { params });
  return data;
}

// Fetch campaign list for log filter dropdown (includes group_name)
export async function fetchCampaignList() {
  const { data } = await api.get('/campaigns', { params: { limit: 100 } });
  if (data.success && data.data?.items) {
    return { success: true, data: data.data.items.map((c: any) => ({ id: c.id, name: c.name, theme: c.theme, group_name: c.group_name })) };
  }
  return data;
}

// [REMOVED] Pixels Library CRUD (fetchPixels/createPixel/updatePixel/deletePixel)
// 像素已全面從 pixel_groups 動態讀取，舊版 /pixels API 不再使用

// ==================== Pixel Groups ====================
export async function fetchPixelGroups(params?: { tag?: string; search?: string }) {
  const { data } = await api.get('/pixel-groups', { params });
  return data;
}

export async function fetchPixelGroup(id: number | string) {
  const { data } = await api.get(`/pixel-groups/${id}`);
  return data;
}

export async function createPixelGroup(body: Record<string, unknown>) {
  const { data } = await api.post('/pixel-groups', body);
  return data;
}

export async function updatePixelGroup(id: number | string, body: Record<string, unknown>) {
  const { data } = await api.put(`/pixel-groups/${id}`, body);
  return data;
}

export async function deletePixelGroup(id: number | string) {
  const { data } = await api.delete(`/pixel-groups/${id}`);
  return data;
}

export async function patchPixelGroupStatus(id: number | string, status: 'active' | 'disabled') {
  const { data } = await api.patch(`/pixel-groups/${id}/status`, { status });
  return data;
}

// ==================== Details Pages ====================
export async function createDetails(body: { content: string; campaign_id?: string; title?: string }) {
  const { data } = await api.post('/details', body);
  return data;
}

export async function updateDetails(id: string, body: { content: string; title?: string }) {
  const { data } = await api.put(`/details/${id}`, body);
  return data;
}

// ==================== Landing Page A/B Test ====================
export async function fetchTemplateStats(days: number = 7) {
  const { data } = await api.get('/template-stats', { params: { days } });
  return data;
}

export async function fetchCampaignVariants(campaignId: string) {
  const { data } = await api.get(`/campaigns/${campaignId}/variants`);
  return data;
}

export async function createVariant(campaignId: string, body: { template_id: string; variant_name?: string; weight?: number }) {
  const { data } = await api.post(`/campaigns/${campaignId}/variants`, body);
  return data;
}

export async function updateVariant(campaignId: string, variantId: string, body: { weight?: number; is_active?: number }) {
  const { data } = await api.put(`/campaigns/${campaignId}/variants/${variantId}`, body);
  return data;
}

export async function deleteVariant(campaignId: string, variantId: string) {
  const { data } = await api.delete(`/campaigns/${campaignId}/variants/${variantId}`);
  return data;
}

export async function resetVariants(campaignId: string) {
  const { data } = await api.post(`/campaigns/${campaignId}/variants/reset`);
  return data;
}

export async function resetSingleVariant(campaignId: string, variantId: string) {
  const { data } = await api.post(`/campaigns/${campaignId}/variants/${variantId}/reset`);
  return data;
}

export default api;
