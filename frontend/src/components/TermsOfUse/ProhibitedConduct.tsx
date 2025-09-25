import React from 'react';
import { NoSymbolIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ProhibitedConduct: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <NoSymbolIcon className="h-8 w-8 text-red-500" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Prohibited Conduct
        </h2>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          To maintain a safe, respectful, and productive environment for all users, 
          certain behaviors and activities are strictly prohibited on HamidVerse. 
          Violation of these rules may result in warnings, content removal, 
          account suspension, or permanent termination.
        </p>

        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-lg mb-8">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
              Zero Tolerance Policy
            </h3>
          </div>
          <p className="text-red-800 dark:text-red-200">
            HamidVerse maintains a zero-tolerance policy for certain severe violations. 
            These may result in immediate account termination without prior warning.
          </p>
        </div>

        <div className="space-y-8">
          <div className="border-l-4 border-red-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Harassment and Abuse
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Personal Attacks</h4>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• Targeted harassment of individuals</li>
                  <li>• Cyberbullying or intimidation</li>
                  <li>• Doxxing or sharing personal information</li>
                  <li>• Threats of violence or harm</li>
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Discriminatory Behavior</h4>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• Hate speech based on identity</li>
                  <li>• Discriminatory language or symbols</li>
                  <li>• Promoting intolerance or prejudice</li>
                  <li>• Creating hostile environments</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-orange-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Illegal and Harmful Activities
            </h3>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <ul className="text-orange-800 dark:text-orange-200 space-y-2">
                <li>• <strong>Illegal Content:</strong> Sharing or promoting illegal activities, substances, or services</li>
                <li>• <strong>Fraud and Scams:</strong> Deceptive practices, phishing, or financial fraud</li>
                <li>• <strong>Malicious Software:</strong> Distributing viruses, malware, or harmful code</li>
                <li>• <strong>Unauthorized Access:</strong> Hacking, account takeovers, or system breaches</li>
                <li>• <strong>Adult Content:</strong> Sexually explicit material or inappropriate content involving minors</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-yellow-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Platform Abuse
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Spam & Manipulation</h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• Excessive posting or messaging</li>
                  <li>• Automated bot activity</li>
                  <li>• Vote manipulation</li>
                  <li>• Fake engagement</li>
                </ul>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">System Exploitation</h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• Circumventing security measures</li>
                  <li>• Exploiting platform vulnerabilities</li>
                  <li>• Creating multiple fake accounts</li>
                  <li>• Evading bans or restrictions</li>
                </ul>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Content Violations</h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>• Copyright infringement</li>
                  <li>• Trademark violations</li>
                  <li>• Plagiarism</li>
                  <li>• Misleading information</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-purple-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Commercial Violations
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              HamidVerse operates under a non-commercial policy. The following 
              commercial activities are prohibited:
            </p>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <ul className="text-purple-800 dark:text-purple-200 space-y-2">
                <li>• <strong>Unauthorized Sales:</strong> Selling products or services without permission</li>
                <li>• <strong>Advertising:</strong> Promotional content or unsolicited marketing</li>
                <li>• <strong>Affiliate Marketing:</strong> Using the platform for affiliate link promotion</li>
                <li>• <strong>Commercial Impersonation:</strong> Misrepresenting business relationships</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-indigo-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Enforcement Actions
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When prohibited conduct is identified, HamidVerse may take various 
              enforcement actions depending on the severity and frequency of violations:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Warning</h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    First-time minor violations may receive a warning with guidance
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                  <h4 className="font-medium text-orange-900 dark:text-orange-100">Content Removal</h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Violating content will be removed from the platform
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                  <h4 className="font-medium text-red-900 dark:text-red-100">Account Suspension</h4>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Temporary restriction of account access and features
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Permanent Ban</h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Complete termination of account and platform access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Reporting Violations
          </h3>
          <p className="text-blue-800 dark:text-blue-200">
            If you encounter prohibited conduct, please report it immediately through 
            our reporting system. All reports are reviewed promptly and confidentially. 
            We encourage community members to help maintain a positive environment 
            by reporting violations when they occur.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProhibitedConduct;