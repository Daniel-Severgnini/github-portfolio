const DEFAULT_PROFILE = {
  name: 'Daniel Severgnini',
  bio: 'Tenho 22 anos, estou em busca de novas oportunidades em outra area de trabalho, apaixonado por tecnologia e desenvolvimento de software. Como estudante da EBAC, estou constantemente aprendendo e aplicando conhecimentos em projetos praticos. Busco crescer profissionalmente e contribuir para solucoes inovadoras.',
  title: 'Estudante na EBAC | Desenvolvedor Fullstack em formacao',
};

const DEFAULT_FAVORITES = ['lista-de-contatos', 'Landing-Page', 'Loja_Ve-culos'];

const DEFAULT_PUBLISHED_STATE = {
  profile: DEFAULT_PROFILE,
  favorites: DEFAULT_FAVORITES,
  metadata: {},
};

module.exports = {
  DEFAULT_PROFILE,
  DEFAULT_FAVORITES,
  DEFAULT_PUBLISHED_STATE,
};
