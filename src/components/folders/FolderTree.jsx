import React from 'react';
import { Button } from '@/components/ui/button';
import { Folder as FolderIcon, Plus, Trash2, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FolderTree({ folders = [], selectedFolderId, onSelectFolder, onCreateFolder, onDeleteFolder }) {
  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelectFolder(null)}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left',
          selectedFolderId === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
        )}
      >
        <Inbox className="h-4 w-4" /> Unfiled
      </button>
      {folders.map((folder) => (
        <div key={folder.id} className="group flex items-center">
          <button
            onClick={() => onSelectFolder(folder.id)}
            className={cn(
              'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left truncate',
              selectedFolderId === folder.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            <FolderIcon className="h-4 w-4 shrink-0" /> <span className="truncate">{folder.name}</span>
          </button>
          <button onClick={() => onDeleteFolder(folder)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={onCreateFolder} className="w-full justify-start text-gray-500 mt-2">
        <Plus className="h-4 w-4 mr-2" /> New Folder
      </Button>
    </div>
  );
}
