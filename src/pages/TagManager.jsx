import React, { useState, useEffect } from 'react';
import { Document, Tag } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, GitMerge } from 'lucide-react';
import TagManagerItem from '@/components/tags/TagManagerItem';
import RenameTagDialog from '@/components/tags/RenameTagDialog';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import MergeTagDialog from '@/components/tags/MergeTagDialog';
import _ from 'lodash';
import { clearTagColorCache } from '@/components/utils/tagColors';
import { clearTagBadgeCache } from '@/components/ui/TagBadge';
import AiFeatureWrapper from '@/components/ai/AiFeatureWrapper';

export default function TagManagerPage() {
    const [tags, setTags] = useState([]);
    const [initialTags, setInitialTags] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [tagToRename, setTagToRename] = useState(null);
    const [tagToDelete, setTagToDelete] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [showMergeDialog, setShowMergeDialog] = useState(false);
    const { toast } = useToast();

    const fetchTags = async () => {
        setLoading(true);
        const [docs, existingTags] = await Promise.all([Document.list(), Tag.list()]);

        setDocuments(docs);

        const allDocTags = new Set();
        docs.forEach(doc => doc.tags?.forEach(tag => allDocTags.add(tag.toLowerCase())));

        const tagEntityMap = {};
        existingTags.forEach(tag => {
            tagEntityMap[tag.name.toLowerCase()] = tag;
        });

        const tagData = [];
        for (const tagName of Array.from(allDocTags).sort()) {
            if (tagEntityMap[tagName]) {
                tagData.push({
                    id: tagEntityMap[tagName].id,
                    name: tagName,
                    color: tagEntityMap[tagName].color
                });
            } else {
                const newTag = await Tag.create({ name: tagName, color: 'gray' });
                tagData.push({
                    id: newTag.id,
                    name: tagName,
                    color: 'gray'
                });
            }
        }

        setTags(tagData);
        setInitialTags(_.cloneDeep(tagData));
        setLoading(false);
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const handleColorChange = (tagName, color) => {
        setTags(prevTags => prevTags.map(tag =>
            tag.name === tagName ? { ...tag, color } : tag
        ));
    };

    const handleSaveChanges = async () => {
        setSaving(true);

        try {
            const changedTags = tags.filter(tag => {
                const initial = initialTags.find(t => t.name === tag.name);
                return initial && initial.color !== tag.color;
            });

            const updatePromises = changedTags.map(tag =>
                Tag.update(tag.id, { color: tag.color })
            );

            await Promise.all(updatePromises);

            setInitialTags(_.cloneDeep(tags));
            clearTagColorCache();
            clearTagBadgeCache();

            toast({
                title: 'Success',
                description: 'Your tag color preferences have been saved.'
            });
        } catch (error) {
            console.error("Failed to save tag colors", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not save your preferences. Please try again.'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleRenameTag = async (oldName, newName) => {
        if (!newName || oldName === newName) {
            setTagToRename(null);
            return;
        }

        setActionInProgress(true);
        toast({ title: 'Renaming tag...', description: 'This may take a moment.'});

        try {
            const docsToUpdate = documents.filter(doc => doc.tags && doc.tags.includes(oldName));

            const updatePromises = docsToUpdate.map(doc => {
                const newTags = doc.tags.map(t => t === oldName ? newName : t);
                return Document.update(doc.id, { tags: _.uniq(newTags) });
            });

            await Promise.all(updatePromises);

            const oldTagEntity = tags.find(t => t.name === oldName);

            const existingNewTag = await Tag.filter({ name: newName });

            if (existingNewTag.length > 0) {
                if (oldTagEntity?.id) {
                    await Tag.delete(oldTagEntity.id);
                }
            } else {
                if (oldTagEntity?.id) {
                    await Tag.update(oldTagEntity.id, { name: newName });
                } else {
                    await Tag.create({ name: newName, color: 'gray' });
                }
            }

            clearTagColorCache();
            clearTagBadgeCache();
            toast({ title: 'Success!', description: `Tag "${oldName}" was renamed to "${newName}".` });
            fetchTags();
        } catch(e) {
            console.error("Failed to rename tag", e);
            toast({ variant: "destructive", title: 'Error', description: 'Failed to rename tag.'});
        } finally {
            setActionInProgress(false);
            setTagToRename(null);
        }
    };

    const handleDeleteTag = async () => {
        if (!tagToDelete) return;

        setActionInProgress(true);
        toast({ title: 'Deleting tag...', description: 'This may take a moment.'});

        try {
            const docsToUpdate = documents.filter(doc => doc.tags && doc.tags.includes(tagToDelete.name));

            const updatePromises = docsToUpdate.map(doc => {
                const newTags = doc.tags.filter(t => t !== tagToDelete.name);
                return Document.update(doc.id, { tags: newTags });
            });

            await Promise.all(updatePromises);

            if (tagToDelete.id) {
                await Tag.delete(tagToDelete.id);
            }

            clearTagColorCache();
            clearTagBadgeCache();
            toast({ title: 'Success!', description: `Tag "${tagToDelete.name}" was deleted.` });
            fetchTags();
        } catch(e) {
            console.error("Failed to delete tag", e);
            toast({ variant: "destructive", title: 'Error', description: 'Failed to delete tag.'});
        } finally {
            setActionInProgress(false);
            setTagToDelete(null);
        }
    };

    const handleTagSelect = (tagName, isSelected) => {
        if (isSelected) {
            if (selectedTags.length < 2) {
                setSelectedTags([...selectedTags, tagName]);
            } else {
                toast({
                    title: 'Selection Limit',
                    description: 'You can only select 2 tags at a time for merging.',
                    variant: 'destructive'
                });
            }
        } else {
            setSelectedTags(selectedTags.filter(tag => tag !== tagName));
        }
    };

    const handleMergeTags = async (newTagName) => {
        if (selectedTags.length !== 2 || !newTagName) {
            setShowMergeDialog(false);
            return;
        }

        setActionInProgress(true);
        toast({ title: 'Merging tags...', description: 'This may take a moment.' });

        try {
            const [tag1, tag2] = selectedTags;

            const docsToUpdate = documents.filter(doc =>
                doc.tags && (doc.tags.includes(tag1) || doc.tags.includes(tag2))
            );

            const updatePromises = docsToUpdate.map(doc => {
                let currentDocTags = doc.tags ? [...doc.tags] : [];

                currentDocTags = currentDocTags.filter(t => t !== tag1 && t !== tag2);
                if (!currentDocTags.includes(newTagName)) {
                    currentDocTags.push(newTagName);
                }

                return Document.update(doc.id, { tags: _.uniq(currentDocTags) });
            });

            await Promise.all(updatePromises);

            const tag1Entity = tags.find(t => t.name === tag1);
            const tag2Entity = tags.find(t => t.name === tag2);

            const existingNewTag = await Tag.filter({ name: newTagName });

            if (existingNewTag.length === 0) {
                const colorToUse = tag1Entity?.color || tag2Entity?.color || 'gray';
                await Tag.create({ name: newTagName, color: colorToUse });
            }

            if (tag1Entity?.id) await Tag.delete(tag1Entity.id);
            if (tag2Entity?.id) await Tag.delete(tag2Entity.id);

            clearTagColorCache();
            clearTagBadgeCache();

            toast({
                title: 'Success!',
                description: `Tags "${tag1}" and "${tag2}" were merged into "${newTagName}".`
            });

            setSelectedTags([]);
            setShowMergeDialog(false);
            fetchTags();
        } catch (e) {
            console.error("Failed to merge tags", e);
            toast({
                variant: "destructive",
                title: 'Error',
                description: 'Failed to merge tags. ' + (e.message || '')
            });
        } finally {
            setActionInProgress(false);
        }
    };

    const hasUnsavedChanges = !_.isEqual(tags, initialTags);
    const isBusy = saving || actionInProgress;
    const canMerge = selectedTags.length === 2;

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tag Manager</h1>
                    <p className="text-sm text-gray-500 mt-1">Organize, color-code, and manage your document tags.</p>
                </div>

                {actionInProgress && (
                    <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <span>Action in progress. Please wait...</span>
                    </div>
                )}

                {selectedTags.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-300 text-blue-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span>Selected tags: <span className="font-medium">{selectedTags.join(', ')}</span></span>
                            {canMerge && <span className="text-green-600 font-medium ml-2">Ready to merge!</span>}
                        </div>
                        <div className="flex gap-2">
                            {canMerge && (
                                <Button size="sm" onClick={() => setShowMergeDialog(true)} disabled={isBusy}>
                                    <GitMerge className="w-4 h-4 mr-2" />
                                    Merge Tags
                                </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => setSelectedTags([])}>
                                Clear Selection
                            </Button>
                        </div>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Your Tags</CardTitle>
                        <CardDescription>
                            Click a tag's color swatch to change it. Select up to two tags to merge them, or use individual action buttons.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {tags.map(tag => (
                                <TagManagerItem
                                    key={tag.name}
                                    tag={tag}
                                    onColorChange={handleColorChange}
                                    onRename={() => setTagToRename(tag)}
                                    onDelete={() => setTagToDelete(tag)}
                                    onSelect={handleTagSelect}
                                    isSelected={selectedTags.includes(tag.name)}
                                    disabled={isBusy}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end mt-6">
                    <AiFeatureWrapper featureName="Custom Tag Colors">
                        <Button onClick={handleSaveChanges} disabled={isBusy || !hasUnsavedChanges}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                        </Button>
                    </AiFeatureWrapper>
                </div>
            </div>

            {tagToRename && (
                <RenameTagDialog
                    isOpen={!!tagToRename}
                    onClose={() => setTagToRename(null)}
                    onConfirm={handleRenameTag}
                    currentName={tagToRename.name}
                />
            )}

            {tagToDelete && (
                <DeleteConfirmationDialog
                    isOpen={!!tagToDelete}
                    onClose={() => setTagToDelete(null)}
                    onConfirm={handleDeleteTag}
                    itemName={tagToDelete.name}
                />
            )}

            {showMergeDialog && (
                <MergeTagDialog
                    isOpen={showMergeDialog}
                    onClose={() => setShowMergeDialog(false)}
                    onConfirm={handleMergeTags}
                    selectedTags={selectedTags}
                />
            )}
        </div>
    );
}
