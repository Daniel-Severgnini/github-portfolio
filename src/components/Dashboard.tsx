import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Project } from '../hooks/useGithubData';
import { useProjectMetadata } from '../hooks/useProjectMetadata';
import { ProjectMetadata } from '../types/Project';
import { DEFAULT_PROFILE_DATA, ProfileData } from '../types/Profile';
import {
  clearAdminToken,
  discardDraftState,
  fetchAdminPortfolioState,
  loginDashboard,
  publishDraftState,
  saveDraftState,
  verifyDashboardSession,
} from '../services/adminApi';

interface DashboardProps {
  onClose: () => void;
  repos: Project[];
  onUpdateProfile: (data: ProfileData) => void;
  onUpdateFavorites: (favorites: string[]) => void;
  initialProfileData: ProfileData | null;
  initialFavorites: string[];
  projectToEdit?: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({
  onClose,
  repos,
  onUpdateProfile,
  onUpdateFavorites,
  initialProfileData,
  initialFavorites,
  projectToEdit,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'profile' | 'projects' | 'history'>('profile');

  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData || DEFAULT_PROFILE_DATA);
  const [publishedProfile, setPublishedProfile] = useState<ProfileData>(initialProfileData || DEFAULT_PROFILE_DATA);

  const [favorites, setFavorites] = useState<string[]>(initialFavorites);
  const [publishedFavorites, setPublishedFavorites] = useState<string[]>(initialFavorites);
  const [draggedFavorite, setDraggedFavorite] = useState<string | null>(null);

  const [showRepoList, setShowRepoList] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Project | null>(null);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ProjectMetadata>>({});
  const [filePreview, setFilePreview] = useState<{ name: string; size: string } | null>(null);

  const [isSavingProfileDraft, setIsSavingProfileDraft] = useState(false);
  const [isPublishingProfile, setIsPublishingProfile] = useState(false);

  const {
    metadata,
    history,
    pendingDraftCount,
    updateDraftMetadata,
    discardDraftMetadata,
    publishDraftMetadata,
    rollbackSnapshot,
    hasDraftChanges,
    getDraftMetadata,
    reload,
  } = useProjectMetadata();

  const refreshAdminState = useCallback(async () => {
    const state = await fetchAdminPortfolioState();

    const nextPublishedProfile = state.published.profile || DEFAULT_PROFILE_DATA;
    const nextDraftProfile = state.draft.profile || nextPublishedProfile;
    const nextPublishedFavorites = Array.isArray(state.published.favorites)
      ? state.published.favorites
      : [];
    const nextDraftFavorites = Array.isArray(state.draft.favorites)
      ? state.draft.favorites
      : nextPublishedFavorites;

    setPublishedProfile(nextPublishedProfile);
    setProfileData(nextDraftProfile);
    setPublishedFavorites(nextPublishedFavorites);
    setFavorites(nextDraftFavorites);

    onUpdateProfile(nextPublishedProfile);
    onUpdateFavorites(nextPublishedFavorites);
  }, [onUpdateFavorites, onUpdateProfile]);

  useEffect(() => {
    setProfileData(initialProfileData || DEFAULT_PROFILE_DATA);
    setPublishedProfile(initialProfileData || DEFAULT_PROFILE_DATA);
  }, [initialProfileData]);

  useEffect(() => {
    setFavorites(initialFavorites);
    setPublishedFavorites(initialFavorites);
  }, [initialFavorites]);

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        await verifyDashboardSession();
        if (!mounted) return;

        setIsAuthenticated(true);
        await refreshAdminState();
        await reload();
      } catch (error) {
        clearAdminToken();
        if (!mounted) return;
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, [refreshAdminState, reload]);

