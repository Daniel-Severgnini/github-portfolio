import React, { useState, useMemo } from 'react';
import ProjectModal from './ProjectModal';
import { useProjectMetadata } from '../hooks/useProjectMetadata';

const ProjectsList: React.FC<{ repos: any[]; loading?: boolean; customFavorites?: string[] }> = ({ repos, loading, customFavorites }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getMetadata } = useProjectMetadata();

  // Obter todas as tags únicas de todos os projetos (filtrando tags inválidas)
  const allTags = useMemo(() => {
    if (!repos) return [];

    // Tags inválidas que podem vir de erros da API
    const invalidTags = new Set(['message', 'documentation_url', 'documentation_url', 'errors', 'resources']);

    const tagsSet = new Set<string>();
    repos.forEach(repo => {
      repo.tags?.forEach((tag: string) => {
        // Filtrar tags que parecem campos de erro e tags vazias
        if (tag && typeof tag === 'string' && !invalidTags.has(tag) && tag.trim().length > 0) {
          tagsSet.add(tag);
        }
      });
    });
    return Array.from(tagsSet).sort();
  }, [repos]);

  // Ordenar por mais recente
  const sortedRepos = useMemo(() => {
    if (!repos) return [];
    return [...repos].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [repos]);

  // Filtrar repositórios baseado na busca e tags
  const filteredRepos = useMemo(() => {
    return sortedRepos.filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Se nenhuma tag está selecionada, mostra tudo
      if (selectedTags.length === 0) return true;

      // Verificar se o projeto tem alguma das tags selecionadas
      return selectedTags.some(tag => repo.tags?.includes(tag));
    });
  }, [sortedRepos, searchTerm, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
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

  // Separar projetos em destaque baseado nos filtrados
  const featuredRepos = filteredRepos.filter(repo =>
    (customFavorites || ['lista-de-contatos', 'Landing-Page', 'Loja_Ve-culos']).includes(repo.name)
  );

  return (
    <div className="mt-12 space-y-8">
      {/* Barra de Busca e Filtros */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-3xl">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Filtrar Projetos</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filtro por Tags */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Filtrar por tecnologia:</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
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

      {/* Projetos em Destaque */}
      {featuredRepos.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <span className="text-yellow-500">⭐</span> Projetos em Destaque
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {featuredRepos.map((repo) => (
              <button
                key={repo.name}
                onClick={() => {
                  setSelectedProject(repo);
                  setIsModalOpen(true);
                }}
                className="group relative bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-slate-800 dark:via-indigo-900/20 dark:to-purple-900/20 border border-slate-200/60 dark:border-slate-700/60 p-5 sm:p-6 rounded-3xl transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-300/80 dark:hover:border-indigo-600/80 text-left cursor-pointer overflow-hidden"
              >
                {/* Elemento decorativo de fundo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-purple-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 line-clamp-1">
                      {repo.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/60 dark:to-purple-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50 shadow-sm">
                        {repo.language || 'N/A'}
                      </span>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-5 max-h-16 overflow-hidden leading-relaxed">
                    {repo.description || 'Sem descrição disponível.'}
                  </p>

                  {/* Tags dinâmicas */}
                  <div className="space-y-3 mb-5">
                    <div className="flex flex-wrap gap-2">
                      {repo.tags && repo.tags.length > 0 && repo.tags.some((t: string) => t && typeof t === 'string' && t !== 'message' && t !== 'documentation_url' && t.trim().length > 0) ? (
                        repo.tags
                          .filter((tag: string) => tag && typeof tag === 'string' && tag !== 'message' && tag !== 'documentation_url' && tag.trim().length > 0)
                          .map((tag: string) => {
                          const tagColors: { [key: string]: string } = {
                            'React': 'from-cyan-100 to-cyan-200 dark:from-cyan-900/60 dark:to-cyan-800/60 text-cyan-800 dark:text-cyan-200 border-cyan-200/50 dark:border-cyan-700/50',
                            'TypeScript': 'from-blue-100 to-blue-200 dark:from-blue-900/60 dark:to-blue-800/60 text-blue-800 dark:text-blue-200 border-blue-200/50 dark:border-blue-700/50',
                            'JavaScript': 'from-yellow-100 to-yellow-200 dark:from-yellow-900/60 dark:to-yellow-800/60 text-yellow-800 dark:text-yellow-200 border-yellow-200/50 dark:border-yellow-700/50',
                            'Node.js': 'from-green-100 to-green-200 dark:from-green-900/60 dark:to-green-800/60 text-green-800 dark:text-green-200 border-green-200/50 dark:border-green-700/50',
                            'HTML': 'from-orange-100 to-orange-200 dark:from-orange-900/60 dark:to-orange-800/60 text-orange-800 dark:text-orange-200 border-orange-200/50 dark:border-orange-700/50',
                            'CSS': 'from-indigo-100 to-indigo-200 dark:from-indigo-900/60 dark:to-indigo-800/60 text-indigo-800 dark:text-indigo-200 border-indigo-200/50 dark:border-indigo-700/50',
                            'Python': 'from-blue-100 to-blue-200 dark:from-blue-900/60 dark:to-blue-800/60 text-blue-800 dark:text-blue-200 border-blue-200/50 dark:border-blue-700/50',
                            'Java': 'from-red-100 to-red-200 dark:from-red-900/60 dark:to-red-800/60 text-red-800 dark:text-red-200 border-red-200/50 dark:border-red-700/50',
                          };

                          const colorClass = tagColors[tag] || 'from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-600/50';

                          return (
                            <span
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTag(tag);
                              }}
                              className={`inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r ${colorClass} text-xs font-semibold border cursor-pointer hover:shadow-md transition-all hover:scale-110`}
                            >
                              {tag}
                            </span>
                          );
                        })
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/50 dark:border-slate-600/50">
                          Sem tags
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-auto pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <span className="text-indigo-500">📅</span>
                        <span className="font-medium">{new Date(repo.updated_at).toLocaleDateString('pt-BR')}</span>
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">{repo.stargazers_count || repo.stars || 0}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-green-500">🍴</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">{repo.forks_count || repo.forks || 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Todos os Projetos */}
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
                {/* Elemento decorativo de fundo (mais simples) */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-400/10 to-transparent rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {repo.name}
                    </h3>
                    <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/60 dark:to-purple-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50 flex-shrink-0 font-semibold">
                      {repo.language || 'N/A'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                    {repo.description || 'Sem descrição disponível.'}
                  </p>

                  {/* Tags dinâmicas clicáveis */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {repo.tags && repo.tags.length > 0 && repo.tags.some((t: string) => t && typeof t === 'string' && t !== 'message' && t !== 'documentation_url' && t.trim().length > 0) ? (
                      repo.tags
                        .filter((tag: string) => tag && typeof tag === 'string' && tag !== 'message' && tag !== 'documentation_url' && tag.trim().length > 0)
                        .map((tag: string) => {
                        // Definir cores para cada tag
                        const tagColors: { [key: string]: string } = {
                          'React': 'from-cyan-100 to-cyan-200 dark:from-cyan-900/60 dark:to-cyan-800/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/50 dark:border-cyan-700/50',
                          'TypeScript': 'from-blue-100 to-blue-200 dark:from-blue-900/60 dark:to-blue-800/60 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50',
                          'JavaScript': 'from-yellow-100 to-yellow-200 dark:from-yellow-900/60 dark:to-yellow-800/60 text-yellow-700 dark:text-yellow-300 border-yellow-200/50 dark:border-yellow-700/50',
                          'Node.js': 'from-green-100 to-green-200 dark:from-green-900/60 dark:to-green-800/60 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-700/50',
                          'HTML': 'from-orange-100 to-orange-200 dark:from-orange-900/60 dark:to-orange-800/60 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-700/50',
                          'CSS': 'from-indigo-100 to-indigo-200 dark:from-indigo-900/60 dark:to-indigo-800/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-700/50',
                          'Python': 'from-blue-100 to-blue-200 dark:from-blue-900/60 dark:to-blue-800/60 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50',
                          'Java': 'from-red-100 to-red-200 dark:from-red-900/60 dark:to-red-800/60 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-700/50',
                        };

                        const colorClass = tagColors[tag] || 'from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-600/50';

                        return (
                          <span
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTag(tag);
                            }}
                            className={`inline-flex items-center px-2 py-1 rounded-md bg-gradient-to-r ${colorClass} text-xs font-semibold border cursor-pointer hover:shadow-md transition-all hover:scale-105`}
                          >
                            {tag}
                          </span>
                        );
                      })
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/50 dark:border-slate-600/50">
                        Sem tags
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-medium">{new Date(repo.updated_at).toLocaleDateString('pt-BR')}</span>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold">⭐ {repo.stargazers_count || 0}</span>
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">🍴 {repo.forks_count || 0}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal do Projeto */}
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