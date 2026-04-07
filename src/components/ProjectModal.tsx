import React from 'react';
import { ProjectMetadata } from '../types/Project';

interface ProjectModalProps {
  isOpen: boolean;
  project: any;
  metadata?: ProjectMetadata;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, project, metadata, onClose }) => {
  if (!isOpen || !project) return null;

  const displayTitle = project.name;
  const displayDescription = metadata?.descriptionExpanded || project.description || 'Sem descrição disponível.';
  const whatSolves = metadata?.whatSolves || 'Sin información disponible.';
  const technicalDifferential = metadata?.technicalDifferential || 'Sin información disponible.';
  const technologies =
    metadata?.technologies ||
    (project.tags && project.tags.length > 0 ? project.tags : project.language ? [project.language] : []);
  const videoUrl = metadata?.videoUrl || '';

  const isYoutubeUrl = videoUrl && videoUrl.includes('youtube.com');
  const getYoutubeEmbedUrl = (url: string) => {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  return (
    <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 z-50 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`} onClick={onClose}>
      <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{displayTitle}</h2>
            <button
              onClick={onClose}
              className="text-3xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-light"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Video/GIF Section */}
            {videoUrl && (
              <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                {isYoutubeUrl ? (
                  <iframe
                    width="100%"
                    height="400"
                    src={getYoutubeEmbedUrl(videoUrl)}
                    title={displayTitle}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full"
                  />
                ) : (
                  <video
                    width="100%"
                    height="400"
                    controls
                    className="w-full"
                  >
                    <source src={videoUrl} type="video/mp4" />
                    Seu navegador não suporta o elemento de vídeo.
                  </video>
                )}
              </div>
            )}

            {/* Descrição Principal */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Descrição</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">{displayDescription}</p>
            </div>

            {/* Tecnologias Usadas */}
            {technologies.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Tecnologias Usadas</h3>
                <div className="flex flex-wrap gap-3">
                  {technologies.map((tech: string) => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-semibold"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links e Informações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-2xl">🔗</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Repositório GitHub</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ver código-fonte</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{project.stars} Estrelas</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No GitHub</p>
                </div>
              </div>
            </div>

            {/* Principais Destaques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-700">
                <h4 className="text-lg font-bold text-green-900 dark:text-green-200 mb-3">🎯 O que Resolve?</h4>
                <p className="text-green-800 dark:text-green-300 leading-relaxed">{whatSolves}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-700">
                <h4 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-3">⚡ Diferencial Técnico</h4>
                <p className="text-purple-800 dark:text-purple-300 leading-relaxed">{technicalDifferential}</p>
              </div>
            </div>

            {/* Extra Info */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{project.language || 'N/A'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Linguagem</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{project.forks || 0}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Forks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{new Date(project.updated_at).toLocaleDateString('pt-BR')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Atualizado</p>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
