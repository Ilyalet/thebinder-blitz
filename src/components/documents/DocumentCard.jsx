import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Document } from '@/entities/all';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Trash2, FolderInput, FileText, CheckSquare, Loader2 } from 'lucide-react';
import TagBadge from '@/components/ui/TagBadge';
import { useToast } from '@/components/ui/use-toast';

export default function DocumentCard({ doc, tasks = [], onDataRefresh, onDelete, onFavoriteChange, onMove }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const { toast } = useToast();

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleToggleFavorite = async (e) => {
    stop(e);
    setIsTogglingFavorite(true);
    try {
      const newValue = !doc.is_favorite;
      await Document.update(doc.id, { is_favorite: newValue });
      onFavoriteChange?.(doc.id, newValue);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update favorite.' });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleDelete = async (e) => {
    stop(e);
    setIsDeleting(true);
    try {
      await Document.delete(doc.id);
      onDelete?.(doc.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete document.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMove = (e) => {
    stop(e);
    onMove?.(doc);
  };

  const isProcessing = doc.status === 'processing';
  const isFailed = doc.status === 'failed';

  return (
    <Link to={createPageUrl(`Document?id=${doc.id}`)} className="block">
      <Card className="hover:shadow-md transition-shadow h-full">
        <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden flex items-center justify-center">
          {doc.image_url && !doc.image_url.toLowerCase().includes('.pdf') ? (
            <img src={doc.image_url} alt={doc.name} className="w-full h-full object-cover" />
          ) : (
            <FileText className="h-10 w-10 text-gray-400" />
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-1">
              {isProcessing ? 'Processing...' : doc.name || 'Untitled document'}
            </h3>
            <button onClick={handleToggleFavorite} disabled={isTogglingFavorite} className="shrink-0">
              <Star className={`h-4 w-4 ${doc.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
            </button>
          </div>
          {isProcessing && (
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> AI is analyzing this document
            </p>
          )}
          {isFailed && <p className="text-xs text-red-600">Processing failed</p>}
          {!isProcessing && doc.summary && <p className="text-xs text-gray-500 line-clamp-2">{doc.summary}</p>}
          {doc.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {doc.tags.slice(0, 3).map((tag, i) => (
                <TagBadge key={i} tag={tag} />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            {tasks.length > 0 ? (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CheckSquare className="h-3 w-3" /> {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-1">
              <button onClick={handleMove} className="p-1 text-gray-400 hover:text-blue-600">
                <FolderInput className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="p-1 text-gray-400 hover:text-red-600">
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
