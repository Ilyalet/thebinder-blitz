import { Tag } from '@/entities/all';

let cache = null;
let pending = null;

export async function getTagColor(tagName) {
  if (!cache) {
    if (!pending) {
      pending = Tag.list().then((tags) => {
        cache = {};
        tags.forEach((t) => {
          cache[t.name.toLowerCase()] = t.color;
        });
        return cache;
      });
    }
    await pending;
  }
  return cache[tagName?.toLowerCase()] || 'gray';
}

export function clearTagColorCache() {
  cache = null;
  pending = null;
}
