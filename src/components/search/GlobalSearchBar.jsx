import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document } from '@/entities/all';
import { Input } from '@/components/ui/input';
import { Search, FileText } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [allDocs, setAllDocs] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = async (e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    let docs = allDocs;
    if (!docs) {
      docs = await Document.list();
      setAllDocs(docs);
    }
    const lower = value.toLowerCase();
    const matches = docs
      .filter(
        (d) =>
          (d.name || '').toLowerCase().includes(lower) ||
          (d.summary || '').toLowerCase().includes(lower) ||
          (d.tags || []).some((t) => t.toLowerCase().includes(lower))
      )
      .slice(0, 6);
    setResults(matches);
    setOpen(true);
  };

  const handleSelect = (doc) => {
    setQuery('');
    setResults([]);
    setOpen(false);
    navigate(createPageUrl(`Document?id=${doc.id}`));
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input placeholder="Search documents..." value={query} onChange={handleChange} className="pl-9 h-9" />
      </div>
      {open && results.length > 0 && (
        <div className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleSelect(doc)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <FileText className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="truncate">{doc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
