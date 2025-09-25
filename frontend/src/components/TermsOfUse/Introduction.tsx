import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const Introduction: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-8">
        <InformationCircleIcon className="h-8 w-8 text-blue-500" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Introduction
        </h2>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Welcome to <span className="font-semibold text-blue-600 dark:text-blue-400">HamidVerse</span>, 
          a digital platform designed to connect creators, innovators, and community members worldwide. 
          These Terms of Use ("Terms") govern your access to and use of HamidVerse services, 
          including our website, applications, and related services.
        </p>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          By accessing or using HamidVerse, you acknowledge that you have read, understood, 
          and agree to be bound by these Terms and our Privacy Policy. If you do not agree 
          with any part of these terms, you may not access or use our services.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            What is HamidVerse?
          </h3>
          <p className="text-blue-800 dark:text-blue-200">
            HamidVerse is a comprehensive digital ecosystem that facilitates creative collaboration, 
            knowledge sharing, and community building. Our platform provides tools and services 
            that enable users to create, share, and discover content while fostering meaningful 
            connections within our global community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Our Mission
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              To create an inclusive digital space where creativity thrives, 
              innovation flourishes, and communities grow stronger through 
              meaningful collaboration and shared experiences.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Our Values
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              We prioritize user safety, content integrity, creative freedom, 
              and community respect. These values guide our policies and 
              shape the experience we provide to all HamidVerse users.
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <strong>Important Notice:</strong> These Terms are effective as of the date you first 
          access HamidVerse and will remain in effect while you use our services. We may update 
          these Terms periodically, and your continued use constitutes acceptance of any changes.
        </p>
      </div>
    </div>
  );
};

export default Introduction;