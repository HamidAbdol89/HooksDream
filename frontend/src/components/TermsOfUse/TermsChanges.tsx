import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const TermsChanges: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <ArrowPathIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Terms Changes</h2>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-3">
          Updates and Modifications
        </h3>
        <p className="text-purple-800 dark:text-purple-200">
          HamidVerse reserves the right to modify these Terms of Use at any time 
          to reflect changes in our services, legal requirements, or business practices.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Right to Modify</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            We may update these Terms of Use from time to time for various reasons, including:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Changes to our services or features</li>
            <li>Legal or regulatory requirements</li>
            <li>Security or safety improvements</li>
            <li>Clarification of existing terms</li>
            <li>Addition of new policies or procedures</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Notification Process</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            When we make changes to these terms, we will notify users through:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Email notification to registered users</li>
            <li>In-app notifications or banners</li>
            <li>Updates to our website and platform</li>
            <li>Social media announcements for major changes</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Effective Date</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Changes to these Terms of Use will become effective immediately upon posting 
            on our platform, unless otherwise specified. For significant changes that 
            materially affect user rights, we will provide at least 30 days' notice 
            before the changes take effect.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">User Acceptance</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            By continuing to use HamidVerse after changes are posted, you agree to the 
            updated terms. If you do not agree with the changes, you should:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Discontinue use of the service</li>
            <li>Contact us with your concerns</li>
            <li>Close your account if necessary</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Version History</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            We maintain a record of significant changes to our Terms of Use. 
            Users can request information about previous versions or specific 
            changes by contacting our support team.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Regular Review</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            We recommend that users periodically review these Terms of Use to 
            stay informed about any changes. The "Last Updated" date at the top 
            of the document indicates when the terms were last modified.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Current Version</h4>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            These Terms of Use were last updated on [Date]. We encourage users to 
            check this page regularly for any updates or changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsChanges;