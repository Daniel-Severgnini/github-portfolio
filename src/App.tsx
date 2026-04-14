import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import ProfileCard from './components/ProfileCard';
import ProjectsList from './components/ProjectsList';
import Dashboard from './components/Dashboard';
import { useGithubData } from './hooks/useGithubData';
import { DEFAULT_FAVORITES, ProfileData } from './types/Profile';
import { fetchPublicPortfolioState } from './services/adminApi';

const PROFILE_STORAGE_KEY = 'portfolio_profile_data';
const FAVORITES_STORAGE_KEY = 'portfolio_favorites';

const getCurrentPathname = (): string => {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
};

const getStoredProfileData = (): ProfileData | null => {
  if (typeof window === 'undefined') return null;

  const stored = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as ProfileData;
    if (!parsed?.name || !parsed?.bio || !parsed?.title) return null;
    return parsed;
  } catch (error) {
    console.error('Erro ao carregar perfil salvo:', error);
    return null;
  }
};

const getStoredFavorites = (): string[] => {
  if (typeof window === 'undefined') return DEFAULT_FAVORITES;

  const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
  if (!stored) return DEFAULT_FAVORITES;

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return DEFAULT_FAVORITES;
    return parsed.filter((item) => typeof item === 'string');
  } catch (error) {
    console.error('Erro ao carregar favoritos salvos:', error);
    return DEFAULT_FAVORITES;
  }
};

const App: React.FC = () => {
  const { repos, loading } = useGithubData('Daniel-Severgnini');
  const [pathname, setPathname] = useState<string>(() => getCurrentPathname());
  const [projectToEdit, setProjectToEdit] = useState<string | null>(null);
  const [customProfileData, setCustomProfileData] = useState<ProfileData | null>(() => getStoredProfileData());
  const [customFavorites, setCustomFavorites] = useState<string[]>(() => getStoredFavorites());

  useEffect(() => {
    let cancelled = false;

    const hydrateFromApi = async () => {
      try {
        const published = await fetchPublicPortfolioState();
        if (!published || typeof published !== 'object') return;
        if (cancelled) return;

        setCustomProfileData(published.profile || null);
        setCustomFavorites(Array.isArray(published.favorites) ? published.favorites : DEFAULT_FAVORITES);
      } catch (error) {
        console.error('Falha ao carregar estado publicado via API:', error);
      }
    };

    const handleStateSync = () => {
      hydrateFromApi();
    };

    hydrateFromApi();
    window.addEventListener('portfolio-project-metadata-sync', handleStateSync);

    return () => {
      cancelled = true;
      window.removeEventListener('portfolio-project-metadata-sync', handleStateSync);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      setPathname(getCurrentPathname());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (customProfileData) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(customProfileData));
    }
  }, [customProfileData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(customFavorites));
  }, [customFavorites]);

  useEffect(() => {
    if (pathname !== '/admin') {
      setProjectToEdit(null);
    }
  }, [pathname]);

  const navigateTo = (path: string) => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === path) return;

    window.history.pushState({}, '', path);
    setPathname(path);
  };

  const openDashboard = (projectName?: string | null) => {
    setProjectToEdit(projectName ?? null);
    navigateTo('/admin');
  };

  const closeDashboard = () => {
    navigateTo('/');
  };

  const handleUpdateProfile = (data: ProfileData) => {
    setCustomProfileData(data);
  };

  const handleUpdateFavorites = (favorites: string[]) => {
    setCustomFavorites(favorites);
  };

  const isDashboardRoute = pathname === '/admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 pb-20">
      <Header onOpenDashboard={() => openDashboard()} />

      <main className="max-w-7xl mx-auto pt-32 px-4">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 pb-2 animate-title">
            GitHub Portfolio
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg">
            Explorando a tecnologia atraves do codigo
          </p>
        </div>

        <div className="space-y-16">
          <div id="perfil" className="relative z-10 scroll-mt-32">
            <ProfileCard customData={customProfileData} customFavorites={customFavorites} onOpenDashboard={() => openDashboard()} />
          </div>

          <div id="projetos" className="scroll-mt-32">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-indigo-500 rounded-full block"></span>
              Projetos Recentes
            </h3>
            <ProjectsList repos={repos} loading={loading} customFavorites={customFavorites} onEditProject={(projectName) => openDashboard(projectName)} />
          </div>

          <div id="tecnologias" className="scroll-mt-32 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Tecnologias & Stack</h2>
            <p className="text-slate-600 dark:text-slate-300">Explore as tecnologias utilizadas nos projetos na secao acima.</p>
          </div>

          <div id="contato" className="scroll-mt-32 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-indigo-200 dark:border-indigo-700/50">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Entre em Contato</h2>
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300">Quer conversar? Encontre-me nos seguintes canais:</p>
              <div className="flex flex-wrap gap-4">
                <a href="https://github.com/Daniel-Severgnini" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors font-medium">
                  Github
                </a>
                <a href="https://www.linkedin.com/in/daniel-severgnini-435a7637a/" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  LinkedIn
                </a>
                <a href="mailto:danielsevergnini02@gmail.com" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isDashboardRoute && (
        <Dashboard
          onClose={closeDashboard}
          repos={repos}
          onUpdateProfile={handleUpdateProfile}
          onUpdateFavorites={handleUpdateFavorites}
          initialProfileData={customProfileData}
          initialFavorites={customFavorites}
          projectToEdit={projectToEdit}
        />
      )}
    </div>
  );
};

export default App;
