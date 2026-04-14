import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProjectMetadata } from '../types/Project';
import {
  clearAdminToken,
  discardDraftState,
  fetchAdminPortfolioState,
  fetchPublicPortfolioState,
  getAdminToken,
  PortfolioAdminState,
  PortfolioHistoryEntry,
  publishDraftState,
  rollbackPublishedState,
  saveDraftState,
} from '../services/adminApi';

type MetadataMap = Record<string, ProjectMetadata>;

const PROJECT_METADATA_SYNC_EVENT = 'portfolio-project-metadata-sync';

const ensureMap = (value: unknown): MetadataMap => {
  if (!value || typeof value !== 'object') return {};
  return value as MetadataMap;
};

const areMetadataEqual = (a?: ProjectMetadata, b?: ProjectMetadata): boolean => {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
};

export const useProjectMetadata = () => {
  const [metadata, setMetadata] = useState<MetadataMap>({});
  const [draftMetadata, setDraftMetadata] = useState<MetadataMap>({});
  const [history, setHistory] = useState<PortfolioHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const syncFromAdminState = useCallback((state: PortfolioAdminState) => {
    setMetadata(ensureMap(state?.published?.metadata));
    setDraftMetadata(ensureMap(state?.draft?.metadata));
    setHistory(Array.isArray(state?.history) ? state.history : []);
  }, []);

  const syncFromPublicState = useCallback(async () => {
    const published = await fetchPublicPortfolioState();
    setMetadata(ensureMap(published.metadata));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      await syncFromPublicState();

      if (getAdminToken()) {
        try {
          const adminState = await fetchAdminPortfolioState();
          syncFromAdminState(adminState);
        } catch (error) {
          clearAdminToken();
          setDraftMetadata({});
          setHistory([]);
        }
      } else {
        setDraftMetadata({});
        setHistory([]);
      }
    } catch (error) {
      console.error('Falha ao carregar metadata do portfolio:', error);
    } finally {
      setLoading(false);
    }
  }, [syncFromAdminState, syncFromPublicState]);

  useEffect(() => {
    reload();

    const handleSync = () => {
      reload();
    };

    window.addEventListener(PROJECT_METADATA_SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener(PROJECT_METADATA_SYNC_EVENT, handleSync);
    };
  }, [reload]);

  const notifySync = () => {
    window.dispatchEvent(new Event(PROJECT_METADATA_SYNC_EVENT));
  };

  const updateMetadata = async (projectName: string, data: Partial<ProjectMetadata>) => {
    const state = await saveDraftState({
      projectName,
      data,
    });

    const publishedState = await publishDraftState({
      projectName,
      note: `Publicacao direta do projeto ${projectName}`,
    });

    syncFromAdminState(publishedState);
    notifySync();
    return state;
  };

  const removeMetadata = async (projectName: string) => {
    const state = await saveDraftState({
      projectName,
      data: {},
    });
    syncFromAdminState(state);
    notifySync();
  };

  const updateDraftMetadata = async (projectName: string, data: Partial<ProjectMetadata>) => {
    const state = await saveDraftState({
      projectName,
      data,
    });
    syncFromAdminState(state);
    notifySync();
  };

  const discardDraftMetadata = async (projectName?: string) => {
    const state = await discardDraftState(projectName ? { projectName } : { sections: ['metadata'] });
    syncFromAdminState(state);
    notifySync();
  };

  const publishDraftMetadata = async (projectName?: string) => {
    const state = await publishDraftState(projectName ? { projectName } : { sections: ['metadata'] });
    syncFromAdminState(state);
    notifySync();
  };

  const rollbackSnapshot = async (snapshotId: string) => {
    const state = await rollbackPublishedState(snapshotId);
    syncFromAdminState(state);
    notifySync();
    return state;
  };

  const getMetadata = (projectName: string): ProjectMetadata | undefined => {
    return metadata[projectName];
  };

  const getDraftMetadata = (projectName: string): ProjectMetadata | undefined => {
    return draftMetadata[projectName];
  };

  const hasDraftChanges = (projectName: string): boolean => {
    const draft = draftMetadata[projectName];
    if (!draft) return false;
    return !areMetadataEqual(draft, metadata[projectName]);
  };

  const pendingDraftCount = useMemo(() => {
    return Object.keys(draftMetadata).filter((projectName) => {
      const draft = draftMetadata[projectName];
      if (!draft) return false;
      return !areMetadataEqual(draft, metadata[projectName]);
    }).length;
  }, [draftMetadata, metadata]);

  return {
    metadata,
    draftMetadata,
    history,
    loading,
    pendingDraftCount,
    updateMetadata,
    removeMetadata,
    updateDraftMetadata,
    discardDraftMetadata,
    publishDraftMetadata,
    rollbackSnapshot,
    hasDraftChanges,
    getMetadata,
    getDraftMetadata,
    reload,
  };
};