  const openProjectEditor = useCallback(
    (projectName: string) => {
      const project = repos.find((repo) => repo.name === projectName) || null;
      const draft = getDraftMetadata(projectName);
      const published = metadata[projectName];
      const source = draft || published;

      setEditingProject(project);
      setEditFormData({
        name: projectName,
        url: source?.url || project?.url || '',
        descriptionExpanded: source?.descriptionExpanded || project?.description || '',
        whatSolves: source?.whatSolves || '',
        technicalDifferential: source?.technicalDifferential || '',
        technologies: source?.technologies || (project?.language ? [project.language] : []),
        videoUrl: source?.videoUrl || '',
      });
      setFilePreview(null);
      setShowEditForm(true);
    },
    [getDraftMetadata, metadata, repos]
  );

  useEffect(() => {
    if (!projectToEdit || !isAuthenticated) return;
    setActiveTab('projects');
    openProjectEditor(projectToEdit);
  }, [projectToEdit, isAuthenticated, openProjectEditor]);

  const hasProfileDraftChanges = useMemo(() => {
    return (
      JSON.stringify(profileData) !== JSON.stringify(publishedProfile) ||
      JSON.stringify(favorites) !== JSON.stringify(publishedFavorites)
    );
  }, [favorites, profileData, publishedFavorites, publishedProfile]);

  const closeProjectEditor = () => {
    setShowEditForm(false);
    setEditingProject(null);
    setEditFormData({});
    setFilePreview(null);
  };

