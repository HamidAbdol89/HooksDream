import React from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';

const UserGeneratedContent: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <UsersIcon className="h-8 w-8 text-purple-500" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          User-Generated Content
        </h2>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          HamidVerse thrives on the creativity and contributions of our community. 
          This section outlines the rights, responsibilities, and guidelines 
          regarding content you create, upload, or share on our platform.
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-purple-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Your Content Rights
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You retain ownership of any intellectual property rights in content 
              you create and share on HamidVerse. However, by posting content, 
              you grant us certain rights to use and display that content.
            </p>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                License Grant
              </h4>
              <p className="text-purple-800 dark:text-purple-200 text-sm">
                You grant HamidVerse a worldwide, non-exclusive, royalty-free license 
                to use, display, reproduce, and distribute your content solely for 
                the purpose of operating and improving our services.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
                ✅ Acceptable Content
              </h3>
              <ul className="space-y-2 text-green-800 dark:text-green-200 text-sm">
                <li>• Original creative works</li>
                <li>• Educational and informational content</li>
                <li>• Collaborative projects and discussions</li>
                <li>• Community-friendly interactions</li>
                <li>• Content that respects others' rights</li>
                <li>• Age-appropriate material</li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3">
                ❌ Prohibited Content
              </h3>
              <ul className="space-y-2 text-red-800 dark:text-red-200 text-sm">
                <li>• Copyrighted material without permission</li>
                <li>• Hate speech or discriminatory content</li>
                <li>• Violent or graphic material</li>
                <li>• Spam or misleading information</li>
                <li>• Personal information of others</li>
                <li>• Content promoting illegal activities</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-blue-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Content Responsibility
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You are solely responsible for the content you post on HamidVerse. 
              This includes ensuring that your content:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Does not violate any third-party rights</li>
              <li>Complies with all applicable laws and regulations</li>
              <li>Is accurate and not misleading</li>
              <li>Does not contain malicious code or viruses</li>
              <li>Respects the privacy and dignity of others</li>
            </ul>
          </div>

          <div className="border-l-4 border-orange-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Content Moderation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              To maintain a safe and positive environment, HamidVerse reserves 
              the right to moderate content. Our moderation approach includes:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Review Process</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automated and human review of reported content
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Community Reports</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  User-driven reporting system for inappropriate content
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Enforcement Actions</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Content removal, warnings, or account restrictions
                </p>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-indigo-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Backup and Preservation
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              While we strive to preserve user content, we recommend maintaining 
              your own backups. HamidVerse is not responsible for any loss of 
              content due to technical issues, account termination, or other circumstances.
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
            Content Removal
          </h3>
                      <p className="text-yellow-800 dark:text-yellow-200">
            You can delete your content at any time through your account settings. 
            However, please note that removed content may remain in our systems 
            for a limited time for backup and legal compliance purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserGeneratedContent;