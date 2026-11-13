import React, { useCallback } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { IntroductionSection } from './IntroductionSection';
import { MissionsSection } from './MissionsSection';
import { DiscoveriesSection } from './DiscoveriesSection';
import { ScienceTechSection } from './ScienceTechSection';
import { WhyExploreSection } from './WhyExploreSection';
import { CallToActionSection } from './CallToActionSection';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onLaunchExplorer: (siteId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchExplorer }) => {
  const scrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="relative w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth bg-space-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Fixed Navigation Bar */}
      <LandingNavbar onLaunchExplorer={() => onLaunchExplorer()} />

      {/* Main Content Sections */}
      <main className="w-full">
        {/* 1. Hero Section: The First Impression */}
        <HeroSection
          onLaunchExplorer={() => onLaunchExplorer()}
          onExploreMissions={() => scrollTo('missions')}
        />

        {/* 2. Introduction: The Moon, Reimagined */}
        <IntroductionSection
          onLaunchExplorer={() => onLaunchExplorer()}
          onExploreMissions={() => scrollTo('missions')}
          onExploreScience={() => scrollTo('science')}
        />

        {/* 3. Lunar Missions: The Missions That Brought Us Closer */}
        <MissionsSection
          onLaunchExplorer={(siteId) => onLaunchExplorer(siteId)}
        />

        {/* 5. Lunar Discoveries: Discover the Secrets of the Moon */}
        <DiscoveriesSection
          onLaunchExplorer={(siteId) => onLaunchExplorer(siteId)}
        />

        {/* 6. Scientific Data & Technology: Powered By Science */}
        <ScienceTechSection />

        {/* 7. Why Explore With SELENE 3D */}
        <WhyExploreSection />

        {/* 8. Final Call To Action: The Next Giant Leap Starts Here */}
        <CallToActionSection
          onLaunchExplorer={() => onLaunchExplorer()}
          onExploreMissions={() => scrollTo('missions')}
        />
      </main>

      {/* 9. Professional Scientific Footer */}
      <LandingFooter onLaunchExplorer={() => onLaunchExplorer()} />
    </div>
  );
};

export default LandingPage;

