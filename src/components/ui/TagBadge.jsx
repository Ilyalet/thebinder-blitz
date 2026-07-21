import React, { useState, useEffect } from 'react';
import { Tag } from '@/entities/all';
import { Badge } from '@/components/ui/badge';

let tagColorCache = null;
let fetchPromise = null;

const COLOR_CLASSES = {
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  pink: 'bg-pink-100 text-pink-700 border-pink-200',
};

async function loadTagColors() {
  if (tagColorCache) return tagColorCache;
  if (!fetchPromise) {
    fetchPromise = Tag.list().then((tags) => {
      tagColorCache = {};
      tags.forEach((t) => {
        tagColorCache[t.name.toLowerCase()] = t.color;
      });
      return tagColorCache;
    });
  }
  return fetchPromise;
}

export function clearTagBadgeCache() {
  tagColorCache = null;
  fetchPromise = null;
}

export default function TagBadge({ tag }) {
  const [color, setColor] = useState('gray');

  useEffect(() => {
    let active = true;
    loadTagColors().then((colors) => {
      if (active) setColor(colors[tag?.toLowerCase()] || 'gray');
    });
    return () => {
      active = false;
    };
  }, [tag]);

  return (
    <Badge variant="outline" className={COLOR_CLASSES[color] || COLOR_CLASSES.gray}>
      {tag}
    </Badge>
  );
}
