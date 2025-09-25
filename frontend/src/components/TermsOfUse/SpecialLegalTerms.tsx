import React from 'react';
import { ScaleIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

const SpecialLegalTerms: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <ScaleIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Special Legal Terms</h2>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
          Additional Legal Provisions
        </h3>
        <p className="text-indigo-800 dark:text-indigo-200">
          These special terms address specific legal requirements and situations 
          that may arise in your use of HamidVerse.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Governing Law and Jurisdiction</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            These Terms of Use and any disputes arising from your use of HamidVerse 
            shall be governed by and construed in accordance with the laws of the 
            State of [Your State/Country], without regard to conflict of law principles.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              <strong>Exclusive Jurisdiction:</strong> Any legal action or proceeding 
              relating to these terms shall be brought exclusively in the courts of 
              [Your Jurisdiction], and you consent to the jurisdiction of such courts.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-start space-x-3 mb-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dispute Resolution</h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Before initiating any legal proceedings, parties agree to attempt resolution through:
          </p>
          <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Direct negotiation between the parties</li>
            <li>Mediation with a mutually agreed mediator</li>
            <li>Binding arbitration if mediation fails</li>
            <li>Court proceedings as a last resort</li>
          </ol>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Class Action Waiver</h3>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <ShieldExclamationIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-red-800 dark:text-red-200 text-sm">
                  <strong>Important:</strong> You agree to resolve disputes individually and waive 
                  your right to participate in class actions, collective actions, or 
                  representative proceedings against HamidVerse.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Severability</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            If any provision of these Terms of Use is found to be invalid, illegal, 
            or unenforceable, the remaining provisions shall continue in full force 
            and effect. The invalid provision will be replaced with a valid provision 
            that most closely matches the intent of the original.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Force Majeure</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            HamidVerse shall not be liable for any failure to perform its obligations 
            under these terms due to circumstances beyond its reasonable control, including:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Natural disasters or acts of God</li>
            <li>Government actions or regulations</li>
            <li>War, terrorism, or civil unrest</li>
            <li>Internet or telecommunications failures</li>
            <li>Cyberattacks or security breaches</li>
            <li>Pandemics or public health emergencies</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">International Users</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            HamidVerse is operated from [Your Country] and may not be available in all jurisdictions. 
            International users acknowledge that:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
            <li>Local laws and regulations may apply</li>
            <li>Data may be transferred across borders</li>
            <li>Currency conversions may apply to paid services</li>
            <li>Service availability may vary by region</li>
            <li>Users are responsible for compliance with local laws</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Digital Millennium Copyright Act (DMCA)</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            HamidVerse complies with the DMCA and responds to valid takedown notices. 
            If you believe your copyrighted work has been infringed:
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm mb-2">
              <strong>DMCA Notice Address:</strong>
            </p>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Email: hamidabdol.verse@gmail.com<br />
              Subject: DMCA Takedown Notice<br />
              Include: Detailed description of infringement, contact information, 
              and good faith statement
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Entire Agreement</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            These Terms of Use, together with our Privacy Policy and any additional 
            terms for specific services, constitute the entire agreement between you 
            and HamidVerse. No other agreements, representations, or warranties shall 
            be binding unless in writing and signed by authorized representatives.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Assignment</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            HamidVerse may assign or transfer these terms and its rights and obligations 
            to any third party without notice. Users may not assign their rights or 
            obligations under these terms without prior written consent from HamidVerse.
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Legal Disclaimer</h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            This document does not constitute legal advice. Users should consult with 
            qualified legal counsel for specific legal questions or concerns. HamidVerse 
            reserves the right to update these terms as needed to comply with applicable laws.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpecialLegalTerms;