import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TagFilters({ availableTags = [], selectedTags = [], onTagSelect, onClearAll }) {
  if (availableTags.length === 0) return null;

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagSelect(selectedTags.filter((t) => t !== tag));
    } else {
      onTagSelect([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {availableTags.map((tag) => (
        <button key={tag} onClick={() => toggleTag(tag)}>
          <Badge
            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
            className={cn('cursor-pointer', selectedTags.includes(tag) ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100')}
          >
            {tag}
          </Badge>
        </button>
      ))}
      {selectedTags.length > 0 && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 text-xs text-gray-500">
          <X className="h-3 w-3 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
