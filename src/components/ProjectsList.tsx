import React, { useMemo, useState } from 'react';
import ProjectModal from './ProjectModal';
import { useProjectMetadata } from '../hooks/useProjectMetadata';
import { Project } from '../hooks/useGithubData';

interface ProjectsListProps {
  repos: Project[];
  loading?: boolean;
  customFavorites?: string[];
  onEditProject?: (projectName: string) => void;
}

const DEFAULT_FAVORITES = ['lista-de-contatos', 'Landing-Page', 'Loja_Ve-culos'];

const ProjectsList: React.FC<ProjectsListProps> = ({ repos, loading, customFavorites, onEditProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { getMetadata } = useProjectMetadata();

  const allTags = useMemo(() => {
    const invalidTags = new Set(['message', 'documentation_url', 'errors', 'resources']);
    const tags = new Set<string>();

    repos.forEach((repo) => {
      repo.tags?.forEach((tag) => {
        if (tag && !invalidTags.has(tag) && tag.trim().length > 0) {
          tags.add(tag);
        }
      });
    });

    return Array.from(tags).sort();
  }, [repos]);

  const sortedRepos = useMemo(() => {
    return [...repos].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [repos]);

  const filteredRepos = useMemo(() => {
    return sortedRepos.filter((repo) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        repo.name.toLowerCase().includes(query) ||
        (repo.description && repo.description.toLowerCase().includes(query));

      if (!matchesSearch) return false;
      if (selectedTags.length === 0) return true;

      return selectedTags.some((tag) => repo.tags?.includes(tag));
    });
  }, [searchTerm, selectedTags, sortedRepos]);

  const featuredRepos = useMemo(() => {
    const favoritesOrder = customFavorites && customFavorites.length > 0 ? customFavorites : DEFAULT_FAVORITES;
    const byName = new Map(filteredRepos.map((repo) => [repo.name, repo]));

    return favoritesOrder
      .map((repoName) => byName.get(repoName))
      .filter((repo): repo is Project => Boolean(repo));
  }, [customFavorites, filteredRepos]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 h-56" />
        ))}
      </div>
    );
  }

  if (!repos || repos.length === 0) {
    return <p className="text-center text-slate-500 dark:text-slate-400 mt-6">Nenhum projeto encontrado.</p>;
  }

  return (
    <div className="mt-12 space-y-8">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-3xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Filtrar Projetos</h2>
          {onEditProject && filteredRepos[0] && (
            <button
              onClick={() => onEditProject(filteredRepos[0].name)}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Abrir Dashboard
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Buscar projetos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Filtrar por tecnologia:</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 border ${
                  selectedTags.includes(tag)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {filteredRepos.length} projeto{filteredRepos.length !== 1 ? 's' : ''} encontrado{filteredRepos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {featuredRepos.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <span className="text-yellow-500">★</span> Projetos em Destaque
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {featuredRepos.map((repo) => (
              <button
                key={repo.name}
                onClick={() => {
                  setSelectedProject(repo);
                  setIsModalOpen(true);
                }}
                className="group relative bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-slate-800 dark:via-indigo-900/20 dark:to-purple-900/20 border border-slate-200/60 dark:border-slate-700/60 p-5 sm:p-6 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-300/80 dark:hover:border-indigo-600/80 text-left cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white line-clamp-1">{repo.name}</h3>
                  <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/60 dark:to-purple-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50">
                    {repo.language || 'N/A'}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-sm mb-5 max-h-16 overflow-hidden leading-relaxed">
                  {repo.description || 'Sem descricao disponivel.'}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-auto pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="font-medium">{new Date(repo.updated_at).toLocaleDateString('pt-BR')}</span>
                  <div className="flex gap-4">
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">★ {repo.stargazers_count || repo.stars || 0}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">Forks {repo.forks_count || 0}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-indigo-500 rounded-full block"></span>
          Todos os Projetos ({filteredRepos.length})
        </h2>

        {filteredRepos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 text-lg">Nenhum projeto encontrado com esses filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRepos.map((repo) => (
              <button
                key={repo.name}
                onClick={() => {
                  setSelectedProject(repo);
                  setIsModalOpen(true);
                }}
                className="group relative bg-gradient-to-br from-slate-50 via-slate-100/50 to-indigo-50/30 dark:from-slate-800 dark:via-slate-800/80 dark:to-indigo-900/10 border border-slate-200 dark:border-slate-700 p-5 sm:p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/15 hover:border-indigo-300 dark:hover:border-indigo-600 text-left cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-start gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-2">{repo.name}</h3>
                  <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/60 dark:to-purple-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50 flex-shrink-0 font-semibold">
                    {repo.language || 'N/A'}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                  {repo.description || 'Sem descricao disponivel.'}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-medium">{new Date(repo.updated_at).toLocaleDateString('pt-BR')}</span>
                  <div className="flex gap-3">
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">★ {repo.stargazers_count || 0}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">Forks {repo.forks_count || 0}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProject && (
        <ProjectModal
          isOpen={isModalOpen}
          project={selectedProject}
          metadata={getMetadata(selectedProject.name)}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectsList;
