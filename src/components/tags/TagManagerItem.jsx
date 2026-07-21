import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
const COLOR_DOT = {
  gray: 'bg-gray-400',
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  pink: 'bg-pink-400',
};

export default function TagManagerItem({ tag, onColorChange, onRename, onDelete, onSelect, isSelected, disabled }) {
  return (
    <div className="flex items-center gap-3 p-2 border rounded-md">
      <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(tag.name, checked)} disabled={disabled} />
      <span className="flex-1 text-sm font-medium">{tag.name}</span>
      <div className="flex items-center gap-1">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(tag.name, color)}
            disabled={disabled}
            className={cn('w-5 h-5 rounded-full border-2', COLOR_DOT[color], tag.color === color ? 'border-gray-900' : 'border-transparent')}
            title={color}
          />
        ))}
      </div>
      <Button variant="ghost" size="icon" onClick={onRename} disabled={disabled}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} disabled={disabled}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
