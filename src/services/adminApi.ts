import { ProjectMetadata } from '../types/Project';
import { ProfileData } from '../types/Profile';

export interface PortfolioPublishedState {
  profile: ProfileData;
  favorites: string[];
  metadata: Record<string, ProjectMetadata>;
}

export interface PortfolioDraftState {
  profile: ProfileData;
  favorites: string[];
  metadata: Record<string, ProjectMetadata>;
}

export interface PortfolioHistoryEntry {
  id: string;
  createdAt: string;
  note: string;
}

export interface PortfolioAdminState {
  published: PortfolioPublishedState;
  draft: PortfolioDraftState;
  history: PortfolioHistoryEntry[];
}

export interface LoginResponse {
  token: string;
  expiresAt: number;
}

const ADMIN_TOKEN_KEY = 'portfolio_admin_token';
const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

const getResponsePayload = async (response: Response) => {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
};

const request = async <T>(
  input: string,
  init: RequestInit = {},
  requiresAuth = false
): Promise<T> => {
  const headers = new Headers(init.headers || {});

  if (requiresAuth) {
    const token = getAdminToken();
    if (!token) {
      throw new Error('Sessao do dashboard nao encontrada.');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const payload = await getResponsePayload(response);
  if (!response.ok) {
    const message = payload?.error || 'Falha ao processar requisicao.';
    throw new Error(message);
  }

  return payload as T;
};

export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
};

export const setAdminToken = (token: string) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const clearAdminToken = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const loginDashboard = async (password: string): Promise<LoginResponse> => {
  const payload = await request<{ token: string; expiresAt: number }>(
    '/api/auth/login.js',
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ password }),
    },
    false
  );

  setAdminToken(payload.token);
  return payload;
};

export const verifyDashboardSession = async () => {
  const payload = await request<{ valid: boolean; expiresAt: number; role: string }>(
    '/api/auth/verify.js',
    { method: 'GET' },
    true
  );
  return payload;
};

export const fetchPublicPortfolioState = async (): Promise<PortfolioPublishedState> => {
  const payload = await request<{ published: PortfolioPublishedState }>(
    '/api/portfolio/state.js',
    { method: 'GET' },
    false
  );

  return payload.published;
};

export const fetchAdminPortfolioState = async (): Promise<PortfolioAdminState> => {
  const payload = await request<{ state: PortfolioAdminState }>(
    '/api/admin/state.js',
    { method: 'GET' },
    true
  );
  return payload.state;
};

export const saveDraftState = async (draftPatch: {
  profile?: ProfileData;
  favorites?: string[];
  metadata?: Record<string, Partial<ProjectMetadata>>;
  projectName?: string;
  data?: Partial<ProjectMetadata>;
}): Promise<PortfolioAdminState> => {
  const payload = await request<{ state: PortfolioAdminState }>(
    '/api/admin/draft.js',
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(draftPatch),
    },
    true
  );
  return payload.state;
};

export const publishDraftState = async (publishPayload: {
  sections?: Array<'profile' | 'favorites' | 'metadata'>;
  projectName?: string;
  note?: string;
} = {}): Promise<PortfolioAdminState> => {
  const payload = await request<{ state: PortfolioAdminState }>(
    '/api/admin/publish.js',
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(publishPayload),
    },
    true
  );
  return payload.state;
};

export const discardDraftState = async (discardPayload: {
  sections?: Array<'profile' | 'favorites' | 'metadata'>;
  projectName?: string;
} = {}): Promise<PortfolioAdminState> => {
  const payload = await request<{ state: PortfolioAdminState }>(
    '/api/admin/discard.js',
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(discardPayload),
    },
    true
  );
  return payload.state;
};

export const rollbackPublishedState = async (snapshotId: string): Promise<PortfolioAdminState> => {
  const payload = await request<{ state: PortfolioAdminState }>(
    '/api/admin/rollback.js',
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ snapshotId }),
    },
    true
  );
  return payload.state;
};
