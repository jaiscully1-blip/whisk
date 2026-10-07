const P = {
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  heart: 'M12 20s-7-4.4-9-8.6C1.6 8.3 3.6 5 6.9 5c2 0 3.3 1.1 4.1 2.4C11.8 6.1 13.1 5 15.1 5c3.3 0 5.3 3.3 3.9 6.4-2 4.2-7 8.6-7 8.6z',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  share: 'M12 3v12M8 7l4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  plane: 'M2 13l20-8-6 16-3-7zM13 14l9-9',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 7',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z',
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
  snow: 'M12 2v20M4.9 6.5l14.2 11M4.9 17.5l14.2-11M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  up: 'M7 11v9H3v-9zM7 11l4-8c2 0 3 1.5 3 3.5L13 10h6a2 2 0 0 1 2 2.3l-1.4 6.5A2 2 0 0 1 17.6 21H7',
  down: 'M17 13V4h4v9zM17 13l-4 8c-2 0-3-1.5-3-3.5L11 14H5a2 2 0 0 1-2-2.3l1.4-6.5A2 2 0 0 1 6.4 3H17',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', play: 'M8 5v14l11-7z', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16.5 16.5L21 21',
  flip: 'M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4',
  shirt: 'M8.5 3.5 3 6.5l2 4.5 2.5-1V21h9V10l2.5 1 2-4.5-5.5-3c-.5 1.6-1.9 2.6-3.5 2.6S9 5.1 8.5 3.5z',
  hat: 'M5 16.5h14V20H5zM6.5 16.5c-2.5-.8-3.6-3.3-2.6-5.3 1-2 3.6-2.4 5.1-1.2.4-3.3 5.6-3.3 6 0 1.5-1.2 4.1-.8 5.1 1.2 1 2-.1 4.5-2.6 5.3',
  glasses: 'M2.5 12.5a3.8 3.8 0 1 0 7.6 0 3.8 3.8 0 1 0-7.6 0zM13.9 12.5a3.8 3.8 0 1 0 7.6 0 3.8 3.8 0 1 0-7.6 0zM10.1 12h3.8M2.5 11 1.5 9M21.5 11l1-2',
  shoe: 'M2.5 18.5h19M2.5 18.5V8.5l5 1 2.7 3 7.3 1.4c2.3.4 3.5 1.8 3.5 4.6M7 11l-1.5 2.5M9.5 12.5 8 15',
  spoon: 'M15.5 3c2.6 0 4.4 2.4 3.8 5.2-.6 2.6-3.4 4.3-5.6 3.4L5.5 21 3 18.5l9.4-8.2c-.9-2.2.8-5 3.4-5.6z',
  bag: 'M5 8h14l-1.2 12H6.2zM9 8V6.5a3 3 0 0 1 6 0V8',
  yt: 'M3 8.5c0-2 1.3-3 3-3.2C8 5.1 10 5 12 5s4 .1 6 .3c1.7.2 3 1.2 3 3.2v7c0 2-1.3 3-3 3.2-2 .2-4 .3-6 .3s-4-.1-6-.3c-1.7-.2-3-1.2-3-3.2zM10 9v6l5-3z',
  ig: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.3 6.7h.01',
  shuffle: 'M3 7h3.5c2.5 0 4 1.5 5.5 5s3 5 5.5 5H20M3 17h3.5c1.4 0 2.5-.5 3.4-1.5M14.1 8.5C15 7.5 16.1 7 17.5 7H20M17 4l3 3-3 3M17 14l3 3-3 3',
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
