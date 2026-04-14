import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./hooks/useGithubData', () => ({
  useGithubData: () => ({
    user: { name: 'Daniel Severgnini' },
    repos: [],
    languagesData: {},
    loading: false,
    error: null,
    calculateRank: () => ({ rank: 'C', color: '#ef4444', text: 'Novato', score: 0 }),
    mainLanguage: 'N/A',
    percentage: 0,
    totalVolume: 0,
  }),
}));

jest.mock('./hooks/useProjectMetadata', () => ({
  useProjectMetadata: () => ({
    metadata: {},
    draftMetadata: {},
    history: [],
    loading: false,
    pendingDraftCount: 0,
    updateMetadata: jest.fn(),
    removeMetadata: jest.fn(),
    updateDraftMetadata: jest.fn(),
    discardDraftMetadata: jest.fn(),
    publishDraftMetadata: jest.fn(),
    rollbackSnapshot: jest.fn(),
    hasDraftChanges: () => false,
    getMetadata: () => undefined,
    getDraftMetadata: () => undefined,
    reload: jest.fn(),
  }),
}));

jest.mock('./services/adminApi', () => ({
  fetchPublicPortfolioState: jest.fn(async () => ({
    profile: {
      name: 'Daniel Severgnini',
      bio: 'Bio de teste',
      title: 'Titulo de teste',
    },
    favorites: ['lista-de-contatos', 'Landing-Page', 'Loja_Ve-culos'],
    metadata: {},
  })),
  getAdminToken: jest.fn(() => null),
  clearAdminToken: jest.fn(),
  fetchAdminPortfolioState: jest.fn(),
  saveDraftState: jest.fn(),
  publishDraftState: jest.fn(),
  discardDraftState: jest.fn(),
  rollbackPublishedState: jest.fn(),
  loginDashboard: jest.fn(),
  verifyDashboardSession: jest.fn(),
}));

test('renderiza o título principal do portfólio', () => {
  render(<App />);
  const titleElement = screen.getByRole('heading', { name: /github portfolio/i });
  expect(titleElement).toBeInTheDocument();
});
