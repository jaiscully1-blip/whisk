const P = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  pantry: 'M6 3h12v4H6zM5 7h14v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM9 12h6',
  cook: 'M3 10h18M5 10v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-8M9 6c0-2 2-2 2-4M14 6c0-2 2-2 2-4',
  compete: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5 9-10',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  timer: 'M12 8v5l3 2M9 2h6M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  chevron: 'M9 6l6 6-6 6',
  gift: 'M3 9h18v4H3zM5 13h14v8H5zM12 9v12M12 9c-2-5-7-4-6-1s6 1 6 1zM12 9c2-5 7-4 6-1s-6 1-6 1z',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  barcode: 'M4 5v14M7 5v14M11 5v14M14 5v14M17 5v14M20 5v14',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'
};
export default function Icon({ name, size = 20, stroke = 2, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d={P[name]} />
    </svg>
  );
}
export function Coin({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#F4B740" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5v9M9.5 9.5h4a1.6 1.6 0 0 1 0 3.2h-3a1.6 1.6 0 0 0 0 3.2h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function Flame({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#F4B740" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-7 1-10z" />
    </svg>
  );
}
