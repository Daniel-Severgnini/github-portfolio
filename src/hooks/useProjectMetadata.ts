import { useState, useEffect } from 'react';
import { ProjectMetadata } from '../types/Project';

export const useProjectMetadata = () => {
  const [metadata, setMetadata] = useState<{ [key: string]: ProjectMetadata }>({});

  useEffect(() => {
    const stored = localStorage.getItem('portfolio_project_metadata');
    if (stored) {
      try {
        setMetadata(JSON.parse(stored));
      } catch (error) {
        console.error('Erro ao carregar metadata dos projetos:', error);
      }
    }
  }, []);

  const updateMetadata = (projectName: string, data: Partial<ProjectMetadata>) => {
    const updated = {
      ...metadata,
      [projectName]: {
        ...metadata[projectName],
        ...data,
        name: projectName,
      }
    };
    setMetadata(updated);
    localStorage.setItem('portfolio_project_metadata', JSON.stringify(updated));
  };

  const removeMetadata = (projectName: string) => {
    const updated = { ...metadata };
    delete updated[projectName];
    setMetadata(updated);
    localStorage.setItem('portfolio_project_metadata', JSON.stringify(updated));
  };

  const getMetadata = (projectName: string): ProjectMetadata | undefined => {
    return metadata[projectName];
  };

  return {
    metadata,
    updateMetadata,
    removeMetadata,
    getMetadata,
  };
};
