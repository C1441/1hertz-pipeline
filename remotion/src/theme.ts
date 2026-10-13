// Identitas visual 1Hertz: "layar osiloskop" — gelap grafit, jejak sinyal cyan,
// aksen amber untuk penekanan. Sengaja beda dari navy+kuning.
export const C = {
  bg: '#0B0E11',
  bgPanel: '#12171C',
  grid: 'rgba(120, 220, 235, 0.06)',
  border: '#24303A',
  text: '#E8EEF2',
  dim: '#8A9AA6',
  signal: '#2EE6F0', // cyan: kata kunci, jejak sinyal
  amber: '#FFB547', // penekanan kedua
  ok: '#3DDC97',
  err: '#FF6B6B',
  warn: '#FFD166',
};

export const FONT = {
  sans: '"Segoe UI", "Inter", "Helvetica Neue", Arial, "DejaVu Sans", sans-serif',
  mono: '"Cascadia Code", "Consolas", "JetBrains Mono", "DejaVu Sans Mono", monospace',
};

export const warnaStatus = (w?: string) =>
  w === 'merah' ? C.err : w === 'kuning' ? C.warn : w === 'hijau' ? C.ok : C.signal;
