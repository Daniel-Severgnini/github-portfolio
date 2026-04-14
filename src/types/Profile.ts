export interface ProfileData {
  name: string;
  bio: string;
  title: string;
}

export const DEFAULT_PROFILE_DATA: ProfileData = {
  name: 'Daniel Severgnini',
  bio: 'Tenho 22 anos, estou em busca de novas oportunidades em outra área de trabalho, apaixonado por tecnologia e desenvolvimento de software. Como estudante da EBAC, estou constantemente aprendendo e aplicando conhecimentos em projetos práticos. Busco crescer profissionalmente e contribuir para soluções inovadoras.',
  title: 'Estudante na EBAC | Desenvolvedor Fullstack em formação',
};

export const DEFAULT_FAVORITES: string[] = ['lista-de-contatos', 'Landing-Page', 'Loja_Ve-culos'];
