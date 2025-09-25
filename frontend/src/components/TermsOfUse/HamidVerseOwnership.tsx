import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const HamidVerseOwnership: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <ShieldCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">HamidVerse Ownership</h2>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
          Intellectual Property Rights
        </h3>
        <p className="text-blue-800 dark:text-blue-200">
          All content, features, and functionality of HamidVerse are owned by HamidVerse 
          and protected by intellectual property laws.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Platform Ownership</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            HamidVerse platform, including but not limited to its design, code, features, 
            graphics, logos, and user interface, is the exclusive property of HamidVerse. 
            All rights, title, and interest in and to the platform remain with HamidVerse.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">User-Generated Content</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            While users retain ownership of their original content, by using HamidVerse, 
            you grant us certain rights to use, display, and distribute your content 
            within the platform for operational purposes.
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Users retain copyright to their original creative works</li>
            <li>HamidVerse receives a non-exclusive license to display user content</li>
            <li>Users are responsible for ensuring they have rights to content they upload</li>
            <li>Prohibited content will be removed without notice</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Third-Party Content</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Any third-party content, trademarks, or materials displayed on HamidVerse 
            remain the property of their respective owners. HamidVerse does not claim 
            ownership of such content and respects all intellectual property rights.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Copyright Protection</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            HamidVerse respects intellectual property rights and expects users to do the same. 
            We respond to valid copyright infringement notices and may terminate accounts 
            of repeat infringers in accordance with applicable laws.
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Important Notice</h4>
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Unauthorized use, reproduction, or distribution of HamidVerse content 
            may result in legal action and account termination.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HamidVerseOwnership;