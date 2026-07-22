import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from "react-router-dom";
import { Document, Task, TaskSuggestion, TagSuggestion } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Trash2, Download, ExternalLink, Plus, Bell, Loader2, RefreshCw, AlertTriangle, CheckCircle, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import TaskCreator from '../components/tasks/TaskCreator';
import TaskList from '../components/tasks/TaskList';
import TagBadge from '@/components/ui/TagBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from "@/components/ui/input";

const TaskSuggestionItem = ({ suggestion, onApprove, onDecline }) => {
    const [isApproving, setIsApproving] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);

    const handleApprove = async () => {
        setIsApproving(true);
        await onApprove(suggestion);
        setIsApproving(false);
    };

    const handleDecline = async () => {
        setIsDeclining(true);
        await onDecline(suggestion);
        setIsDeclining(false);
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 border-blue-200">
            <div>
                <p className="font-medium text-blue-900">{suggestion.title}</p>
                {suggestion.due_date && (
                    <p className="text-sm text-blue-700">
                        Due: {format(new Date(suggestion.due_date), 'PPP')}
                        {suggestion.type === 'reminder' && suggestion.due_time && ` at ${suggestion.due_time}`}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDecline}
                    disabled={isDeclining || isApproving}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                >
                    {isDeclining ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Decline'}
                </Button>
                <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={isApproving || isDeclining}
                >
                    {isApproving ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Approve
                </Button>
            </div>
        </div>
    );
};

const TagSuggestionItem = ({ tagName, onApprove, onDecline }) => {
    const [isApproving, setIsApproving] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);

    const handleApprove = async () => {
        setIsApproving(true);
        await onApprove(tagName);
        setIsApproving(false);
    };

    const handleDecline = async () => {
        setIsDeclining(true);
        await onDecline(tagName);
        setIsDeclining(false);
    };

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-blue-50 border-blue-200">
            <span className="text-sm font-medium text-blue-900">{tagName}</span>
            <div className="flex items-center gap-1">
                <button
                    onClick={handleDecline}
                    disabled={isDeclining || isApproving}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                    {isDeclining ? <Loader2 className="h-3 w-3 animate-spin"/> : <X className="h-3 w-3" />}
                </button>
                <button
                    onClick={handleApprove}
                    disabled={isApproving || isDeclining}
                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                >
                    {isApproving ? <Loader2 className="h-3 w-3 animate-spin"/> : <CheckCircle className="h-3 w-3" />}
                </button>
            </div>
        </div>
    );
};

