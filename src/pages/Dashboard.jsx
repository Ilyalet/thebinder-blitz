import React, { useState, useEffect } from 'react';
import { Document, Task, Folder } from '@/entities/all';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AIDocumentScanner from '@/components/dashboard/AIDocumentScanner';
import MoveDocumentDialog from '@/components/folders/MoveDocumentDialog';
import DocumentCard from '@/components/documents/DocumentCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import TipOfTheDay from '@/components/dashboard/TipOfTheDay';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docToMove, setDocToMove] = useState(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docs, allTasks, flds] = await Promise.all([
        Document.list('-upload_date'),
        Task.list(),
        Folder.list(),
      ]);

      setDocuments(docs);
      setFolders(flds);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll for new documents every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleUploadComplete = () => {
    toast({
      title: 'Scan complete',
      description: 'Refreshing your documents...',
    });
    fetchData();
  };

  const handleDelete = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setTasks(prev => prev.filter(t => t.document_id !== docId));
  }

  const handleFavoriteChange = (docId, isFavorite) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === docId ? { ...doc, is_favorite: isFavorite } : doc
    ));
  }

  const handleMoveDocument = async (docId, newFolderId) => {
    await Document.update(docId, { folder_id: newFolderId });
    fetchData();
    setDocToMove(null);
    toast({ title: 'Success', description: 'Document moved.' });
  };

  const recentDocuments = documents.slice(0, 4);
  const favoriteDocuments = documents.filter(d => d.is_favorite);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening with your documents and tasks.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Scan or upload a document</h2>
          <p className="text-sm text-gray-500 mb-4">
            Receipts, warranties, bills, insurance policies, contracts, appointment letters — anything paper or PDF.
            TheBinder reads it, files it by type, and turns any deadlines or appointments it finds into tasks and reminders automatically, so everything stays organized and nothing gets missed.
          </p>
          <AIDocumentScanner onUploadComplete={handleUploadComplete} />
        </div>

        <TipOfTheDay />

        <div>
          <Tabs defaultValue="recent">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
              <div className="flex items-center gap-4 justify-end">
                <TabsList>
                  <TabsTrigger value="recent" className="text-xs sm:text-sm">Recent</TabsTrigger>
                  <TabsTrigger value="favorites" className="text-xs sm:text-sm">Favorites ({favoriteDocuments.length})</TabsTrigger>
                </TabsList>
                <Link to={createPageUrl('Documents')}>
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm">View all</Button>
                </Link>
              </div>
            </div>
            {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : (
              <>
                <TabsContent value="recent">
                  {recentDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {recentDocuments.map(doc => {
                        const relatedTasks = tasks.filter(t => t.document_id === doc.id);
                        return (
                          <DocumentCard
                            key={doc.id}
                            doc={doc}
                            tasks={relatedTasks}
                            onDataRefresh={fetchData}
                            onDelete={handleDelete}
                            onFavoriteChange={handleFavoriteChange}
                            onMove={setDocToMove}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center py-10 text-gray-500">No recent documents yet.</p>
                  )}
                </TabsContent>
                <TabsContent value="favorites">
                  {favoriteDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                      {favoriteDocuments.map(doc => {
                        const relatedTasks = tasks.filter(t => t.document_id === doc.id);
                        return (
                          <DocumentCard
                            key={doc.id}
                            doc={doc}
                            tasks={relatedTasks}
                            onDataRefresh={fetchData}
                            onDelete={handleDelete}
                            onFavoriteChange={handleFavoriteChange}
                            onMove={setDocToMove}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center py-10 text-gray-500">No favorite documents yet.</p>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>

      {docToMove && <MoveDocumentDialog isOpen={!!docToMove} onClose={() => setDocToMove(null)} onConfirm={handleMoveDocument} folders={folders} documentToMove={docToMove} />}

    </div>
  );
}
