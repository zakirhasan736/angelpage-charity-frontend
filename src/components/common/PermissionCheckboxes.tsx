'use client';

import React from 'react';
import { Check } from 'lucide-react';

type PermissionCheckboxesProps = {
  allKeys: string[];
  labels: Record<string, string>;
  selected: string[];
  onChange: (next: string[]) => void;
  presets?: { id: string; label: string; permissions: string[] }[];
};

/** Preset chips + a grid of toggleable permission tiles. */
const PermissionCheckboxes = ({ allKeys, labels, selected, onChange, presets = [] }: PermissionCheckboxesProps) => {
  const toggle = (key: string) => onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  const same = (a: string[], b: string[]) => a.length === b.length && a.every(k => b.includes(k));

  return (
    <div className="space-y-3">
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-[#8A888C]">Presets:</span>
          {presets.map(preset => {
            const active = same(preset.permissions, selected);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange([...preset.permissions])}
                className={`h-8 rounded-full px-3 text-[12.5px] font-medium transition ${active ? 'bg-[#611192] text-white' : 'bg-[#F4F1F6] text-[#474648] hover:bg-[#ECE6EF]'}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
        {allKeys.map(key => {
          const on = selected.includes(key);
          return (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] ring-1 transition ${on ? 'bg-[#F6EEFA] text-[#3B055C] ring-[#D9B8F0]' : 'bg-white text-[#474648] ring-[#ECE8EE] hover:ring-[#DCD3E1]'}`}
            >
              <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(key)} />
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${on ? 'bg-[#611192] text-white' : 'ring-1 ring-[#CFC6D5]'}`} aria-hidden>
                {on ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span>{labels[key] || key}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionCheckboxes;
