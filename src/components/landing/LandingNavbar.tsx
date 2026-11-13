import React, { useState, useEffect } from 'react';
import { Globe2, Rocket, Menu, X, Compass, Layers, Sparkles, BookOpen, ExternalLink } from 'lucide-react';

interface LandingNavbarProps {
  onLaunchExplorer: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onLaunchExplorer }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check scroll position of window or container
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled(scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: 'Home', id: 'hero' },
    { label: 'Explore', id: 'explore' },
    { label: 'Lunar Missions', id: 'missions' },
    { label: 'Discoveries', id: 'discoveries' },
    { label: 'Science & Tech', id: 'science' },
    { label: 'About', id: 'about' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-space-950/90 border-b border-cyan-500/20 backdrop-blur-xl shadow-2xl py-3'
          : 'bg-space-950/60 border-b border-slate-800/40 backdrop-blur-md py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div
          onClick={() => scrollToSection('hero')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-space-900 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950/60 group-hover:border-cyan-400 group-hover:shadow-cyan-500/20 transition-all">
            <Globe2 className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-wider text-white font-mono flex items-center gap-1.5">
                SELENE<span className="text-cyan-400 font-extrabold">3D</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                NASA ATLAS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block tracking-tight">
              Photographic Lunar Globe & Exploration Portal
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 font-mono text-xs">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Actions: Highlighted Launch Explorer CTA & Mobile Menu Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onLaunchExplorer}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-space-950 font-bold font-mono text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Rocket className="w-4 h-4 text-space-950" />
            <span className="hidden sm:inline">Launch Explorer</span>
            <span className="sm:hidden">Explorer</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-space-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-space-950/98 border-b border-slate-800 backdrop-blur-2xl px-4 py-4 space-y-2 animate-fadeIn font-mono text-sm">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-space-900 transition-colors flex items-center justify-between"
            >
              <span>{link.label}</span>
              <span className="text-slate-600">→</span>
            </button>
          ))}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchExplorer();
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-space-950 font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch Full Interactive 3D Explorer</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;

