import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check } from 'lucide-react';

// Simplified rebuild: the original app's share/export behavior wasn't in the
// pasted source, so this exports a plain-text summary (copy or download)
// rather than guessing at a link-sharing backend we don't have.
export default function ShareDocumentsModal({ isOpen, onClose, documents = [], selectedTags = [], searchTerm }) {
  const [copied, setCopied] = useState(false);

  const summaryText = documents
    .map((doc) => `- ${doc.name}${doc.summary ? `: ${doc.summary}` : ''}${doc.tags?.length ? ` [${doc.tags.join(', ')}]` : ''}`)
    .join('\n');

  const header = `Documents export${searchTerm ? ` — search: "${searchTerm}"` : ''}${
    selectedTags?.length ? ` — tags: ${selectedTags.join(', ')}` : ''
  }\n\n`;
  const fullText = header + (summaryText || 'No documents to export.');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documents-export.txt';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share & Export ({documents.length})</DialogTitle>
          <DialogDescription>Copy or download a plain-text summary of these documents.</DialogDescription>
        </DialogHeader>
        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap text-xs bg-gray-50 border rounded-md p-3">{fullText}</pre>
        <DialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" /> Download .txt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
