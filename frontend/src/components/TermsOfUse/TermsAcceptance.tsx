import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

const TermsAcceptance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <CheckIcon className="h-8 w-8 text-green-500" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Terms Acceptance
        </h2>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          By accessing, browsing, or using HamidVerse in any manner, you acknowledge 
          that you have read, understood, and agree to be bound by these Terms of Use 
          and all applicable laws and regulations.
        </p>

        <div className="space-y-6">
          <div className="border-l-4 border-green-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Agreement Formation
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Your agreement to these Terms is formed when you:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3 text-gray-700 dark:text-gray-300">
              <li>Create an account on HamidVerse</li>
              <li>Access any part of our platform or services</li>
              <li>Use any features, tools, or content provided by HamidVerse</li>
              <li>Interact with other users through our platform</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">
              Age Requirements
            </h3>
            <p className="text-amber-800 dark:text-amber-200">
              You must be at least <strong>13 years old</strong> to use HamidVerse. 
              If you are between 13 and 18 years old, you represent that you have 
              your parent's or legal guardian's permission to use our services and 
              that they have agreed to these Terms on your behalf.
            </p>
          </div>

          <div className="border-l-4 border-blue-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Legal Capacity
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              By agreeing to these Terms, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3 text-gray-700 dark:text-gray-300">
              <li>You have the legal capacity to enter into this agreement</li>
              <li>You are not prohibited from using our services under applicable law</li>
              <li>Your use of HamidVerse will comply with all applicable local, state, national, and international laws</li>
              <li>All information you provide is accurate and truthful</li>
            </ul>
          </div>

          <div className="border-l-4 border-purple-500 pl-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Scope of Agreement
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              These Terms apply to all aspects of your relationship with HamidVerse, including:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Platform Access</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Website, mobile applications, and all related services
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Content & Features</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All tools, content, and functionality provided by HamidVerse
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Community Interaction</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Communication with other users and community participation
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Third-party Integration</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connected services and external platform integrations
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3">
            Rejection of Terms
          </h3>
          <p className="text-red-800 dark:text-red-200">
            If you do not agree to these Terms, you must immediately discontinue 
            your use of HamidVerse. Continued use after being notified of changes 
            to these Terms constitutes acceptance of the updated terms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptance;