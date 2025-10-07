'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Download, Smartphone, Monitor } from 'lucide-react';

export default function PWATestPage() {
  const [pwaFeatures, setPwaFeatures] = useState({
    serviceWorker: false,
    manifest: false,
    installPrompt: false,
    offline: false,
    notifications: false
  });

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Check PWA features
    const checkPWAFatures = () => {
      setPwaFeatures({
        serviceWorker: 'serviceWorker' in navigator,
        manifest: !!document.querySelector('link[rel="manifest"]'),
        installPrompt: 'onbeforeinstallprompt' in window,
        offline: 'ononline' in window && 'onoffline' in window,
        notifications: 'Notification' in window
      });
    };

    checkPWAFatures();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setInstallPrompt(null);
    setShowInstallPrompt(false);
  };

  const testNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('DoroBuddy Test', {
          body: 'PWA notifications are working!',
          icon: '/icons/icon-192x192.svg'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('DoroBuddy Test', {
              body: 'PWA notifications are working!',
              icon: '/icons/icon-192x192.svg'
            });
          }
        });
      }
    }
  };

  const features = [
    { key: 'serviceWorker', name: 'Service Worker', description: 'Enables offline functionality' },
    { key: 'manifest', name: 'Web App Manifest', description: 'Defines app metadata and icons' },
    { key: 'installPrompt', name: 'Install Prompt', description: 'Allows app installation' },
    { key: 'offline', name: 'Offline Detection', description: 'Detects online/offline status' },
    { key: 'notifications', name: 'Notifications', description: 'Push notification support' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            🎯 PWA Installation Test
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            This page helps you test and install DoroBuddy as a Progressive Web App (PWA).
          </p>

          {/* PWA Features Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              PWA Features Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.key}
                  className={`p-4 rounded-lg border-2 ${
                    pwaFeatures[feature.key as keyof typeof pwaFeatures]
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                      : 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {pwaFeatures[feature.key as keyof typeof pwaFeatures] ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feature.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Installation Instructions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mobile */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Mobile</h3>
                </div>
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>1. Open in Safari (iOS) or Chrome (Android)</li>
                  <li>2. Tap the Share button</li>
                  <li>3. Select "Add to Home Screen"</li>
                  <li>4. Tap "Add" to install</li>
                </ol>
              </div>

              {/* Desktop */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Monitor className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Desktop</h3>
                </div>
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>1. Open in Chrome, Edge, or Safari</li>
                  <li>2. Look for install button in address bar</li>
                  <li>3. Or use browser menu → "Install DoroBuddy"</li>
                  <li>4. Click "Install" when prompted</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="flex flex-wrap gap-4">
            {showInstallPrompt && installPrompt && (
              <button
                onClick={handleInstall}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Install DoroBuddy</span>
              </button>
            )}
            
            <button
              onClick={testNotification}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <span>Test Notification</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <span>Back to App</span>
            </button>
          </div>

          {/* Status Messages */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Current Status
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              {pwaFeatures.serviceWorker && pwaFeatures.manifest ? (
                <p>✅ DoroBuddy is ready to be installed as a PWA!</p>
              ) : (
                <p>⚠️ Some PWA features are missing. Check the status above.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
