// Line icons drawn for Thomnail; they take the current text colour.
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export function SettingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

/** Empty: an arrow into the folder; selected: a check mark. */
export function FolderIcon({ selected, size = 40 }: { selected: boolean; size?: number }) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={1.5}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      {selected ? <path d="M9 13l2 2 4-4" /> : <path d="M12 10v6M9.5 13.5 12 16l2.5-2.5" />}
    </svg>
  );
}
