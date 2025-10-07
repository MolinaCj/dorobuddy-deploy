"use client";

import React, { useState } from 'react';
import { Smartphone, Monitor, Download, X, CheckCircle } from 'lucide-react';

interface PWAInstallGuideProps {
  onClose: () => void;
}

export function PWAInstallGuide({ onClose }: PWAInstallGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Mobile Installation",
      icon: <Smartphone className="w-8 h-8 text-blue-500" />,
      instructions: [
        "Open DoroBuddy in your mobile browser",
        "Look for the 'Add to Home Screen' option in your browser menu",
        "On iOS: Tap the Share button, then 'Add to Home Screen'",
        "On Android: Tap the menu (⋮) and select 'Add to Home Screen' or 'Install App'",
        "Follow the prompts to install"
      ]
    },
    {
      title: "Desktop Installation",
      icon: <Monitor className="w-8 h-8 text-green-500" />,
      instructions: [
        "Open DoroBuddy in Chrome, Edge, or Safari",
        "Look for the install button in the address bar (📱 icon)",
        "Or click the menu (⋮) and select 'Install DoroBuddy'",
        "Click 'Install' when prompted",
        "The app will appear in your applications folder"
      ]
    }
  ];

  const benefits = [
    "Quick access from home screen",
    "Works offline",
    "No browser address bar",
    "Native app experience",
    "Push notifications",
    "Faster loading"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Install DoroBuddy
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Why install DoroBuddy?
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Installation Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {step.icon}
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {step.title}
                  </h4>
                </div>
                <ol className="space-y-2">
                  {step.instructions.map((instruction, instIndex) => (
                    <li key={instIndex} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                        {instIndex + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {/* Browser Support */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Supported Browsers
            </h4>
            <div className="flex flex-wrap gap-2 text-sm">
              {['Chrome', 'Edge', 'Safari', 'Firefox', 'Samsung Internet'].map((browser) => (
                <span key={browser} className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {browser}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Check your browser's help section for "Add to Home Screen"
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

export default PWAInstallGuide;
