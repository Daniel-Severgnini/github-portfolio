/**
 * Hook para calcular ranking estilo RPG (Solo Leveling) baseado em dados do GitHub
 * Sistema balanceado com distribuição precisa de pontos 0-1000
 */

interface RankingBreakdown {
  producao: number;
  reconhecimento: number;
  colaboracao: number;
  linguagens: number;
  qualidade: number;
  consistencia: number;
}

interface RankingResult {
  scoreTotal: number;
  rank: string;
  breakdown: RankingBreakdown;
  rankColor: string;
  rankSymbol: string;
}

// Distribuição de pontos máximo por categoria (total = 1000)
// Para referência - cada categoria tem limite máximo:
// producao: 200, reconhecimento: 250, colaboracao: 150,
// linguagens: 150, qualidade: 150, consistencia: 100

const RANK_CONFIG = [
  { min: 0, max: 100, rank: 'E', symbol: '💀', color: '#7f8c8d' },
  { min: 100, max: 200, rank: 'D', symbol: '📍', color: '#e74c3c' },
  { min: 200, max: 300, rank: 'C', symbol: '⚡', color: '#e67e22' },
  { min: 300, max: 450, rank: 'B', symbol: '🔥', color: '#f39c12' },
  { min: 450, max: 600, rank: 'A', symbol: '✨', color: '#27ae60' },
  { min: 600, max: 750, rank: 'S', symbol: '👑', color: '#2980b9' },
  { min: 750, max: 850, rank: 'S+', symbol: '⚔️', color: '#8e44ad' },
  { min: 850, max: 950, rank: 'SS', symbol: '🌟', color: '#c0392b' },
  { min: 950, max: 1000, rank: 'SSS', symbol: '⭐', color: '#f1c40f' },
];

/**
 * Calcula pontos de produção (Repositórios + Atividade)
 * Máximo 200 pontos
 */
function calculaProdcao(repos: any[]): number {
  if (!repos.length) return 0;

  // Quantos repos tem (0-100 repos = 0-100 pontos)
  const reposScore = Math.min((repos.length / 50) * 100, 100);

  // Atividade recente (quantos atualizados nos últimos 30 dias)
  const reposAtivos = repos.filter(repo => {
    const dias = Math.floor(
      (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return dias < 30;
  }).length;

  const atividadeScore = Math.min((reposAtivos / repos.length) * 100, 100);

  return Math.floor((reposScore + atividadeScore) / 2);
}

/**
 * Calcula pontos de reconhecimento (Stars + Forks)
 * Máximo 250 pontos
 */
function calculaReconhecimento(repos: any[]): number {
  if (!repos.length) return 0;

  // Stars
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const starsScore = Math.min(totalStars * 2, 150); // máximo 150

  // Forks
  const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
  const forksScore = Math.min(totalForks * 3, 100); // máximo 100

  return Math.floor(starsScore + forksScore);
}

/**
 * Calcula pontos de colaboração (Issues abertas - aproximação)
 * Máximo 150 pontos
 */
function calculaColaboracao(repos: any[]): number {
  if (!repos.length) return 0;

  // Estimativa de issues abertas
  const totalIssues = repos.reduce((sum, repo) => sum + Math.max(0, repo.open_issues_count || 0), 0);

  // Normalizar: até 100 issues = 150 pontos
  return Math.min((totalIssues / 100) * 150, 150);
}

/**
 * Calcula pontos de linguagens
 * Máximo 150 pontos
 */
function calculaLinguagens(repos: any[]): number {
  if (!repos.length) return 0;

  // Quantas linguagens únicas tem
  const linguagensUnicas = new Set(repos.map(r => r.language).filter(Boolean));
  const numLinguagens = linguagensUnicas.size;

  // Até 10 linguagens = 150 pontos
  return Math.min((numLinguagens / 10) * 150, 150);
}

/**
 * Calcula pontos de qualidade (Descrição + Stars)
 * Máximo 150 pontos
 */
function calculaQualidade(repos: any[]): number {
  if (!repos.length) return 0;

  // Repos com boa descrição
  const comDescricao = repos.filter(
    repo => repo.description && repo.description.length > 20
  ).length;
  const descricaoScore = (comDescricao / repos.length) * 80;

  // Repos com pelo menos 1 star
  const comStars = repos.filter(repo => (repo.stargazers_count || 0) > 0).length;
  const starsQualityScore = (comStars / repos.length) * 70;

  return Math.floor(descricaoScore + starsQualityScore);
}

/**
 * Calcula pontos de consistência (Atualizações regulares)
 * Máximo 100 pontos
 */
function calculaConsistencia(repos: any[]): number {
  if (!repos.length) return 0;

  // Repos atualizados nos últimos 7 dias
  const atualizadosRecentes = repos.filter(repo => {
    const dias = Math.floor(
      (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return dias < 7;
  }).length;

  // Repos atualizados nos últimos 30 dias
  const atualizados30 = repos.filter(repo => {
    const dias = Math.floor(
      (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return dias < 30;
  }).length;

  const consistenciaScore = (atualizadosRecentes / repos.length) * 60 +
                            (atualizados30 / repos.length) * 40;

  return Math.floor(consistenciaScore);
}

/**
 * Obtém rank baseado no score
 */
function obtemRank(score: number): {
  rank: string;
  symbol: string;
  color: string;
} {
  for (const config of RANK_CONFIG) {
    if (score >= config.min && score <= config.max) {
      return {
        rank: config.rank,
        symbol: config.symbol,
        color: config.color,
      };
    }
  }
  return {
    rank: 'SSS',
    symbol: '⭐',
    color: '#f1c40f',
  };
}

/**
 * Função principal que calcula o ranking completo BALANCEADO
 */
export function calculaRankingRPG(repos: any[]): RankingResult {
  if (!repos || repos.length === 0) {
    return {
      scoreTotal: 0,
      rank: 'E',
      rankColor: '#7f8c8d',
      rankSymbol: '💀',
      breakdown: {
        producao: 0,
        reconhecimento: 0,
        colaboracao: 0,
        linguagens: 0,
        qualidade: 0,
        consistencia: 0,
      },
    };
  }

  // Calcular cada categoria dentro do máximo
  const producao = calculaProdcao(repos);
  const reconhecimento = calculaReconhecimento(repos);
  const colaboracao = calculaColaboracao(repos);
  const linguagens = calculaLinguagens(repos);
  const qualidade = calculaQualidade(repos);
  const consistencia = calculaConsistencia(repos);

  // Score total balanceado (máximo 1000)
  const scoreTotal = Math.floor(
    producao +
    reconhecimento +
    colaboracao +
    linguagens +
    qualidade +
    consistencia
  );

  // Garantir que não ultrapassa 1000
  const finalScore = Math.min(scoreTotal, 1000);

  // Obter rank
  const rankInfo = obtemRank(finalScore);

  return {
    scoreTotal: finalScore,
    rank: rankInfo.rank,
    rankColor: rankInfo.color,
    rankSymbol: rankInfo.symbol,
    breakdown: {
      producao,
      reconhecimento,
      colaboracao,
      linguagens,
      qualidade,
      consistencia,
    },
  };
}

/**
 * Hook customizado para usar o ranking RPG
 */
export function useRankingRPG(repos: any[]): RankingResult {
  return calculaRankingRPG(repos);
}

export default calculaRankingRPG;
