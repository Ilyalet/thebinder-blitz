import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RenameTagDialog({ isOpen, onClose, onConfirm, currentName }) {
  const [newName, setNewName] = useState(currentName || '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename tag "{currentName}"</DialogTitle>
        </DialogHeader>
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(currentName, newName.trim().toLowerCase())} disabled={!newName.trim()}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
