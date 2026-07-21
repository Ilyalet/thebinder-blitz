import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Document, Folder, Task } from '@/entities/all';
import DocumentCard from '@/components/documents/DocumentCard';
import TagFilters from '@/components/documents/TagFilters';
import ShareDocumentsModal from '@/components/documents/ShareDocumentsModal';
import CreateFolderDialog from '@/components/folders/CreateFolderDialog';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import MoveDocumentDialog from '@/components/folders/MoveDocumentDialog';
import FolderTree from '@/components/folders/FolderTree';
import DocumentAgent from '@/components/documents/DocumentAgent';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Loader2, Search, Share, Folder as FolderIcon, MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import AiFeatureWrapper from '@/components/ai/AiFeatureWrapper';
import _ from 'lodash';

const PAGE_SIZE = 12;

export default function DocumentsPage() {
  const [allDocuments, setAllDocuments] = useState([]);
  const [paginatedDocuments, setPaginatedDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [displayedDocuments, setDisplayedDocuments] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [docToMove, setDocToMove] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [showAgent, setShowAgent] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const { toast } = useToast();

  const debounceTimeoutRef = useRef(null);

  const hasActiveFilters = useMemo(() => searchTerm.trim() !== '' || selectedTags.length > 0, [searchTerm, selectedTags]);

  const fetchPaginatedData = useCallback(async (page) => {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;
    const [docs, flds, allTasks] = await Promise.all([
      Document.list('-upload_date', PAGE_SIZE + 1, offset),
      Folder.list(),
      Task.list()
    ]);

    setHasNextPage(docs.length > PAGE_SIZE);
    const currentPageDocs = docs.slice(0, PAGE_SIZE);

    setPaginatedDocuments(currentPageDocs);
    setDisplayedDocuments(currentPageDocs);

    setFolders(flds);
    setTasks(allTasks);
    setLoading(false);
  }, []);

  const fetchAllDataAndFilter = useCallback(async () => {
    setLoading(true);
    setIsSearching(true);

    let docsToFilter = allDocuments;
    if (allDocuments.length === 0) {
      docsToFilter = await Document.list('-upload_date');
      setAllDocuments(docsToFilter);
    }

    let currentFilteredDocs = docsToFilter;

    if (selectedTags.length > 0) {
      currentFilteredDocs = currentFilteredDocs.filter(doc => {
        if (!doc.tags) return false;
        const docTags = doc.tags.map(tag => tag.toLowerCase());
        return selectedTags.every(selectedTag =>
          docTags.some(docTag => docTag.includes(selectedTag.toLowerCase()))
        );
      });
    }

    if (searchTerm.trim()) {
      const lowercasedFilter = searchTerm.toLowerCase();
      currentFilteredDocs = currentFilteredDocs.filter(item =>
        (item.name || '').toLowerCase().includes(lowercasedFilter) ||
        (item.summary || '').toLowerCase().includes(lowercasedFilter) ||
        (item.tags || []).some(tag => tag.toLowerCase().includes(lowercasedFilter)) ||
        (item.extracted_text || '').toLowerCase().includes(lowercasedFilter)
      );
    }

    setDisplayedDocuments(currentFilteredDocs);
    setIsSearching(false);
    setLoading(false);
  }, [allDocuments, searchTerm, selectedTags]);

  useEffect(() => {
    if (hasActiveFilters) {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => fetchAllDataAndFilter(), 300);
    } else {
      fetchPaginatedData(currentPage);
    }

    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
  }, [searchTerm, selectedTags, hasActiveFilters, currentPage, fetchAllDataAndFilter, fetchPaginatedData]);

  useEffect(() => {
    if (!hasActiveFilters) {
      setCurrentPage(1);
    }
  }, [hasActiveFilters]);


  const masterTagList = useMemo(() => {
    const tagsSource = (hasActiveFilters || allDocuments.length > 0) ? allDocuments : paginatedDocuments;
    const allTags = new Set();
    tagsSource.forEach(doc => doc.tags?.forEach(tag => tag && tag.trim() && allTags.add(tag.toLowerCase().trim())));
    return Array.from(allTags).sort();
  }, [hasActiveFilters, allDocuments, paginatedDocuments]);

  const availableTags = useMemo(() => {
    const activeSearch = searchTerm.trim() || selectedTags.length > 0;
    if (!activeSearch) return masterTagList;
    const tagsInDisplayedDocs = new Set();
    displayedDocuments.forEach(doc => doc.tags?.forEach(tag => tagsInDisplayedDocs.add(tag.toLowerCase().trim())));
    selectedTags.forEach(tag => tagsInDisplayedDocs.add(tag.toLowerCase().trim()));
    return Array.from(tagsInDisplayedDocs).sort();
  }, [displayedDocuments, masterTagList, searchTerm, selectedTags]);

  const handleDataRefresh = useCallback(() => {
    if (hasActiveFilters) {
      fetchAllDataAndFilter();
    } else {
      fetchPaginatedData(currentPage);
    }
  }, [hasActiveFilters, fetchAllDataAndFilter, fetchPaginatedData, currentPage]);

  const handleDeleteDoc = (docId) => {
    setAllDocuments(prev => prev.filter(d => d.id !== docId));
    setPaginatedDocuments(prev => prev.filter(d => d.id !== docId));
    setDisplayedDocuments(prev => prev.filter(d => d.id !== docId));
    toast({ title: 'Success', description: "Document deleted." });
    handleDataRefresh();
  };

  const handleFavoriteChange = (docId, isFavorite) => {
    const update = (docs) => docs.map(d => d.id === docId ? { ...d, is_favorite: isFavorite } : d);
    setAllDocuments(update);
    setPaginatedDocuments(update);
    setDisplayedDocuments(update);
  };

  const handleClearAllTags = () => setSelectedTags([]);

  const handleFolderCreated = (newFolder) => {
      setFolders(prev => _.uniqBy([...prev, newFolder], 'id'));
      toast({ title: 'Success', description: `Folder "${newFolder.name}" created.` });
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    const hasDocs = allDocuments.some(d => d.folder_id === folderToDelete.id);
    if (hasDocs) {
        toast({ variant: "destructive", title: "Cannot delete", description: "Folder is not empty." });
        setFolderToDelete(null);
        return;
    }

    await Folder.delete(folderToDelete.id);
    setFolders(prev => prev.filter(f => f.id !== folderToDelete.id));
    toast({ title: 'Success', description: `Folder "${folderToDelete.name}" deleted.` });
    setFolderToDelete(null);
  };

  const handleMoveDocument = async (docId, newFolderId) => {
      await Document.update(docId, { folder_id: newFolderId });
      const updateDocFolder = (docs) => docs.map(d => d.id === docId ? { ...d, folder_id: newFolderId } : d);
      setAllDocuments(updateDocFolder);
      setPaginatedDocuments(updateDocFolder);
      setDisplayedDocuments(updateDocFolder);
      setDocToMove(null);
      toast({ title: 'Success', description: "Document moved." });
      handleDataRefresh();
  };

  const filteredDocsForFolderView = useMemo(() => {
    const sourceDocs = allDocuments.length > 0 ? allDocuments : paginatedDocuments;
    return sourceDocs.filter(doc => (doc.folder_id || null) === selectedFolderId);
  }, [allDocuments, paginatedDocuments, selectedFolderId]);

  const CurrentFolderDisplay = () => {
      if (selectedFolderId === null) {
          return <h2 className="text-xl font-semibold">Unfiled Documents</h2>;
      }
      const folder = folders.find(f => f.id === selectedFolderId);
      return <h2 className="text-xl font-semibold flex items-center gap-2"><FolderIcon className="w-5 h-5" /> {folder?.name}</h2>;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Documents</h1>
              <p className="text-sm text-gray-500 mt-1">Search, filter, and organize your documents.</p>
            </div>
            <AiFeatureWrapper featureName="Document Assistant">
              <Button
                onClick={() => setShowAgent(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask Assistant
              </Button>
            </AiFeatureWrapper>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            <Tabs defaultValue="all-docs" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="all-docs">Documents</TabsTrigger>
                    <TabsTrigger value="by-folder">By Folder</TabsTrigger>
                </TabsList>

                <TabsContent value="all-docs">
                  <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      {isSearching && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />}
                    </div>
                  </div>

                  {!loading && <TagFilters availableTags={availableTags} selectedTags={selectedTags} onTagSelect={setSelectedTags} onClearAll={handleClearAllTags}/>}

                  {loading ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>
                  ) : (
                    <>
                      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {hasActiveFilters ? (
                              <div className="text-sm text-gray-600">Showing {displayedDocuments.length} matching documents</div>
                          ) : (
                              <div className="text-sm text-gray-600">Page {currentPage}</div>
                          )}
                          <AiFeatureWrapper
                            featureName="Document Sharing & Export"
                            placeholder={
                              <Button
                                disabled
                                className="bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                              >
                                <Share className="w-4 h-4 mr-2" />
                                Share/Export ({displayedDocuments.length})
                              </Button>
                            }
                          >
                            <Button
                              onClick={() => setShowShareModal(true)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={!hasActiveFilters && displayedDocuments.length === 0}
                            >
                              <Share className="w-4 h-4 mr-2" />
                              Share/Export ({displayedDocuments.length})
                            </Button>
                          </AiFeatureWrapper>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {displayedDocuments.map(doc => {
                          const relatedTasks = tasks.filter(t => t.document_id === doc.id);
                          return <DocumentCard
                            key={doc.id}
                            doc={doc}
                            tasks={relatedTasks}
                            onDataRefresh={handleDataRefresh}
                            onDelete={handleDeleteDoc}
                            onFavoriteChange={handleFavoriteChange}
                            onMove={setDocToMove}
                          />
                        })}
                      </div>

                      {!hasActiveFilters && (
                        <div className="mt-8 flex justify-center items-center gap-4">
                          <Button
                            onClick={() => setCurrentPage(p => p - 1)}
                            disabled={currentPage === 1}
                            variant="outline"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                          </Button>
                          <span className="text-sm font-medium">Page {currentPage}</span>
                          <Button
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={!hasNextPage}
                            variant="outline"
                          >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  {!loading && displayedDocuments.length === 0 && (
                    <div className="text-center py-16">
                      <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
                      <p className="text-sm text-gray-500 mt-2">{hasActiveFilters ? "Try adjusting your search or tag filters." : "You haven't scanned any documents yet."}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="by-folder">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1 border-r pr-4">
                            <FolderTree
                                folders={folders}
                                selectedFolderId={selectedFolderId}
                                onSelectFolder={setSelectedFolderId}
                                onCreateFolder={() => setShowCreateFolderDialog(true)}
                                onDeleteFolder={setFolderToDelete}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <div className="mb-4">
                                <CurrentFolderDisplay />
                            </div>
                            {loading ? (
                              <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>
                            ) : (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {filteredDocsForFolderView.map(doc => {
                                      const relatedTasks = tasks.filter(t => t.document_id === doc.id);
                                      return <DocumentCard
                                        key={doc.id}
                                        doc={doc}
                                        tasks={relatedTasks}
                                        onDataRefresh={handleDataRefresh}
                                        onDelete={handleDeleteDoc}
                                        onFavoriteChange={handleFavoriteChange}
                                        onMove={setDocToMove}
                                      />
                                    })}
                                </div>
                                {filteredDocsForFolderView.length === 0 && (
                                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                        <p className="text-gray-500">This folder is empty.</p>
                                        <p className="text-sm text-gray-400 mt-2">Drag documents here to add them.</p>
                                    </div>
                                )}
                              </>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <ShareDocumentsModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} documents={displayedDocuments} selectedTags={selectedTags} searchTerm={searchTerm} />
      <CreateFolderDialog isOpen={showCreateFolderDialog} onClose={() => setShowCreateFolderDialog(false)} onFolderCreated={handleFolderCreated} />
      {folderToDelete && <DeleteConfirmationDialog isOpen={!!folderToDelete} onClose={() => setFolderToDelete(null)} onConfirm={handleDeleteFolder} itemName={folderToDelete.name} />}
      {docToMove && <MoveDocumentDialog isOpen={!!docToMove} onClose={() => setDocToMove(null)} onConfirm={handleMoveDocument} folders={folders} documentToMove={docToMove} />}
      {showAgent && <DocumentAgent onClose={() => setShowAgent(false)} />}
    </div>
  );
}
