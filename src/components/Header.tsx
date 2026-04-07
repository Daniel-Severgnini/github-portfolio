import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.classList.toggle('light', !darkMode);
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const navItems = [
    { label: 'Sobre', id: 'perfil' },
    { label: 'Projetos', id: 'projetos' },
    { label: 'Tecnologias', id: 'tecnologias' },
    { label: 'Contato', id: 'contato' },
  ];

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-full px-6 py-3 flex justify-between items-center shadow-lg transition-colors duration-300">
        {/* Logo */}
        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold tracking-wider text-sm">
          DANIEL<span className="text-indigo-500">.DEV</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 text-sm font-medium hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-200"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-yellow-500 dark:text-yellow-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Alternar tema"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Abrir menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-20 left-4 right-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-lg p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all duration-200"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Header;