export default function DocumentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doc, setDoc] = useState(null);
  const [taskSuggestions, setTaskSuggestions] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showTaskCreator, setShowTaskCreator] = useState(null);
  const [duplicateDocuments, setDuplicateDocuments] = useState([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Guards against processDocumentDetails firing twice for the same document
  // (e.g. React StrictMode double-invoking the mount effect below), which
  // would otherwise create duplicate tag/task suggestions.
  const autoProcessedDocIds = useRef(new Set());

  const docId = searchParams.get("id");

  const processDocumentDetails = useCallback(async (document) => {
    try {
        setDoc(prev => ({...prev, status: 'processing'}));

        let extractedText = document.extracted_text || "";
        if (!extractedText) {
            const textResult = await InvokeLLM({
                prompt: `You are performing OCR on a document image. Extract ALL text EXACTLY as it appears in the image.

CRITICAL INSTRUCTIONS - DO NOT TRANSLATE:
- If text is in Hebrew (עברית), extract it in Hebrew characters
- If text is in Arabic (العربية), extract it in Arabic characters
- If text is in English, extract it in English
- If text is in any other language, keep it in that language
- Preserve ALL characters, numbers, punctuation, and special symbols exactly as shown
- Do NOT translate, interpret, or modify the text in any way

Examples of correct extraction:
Hebrew: "קבלה מסופרמרקט סה״כ 150 ש״ח"
English: "Invoice from ABC Company Total $150"
Arabic: "فاتورة من شركة ABC"

Return ONLY the extracted text in its original language.`,
                file_urls: [document.image_url],
                response_json_schema: {
                    type: "object",
                    properties: {
                        extracted_text: { type: "string" }
                    },
                    required: ["extracted_text"]
                }
            });
            extractedText = textResult.extracted_text || "";

            await Document.update(document.id, { extracted_text: extractedText });
            setDoc(prev => ({...prev, extracted_text: extractedText}));
        }

        let docName = document.name;
        let docSummary = document.summary;

        if (!docName || !docSummary) {
            const metadataResult = await InvokeLLM({
                prompt: `Analyze this document and create metadata.

Document content:
"""
${extractedText.substring(0, 3000)}
"""

Instructions:
1. Create a title in THE SAME LANGUAGE as the document content
2. Create a summary in THE SAME LANGUAGE as the document content
3. Generate relevant tags in English only (lowercase)

Examples:
- Hebrew document → {"title": "קבלה מסופרמרקט", "summary": "קבלה על רכישת מוצרים", "tags": ["receipt", "shopping"]}
- English document → {"title": "Grocery Receipt", "summary": "Receipt for grocery purchase", "tags": ["receipt", "shopping"]}
- Arabic document → {"title": "فاتورة", "summary": "فاتورة شراء", "tags": ["invoice", "purchase"]}

Match the language of the content for title and summary. Only tags are in English.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        summary: { type: "string" },
                        tags: { type: "array", items: { type: "string" } }
                    },
                    required: ["title", "summary", "tags"]
                }
            });
            docName = metadataResult.title;
            docSummary = metadataResult.summary;

            if (metadataResult.tags && metadataResult.tags.length > 0) {
                const tagSuggestionsToCreate = metadataResult.tags.map(tag => ({
                    document_id: document.id,
                    tag: tag.toLowerCase(),
                    status: 'pending'
                }));
                const createdTagSuggestions = await TagSuggestion.bulkCreate(tagSuggestionsToCreate);
                setTagSuggestions(createdTagSuggestions);
            }

            await Document.update(document.id, { name: docName, summary: docSummary });
            setDoc(prev => ({...prev, name: docName, summary: docSummary}));
        }

        if (extractedText.trim().length > 50) {
            const allDocs = await Document.list();
            const otherDocs = allDocs.filter(d => d.id !== document.id && d.extracted_text && d.extracted_text.trim().length > 50);

            if (otherDocs.length > 0) {
                const docsForComparison = otherDocs.slice(0, 10).map(d => ({
                    id: d.id,
                    name: d.name,
                    text_sample: d.extracted_text.substring(0, 500)
                }));

                try {
                    const duplicateResult = await InvokeLLM({
                        prompt: `Compare this document with existing ones. Return IDs of documents with >70% content similarity.

Current document text (first 500 chars):
${extractedText.substring(0, 500)}

Existing documents:
${JSON.stringify(docsForComparison, null, 2)}

Return array of duplicate document IDs, or empty array if none similar.`,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                duplicate_ids: { type: "array", items: { type: "string" } }
                            },
                            required: ["duplicate_ids"]
                        }
                    });

                    if (duplicateResult.duplicate_ids && duplicateResult.duplicate_ids.length > 0) {
                        const duplicates = allDocs.filter(d => duplicateResult.duplicate_ids.includes(d.id));
                        setDuplicateDocuments(duplicates);
                    }
                } catch (error) {
                    console.error("Duplicate check failed:", error);
                }
            }
        }

        if (extractedText.trim().length > 10) {
            const today = format(new Date(), 'yyyy-MM-dd');
            const taskResult = await InvokeLLM({
                prompt: `Extract tasks or reminders from this document. Write them in THE SAME LANGUAGE as the document.

Document text:
"""
${extractedText.substring(0, 2000)}
"""

Today's date: ${today}

Instructions:
- If the document is in Hebrew, write tasks in Hebrew
- If the document is in English, write tasks in English
- If the document is in another language, write tasks in that language
- Return an empty array if no tasks/reminders are found
- A "task" is a to-do item: give it a due_date only if the document states a deadline, and never give it a due_time.
- A "reminder" is a calendar event: it must have both due_date and due_time. Only classify something as a reminder if the document specifies (or clearly implies) an actual clock time (e.g. an appointment, a meeting) — otherwise classify it as a task.

Return tasks/reminders in the document's original language.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggestions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    due_date: { type: "string", format: "date" },
                                    due_time: { type: "string", description: "24h HH:MM, reminders only" },
                                    priority: { type: "string", enum: ["low", "medium", "high"] },
                                    type: { type: "string", enum: ["task", "reminder"] }
                                },
                                required: ["title", "priority", "type"]
                            }
                        }
                    }
                }
            });
            if (taskResult.suggestions && taskResult.suggestions.length > 0) {
                const suggestionsToCreate = taskResult.suggestions.map(s => ({ ...s, document_id: document.id }));
                const createdSuggestions = await TaskSuggestion.bulkCreate(suggestionsToCreate);
                setTaskSuggestions(createdSuggestions);
            }
        }

        await Document.update(document.id, { status: 'completed' });
        setDoc(prev => ({...prev, status: 'completed'}));

    } catch (error) {
        console.error("Processing error:", error);
        await Document.update(document.id, { status: 'failed', processing_error: error.message });
        setDoc(prev => ({...prev, status: 'failed', processing_error: error.message}));
        toast({ variant: "destructive", title: "Processing Failed", description: error.message });
    }
  }, [toast]);

  const loadData = useCallback(async (id) => {
    setIsLoading(true);
    try {
      const documentData = await Document.get(id);
      setDoc(documentData);

      const suggestions = await TaskSuggestion.filter({ document_id: id, status: 'pending' });
      setTaskSuggestions(suggestions);

      const tagSuggestionsList = await TagSuggestion.filter({ document_id: id, status: 'pending' });
      setTagSuggestions(tagSuggestionsList);

      setDuplicateDocuments([]);

      if (documentData.status === 'processing' && !autoProcessedDocIds.current.has(id)) {
        autoProcessedDocIds.current.add(id);
        await processDocumentDetails(documentData);
      }
    } catch (error) {
      console.error("Error loading document:", error);
      toast({ variant: "destructive", title: "Failed to load document." });
      navigate(createPageUrl("Dashboard"));
    }
    setIsLoading(false);
  }, [toast, navigate, processDocumentDetails]);

  useEffect(() => {
    if (docId) {
      loadData(docId);
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  }, [docId, loadData, navigate]);

  const handleDelete = async () => {
    if (!doc) return;
    try {
      await Document.delete(doc.id);
      toast({ title: "Document deleted successfully." });
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to delete document." });
    }
  };

  const handleTaskCreated = () => {
    setTaskRefreshTrigger(prev => prev + 1);
    setShowTaskCreator(null);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const openDocumentInNewTab = () => {
    if (doc?.image_url) {
      window.open(doc.image_url, '_blank');
    }
  };

  const handleApproveSuggestion = async (suggestion) => {
    try {
        await Task.create({
            title: suggestion.title,
            description: suggestion.description,
            due_date: suggestion.due_date,
            due_time: suggestion.type === 'reminder' ? suggestion.due_time : null,
            priority: suggestion.priority,
            type: suggestion.type,
            status: "pending",
            document_id: doc.id,
        });
        await TaskSuggestion.update(suggestion.id, { status: 'approved' });
        setTaskSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        setTaskRefreshTrigger(prev => prev + 1);
        toast({ title: "Success", description: `${suggestion.type} created.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: `Failed to create ${suggestion.type}.`});
    }
  };

  const handleDeclineSuggestion = async (suggestion) => {
    try {
        await TaskSuggestion.update(suggestion.id, { status: 'rejected' });
        setTaskSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        toast({ title: "Success", description: "Suggestion declined." });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to decline suggestion."});
    }
  };

  const handleApproveTag = async (tagName) => {
    try {
        const currentTags = doc.tags || [];
        const normalizedTagName = tagName.toLowerCase();
        if (!currentTags.includes(normalizedTagName)) {
            const newTags = [...currentTags, normalizedTagName];
            await Document.update(doc.id, { tags: newTags });
            setDoc(prev => ({...prev, tags: newTags}));
        }

        const suggestionToUpdate = tagSuggestions.find(s => s.tag === normalizedTagName);
        if (suggestionToUpdate) {
            await TagSuggestion.update(suggestionToUpdate.id, { status: 'approved' });
            setTagSuggestions(prev => prev.filter(s => s.id !== suggestionToUpdate.id));
        }

        toast({ title: "Success", description: `Tag '${tagName}' added.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to add tag."});
    }
  };

  const handleDeclineTag = async (tagName) => {
    try {
        const normalizedTagName = tagName.toLowerCase();
        const suggestionToUpdate = tagSuggestions.find(s => s.tag === normalizedTagName);
        if (suggestionToUpdate) {
            await TagSuggestion.update(suggestionToUpdate.id, { status: 'rejected' });
            setTagSuggestions(prev => prev.filter(s => s.id !== suggestionToUpdate.id));
        }
        toast({ title: "Success", description: `Tag '${tagName}' declined.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to decline tag."});
    }
  };

  const handleRemoveApprovedTag = async (tagName) => {
    try {
        const currentTags = doc.tags || [];
        const newTags = currentTags.filter(t => t !== tagName);
        await Document.update(doc.id, { tags: newTags });
        setDoc(prev => ({...prev, tags: newTags}));
        toast({ title: "Success", description: `Tag '${tagName}' removed.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to remove tag."});
    }
  };

  const handleAddCustomTag = async () => {
    const tagName = newTagInput.trim().toLowerCase();
    if (!tagName) return;

    setIsAddingTag(true);
    try {
        const currentTags = doc.tags || [];
        if (currentTags.includes(tagName)) {
            toast({ variant: "destructive", title: "Tag already exists" });
            return;
        }

        const newTags = [...currentTags, tagName];
        await Document.update(doc.id, { tags: newTags });
        setDoc(prev => ({...prev, tags: newTags}));
        setNewTagInput("");
        toast({ title: "Success", description: `Custom tag '${tagName}' added.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to add custom tag."});
    } finally {
        setIsAddingTag(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-500" /><p className="mt-2 text-gray-500">Loading document...</p></div>;
  }

  if (!doc) {
    return <div className="p-6 text-center">Document not found.</div>;
  }

  const isProcessing = doc.status === 'processing';
  const isFailed = doc.status === 'failed';
  const isProbablyPDF = doc.image_url?.toLowerCase().includes('.pdf') ||
                       doc.name?.toLowerCase().includes('.pdf') ||
                       imageError;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(createPageUrl("Dashboard"))}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <div>
            {isFailed && (
                <Button variant="outline" className="mr-2" onClick={() => processDocumentDetails(doc)}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Retry Processing
                </Button>
            )}
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {isFailed && (
            <Card className="mb-6 bg-red-50 border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800"><AlertTriangle className="h-5 w-5" /> Processing Failed</CardTitle>
                    <CardDescription className="text-red-700">
                        The AI could not process this document. You can retry or edit details manually.
                        {doc.processing_error && <p className="mt-2 text-xs">Error: {doc.processing_error}</p>}
                    </CardDescription>
                </CardHeader>
            </Card>
        )}

        {isProcessing && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Loader2 className="h-5 w-5 animate-spin" /> Processing Document
              </CardTitle>
              <CardDescription className="text-blue-700">
                AI is analyzing your document. This may take a moment.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {duplicateDocuments.length > 0 && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" /> Possible Duplicates
              </CardTitle>
              <CardDescription className="text-yellow-700">
                This document appears similar to existing documents:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {duplicateDocuments.map(dupDoc => (
                  <div key={dupDoc.id} className="p-3 bg-white border border-yellow-300 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{dupDoc.name}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded: {dupDoc.upload_date ? format(new Date(dupDoc.upload_date), 'PPP') : 'N/A'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(createPageUrl(`Document?id=${dupDoc.id}`))}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                {isProcessing ? <Skeleton className="h-8 w-3/4" /> : <CardTitle className="text-2xl">{doc.name}</CardTitle>}
                {isProcessing ? <Skeleton className="h-4 w-full mt-2" /> : <p className="text-gray-500">{doc.summary}</p>}
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {isProcessing ? (
                      <>
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-20" />
                      </>
                    ) : (
                      <>
                        {doc.tags?.map((tag, index) => (
                          <div key={index} className="inline-flex items-center gap-1">
                            <TagBadge tag={tag} />
                            <button
                              onClick={() => handleRemoveApprovedTag(tag)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <div className="inline-flex items-center gap-1">
                          <Input
                            placeholder="Add tag..."
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleAddCustomTag();
                            }}
                            className="h-6 w-24 text-xs px-2"
                            disabled={isAddingTag}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleAddCustomTag}
                            disabled={isAddingTag || !newTagInput.trim()}
                            className="h-6 px-2"
                          >
                            {isAddingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-400 mt-4">
                  Uploaded on {doc.upload_date ? format(new Date(doc.upload_date), 'PPP') : 'N/A'}
                </div>
              </CardContent>
            </Card>

            {(tagSuggestions.length > 0 || (isProcessing && !doc.tags && tagSuggestions.length === 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Tags</CardTitle>
                  <CardDescription>Review and approve AI-suggested tags.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {isProcessing && tagSuggestions.length === 0 ? (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating tag suggestions...
                      </p>
                    ) : (
                      tagSuggestions.map(suggestion => (
                        <TagSuggestionItem
                          key={suggestion.id}
                          tagName={suggestion.tag}
                          onApprove={handleApproveTag}
                          onDecline={handleDeclineTag}
                        />
                      ))
                    )}
                    {!isProcessing && tagSuggestions.length === 0 && (
                      <p className="text-sm text-gray-500">No pending tag suggestions.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {(taskSuggestions.length > 0 || isProcessing) && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Suggestions</CardTitle>
                  <CardDescription>Review tasks and reminders suggested by AI.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isProcessing && taskSuggestions.length === 0 ?
                      <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Looking for tasks and reminders...</p>
                      :
                      taskSuggestions.map(s => (
                          <TaskSuggestionItem
                            key={s.id}
                            suggestion={s}
                            onApprove={handleApproveSuggestion}
                            onDecline={handleDeclineSuggestion}
                          />
                      ))
                    }
                    {!isProcessing && taskSuggestions.length === 0 && <p className="text-sm text-gray-500">No pending suggestions.</p>}
                </CardContent>
              </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Tasks & Reminders</CardTitle>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowTaskCreator('task')}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Task
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowTaskCreator('reminder')}
                            >
                                <Bell className="w-4 h-4 mr-2" />
                                Add Reminder
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <TaskList entityType="document" entityId={doc.id} refreshTrigger={taskRefreshTrigger} />
                </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Extracted Text</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto p-4 border rounded-md bg-gray-50 text-sm whitespace-pre-wrap" dir="auto">
                  {isProcessing ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  ) : (
                    doc.extracted_text || "No text was extracted."
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Original Document
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openDocumentInNewTab}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!imageError && !isProbablyPDF ? (
                  <img
                    src={doc.image_url}
                    alt={doc.name}
                    className="rounded-lg border shadow-sm w-full"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="bg-gray-100 rounded-lg border shadow-sm w-full h-64 flex flex-col items-center justify-center text-gray-500">
                    <FileText className="w-16 h-16 mb-4 text-gray-400" />
                    <p className="text-sm text-center mb-4">
                      {isProbablyPDF ? "PDF Document" : "Preview not available"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openDocumentInNewTab}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      View/Download
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {showTaskCreator && (
            <TaskCreator
                documentId={doc.id}
                taskType={showTaskCreator}
                isOpen={!!showTaskCreator}
                onClose={() => setShowTaskCreator(null)}
                onTaskCreated={handleTaskCreated}
            />
        )}

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        itemName={doc.name}
      />
    </div>
  );
}
