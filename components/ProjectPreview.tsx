import React, { useState } from 'react';
import { PhonePreview } from './PhonePreview';
import type { Project } from '../types/database';

interface ProjectPreviewProps {
  project: Project;
  onOpen: (projectId: string) => void;
  onPublish?: (projectId: string) => void;
  onUnpublish?: (projectId: string) => void;
  onRemove?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
  onRename?: (projectId: string, newName: string) => void;
  showPublishButton?: boolean;
  showRemoveButton?: boolean;
  showDeleteButton?: boolean;
  showRenameButton?: boolean;
  className?: string;
  // New props for selection
  showCheckbox?: boolean;
  checked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
  isDarkMode?: boolean;
}

export const ProjectPreview: React.FC<ProjectPreviewProps> = ({
  project,
  onOpen,
  onPublish,
  onUnpublish,
  onRemove,
  onDelete,
  onRename,
  showPublishButton = false,
  showRemoveButton = false,
  showDeleteButton = false,
  showRenameButton = false,
  className = '',
  // New props for selection
  showCheckbox = false,
  checked = false,
  onCheckboxChange,
  isDarkMode = false
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const handleRename = () => {
    if (onRename && newName.trim() && newName.trim() !== project.name) {
      onRename(project.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setNewName(project.name);
    setIsRenaming(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  return (
    <div className={`glass-card p-4 md:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg flex ${className}`}>
      {/* Selection Checkbox (if enabled) */}
      {showCheckbox && (
        <div className="flex items-start pr-4 pt-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => onCheckboxChange && onCheckboxChange(e.target.checked)}
            className="w-5 h-5 accent-blue-500"
          />
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1">
        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={handleRename}
                  className="text-lg md:text-xl font-semibold bg-transparent border-b-2 border-blue-500 text-white focus:outline-none focus:border-blue-400"
                  autoFocus
                />
                <button
                  onClick={handleRename}
                  className="text-green-400 hover:text-green-300 text-sm"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancelRename}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg md:text-xl font-semibold text-white break-words">
                    {project.name}
                  </h3>
                  {showRenameButton && onRename && (
                    <button
                      onClick={() => setIsRenaming(true)}
                      className="text-blue-400 hover:text-blue-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Rename project"
                    >
                      ✏️
                    </button>
                  )}
                </div>
                {/* Author display for community */}
                {project.user_full_name || project.user_name ? (
                  <span className="text-xs text-white/60 mt-0.5">
                    by {project.user_full_name || project.user_name}
                  </span>
                ) : null}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full self-start">
              {project.category}
            </span>
            <span className="text-xs text-white/60">
              {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </div>
          
          <p className="text-white/80 text-sm mb-3 line-clamp-2">
            {project.description}
          </p>
          
          {/* Stats for saved projects */}
          {showRemoveButton && (
            <div className="flex items-center gap-4 text-xs text-white/60 mb-3">
              <span>❤️ {project.likes_count || 0} likes</span>
              <span>👁️ {project.views_count || 0} views</span>
              <span>🔄 {project.remix_count || 0} remixes</span>
            </div>
          )}
        </div>
        
        {/* Phone Preview */}
        <div className="flex-shrink-0">
          <div className="w-32 h-64 md:w-40 md:h-80 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-2 shadow-lg">
            <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
              <PhonePreview 
                htmlContent={project.preview_html || ''}
                onPreviewInteraction={() => {}}
                size="tiny"
                onPreviewReady={() => {}}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-2 lg:flex-shrink-0">
          <button
            onClick={() => onOpen(project.id)}
            className="glass-button px-4 py-2 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded text-sm transition-all duration-300 font-medium"
          >
            Open
          </button>
          
          {showPublishButton && onPublish && onUnpublish && (
            <button
              onClick={() => project.is_public ? onUnpublish(project.id) : onPublish(project.id)}
              className={`glass-button px-4 py-2 rounded text-sm transition-all duration-300 font-medium ${
                project.is_public
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
              }`}
            >
              {project.is_public ? 'Unpublish' : 'Publish'}
            </button>
          )}
          
          {showRemoveButton && onRemove && (
            <button
              onClick={() => onRemove(project.id)}
              className="glass-button px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded text-sm transition-all duration-300 font-medium"
            >
              Remove
            </button>
          )}

          {showDeleteButton && onDelete && (
            <button
              onClick={() => onDelete(project.id)}
              className="glass-button px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded text-sm transition-all duration-300 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 