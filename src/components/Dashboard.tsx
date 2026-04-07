import React, { useState, useEffect } from 'react';
import { useProjectMetadata } from '../hooks/useProjectMetadata';
import { ProjectMetadata } from '../types/Project';

interface DashboardProps {
  onClose: () => void;
  repos: any[];
  onUpdateProfile: (data: any) => void;
  onUpdateFavorites: (favorites: string[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onClose, repos, onUpdateProfile, onUpdateFavorites }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'projects'>('profile');
  const [profileData, setProfileData] = useState({
    name: 'Daniel Severgnini',
    bio: 'Tenho 22 anos, estou em busca de novas oportunidades em outra área de trabalho, apaixonado por tecnologia e desenvolvimento de software. Como estudante da EBAC, estou constantemente aprendendo e aplicando conhecimentos em projetos práticos. Busco crescer profissionalmente e contribuir para soluções inovadoras.',
    title: 'Estudante na EBAC | Desenvolvedor Fullstack em formação'
  });
  const [favorites, setFavorites] = useState<string[]>(['lista-de-contatos', 'Landing-Page', 'Loja_Ve-culos']);
  const [showRepoList, setShowRepoList] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<ProjectMetadata>>({});
  const [filePreview, setFilePreview] = useState<{name: string; size: string} | null>(null);

  const { metadata, updateMetadata } = useProjectMetadata();

  const handleFileSelect = (file: File) => {
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Arquivo muito grande! Máximo 50MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setEditFormData({...editFormData, videoUrl: result});
      setFilePreview({name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)}MB`});
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const auth = localStorage.getItem('portfolio_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('portfolio_auth', 'true');
    } else {
      alert('Senha incorreta');
    }
  };

  const handleSave = () => {
    onUpdateProfile(profileData);
    onUpdateFavorites(favorites);
    alert('Dados salvos com sucesso!');
  };

  const handleAddToFavorites = (repo: any) => {
    setSelectedRepo(repo);
    setShowRepoList(false);
    setShowAddForm(true);
  };

  const handleConfirmAdd = () => {
    if (selectedRepo && !favorites.includes(selectedRepo.name)) {
      setFavorites([...favorites, selectedRepo.name]);
    }
    setShowAddForm(false);
    setSelectedRepo(null);
  };

  const handleRemoveFromFavorites = (repoName: string) => {
    setFavorites(favorites.filter(f => f !== repoName));
  };

  const handleStartEditProject = (projectName: string) => {
    const project = repos.find(r => r.name === projectName);
    const existingMetadata = metadata[projectName];

    setEditingProject(project);
    setEditFormData({
      name: projectName,
      url: project?.url || '',
      descriptionExpanded: existingMetadata?.descriptionExpanded || project?.description || '',
      whatSolves: existingMetadata?.whatSolves || '',
      technicalDifferential: existingMetadata?.technicalDifferential || '',
      technologies: existingMetadata?.technologies || (project?.language ? [project.language] : []),
      videoUrl: existingMetadata?.videoUrl || '',
    });
    setShowEditForm(true);
  };

  const handleSaveProjectEdit = () => {
    if (editingProject && editFormData.name) {
      updateMetadata(editFormData.name, editFormData);
      setEditingProject(null);
      setShowEditForm(false);
      alert('Projeto atualizado com sucesso!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Dashboard Admin</h2>
          <input
            type="password"
            placeholder="Digite a senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={handleLogin}
              className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
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
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            👤 Perfil
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'projects'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            📁 Projetos
          </button>
        </div>

        {/* ABA PERFIL */}
        {activeTab === 'profile' && (
          <div>
            {/* Editar Perfil */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Editar Perfil</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Título</label>
                  <input
                    type="text"
                    value={profileData.title}
                    onChange={(e) => setProfileData({...profileData, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Gerenciar Projetos em Destaque */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Projetos em Destaque</h3>
                <button
                  onClick={() => setShowRepoList(true)}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors flex items-center gap-2"
                >
                  <span>+</span> Adicionar Projeto
                </button>
              </div>
              <div className="space-y-3">
                {favorites.map((repoName) => {
                  const repo = repos.find(r => r.name === repoName);
                  return (
                    <div key={repoName} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{repo?.name || repoName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{repo?.description || 'Sem descrição'}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromFavorites(repoName)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  );
                })}
                {favorites.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-4">Nenhum projeto em destaque</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        )}

        {/* ABA PROJETOS */}
        {activeTab === 'projects' && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Editar Detalhes dos Projetos</h3>
            <div className="space-y-4">
              {repos.map((repo) => (
                <div key={repo.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{repo.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{repo.description || 'Sem descrição'}</p>
                    {metadata[repo.name] && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">✓ Customizado</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleStartEditProject(repo.name)}
                    className="ml-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal - Lista de Repositórios */}
      {showRepoList && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] overflow-y-auto">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-w-2xl w-full mx-4 my-8 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Selecionar Repositório</h3>
              <button
                onClick={() => setShowRepoList(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {repos.filter(repo => !favorites.includes(repo.name)).map((repo) => (
                <div key={repo.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{repo.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{repo.description || 'Sem descrição'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">{repo.language || 'N/A'}</span>
                      <span className="text-xs text-slate-500">⭐ {repo.stars}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToFavorites(repo)}
                    className="ml-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal - Formulário de Adição */}
      {showAddForm && selectedRepo && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Adicionar aos Destaques</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedRepo(null);
                }}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome do Repositório</label>
                <input
                  type="text"
                  value={selectedRepo.name}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleConfirmAdd}
                className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                Adicionar aos Destaques
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedRepo(null);
                }}
                className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Editar Projeto */}
      {showEditForm && editingProject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] overflow-y-auto">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-w-3xl w-full mx-4 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Editar Projeto: {editingProject.name}</h3>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingProject(null);
                }}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Descrição Expandida */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descrição Expandida</label>
                <textarea
                  value={editFormData.descriptionExpanded || ''}
                  onChange={(e) => setEditFormData({...editFormData, descriptionExpanded: e.target.value})}
                  placeholder="Descrição detalhada do projeto..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* O que Resolve */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">O que Resolve?</label>
                <textarea
                  value={editFormData.whatSolves || ''}
                  onChange={(e) => setEditFormData({...editFormData, whatSolves: e.target.value})}
                  placeholder="Qual problema este projeto resolve..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Diferencial Técnico */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Diferencial Técnico</label>
                <textarea
                  value={editFormData.technicalDifferential || ''}
                  onChange={(e) => setEditFormData({...editFormData, technicalDifferential: e.target.value})}
                  placeholder="Qual é o diferencial técnico deste projeto..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Tecnologias */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tecnologias Usadas (separadas por vírgula)</label>
                <input
                  type="text"
                  value={(editFormData.technologies || []).join(', ')}
                  onChange={(e) => setEditFormData({...editFormData, technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                  placeholder="React, TypeScript, Node.js..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Vídeo/GIF - Seção Modernizada */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-700/50">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <span className="text-lg">🎬</span> Adicionar Vídeo/GIF do Projeto
                </label>
                
                {/* Área Principal: Upload ou URL */}
                {!filePreview && !editFormData.videoUrl && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Botão de Upload de Arquivo */}
                    <label htmlFor="video-file" className="flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-2xl bg-white dark:bg-slate-900/50 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer transition-all group shadow-sm hover:shadow-md">
                      <div className="text-center">
                        <span className="text-3xl mb-2 block group-hover:scale-125 transition-transform">📁</span>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Escolher arquivo</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">MP4, MOV, WebM</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Até 50MB</p>
                      </div>
                      <input
                        id="video-file"
                        type="file"
                        accept="video/*"
                        onChange={(e) => {if(e.target.files?.[0]) handleFileSelect(e.target.files[0]);}}
                        className="hidden"
                      />
                    </label>

                    {/* Separador */}
                    <div className="flex items-center justify-center">
                      <div className="w-full h-0.5 bg-slate-300 dark:bg-slate-600"></div>
                      <span className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400">OU</span>
                      <div className="w-full h-0.5 bg-slate-300 dark:bg-slate-600"></div>
                    </div>

                    {/* URL de YouTube */}
                    <div className="flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-2xl bg-white dark:bg-slate-900/50 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-pointer transition-all group shadow-sm hover:shadow-md">
                      <div className="text-center w-full">
                        <span className="text-3xl mb-2 block group-hover:scale-125 transition-transform">🌐</span>
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Usar URL</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">YouTube ou link direto</p>
                        <input
                          type="text"
                          value={editFormData.videoUrl || ''}
                          onChange={(e) => setEditFormData({...editFormData, videoUrl: e.target.value})}
                          placeholder="cola a URL aqui..."
                          className="w-full mt-2 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Estado: Arquivo Selecionado */}
                {filePreview && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">✅</span>
                          <div>
                            <p className="font-semibold text-green-700 dark:text-green-400">Arquivo pronto</p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">📄 {filePreview.name} ({filePreview.size})</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <label htmlFor="video-file-change" className="flex items-center justify-center w-full px-3 py-3 border border-indigo-300 dark:border-indigo-600 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer transition-all text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                      🔄 Alterar arquivo
                      <input
                        id="video-file-change"
                        type="file"
                        accept="video/*"
                        onChange={(e) => {if(e.target.files?.[0]) handleFileSelect(e.target.files[0]);}}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Estado: URL Digitada */}
                {editFormData.videoUrl && !filePreview && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">✓ URL adicionada</p>
                      <p className="text-xs text-blue-600 dark:text-blue-500 mt-1 truncate">🔗 {editFormData.videoUrl}</p>
                    </div>
                    <button
                      onClick={() => setEditFormData({...editFormData, videoUrl: ''})}
                      className="w-full px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                    >
                      ✕ Remover URL
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSaveProjectEdit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                ✓ Salvar Edições
              </button>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingProject(null);
                  setFilePreview(null);
                }}
                className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
