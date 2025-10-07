// components/Layout/Footer.tsx
import React, { useEffect, useState } from 'react';
import { Heart, Github, Coffee } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface FooterProps {
  className?: string;
  compact?: boolean;
}

interface BuildInfo {
  buildDate: string;
  creatorName: string;
  version?: string;
  commitHash?: string;
}

export default function Footer({ className = '', compact = false }: FooterProps) {
  const { user, profile } = useAuth();
  const [buildInfo, setBuildInfo] = useState<BuildInfo>({
    buildDate: '',
    creatorName: '',
  });

  // Get build information on component mount
  useEffect(() => {
    const getBuildInfo = (): BuildInfo => {
      const buildDate =
        process.env.NEXT_PUBLIC_BUILD_DATE ||
        new Date().toISOString().split('T')[0];

      let creatorName =
        process.env.NEXT_PUBLIC_CREATOR_NAME;

      if (!creatorName && user) {
        creatorName =
          profile?.full_name ||
          profile?.username ||
          user.email?.split('@')[0] ||
          '';
      }

      if (!creatorName) {
        creatorName = 'clnt_mln';
      }

      return {
        buildDate,
        creatorName,
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        commitHash: process.env.NEXT_PUBLIC_COMMIT_HASH?.substring(0, 7),
      };
    };

    setBuildInfo(getBuildInfo());
  }, [user]);

  const getFooterText = (): string => {
    const { buildDate, creatorName } = buildInfo;
    return `Made Exclusively for future CPA — Created on ${buildDate} by ${creatorName}`;
  };

  if (compact) {
    return (
      <footer
        className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}
      >
        <div className="text-center">{getFooterText()}</div>
      </footer>
    );
  }

  return (
    <footer
      className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Main Footer Content */}
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            {/* Required Footer Text */}
            <div className="text-center lg:text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getFooterText()}
              </p>

              {buildInfo.version && (
                <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                  <span>v{buildInfo.version}</span>
                  {buildInfo.commitHash && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{buildInfo.commitHash}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>Built with Next.js & Supabase</span>
                </div>
              )}
            </div>

            {/* Links and Actions */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span></span>
              </div>

              <div className="flex items-center space-x-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Github className="w-5 h-5" />
                </a>

                <a
                  href="https://buymeacoffee.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-yellow-600 transition-colors"
                >
                  <Coffee className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Additional Footer Sections for Full Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
              {/* About */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  About DoroBuddy
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  A distraction-free Pomodoro timer designed for focused productivity. 
                  Track your sessions, manage tasks, and stay motivated with beautiful analytics.
                </p>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Features
                </h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Customizable timers</li>
                  <li>Task management</li>
                  <li>Activity heatmap</li>
                  <li>Spotify integration</li>
                  <li>Progress tracking</li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Resources
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      User Guide
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      Keyboard Shortcuts
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Support
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="mailto:support@dorobuddy.com" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      Contact Support
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      Report Bug
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      Feature Request
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#" 
                      className="text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      Community
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright and Legal */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>© 2025 DoroBuddy. All rights reserved.</span>
                <span>•</span>
                <span>Pomodoro Technique® is a trademark of Francesco Cirillo</span>
              </div>
              
              <div className="flex items-center space-x-4 mt-2 md:mt-0">
                <span>Status: All systems operational</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// StaticFooter stays the same, just drop child_process from getBuildTimeInfo
export function StaticFooter({
  buildDate,
  creatorName,
  className = '',
}: {
  buildDate: string;
  creatorName: string;
  className?: string;
}) {
  const footerText = `Made Exclusively for future CPA — Created on ${buildDate} by ${creatorName}`;

  return (
    <footer
      className={`text-center text-sm text-gray-500 dark:text-gray-400 ${className}`}
    >
      {footerText}
    </footer>
  );
}

// Utility to provide build-time info safely
export function getBuildTimeInfo(): BuildInfo {
  return {
    buildDate: new Date().toISOString().split('T')[0],
    creatorName: process.env.NEXT_PUBLIC_CREATOR_NAME || 'clnt',
    version: process.env.npm_package_version || '1.0.0',
    commitHash:
      process.env.NEXT_PUBLIC_COMMIT_HASH?.substring(0, 7) || undefined,
  };
}
