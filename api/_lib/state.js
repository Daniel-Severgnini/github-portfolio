const crypto = require('crypto');
const { getRedis } = require('./redis');
const { DEFAULT_PUBLISHED_STATE } = require('./constants');

const STATE_KEY = 'portfolio:state:v1';
const HISTORY_LIMIT = 20;

let inMemoryState = null;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const createDefaultState = () => {
  const published = deepClone(DEFAULT_PUBLISHED_STATE);

  return {
    published,
    draft: deepClone(published),
    history: [],
  };
};

const normalizeState = (state) => {
  const fallback = createDefaultState();
  if (!state || typeof state !== 'object') return fallback;

  const published = {
    profile: state.published?.profile || fallback.published.profile,
    favorites: Array.isArray(state.published?.favorites)
      ? state.published.favorites
      : fallback.published.favorites,
    metadata: state.published?.metadata && typeof state.published.metadata === 'object'
      ? state.published.metadata
      : {},
  };

  const draft = {
    profile: state.draft?.profile || published.profile,
    favorites: Array.isArray(state.draft?.favorites) ? state.draft.favorites : published.favorites,
    metadata: state.draft?.metadata && typeof state.draft.metadata === 'object'
      ? state.draft.metadata
      : deepClone(published.metadata),
  };

  const history = Array.isArray(state.history) ? state.history : [];

  return {
    published,
    draft,
    history,
  };
};

const readState = async () => {
  const redis = getRedis();

  if (redis) {
    const raw = await redis.get(STATE_KEY);
    if (!raw) {
      const initial = createDefaultState();
      await redis.set(STATE_KEY, JSON.stringify(initial));
      return initial;
    }

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return normalizeState(parsed);
    } catch (error) {
      const initial = createDefaultState();
      await redis.set(STATE_KEY, JSON.stringify(initial));
      return initial;
    }
  }

  if (!inMemoryState) inMemoryState = createDefaultState();
  return normalizeState(inMemoryState);
};

const writeState = async (state) => {
  const normalized = normalizeState(state);
  const redis = getRedis();

  if (redis) {
    await redis.set(STATE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  inMemoryState = normalized;
  return normalized;
};

const createHistoryEntry = (published, note) => {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    note: note || 'Atualizacao do portfolio',
    published: deepClone(published),
  };
};

const pushHistory = (state, note, publishedOverride) => {
  const source = publishedOverride || state.published;
  state.history.unshift(createHistoryEntry(source, note));
  state.history = state.history.slice(0, HISTORY_LIMIT);
};

const toPublicState = (state) => deepClone(state.published);

const toAdminState = (state) => {
  return {
    published: deepClone(state.published),
    draft: deepClone(state.draft),
    history: state.history.map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt,
      note: entry.note,
    })),
  };
};

const mergeDraftState = (state, payload) => {
  if (payload.profile) {
    state.draft.profile = deepClone(payload.profile);
  }

  if (Array.isArray(payload.favorites)) {
    state.draft.favorites = [...payload.favorites];
  }

  if (payload.projectName) {
    const existing = state.draft.metadata[payload.projectName] || {};
    state.draft.metadata[payload.projectName] = {
      ...existing,
      ...payload.data,
      name: payload.projectName,
    };
  }

  if (payload.metadata && typeof payload.metadata === 'object') {
    Object.entries(payload.metadata).forEach(([projectName, projectData]) => {
      const existing = state.draft.metadata[projectName] || {};
      state.draft.metadata[projectName] = {
        ...existing,
        ...projectData,
        name: projectName,
      };
    });
  }
};

const applyPublish = (state, payload) => {
  const sections = payload.sections && payload.sections.length > 0
    ? payload.sections
    : ['profile', 'favorites', 'metadata'];

  let changed = false;

  if (payload.projectName) {
    const projectName = payload.projectName;
    const draftData = state.draft.metadata[projectName];
    const currentData = state.published.metadata[projectName];

    if (JSON.stringify(draftData || null) !== JSON.stringify(currentData || null)) {
      changed = true;
    }

    if (draftData) {
      state.published.metadata[projectName] = deepClone(draftData);
      state.draft.metadata[projectName] = deepClone(draftData);
    } else {
      delete state.published.metadata[projectName];
      delete state.draft.metadata[projectName];
    }
  } else {
    if (sections.includes('profile')) {
      if (JSON.stringify(state.published.profile) !== JSON.stringify(state.draft.profile)) {
        changed = true;
      }
      state.published.profile = deepClone(state.draft.profile);
      state.draft.profile = deepClone(state.published.profile);
    }

    if (sections.includes('favorites')) {
      if (JSON.stringify(state.published.favorites) !== JSON.stringify(state.draft.favorites)) {
        changed = true;
      }
      state.published.favorites = [...state.draft.favorites];
      state.draft.favorites = [...state.published.favorites];
    }

    if (sections.includes('metadata')) {
      if (JSON.stringify(state.published.metadata) !== JSON.stringify(state.draft.metadata)) {
        changed = true;
      }
      state.published.metadata = deepClone(state.draft.metadata);
      state.draft.metadata = deepClone(state.published.metadata);
    }
  }

  return changed;
};

const applyDiscard = (state, payload) => {
  const sections = payload.sections && payload.sections.length > 0
    ? payload.sections
    : ['profile', 'favorites', 'metadata'];

  if (payload.projectName) {
    const projectName = payload.projectName;
    const publishedData = state.published.metadata[projectName];

    if (publishedData) {
      state.draft.metadata[projectName] = deepClone(publishedData);
    } else {
      delete state.draft.metadata[projectName];
    }

    return;
  }

  if (sections.includes('profile')) {
    state.draft.profile = deepClone(state.published.profile);
  }

  if (sections.includes('favorites')) {
    state.draft.favorites = [...state.published.favorites];
  }

  if (sections.includes('metadata')) {
    state.draft.metadata = deepClone(state.published.metadata);
  }
};

const getPublicPortfolioState = async () => {
  const state = await readState();
  return toPublicState(state);
};

const getAdminPortfolioState = async () => {
  const state = await readState();
  return toAdminState(state);
};

const saveDraft = async (payload) => {
  const state = await readState();
  mergeDraftState(state, payload || {});
  const updated = await writeState(state);
  return toAdminState(updated);
};

const publishDraft = async (payload) => {
  const state = await readState();
  const publishPayload = payload || {};
  const previousPublished = deepClone(state.published);

  const changed = applyPublish(state, publishPayload);
  if (changed) {
    pushHistory(state, publishPayload.note || 'Publicacao de alteracoes', previousPublished);
  }

  const updated = await writeState(state);
  return toAdminState(updated);
};

const discardDraft = async (payload) => {
  const state = await readState();
  applyDiscard(state, payload || {});
  const updated = await writeState(state);
  return toAdminState(updated);
};

const rollbackPublished = async (snapshotId) => {
  const state = await readState();
  const target = state.history.find((item) => item.id === snapshotId);
  if (!target) {
    throw new Error('Snapshot nao encontrado.');
  }

  pushHistory(state, `Snapshot antes do rollback (${snapshotId})`);
  state.published = deepClone(target.published);
  state.draft = deepClone(target.published);

  const updated = await writeState(state);
  return toAdminState(updated);
};

module.exports = {
  getPublicPortfolioState,
  getAdminPortfolioState,
  saveDraft,
  publishDraft,
  discardDraft,
  rollbackPublished,
};
