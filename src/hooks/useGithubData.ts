import { useState, useEffect } from 'react';

// Interface para padronizar o objeto linguagem retornado pela API
interface LanguageCount {
  [key: string]: number;
}

export interface Project {
  name: string;
  description: string;
  language: string; // Pode ser null se o repo não tiver linguagem definida
  tags: string[]; // Tags das 3 principais linguagens
  stars: number;
  size: number; // tamanho do repo como proxy de atividade
  url: string;
  updated_at: string;
  stargazers_count?: number;
  forks_count?: number;
}

export const useGithubData = (username: string) => {
  const [user, setUser] = useState<any>(null);
  const [repos, setRepos] = useState<Project[]>([]);
  const [languagesData, setLanguagesData] = useState<LanguageCount>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper para adicionar header de autenticação
  const getHeaders = (): Record<string, string> => {
    const token = process.env.REACT_APP_GITHUB_TOKEN?.trim();
    if (!token) return {};

    const scheme = token.startsWith('github_pat_') ? 'Bearer' : 'token';
    return { Authorization: `${scheme} ${token}` };
  };

  const normalizeLanguage = (lang: any): string | null => {
    if (!lang || typeof lang !== 'string') return null;
    const cleaned = lang.trim();
    if (cleaned.length === 0) return null;
    if (/^unknown$/i.test(cleaned)) return 'Sem linguagem';
    return cleaned;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscamos apenas os repositórios públicos
        const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
          headers: getHeaders(),
        });
        const data = await response.json();

        // Verificar se é um erro (resposta com 'message')
        if (data && typeof data === 'object' && 'message' in data) {
          setError(`Erro ao acessar API: ${data.message || 'Usuário não encontrado.'}`);
          return;
        }

        if (!Array.isArray(data)) {
          setError("Usuário não encontrado ou nenhum repositório disponível.");
          return;
        }

        // Se o array está vazio, é válido (usuário existe mas não tem repos)
        if (data.length === 0) {
          setUser({ name: username });
          setRepos([]);
          setLanguagesData({});
          setLoading(false);
          return;
        }

        // 1. Calcular Total de Linguagens (Contagem de repositórios por linguagem)
        const langCounts: LanguageCount = {};

        data.forEach(repo => {
          if (repo.language) {
            langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
          }
        });

        setLanguagesData(langCounts);

        // 2. Buscar as linguagens detalhadas para cada repositório (com limite)
        const reposWithLanguages = await Promise.all(
          data.slice(0, 50).map(async (repo) => {
            try {
              const langResponse = await fetch(
                `https://api.github.com/repos/${username}/${repo.name}/languages`,
                {
                  headers: getHeaders(),
                }
              );

              // Verificar se a requisição foi bem-sucedida
              if (!langResponse.ok) {
                throw new Error(`HTTP ${langResponse.status}`);
              }

              const languages = await langResponse.json();

              // Verificar se é uma resposta de erro (contém 'message' da API)
              if (!languages || typeof languages !== 'object' || 'message' in languages) {
                throw new Error('API returned error');
              }

              // Validar que temos linguagens válidas (valores numéricos)
              const entries = Object.entries(languages).filter(
                (entry: any) => typeof entry[1] === 'number' && typeof entry[0] === 'string'
              );

              // Pegar as 3 principais linguagens (por bytes)
              const sortedLanguages = entries
                .sort((a: any, b: any) => b[1] - a[1])
                .map((entry: any) => normalizeLanguage(entry[0]))
                .filter((lang: string | null): lang is string => Boolean(lang))
                .slice(0, 3);

              const primaryLanguage = normalizeLanguage(repo.language) || 'Sem linguagem';

              return {
                name: repo.name,
                description: repo.description || 'Sem descrição.',
                language: primaryLanguage,
                tags: sortedLanguages.length > 0 ? sortedLanguages : [primaryLanguage],
                stars: repo.stargazers_count || 0,
                size: repo.size || 0,
                url: repo.html_url,
                updated_at: repo.updated_at || 'N/A',
                stargazers_count: repo.stargazers_count || 0,
                forks_count: repo.forks_count || 0,
              };
            } catch (err) {
              // Se falhar, usar apenas a linguagem principal
              const primaryLanguage = normalizeLanguage(repo.language) || 'Sem linguagem';
              return {
                name: repo.name,
                description: repo.description || 'Sem descrição.',
                language: primaryLanguage,
                tags: [primaryLanguage],
                stars: repo.stargazers_count || 0,
                size: repo.size || 0,
                url: repo.html_url,
                updated_at: repo.updated_at || 'N/A',
                stargazers_count: repo.stargazers_count || 0,
                forks_count: repo.forks_count || 0,
              };
            }
          })
        );

        // Filtrar repositórios muito vazios
        const filteredRepos = reposWithLanguages.filter(
          repo => repo.stars > 0 || repo.description.length > 0
        );

        setRepos(filteredRepos);
        setUser({ name: username }); // Simulando o nome do usuário para exibição
        setLoading(false);

      } catch (err) {
        console.error(err);
        setError("Erro ao carregar dados do GitHub.");
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  // Lógica de RANK
  // Fator 1: Quantidade de Projetos (Máx 50 pts)
  // Fator 2: Quantidade de Linguagens Únicas (Máx 50 pts)
  const calculateRank = () => {
    const totalProjects = repos.length;
    const totalSize = repos.reduce((sum, repo) => sum + repo.size, 0);
    const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
    const uniqueLanguages = Object.keys(languagesData).length;

    const projectScore = Math.min(totalProjects * 1.2, 15);
    const activityScore = Math.min(Math.floor(totalSize / 500), 10); // proxy para commits/atividade
    const langScore = Math.min(uniqueLanguages * 1.5, 15);
    const popularityScore = Math.min(Math.floor(totalStars / 15), 10);

    const totalScore = projectScore + activityScore + langScore + popularityScore;

    if (totalScore >= 46) return { rank: 'SSS', color: '#10b981', text: 'Deus do Código', score: totalScore };
    if (totalScore >= 41) return { rank: 'SS', color: '#3b82f6', text: 'Mestre', score: totalScore };
    if (totalScore >= 31) return { rank: 'S', color: '#a855f7', text: 'Aprendiz Sênior', score: totalScore };
    if (totalScore >= 21) return { rank: 'A', color: '#f97316', text: 'Desenvolvedor', score: totalScore };
    if (totalScore >= 11) return { rank: 'B', color: '#64748b', text: 'Iniciante', score: totalScore };
    return { rank: 'C', color: '#ef4444', text: 'Novato', score: totalScore };
  };

  // Encontrar a linguagem dominante
  const mainLanguage = Object.keys(languagesData).length > 0
    ? Object.entries(languagesData).sort((a, b) => b[1] - a[1])[0][0]
    : "N/A";

  const totalVolume = Object.values(languagesData).reduce((a, b) => a + b, 0);
  const mainLangVolume = languagesData[mainLanguage] || 0;
  const percentage = totalVolume > 0 ? (mainLangVolume / totalVolume) * 100 : 0;

  return { user, repos, languagesData, loading, error, calculateRank, mainLanguage, percentage, totalVolume };
};
