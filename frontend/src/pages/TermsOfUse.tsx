import React, { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  InformationCircleIcon,
  CheckIcon,
  UsersIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  ScaleIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

// Import section components
import Introduction from '@/components/TermsOfUse/Introduction';
import TermsAcceptance from '@/components/TermsOfUse/TermsAcceptance';
import UserGeneratedContent from '@/components/TermsOfUse/UserGeneratedContent';
import ProhibitedConduct from '@/components/TermsOfUse/ProhibitedConduct';
import IntellectualProperty from '@/components/TermsOfUse/IntellectualProperty';
import HamidVerseOwnership from '@/components/TermsOfUse/HamidVerseOwnership';
import LiabilityLimitation from '@/components/TermsOfUse/LiabilityLimitation';
import TermsChanges from '@/components/TermsOfUse/TermsChanges';
import ContactInformation from '@/components/TermsOfUse/ContactInformation';
import NonCommercialPolicy from '@/components/TermsOfUse/NonCommercialPolicy';
import SpecialLegalTerms from '@/components/TermsOfUse/SpecialLegalTerms';


interface Section {
  id: string;
  title: string;
  shortTitle: string; // Thêm title ngắn cho mobile
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

const TermsOfUse: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('intro');

  const sections: Section[] = [
    {
      id: "intro",
      title: "Introduction",
      shortTitle: "Intro",
      icon: InformationCircleIcon,
      component: Introduction
    },
    {
      id: "acceptance",
      title: "Terms Acceptance",
      shortTitle: "Acceptance",
      icon: CheckIcon,
      component: TermsAcceptance
    },
    {
      id: "user-content",
      title: "User-Generated Content",
      shortTitle: "Content",
      icon: UsersIcon,
      component: UserGeneratedContent
    },
    {
      id: "prohibited",
      title: "Prohibited Conduct",
      shortTitle: "Rules",
      icon: NoSymbolIcon,
      component: ProhibitedConduct
    },
    {
      id: "ip-respect",
      title: "Intellectual Property",
      shortTitle: "IP",
      icon: ShieldCheckIcon,
      component: IntellectualProperty
    },
    {
      id: "ownership",
      title: "HamidVerse Ownership",
      shortTitle: "Ownership",
      icon: ShieldCheckIcon,
      component: HamidVerseOwnership
    },
    {
      id: "liability",
      title: "Liability Limitation",
      shortTitle: "Liability",
      icon: ScaleIcon,
      component: LiabilityLimitation
    },
    {
      id: "changes",
      title: "Terms Changes",
      shortTitle: "Changes",
      icon: ArrowPathIcon,
      component: TermsChanges
    },
    {
      id: "contact",
      title: "Contact Information",
      shortTitle: "Contact",
      icon: EnvelopeIcon,
      component: ContactInformation
    },
    {
      id: "non-commercial",
      title: "Non-Commercial Policy",
      shortTitle: "Policy",
      icon: CurrencyDollarIcon,
      component: NonCommercialPolicy
    },
    {
      id: "special-terms",
      title: "Special Legal Terms",
      shortTitle: "Legal",
      icon: ScaleIcon,
      component: SpecialLegalTerms
    }
  ];

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const currentSection = sections.find(section => section.id === activeSection);
  const CurrentComponent = currentSection?.component || Introduction;

  return (
<div className="min-h-screen bg-gray-50 dark:bg-gray-800">



   {/* Mobile Navigation Bar - Horizontal Scrollable - Pill Style with Scroll Indicator */}
<div className="sm:hidden sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="relative">
    <div className="flex overflow-x-auto scrollbar-hide space-x-2 px-4 py-3">
      {sections.map((section) => {
        const IconComponent = section.icon;
        return (
          <button
            key={section.id}
            onClick={() => handleSectionChange(section.id)}
            className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
              activeSection === section.id
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <IconComponent className={`h-4 w-4 ${
              activeSection === section.id
                ? 'text-white'
                : 'text-gray-500 dark:text-gray-400'
            }`} />
            <span className={`text-xs font-medium ${
              activeSection === section.id
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {section.shortTitle}
            </span>
          </button>
        );
      })}
    </div>
    {/* Scroll indicator arrow */}
    <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-2 bg-gradient-to-l from-white dark:from-gray-800 via-white/80 dark:via-gray-800/80 to-transparent w-16 pointer-events-none">
      <span className="text-gray-400 dark:text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </span>
    </div>
  </div>
</div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden sm:block w-full md:w-80">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <IconComponent className={`h-5 w-5 ${
                        activeSection === section.id
                          ? 'text-blue-500'
                          : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <span className="font-medium">{section.title}</span>
                      {activeSection === section.id && (
                        <ChevronRightIcon className="h-4 w-4 ml-auto text-blue-500" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
              <div className="animate-fadeIn">
                <CurrentComponent />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              © 2025 HamidVerse. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Hide scrollbar for horizontal scroll */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Smooth scrolling for mobile navigation */
        .scroll-smooth {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default TermsOfUse;