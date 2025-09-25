import React from 'react';
import { ShieldCheckIcon, DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';

const IntellectualProperty: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <ShieldCheckIcon className="h-8 w-8 text-blue-500" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Intellectual Property
        </h2>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          HamidVerse respects intellectual property rights and expects all users 
          to do the same. This section outlines our policies regarding copyrights, 
          trademarks, and other intellectual property matters on our platform.
        </p>

        <div className="space-y-8">
          <div className="border-l-4 border-blue-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Copyright Policy
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We comply with the Digital Millennium Copyright Act (DMCA) and 
              similar international copyright laws. Users must respect copyright 
              protections and only share content they own or have permission to use.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Copyright Compliance
              </h4>
              <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-sm">
                <li>• Only upload content you own or have explicit permission to use</li>
                <li>• Provide proper attribution when required</li>
                <li>• Respect Creative Commons and other licensing terms</li>
                <li>• Remove infringing content immediately when notified</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              DMCA Takedown Process
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you believe your copyrighted work has been infringed upon, 
              you may submit a DMCA takedown notice. We will process valid 
              notices promptly and fairly.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <DocumentTextIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">Step 1: Notice</h4>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Submit a detailed DMCA notice with all required information
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <EyeIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">Step 2: Review</h4>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Our team reviews the notice for completeness and validity
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">Step 3: Action</h4>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Content is removed or disabled if the notice is valid
                </p>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-purple-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Counter-Notification Process
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you believe your content was removed in error, you may submit 
              a counter-notification to request restoration of the content.
            </p>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Counter-Notification Requirements
              </h4>
              <ul className="text-purple-800 dark:text-purple-200 space-y-1 text-sm">
                <li>• Identification of the removed content</li>
                <li>• Statement of good faith belief that removal was erroneous</li>
                <li>• Contact information and electronic signature</li>
                <li>• Consent to jurisdiction of federal court</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-orange-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Trademark Policy
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We respect trademark rights and prohibit the unauthorized use of 
              trademarks in ways that could cause confusion or dilute their value.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Prohibited Uses</h4>
                <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                  <li>• Using trademarks in usernames without permission</li>
                  <li>• Creating content that impersonates brands</li>
                  <li>• Selling counterfeit or unauthorized products</li>
                  <li>• Using trademarks in misleading ways</li>
                </ul>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">Permitted Uses</h4>
                <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                  <li>• Nominative fair use (describing products/services)</li>
                  <li>• Commentary and criticism</li>
                  <li>• Educational content about brands</li>
                  <li>• Parody and satire (where clearly identified)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-indigo-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              User Content Licensing
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When you share content on HamidVerse, you grant us certain rights 
              while retaining ownership of your intellectual property.
            </p>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                License Terms
              </h4>
              <div className="space-y-2 text-indigo-800 dark:text-indigo-200 text-sm">
                <p><strong>Scope:</strong> Worldwide, non-exclusive, royalty-free</p>
                <p><strong>Purpose:</strong> Operating, displaying, and improving HamidVerse</p>
                <p><strong>Duration:</strong> While content remains on the platform</p>
                <p><strong>Your Rights:</strong> You retain all ownership rights to your content</p>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-teal-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Third-Party Content
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              HamidVerse may contain content from third parties. We respect 
              their intellectual property rights and expect users to do the same.
            </p>
            <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">
                Third-Party Guidelines
              </h4>
              <ul className="text-teal-800 dark:text-teal-200 space-y-1 text-sm">
                <li>• Always check licensing before using third-party content</li>
                <li>• Provide proper attribution when required</li>
                <li>• Respect usage restrictions and limitations</li>
                <li>• Report suspected infringement of third-party rights</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
            Contact Information
          </h3>
          <p className="text-yellow-800 dark:text-yellow-200 mb-3">
            For intellectual property matters, including DMCA notices and 
            counter-notifications, please contact our designated agent:
          </p>
          <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded text-sm">
            <p className="text-yellow-900 dark:text-yellow-100">
              <strong>Email:</strong> hamidabdol.verse@gmail.com<br />
              <strong>Subject Line:</strong> DMCA Notice - [Brief Description]
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntellectualProperty;