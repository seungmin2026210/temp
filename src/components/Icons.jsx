const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
export const PenIcon = () => <Svg><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></Svg>;
export const PlusIcon = () => <Svg><path d="M12 5v14M5 12h14" /></Svg>;
export const CheckIcon = () => <Svg><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const CloseIcon = () => <Svg><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const PinIcon = () => <Svg><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Svg>;
export const NoteIcon = () => <Svg><path d="M5 4h14v16H5z" /><path d="M8 9h8M8 13h8M8 17h5" /></Svg>;
