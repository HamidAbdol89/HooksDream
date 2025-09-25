import React from 'react';
import { CurrencyDollarIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const NonCommercialPolicy: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <CurrencyDollarIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Non-Commercial Policy</h2>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200 mb-3">
          Usage Guidelines
        </h3>
        <p className="text-emerald-800 dark:text-emerald-200">
          HamidVerse promotes creative expression and community building. 
          This policy outlines the boundaries between personal use and commercial activities.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Non-Commercial Use Definition</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Non-commercial use refers to activities that are primarily for personal, 
            educational, or non-profit purposes without the intent of generating revenue 
            or commercial benefit. This includes:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">Allowed Activities</h4>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <li>Personal creative projects</li>
                    <li>Educational content creation</li>
                    <li>Non-profit organization use</li>
                    <li>Academic research</li>
                    <li>Community building</li>
                    <li>Portfolio development</li>
                    <li>Skill development</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">Prohibited Activities</h4>
                  <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                    <li>Selling content or services</li>
                    <li>Advertising products</li>
                    <li>Lead generation</li>
                    <li>Affiliate marketing</li>
                    <li>Business promotion</li>
                    <li>Monetized content</li>
                    <li>Commercial partnerships</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Commercial Use Guidelines</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            If you wish to use HamidVerse for commercial purposes, you must:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Contact our business team for commercial licensing</li>
            <li>Obtain written permission before any commercial use</li>
            <li>Comply with additional terms and conditions</li>
            <li>Pay applicable commercial licensing fees</li>
            <li>Respect intellectual property rights</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Content Monetization</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Users are generally prohibited from monetizing content created on or with HamidVerse:
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Special Considerations</h4>
            <ul className="text-yellow-800 dark:text-yellow-200 text-sm space-y-1">
              <li>Donation-based support for non-profit projects may be permitted</li>
              <li>Educational institutions may use content for fundraising purposes</li>
              <li>Creative commons licensing may apply to certain content</li>
              <li>Contact us for case-by-case evaluations</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Enforcement and Violations</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            HamidVerse actively monitors for commercial use violations. Consequences may include:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Content removal or restriction</li>
            <li>Account suspension or termination</li>
            <li>Legal action for copyright infringement</li>
            <li>Requirement to obtain retroactive commercial licensing</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Reporting Commercial Use</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            If you discover content or activities that appear to violate our non-commercial 
            policy, please report them to our support team. We investigate all reports 
            and take appropriate action to maintain the integrity of our platform.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Need Commercial Access?</h4>
          <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
            We offer commercial licensing options for businesses and organizations. 
            Contact our business development team to discuss your needs.
          </p>
          <a href="mailto:hamidabdol.verse@gmail.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
            hamidabdol.verse@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default NonCommercialPolicy;