  const handleLogin = async () => {
    setAuthError('');
    try {
      await loginDashboard(password);
      setPassword('');
      setIsAuthenticated(true);
      await refreshAdminState();
      await reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao autenticar.';
      setAuthError(message);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setIsAuthenticated(false);
    onClose();
  };

  const handleSaveProfileDraft = async () => {
    setIsSavingProfileDraft(true);
    try {
      await saveDraftState({
        profile: profileData,
        favorites,
      });
      await refreshAdminState();
      await reload();
      alert('Rascunho de perfil salvo no banco.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar rascunho.';
      alert(message);
    } finally {
      setIsSavingProfileDraft(false);
    }
  };

  const handleDiscardProfileDraft = async () => {
    try {
      await discardDraftState({
        sections: ['profile', 'favorites'],
      });
      await refreshAdminState();
      await reload();
      alert('Rascunho de perfil descartado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao descartar rascunho.';
      alert(message);
    }
  };

  const handlePublishProfile = async () => {
    setIsPublishingProfile(true);
    try {
      await publishDraftState({
        sections: ['profile', 'favorites'],
        note: 'Publicacao de perfil e destaques',
      });
      await refreshAdminState();
      await reload();
      window.dispatchEvent(new Event('portfolio-project-metadata-sync'));
      alert('Perfil e destaques publicados.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao publicar perfil.';
      alert(message);
    } finally {
      setIsPublishingProfile(false);
    }
  };

  const handleDropFavorite = (targetRepoName: string) => {
    if (!draggedFavorite || draggedFavorite === targetRepoName) return;

    setFavorites((current) => {
      const sourceIndex = current.indexOf(draggedFavorite);
      const targetIndex = current.indexOf(targetRepoName);
      if (sourceIndex < 0 || targetIndex < 0) return current;

      const reordered = [...current];
      reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, draggedFavorite);
      return reordered;
    });

    setDraggedFavorite(null);
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Limite de 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      setEditFormData((current) => ({ ...current, videoUrl: data }));
      setFilePreview({ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)}MB` });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProjectDraft = async () => {
    if (!editingProject || !editFormData.name) return;

    try {
      await updateDraftMetadata(editFormData.name, {
        ...editFormData,
        url: editFormData.url || editingProject.url,
      });
      closeProjectEditor();
      alert('Rascunho do projeto salvo no banco.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar rascunho do projeto.';
      alert(message);
    }
  };

  const handlePublishProjectNow = async () => {
    if (!editingProject || !editFormData.name) return;

    try {
      await updateDraftMetadata(editFormData.name, {
        ...editFormData,
        url: editFormData.url || editingProject.url,
      });
      await publishDraftMetadata(editFormData.name);
      closeProjectEditor();
      alert('Projeto publicado com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao publicar projeto.';
      alert(message);
    }
  };

  const handlePublishAllMetadataDrafts = async () => {
    try {
      await publishDraftMetadata();
      await refreshAdminState();
      alert('Todos os rascunhos de projeto foram publicados.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao publicar rascunhos.';
      alert(message);
    }
  };

  const handleDiscardAllMetadataDrafts = async () => {
    try {
      await discardDraftMetadata();
      alert('Rascunhos de projeto descartados.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao descartar rascunhos.';
      alert(message);
    }
  };

  const handleRollback = async (snapshotId: string) => {
    try {
      const state = await rollbackSnapshot(snapshotId);

      const nextPublishedProfile = state.published.profile || DEFAULT_PROFILE_DATA;
      const nextPublishedFavorites = Array.isArray(state.published.favorites)
        ? state.published.favorites
        : [];

      setPublishedProfile(nextPublishedProfile);
      setProfileData(nextPublishedProfile);
      setPublishedFavorites(nextPublishedFavorites);
      setFavorites(nextPublishedFavorites);

      onUpdateProfile(nextPublishedProfile);
      onUpdateFavorites(nextPublishedFavorites);
      window.dispatchEvent(new Event('portfolio-project-metadata-sync'));
      alert('Rollback aplicado com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao executar rollback.';
      alert(message);
    }
  };

  if (isBootstrapping) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
          Verificando sessao do dashboard...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 text-center">Dashboard Admin</h2>
          <input
            type="password"
            placeholder="Digite a senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white mb-4"
          />
          {authError && <p className="text-xs text-red-500 mb-4">{authError}</p>}
          <div className="flex gap-3">
            <button onClick={handleLogin} className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors">Entrar</button>
            <button onClick={onClose} className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-w-5xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Admin</h2>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">Sair</button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Fechar</button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'profile' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Perfil</button>
          <button onClick={() => setActiveTab('projects')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'projects' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Projetos</button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Historico</button>
        </div>

        {activeTab === 'profile' && (
          <div>
            <div className="space-y-4 mb-8">
              <input type="text" value={profileData.name} onChange={(event) => setProfileData({ ...profileData, name: event.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" placeholder="Nome" />
              <input type="text" value={profileData.title} onChange={(event) => setProfileData({ ...profileData, title: event.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" placeholder="Titulo" />
              <textarea value={profileData.bio} onChange={(event) => setProfileData({ ...profileData, bio: event.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" placeholder="Bio" />
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Projetos em Destaque (arraste para ordenar)</h3>
                <button onClick={() => setShowRepoList(true)} className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors">+ Adicionar</button>
              </div>
              <div className="space-y-3">
                {favorites.map((repoName) => {
                  const repo = repos.find((item) => item.name === repoName);
                  return (
                    <div key={repoName} draggable onDragStart={() => setDraggedFavorite(repoName)} onDragOver={(event) => event.preventDefault()} onDrop={() => handleDropFavorite(repoName)} onDragEnd={() => setDraggedFavorite(null)} className={`flex items-center justify-between p-4 rounded-xl border ${draggedFavorite === repoName ? 'border-indigo-400 opacity-70' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-900`}>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{repo?.name || repoName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{repo?.description || 'Sem descricao'}</p>
                      </div>
                      <button onClick={() => setFavorites((current) => current.filter((item) => item !== repoName))} className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">Remover</button>
                    </div>
                  );
                })}
                {favorites.length === 0 && <p className="text-slate-500 dark:text-slate-400 text-center py-4">Nenhum projeto em destaque.</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={handleSaveProfileDraft} disabled={isSavingProfileDraft || !hasProfileDraftChanges} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Salvar Rascunho</button>
              <button onClick={handleDiscardProfileDraft} disabled={!hasProfileDraftChanges} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Descartar</button>
              <button onClick={handlePublishProfile} disabled={isPublishingProfile || !hasProfileDraftChanges} className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Publicar</button>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edicao de Projetos</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">{pendingDraftCount} pendente(s)</span>
                <button onClick={handleDiscardAllMetadataDrafts} disabled={pendingDraftCount === 0} className="px-3 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Descartar Tudo</button>
                <button onClick={handlePublishAllMetadataDrafts} disabled={pendingDraftCount === 0} className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Publicar Tudo</button>
              </div>
            </div>
            <div className="space-y-4">
              {repos.map((repo) => {
                const draft = hasDraftChanges(repo.name);
                const published = Boolean(metadata[repo.name]);
                return (
                  <div key={repo.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">{repo.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{repo.description || 'Sem descricao'}</p>
                      {draft && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Rascunho pendente</p>}
                      {!draft && published && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Publicado</p>}
                    </div>
                    <button onClick={() => openProjectEditor(repo.name)} className="ml-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm">Editar</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {history.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400">Sem snapshots historicos ainda. Publique uma alteracao para criar a primeira versao.</p>
            )}
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{entry.note || 'Atualizacao do portfolio'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(entry.createdAt).toLocaleString('pt-BR')}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">ID: {entry.id}</p>
                </div>
                <button onClick={() => handleRollback(entry.id)} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm">Rollback</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRepoList && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] overflow-y-auto">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-w-2xl w-full mx-4 my-8 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Selecionar Repositorio</h3>
              <button onClick={() => setShowRepoList(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl">✕</button>
            </div>
            <div className="space-y-3">
              {repos.filter((repo) => !favorites.includes(repo.name)).map((repo) => (
                <div key={repo.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{repo.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{repo.description || 'Sem descricao'}</p>
                  </div>
                  <button onClick={() => { setSelectedRepo(repo); setShowRepoList(false); setShowAddForm(true); }} className="ml-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">Adicionar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddForm && selectedRepo && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Adicionar aos Destaques</h3>
            <input type="text" value={selectedRepo.name} disabled className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 mb-6" />
            <div className="flex gap-3">
              <button onClick={() => { if (!favorites.includes(selectedRepo.name)) setFavorites((current) => [...current, selectedRepo.name]); setShowAddForm(false); setSelectedRepo(null); }} className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors">Adicionar</button>
              <button onClick={() => { setShowAddForm(false); setSelectedRepo(null); }} className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && editingProject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] overflow-y-auto">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-w-3xl w-full mx-4 my-8 max-h-[85vh] overflow-y-auto">
            <div className="space-y-4">
              <textarea value={editFormData.descriptionExpanded || ''} onChange={(event) => setEditFormData({ ...editFormData, descriptionExpanded: event.target.value })} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" placeholder="Descricao expandida" />
              <textarea value={editFormData.whatSolves || ''} onChange={(event) => setEditFormData({ ...editFormData, whatSolves: event.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" placeholder="O que resolve" />
              <textarea value={editFormData.technicalDifferential || ''} onChange={(event) => setEditFormData({ ...editFormData, technicalDifferential: event.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" placeholder="Diferencial tecnico" />
              <input type="text" value={(editFormData.technologies || []).join(', ')} onChange={(event) => setEditFormData({ ...editFormData, technologies: event.target.value.split(',').map((tech) => tech.trim()).filter(Boolean) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" placeholder="Tecnologias" />
              <input type="text" value={editFormData.videoUrl || ''} onChange={(event) => setEditFormData({ ...editFormData, videoUrl: event.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white" placeholder="URL de video/gif" />
              <label className="flex items-center justify-center w-full px-3 py-3 border border-indigo-300 dark:border-indigo-600 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer transition-all text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                Upload de video
                <input type="file" accept="video/*" onChange={(event) => { if (event.target.files?.[0]) handleFileSelect(event.target.files[0]); }} className="hidden" />
              </label>
              {filePreview && <p className="text-xs text-green-600 dark:text-green-400">Arquivo: {filePreview.name} ({filePreview.size})</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveProjectDraft} className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Salvar Rascunho</button>
              <button onClick={handlePublishProjectNow} className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors">Publicar Agora</button>
              <button onClick={closeProjectEditor} className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
