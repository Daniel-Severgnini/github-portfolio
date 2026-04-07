import React, { useState } from 'react';
import Header from './components/Header';
import ProfileCard from './components/ProfileCard';
import ProjectsList from './components/ProjectsList';
import Dashboard from './components/Dashboard';
import { useGithubData } from './hooks/useGithubData';

const App: React.FC = () => {
  const { repos, loading } = useGithubData('Daniel-Severgnini');
  const [showDashboard, setShowDashboard] = useState(false);
  const [customProfileData, setCustomProfileData] = useState<any>(null);
  const [customFavorites, setCustomFavorites] = useState<string[]>(['lista-de-contatos', 'Landing-Page', 'Loja_Ve-culos']);

  const handleUpdateProfile = (data: any) => {
    setCustomProfileData(data);
  };

  const handleUpdateFavorites = (favorites: string[]) => {
    setCustomFavorites(favorites);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto pt-32 px-4">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 pb-2 animate-title">
            GitHub Portfolio
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg">
            Explorando a tecnologia através do código
          </p>
        </div>

        <div className="space-y-16">
          {/* Seção: Sobre / Perfil */}
          <div id="perfil" className="relative z-10 scroll-mt-32">
            <ProfileCard customData={customProfileData} customFavorites={customFavorites} onOpenDashboard={() => setShowDashboard(true)} />
          </div>

          {/* Seção: Projetos */}
          <div id="projetos" className="scroll-mt-32">
             <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
               <span className="w-2 h-8 bg-indigo-500 rounded-full block"></span>
               Projetos Recentes
             </h3>
             <ProjectsList repos={repos} loading={loading} customFavorites={customFavorites} />
          </div>

          {/* Seção: Tecnologias */}
          <div id="tecnologias" className="scroll-mt-32 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Tecnologias & Stack</h2>
            <p className="text-slate-600 dark:text-slate-300">Explore as tecnologias utilizadas nos projetos na seção acima.</p>
          </div>

          {/* Seção: Contato */}
          <div id="contato" className="scroll-mt-32 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-indigo-200 dark:border-indigo-700/50">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Entre em Contato</h2>
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300">
                Quer conversar? Encontre-me nos seguintes canais:
              </p>
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

      {showDashboard && (
        <Dashboard
          onClose={() => setShowDashboard(false)}
          repos={repos}
          onUpdateProfile={handleUpdateProfile}
          onUpdateFavorites={handleUpdateFavorites}
        />
      )}
    </div>
  );
};

export default App;