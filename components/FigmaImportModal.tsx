import React, { useState, useEffect } from 'react';
import { FigmaIcon } from './icons/FigmaIcon';

interface FigmaProject {
  key: string;
  name: string;
  thumbnailUrl?: string;
  lastModified: string;
}

interface FigmaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectSelect: (projectKey: string, projectName: string) => void;
  isDarkMode?: boolean;
}

export const FigmaImportModal: React.FC<FigmaImportModalProps> = ({
  isOpen,
  onClose,
  onProjectSelect,
  isDarkMode = false
}) => {
  const [step, setStep] = useState<'auth' | 'projects' | 'loading'>('auth');
  const [apiKey, setApiKey] = useState('');
  const [projects, setProjects] = useState<FigmaProject[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('auth');
      setApiKey('');
      setProjects([]);
      setError('');
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Figma Personal Access Token');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Test the API key by fetching user info
      const response = await fetch('https://api.figma.com/v1/me', {
        headers: {
          'X-Figma-Token': apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Invalid API key. Please check your Personal Access Token.');
      }

      // Fetch user's projects
      const projectsResponse = await fetch('https://api.figma.com/v1/me/files', {
        headers: {
          'X-Figma-Token': apiKey
        }
      });

      if (!projectsResponse.ok) {
        throw new Error('Failed to fetch projects. Please try again.');
      }

      const projectsData = await projectsResponse.json();
      const formattedProjects: FigmaProject[] = projectsData.files.map((file: any) => ({
        key: file.key,
        name: file.name,
        thumbnailUrl: file.thumbnailUrl,
        lastModified: file.lastModified
      }));

      setProjects(formattedProjects);
      setStep('projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = (project: FigmaProject) => {
    onProjectSelect(project.key, project.name);
    onClose();
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
        isDarkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <FigmaIcon className="h-6 w-6 text-purple-500" />
            <h2 className={`text-xl font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Import from Figma
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'auth' && (
            <div className="space-y-4">
              <div>
                <h3 className={`text-lg font-medium mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Connect to Figma
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Enter your Figma Personal Access Token to import your designs.
                </p>
              </div>

              <div className="space-y-2">
                <label className={`block text-sm font-medium ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Personal Access Token
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Figma Personal Access Token"
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500'
                  }`}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApiKeySubmit}
                  disabled={isLoading || !apiKey.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
              </div>

              <div className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <p className="mb-2">Don't have a Personal Access Token?</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to your Figma account settings</li>
                  <li>Navigate to Personal access tokens</li>
                  <li>Create a new token with read access</li>
                  <li>Copy and paste the token above</li>
                </ol>
              </div>
            </div>
          )}

          {step === 'projects' && (
            <div className="space-y-4">
              <div>
                <h3 className={`text-lg font-medium mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Select a Project
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Choose a Figma file to import into myPip.
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search projects..."
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500'
                  }`}
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Projects List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredProjects.length === 0 ? (
                  <div className={`text-center py-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {searchTerm ? 'No projects found matching your search.' : 'No projects available.'}
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <button
                      key={project.key}
                      onClick={() => handleProjectSelect(project)}
                      className={`w-full p-3 rounded-lg border transition-colors text-left ${
                        isDarkMode
                          ? 'border-gray-600 hover:bg-gray-700 hover:border-gray-500'
                          : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {project.thumbnailUrl ? (
                          <img 
                            src={project.thumbnailUrl} 
                            alt={project.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${
                            isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                          }`}>
                            <FigmaIcon className="h-4 w-4 text-purple-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {project.name}
                          </p>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Last modified: {new Date(project.lastModified).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('auth')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 