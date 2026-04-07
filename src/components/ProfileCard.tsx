import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useGithubData } from '../hooks/useGithubData';
import { useRankingRPG } from '../hooks/useRankingRPG';

interface ProfileCardProps {
  customData?: any;
  customFavorites?: string[];
  onOpenDashboard?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ customData, customFavorites, onOpenDashboard }) => {
  const { user, repos, languagesData, loading, error, mainLanguage, percentage } = useGithubData('Daniel-Severgnini');
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [timelineVisible, setTimelineVisible] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setTimelineVisible(true), 140);
    return () => window.clearTimeout(timeout);
  }, []);

  // Chamar hooks ANTES de qualquer return (regra dos hooks)
  const rankingData = useRankingRPG(repos);

  if (error) return <div className="flex justify-center items-center h-64 text-red-500">Erro: {error}</div>;
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in-up">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-3/5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-700" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 rounded-3xl bg-slate-100 dark:bg-slate-700" />
            <div className="h-24 rounded-3xl bg-slate-100 dark:bg-slate-700" />
            <div className="h-24 rounded-3xl bg-slate-100 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <div className="flex justify-center items-center h-64 text-white">Carregando...</div>;

  // Usar dados customizados se disponíveis
  const displayName = customData?.name || user.name;
  const displayTitle = customData?.title || 'Estudante na EBAC | Desenvolvedor Fullstack em formação';
  const displayBio = customData?.bio || 'Tenho 22 anos, estou em busca de novas oportunidades em outra área de trabalho, apaixonado por tecnologia e desenvolvimento de software. Como estudante da EBAC, estou constantemente aprendendo e aplicando conhecimentos em projetos práticos. Busco crescer profissionalmente e contribuir para soluções inovadoras.';
  const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
  const totalRepos = repos.length;
  const uniqueLangs = Object.keys(languagesData).length;

  // Dados para o Pie Chart
  const pieData = Object.keys(languagesData).slice(0, 6).map(lang => ({
    name: lang,
    value: languagesData[lang]
  }));

  const totalVolume = Object.values(languagesData).reduce((sum, value) => sum + value, 0);
  const COLORS = ['#4f46e5', '#22c55e', '#facc15', '#fb7185', '#38bdf8', '#a855f7'];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl animate-fade-in-up">

      {/* Header do Card */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 relative">

        {/* Foto com Clique */}
        <div
          onMouseDown={() => {
            const timer = setTimeout(() => {
              if (onOpenDashboard) onOpenDashboard();
            }, 2000); // 2 segundos
            setPressTimer(timer);
          }}
          onMouseUp={() => {
            if (pressTimer) {
              clearTimeout(pressTimer);
              setPressTimer(null);
            }
          }}
          onMouseLeave={() => {
            if (pressTimer) {
              clearTimeout(pressTimer);
              setPressTimer(null);
            }
          }}
          className="relative group cursor-pointer"
        >
            <img
            src="https://github.com/Daniel-Severgnini.png"
            alt="Daniel Severgnini"
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-indigo-500 shadow-lg transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-full bg-indigo-500 blur-md opacity-0 group-hover:opacity-40 transition-all"></div>
        </div>

        {/* Informações */}
        <div className="flex-1 text-center md:text-left z-10">
          <div className="flex flex-col items-center md:items-start gap-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600 dark:text-indigo-400">@</span>{displayName}
            </h1>
            <p className="text-slate-500 dark:text-slate-300 text-lg flex items-center gap-2">
              <span className="text-2xl">🎓</span>
              {displayTitle}
              <span className="text-2xl">🚀</span>
            </p>
          </div>

          {/* Rank Badge */}
          <div className="mt-3 flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700/70 dark:to-slate-700/40 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm">
            <span className="text-2xl">{rankingData.rankSymbol}</span>
            <div className="flex flex-col">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                Rank: <span className="font-black text-lg ml-1" style={{ color: rankingData.rankColor }}>
                  {rankingData.rank}
                </span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Score: {rankingData.scoreTotal}/1000</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-left">
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-200 dark:hover:bg-slate-700">
              <p className="text-xs uppercase text-slate-400">Repos</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{totalRepos}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-200 dark:hover:bg-slate-700">
              <p className="text-xs uppercase text-slate-400">Linguagens</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{uniqueLangs}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-200 dark:hover:bg-slate-700">
              <p className="text-xs uppercase text-slate-400">Stars</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{totalStars}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Progresso de carreira</p>
            <div className="mt-2 h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700" style={{ width: `${Math.min(rankingData.scoreTotal / 10, 100)}%` }}></div>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Score: {rankingData.scoreTotal} / 1000</p>
          </div>
          <div className="mt-6 rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700/50 p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              🎮 Sistema de Ranking RPG Solo Leveling implementado
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Score calculado com base em repositórios, stars, forks, linguagens e qualidade.
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas do GitHub */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-2xl font-bold text-indigo-500">{repos.length}</div>
          <div className="text-xs text-slate-500 uppercase">Repositórios</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-2xl font-bold text-green-500">{Object.keys(languagesData).length}</div>
          <div className="text-xs text-slate-500 uppercase">Linguagens</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-2xl font-bold text-yellow-500">{repos.reduce((sum, repo) => sum + repo.stars, 0)}</div>
          <div className="text-xs text-slate-500 uppercase">Estrelas</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-2xl font-bold text-purple-500">{Math.floor(repos.reduce((sum, repo) => sum + repo.size, 0) / 100)}</div>
          <div className="text-xs text-slate-500 uppercase">Commits (est.)</div>
        </div>
      </div>

      {/* Seção Sobre Mim */}
      <div className="mb-6 rounded-[2.5rem] border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 shadow-[0_30px_80px_rgba(14,116,144,0.25)] text-white">
        <div className="mb-4 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200 shadow-sm shadow-cyan-500/10">
          <span className="h-2 w-2 rounded-full bg-cyan-300 block"></span>
          Sobre Mim
        </div>
        <h3 className="text-3xl font-extrabold tracking-tight text-white mb-4">Minha jornada em desenvolvimento</h3>
        <p className="text-slate-200 leading-relaxed text-lg">{displayBio}</p>
      </div>

      {/* Timeline de Carreira */}
      <div className={`mb-6 rounded-[2.5rem] border border-violet-500/20 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 p-6 shadow-[0_30px_80px_rgba(124,58,237,0.25)] text-white transition-all duration-700 ${timelineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight text-white">🧾 Timeline de Carreira</h3>
            <p className="mt-2 text-slate-300 max-w-2xl">Principais marcos de aprendizado, projetos e crescimento técnico.</p>
          </div>
          <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Em evolução</span>
        </div>

        <div className="relative">
          <div className="absolute inset-x-0 top-16 h-px bg-white/10 md:top-24"></div>
          <div className="flex flex-col gap-5 md:flex-row md:justify-between md:items-start">
            <div className="group relative md:w-[32%] rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute left-1/2 -top-6 -translate-x-1/2 md:left-[-2.5rem] md:top-6 md:translate-x-0 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-2xl shadow-cyan-500/30 flex items-center justify-center text-xl">
                ⚡
              </div>
              <div className="pt-8 md:pl-12">
                <h4 className="font-semibold text-xl text-white">2024 - Presente</h4>
                <p className="mt-2 text-slate-300">Estudante na EBAC focado em Desenvolvimento Fullstack. Criando soluções com React, TypeScript e Node.js.</p>
                <p className="mt-3 text-sm text-cyan-100/80">React · TypeScript · Node.js · Git · Testes</p>
              </div>
            </div>
            <div className="group relative md:w-[32%] rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute left-1/2 -top-6 -translate-x-1/2 md:left-[-2.5rem] md:top-6 md:translate-x-0 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-2xl shadow-emerald-500/30 flex items-center justify-center text-xl">
                🚀
              </div>
              <div className="pt-8 md:pl-12">
                <h4 className="font-semibold text-xl text-white">2023</h4>
                <p className="mt-2 text-slate-300">Primeiros projetos práticos e imersão nas principais ferramentas do mercado.</p>
                <p className="mt-3 text-sm text-emerald-100/80">HTML · CSS · JavaScript · Responsive Design</p>
              </div>
            </div>
            <div className="group relative md:w-[32%] rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl">
              <div className="absolute left-1/2 -top-6 -translate-x-1/2 md:left-[-2.5rem] md:top-6 md:translate-x-0 h-14 w-14 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-white shadow-2xl shadow-violet-500/30 flex items-center justify-center text-xl">
                💡
              </div>
              <div className="pt-8 md:pl-12">
                <h4 className="font-semibold text-xl text-white">2022</h4>
                <p className="mt-2 text-slate-300">Descoberta da tecnologia e início do desenvolvimento voltado para resultados reais.</p>
                <p className="mt-3 text-sm text-violet-100/80">Curiosidade · Aprendizado · Primeiro código</p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Seção de Linguagem Dominante e Gráfico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Stack de Tecnologias */}
        <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Stack de Tecnologias</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase mb-2">Linguagens</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(languagesData).slice(0, 4).map(lang => (
                    <span key={lang} className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-semibold">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase mb-2">Frameworks & Ferramentas</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold">React</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold">Node.js</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-semibold">Git</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-semibold">Docker</span>
                </div>
              </div>
            </div>
        </div>

        {/* Barra de Linguagem Dominante */}
        <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Linguagem Dominante</h3>
            <div className="flex items-baseline justify-between mb-2">
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{mainLanguage}</span>
                <span className="text-sm font-mono text-slate-500">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner shadow-slate-200/20 dark:shadow-slate-900/40 overflow-hidden">
            {loading || Object.keys(languagesData).length < 2 ? (
                <div className="text-center text-slate-400 text-sm">Poucos dados para gráfico</div>
            ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="w-full h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={450}
                                    stroke="none"
                                    isAnimationActive={true}
                                    animationDuration={900}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => {
                                        const percent = totalVolume > 0 ? ((Number(value) / totalVolume) * 100).toFixed(1) : '0.0';
                                        return [`${percent}%`, name];
                                    }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: '#f8fafc'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-3">
                        {pieData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 p-3 shadow-sm border border-slate-200 dark:border-slate-700">
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{((entry.value / totalVolume) * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Seção de Redes Sociais */}
      <div className="mt-8 flex justify-center">
          <a href="https://www.instagram.com/daniel_severgnini/" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 text-white px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="m16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
             <span>@daniel_severgnini</span>
          </a>
      </div>
    </div>
  );
};

export default ProfileCard;