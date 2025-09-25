import React from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const ContactInformation: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <EnvelopeIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Information</h2>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-3">
          Get in Touch
        </h3>
        <p className="text-green-800 dark:text-green-200">
          We're here to help! Reach out to us with any questions, concerns, 
          or feedback about HamidVerse and our Terms of Use.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm dark:shadow-none">
            <div className="flex items-center space-x-3 mb-4">
              <EnvelopeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Support</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">General Support:</span>
                <br />
                <a href="mailto:hamidabdol.verse@gmail.com" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  hamidabdol.verse@gmail.com
                </a>
              </p>
          
           
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm dark:shadow-none">
            <div className="flex items-center space-x-3 mb-4">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Chat</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Available 24/7 through our platform
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click the chat icon in the bottom right corner of any page
            </p>
          </div>
        </div>

      <div className="space-y-4">
  {/* Office Address */}
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm dark:shadow-none">
    <div className="flex items-center space-x-3 mb-4">
      <MapPinIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Office Address</h3>
    </div>
    <address className="not-italic text-gray-700 dark:text-gray-300">
      <p>HamidVerse Headquarters</p>
      <p>Chau Doc City</p>
      <p>An Giang Province</p>
      <p>Vietnam</p>
    </address>
  </div>

  {/* Phone Support */}
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm dark:shadow-none">
    <div className="flex items-center space-x-3 mb-4">
      <PhoneIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Phone Support</h3>
    </div>
    <div className="text-gray-700 dark:text-gray-300">
      <p className="font-medium">Hotline:</p>
      <p className="text-lg">(+84) 981 192 884</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        Monday - Friday: 9:00 AM – 6:00 PM (ICT)
      </p>
    </div>
  </div>
</div>

      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Response Times</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">1hr</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Live Chat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24hrs</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Email Support</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">48hrs</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Legal Inquiries</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Social Media</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            Follow us for updates, announcements, and community discussions:
          </p>
          <div className="flex space-x-4">
            <a href="https://twitter.com/hamidabdolX"  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">X</a>
            <a href="https://www.facebook.com/hamid.dolab/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Facebook</a>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Emergency Issues</h4>
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            For urgent security issues or account compromises, please email 
            <a href="mailto:hamidabdol.verse@gmail.com" className="text-yellow-900 dark:text-yellow-200 font-medium ml-1">
              hamidabdol.verse@gmail.com
            </a> immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactInformation;