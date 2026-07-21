import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MoveDocumentDialog({ isOpen, onClose, onConfirm, folders = [], documentToMove }) {
  const [folderId, setFolderId] = useState(documentToMove?.folder_id || 'none');

  const handleConfirm = () => {
    onConfirm(documentToMove.id, folderId === 'none' ? null : folderId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move "{documentToMove?.name}"</DialogTitle>
        </DialogHeader>
        <Select value={folderId} onValueChange={setFolderId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unfiled</SelectItem>
            {folders.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
