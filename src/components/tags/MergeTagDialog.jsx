import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MergeTagDialog({ isOpen, onClose, onConfirm, selectedTags = [] }) {
  const [newName, setNewName] = useState(selectedTags[0] || '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Merge "{selectedTags[0]}" and "{selectedTags[1]}"
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">Choose the name for the merged tag:</p>
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(newName.trim().toLowerCase())} disabled={!newName.trim()}>
            Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
