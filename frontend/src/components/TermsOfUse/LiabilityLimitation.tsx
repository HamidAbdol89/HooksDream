import React from 'react';
import { ScaleIcon } from '@heroicons/react/24/outline';

const LiabilityLimitation: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <ScaleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Liability Limitation</h2>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-3">
          Important Legal Notice
        </h3>
        <p className="text-red-800 dark:text-red-200 font-medium">
          Please read this section carefully as it limits HamidVerse's liability to you.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Service Availability</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            HamidVerse is provided "as is" and "as available" without any warranties, 
            express or implied. We do not guarantee that the service will be uninterrupted, 
            secure, or error-free. Users acknowledge that internet-based services may 
            experience downtime or technical issues.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Limitation of Damages</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            To the maximum extent permitted by law, HamidVerse shall not be liable for any:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Indirect, incidental, special, or consequential damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Damages resulting from service interruptions or downtime</li>
            <li>Damages caused by third-party content or user interactions</li>
            <li>Damages exceeding the amount paid by user in the past 12 months</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">User Responsibility</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Users are responsible for their own actions and content while using HamidVerse:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Maintaining the security of their account credentials</li>
            <li>Backing up important data and content</li>
            <li>Complying with all applicable laws and regulations</li>
            <li>Respecting other users' rights and privacy</li>
            <li>Using the service at their own risk</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Third-Party Services</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            HamidVerse may integrate with third-party services or contain links to external websites. 
            We are not responsible for the availability, content, or practices of these third parties. 
            Users interact with third-party services at their own risk.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Indemnification</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Users agree to indemnify and hold HamidVerse harmless from any claims, damages, 
            or expenses arising from their use of the service, violation of these terms, 
            or infringement of any third-party rights.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">Jurisdiction Notice</h4>
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            Some jurisdictions do not allow the limitation of liability for certain damages. 
            In such cases, our liability is limited to the maximum extent permitted by law.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiabilityLimitation;