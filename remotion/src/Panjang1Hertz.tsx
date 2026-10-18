// Template VIDEO PANJANG 1Hertz (16:9, 1920x1080) — format katalog "naik tangga".
// Gaya sama dengan Shorts guidebook (latar titik gelap, pil tag cyan, judul kinetik 2 baris,
// HUD, hantaman, grain, SFX), penyajian beda: menu bulat → zoom ke item → kenalan → spesifikasi
// → kegunaan → plus/minus → kembali ke menu; penutup = grafik perbandingan + CTA.
import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, Easing, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { K, SANS, MONO, naik, pop, w, Warna } from './gaya/pustaka';
import { Sfx, Bunyi } from './gaya/gb';
import { ukuranPas } from './gaya/ukur';

export const W = 1920;
export const H = 1080;
const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

type Spek = { label: string; nilai: string; satuan?: string };
export type Item = {
  kunci: string; nama: string; chip: string; kelas: string; ram: number; ram_label: string;
  spek: Spek[]; guna: string[]; plus: string[]; minus: string[];
  vo: { kenalan: string; spek: string; guna: string; plusmin: string };
  hantaman?: { segmen: string; kata: string };
};
export type DataPanjang = { id: string; judul_video: string; tag?: string; item: Item[]; vo: { intro: string; banding: string; cta: string } };
export type Segmen = { jenis: 'intro' | 'menu' | 'kenalan' | 'spek' | 'guna' | 'plusmin' | 'banding' | 'cta'; item?: number; mulai: number; selesai: number; vo: string };
type Kata = { teks: string; mulai: number; selesai: number };
export type PropsPanjang = { data: DataPanjang; segmen?: Segmen[]; audio?: string; kata?: Kata[]; foto?: Record<string, string>; kredit?: string; musik?: string; total?: number };

/* ---------------- linimasa (dipakai juga oleh produksi-panjang.js lewat salinan logika) ---------------- */
const JEDA_MENU = 1.8;
export const durasiKira = (vo: string) => Math.max(2.5, vo.split(/\s+/).filter(Boolean).length / 2.55 + 0.5);
export const linimasaKira = (d: DataPanjang): Segmen[] => {
  const out: Segmen[] = [];
  let t = 0;
  const tambah = (s: Omit<Segmen, 'mulai' | 'selesai'>, dur: number) => { out.push({ ...s, mulai: t, selesai: t + dur } as Segmen); t += dur; };
  tambah({ jenis: 'intro', vo: d.vo.intro }, durasiKira(d.vo.intro));
  d.item.forEach((it, i) => {
    tambah({ jenis: 'menu', item: i, vo: '' }, JEDA_MENU);
    (['kenalan', 'spek', 'guna', 'plusmin'] as const).forEach((j) => tambah({ jenis: j, item: i, vo: it.vo[j] }, durasiKira(it.vo[j])));
  });
  tambah({ jenis: 'banding', vo: d.vo.banding }, durasiKira(d.vo.banding) + 1);
  tambah({ jenis: 'cta', vo: d.vo.cta }, durasiKira(d.vo.cta) + 1.5);
  return out;
};

/* ---------------- foto (atau gambar pengganti kalau belum ada) ---------------- */
const Foto: React.FC<{ src?: string; nama: string; w: number; h: number; isi?: 'contain' | 'cover'; bulat?: boolean; kaki?: number }> = ({ src, nama, w: lw, h: lh, isi = 'contain', bulat, kaki = 12 }) => {
  // tanpa foto: ilustrasi chip DIP yang digambar sendiri (jumlah kaki sesuai chip)
  const n = Math.max(2, Math.round(kaki / 2));
  const bw = Math.max(190, 40 + n * 22);
  const x0 = 200 - bw / 2;
  return (
    <div style={{ width: lw, height: lh, borderRadius: bulat ? '50%' : 18, overflow: 'hidden', background: '#EEF1EC', boxShadow: '0 22px 50px rgba(0,0,0,0.55)', position: 'relative' }}>
      {src ? (
        <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: isi }} />
      ) : (
        <svg viewBox="0 0 400 300" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <ellipse cx={200} cy={232} rx={bw * 0.62} ry={16} fill="#000" opacity={0.12} />
          {Array.from({ length: n }, (_, i) => {
            const x = 200 - ((n - 1) * 22) / 2 - 5 + i * 22;
            return (
              <g key={i}>
                <path d={`M${x},96 h10 v-26 h-4 v-10 h-2 v10 h-4 z`} fill="#B9C2C9" stroke="#8A949C" strokeWidth={1} />
                <path d={`M${x},204 h10 v26 h-4 v10 h-2 v-10 h-4 z`} fill="#B9C2C9" stroke="#8A949C" strokeWidth={1} />
              </g>
            );
          })}
          <rect x={x0} y={96} width={bw} height={108} rx={6} fill="#22272D" />
          <rect x={x0} y={96} width={bw} height={10} rx={4} fill="#2F363D" />
          <path d={`M${x0},138 a12,12 0 0 1 0,24`} fill="#151A1F" />
          <circle cx={x0 + 18} cy={186} r={5} fill="#151A1F" />
          <text x={210} y={158} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={Math.min(24, (bw - 50) / (nama.length * 0.62))} fill="#D7DDE2">{nama.toUpperCase()}</text>
          <text x={200} y={284} textAnchor="middle" fontFamily={MONO} fontSize={12} letterSpacing={2} fill="#7A858D">{kaki}-PIN DIP · ILUSTRASI</text>
        </svg>
      )}
    </div>
  );
};

/* ---------------- judul kinetik 2 baris (gaya Shorts) ---------------- */
const BarisKinetik: React.FC<{ t: number; a: number; teks: string; warna: string; tunda: number; ukuran: number }> = ({ t, a, teks, warna, tunda, ukuran }) => (
  <div style={{ fontSize: ukuran, fontWeight: 800, color: warna, letterSpacing: -1.5, lineHeight: 1.08, whiteSpace: 'nowrap' }}>
    {teks.split(' ').map((kata, i) => {
      const k = a === 0 && tunda === 0 && i === 0 ? 1 : naik(t, a + tunda + i * 0.08, 0.28);
      return <span key={i} style={{ display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 16}px)`, marginRight: ukuran * 0.25 }}>{kata}</span>;
    })}
  </div>
);
const judulSegmen = (s: Segmen, d: DataPanjang): [string, string, Warna] => {
  const it = s.item != null ? d.item[s.item] : undefined;
  const no = s.item != null ? `0${s.item + 1}` : '';
  switch (s.jenis) {
    case 'intro': return ['Mikrokontroler', 'dari kecil ke besar', 'cyan'];
    case 'menu': return [`Tangga ${no} dari 0${d.item.length}`, it ? it.nama : '', 'amber'];
    case 'kenalan': return [`${no}. ${it!.nama}`, it!.chip, 'cyan'];
    case 'spek': return [it!.nama, 'spesifikasi', 'amber'];
    case 'guna': return [it!.nama, 'dipakai buat apa?', 'cyan'];
    case 'plusmin': return [it!.nama, 'kelebihan & kelemahan', 'ok'];
    case 'banding': return ['Kalau dijejerkan', 'RAM naik 2.000×', 'amber'];
    case 'cta': return ['Kamu pakai', 'yang mana?', 'cyan'];
  }
};

/* ---------------- lembar terang (spesifikasi) ---------------- */
const LembarSpek: React.FC<{ t: number; a: number; d: number; it: Item; no: number }> = ({ t, a, d, it, no }) => {
  const step = Math.min(1.1, (d * 0.65) / Math.max(1, it.spek.length));
  return (
    <div style={{ width: 880, background: '#EEF1EC', borderRadius: 16, overflow: 'hidden', boxShadow: '0 22px 50px rgba(0,0,0,0.55)' }}>
      <div style={{ background: '#0C1117', padding: '22px 34px', display: 'flex', alignItems: 'baseline', gap: 24 }}>
        <div style={{ fontWeight: 900, fontSize: 40, color: '#EEF1EC' }}>LEMBAR {no}</div>
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: '#EEF1EC' }}>{it.nama.toUpperCase()}</div>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: '#8B9AA6', marginLeft: 'auto' }}>{it.kelas.toUpperCase()}</div>
      </div>
      <div style={{ padding: '10px 34px 18px' }}>
        {it.spek.map((s, i) => {
          const m = a + 0.3 + i * step;
          const k = naik(t, m, 0.35);
          const angka = /^-?\d+(\.\d+)?$/.test(s.nilai) ? Number(s.nilai) : null;
          const des = (s.nilai.split('.')[1] || '').length;
          const tampil = angka !== null ? interpolate(t, [m + 0.05, m + 0.8], [0, angka], { ...C, easing: Easing.out(Easing.cubic) }).toFixed(des) : s.nilai;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid #C9D1C8', padding: '14px 0', opacity: k, transform: `translateX(${(1 - k) * -30}px)` }}>
              <div style={{ fontWeight: 700, fontSize: 32, color: '#1A232C' }}>{s.label}</div>
              <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 46, color: '#0E8F99' }}>
                {tampil}
                {s.satuan && <span style={{ fontSize: 26, color: '#45525C', marginLeft: 8 }}>{s.satuan}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- kartu kecil gelap ---------------- */
const Kartu: React.FC<{ garis: string; children: React.ReactNode; lebar?: number; style?: React.CSSProperties }> = ({ garis, children, lebar, style }) => (
  <div style={{ width: lebar, background: K.card, border: `3px solid ${garis}`, borderRadius: 18, padding: '26px 30px', boxShadow: `0 0 40px ${garis}22, 0 20px 50px rgba(0,0,0,0.45)`, ...style }}>{children}</div>
);

/* ---------------- adegan per jenis ---------------- */
const Panggung: React.FC<{ t: number; s: Segmen; d: DataPanjang; foto: Record<string, string>; segmen: Segmen[] }> = ({ t, s, d, foto, segmen }) => {
  const a = s.mulai;
  const dur = s.selesai - s.mulai;
  const it = s.item != null ? d.item[s.item] : undefined;
  if (s.jenis === 'intro' || s.jenis === 'menu') {
    // menu bulat: muncul satu-satu (intro), lalu zoom ke item aktif (menu)
    const aktif = s.jenis === 'menu' ? s.item! : -1;
    const n = d.item.length;
    const jarak = 280;
    const x0 = W / 2 - ((n - 1) * jarak) / 2;
    const zoom = s.jenis === 'menu' ? interpolate(t, [s.selesai - 0.65, s.selesai], [0, 1], { ...C, easing: Easing.in(Easing.cubic) }) : 0;
    const cx = aktif >= 0 ? x0 + aktif * jarak : W / 2;
    return (
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + zoom * 3})`, transformOrigin: `${cx}px 560px`, opacity: 1 - zoom * 0.9 }}>
        {d.item.map((x, i) => {
          const muncul = s.jenis === 'intro' ? pop(t, a + dur * 0.45 + i * 0.35, 0.4) : 1;
          const selesai = aktif >= 0 && i < aktif;
          const fokus = i === aktif;
          const denyut = fokus ? 1 + 0.05 * Math.sin((t - a) * 9) : 1;
          const ukuran = 150 + i * 14;
          return (
            <div key={i} style={{ position: 'absolute', left: x0 + i * jarak - ukuran / 2, top: 560 - ukuran / 2, width: ukuran, textAlign: 'center', opacity: muncul * (selesai ? 0.45 : 1), transform: `scale(${muncul * denyut})` }}>
              <div style={{ borderRadius: '50%', border: `5px solid ${fokus ? K.cyan : selesai ? K.ok : K.garis}`, boxShadow: fokus ? `0 0 40px ${K.cyan}88` : undefined }}>
                <Foto src={foto[x.kunci]} nama={x.nama} kaki={(x as any).kaki} w={ukuran - 10} h={ukuran - 10} isi="cover" bulat />
              </div>
              <div style={{ marginTop: 16, fontSize: 26, fontWeight: 800, color: K.text, whiteSpace: 'nowrap', marginLeft: -60, marginRight: -60 }}>{x.nama}</div>
              <div style={{ fontFamily: MONO, fontSize: 22, color: fokus ? K.cyan : K.dim }}>{selesai ? '✓ ' : ''}RAM {x.ram_label}</div>
            </div>
          );
        })}
      </div>
    );
  }
  if (!it && s.jenis !== 'banding' && s.jenis !== 'cta') return null;
  if (s.jenis === 'kenalan') {
    const k1 = naik(t, a + 0.1, 0.5);
    const k2 = naik(t, a + 0.5, 0.4);
    return (
      <>
        <div style={{ position: 'absolute', left: 150, top: 290, opacity: k1, transform: `translateY(${(1 - k1) * 40}px) scale(${0.96 + 0.04 * k1})` }}>
          <Foto src={foto[it!.kunci]} nama={it!.nama} kaki={(it as any).kaki} w={820} h={540} />
        </div>
        <div style={{ position: 'absolute', left: 1060, top: 360, width: 720, opacity: k2, transform: `translateX(${(1 - k2) * 40}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: K.cyan }}>MIKROKONTROLER #{s.item! + 1}</div>
          <div style={{ fontSize: ukuranPas(it!.nama, 92, 720, SANS, 900, -2, 48), fontWeight: 900, color: K.text, letterSpacing: -2, lineHeight: 1.05, marginTop: 10 }}>{it!.nama}</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 26 }}>
            <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: K.bg, background: K.cyan, borderRadius: 999, padding: '8px 20px' }}>{it!.kelas}</div>
            <div style={{ fontFamily: MONO, fontSize: 24, color: K.text, border: `2px solid ${K.garis}`, borderRadius: 999, padding: '6px 18px' }}>{it!.chip}</div>
          </div>
          <div style={{ marginTop: 44, fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: K.dim }}>RAM</div>
          <div style={{ fontSize: 110, fontWeight: 900, color: K.amber, letterSpacing: -3, lineHeight: 1 }}>{it!.ram_label}</div>
        </div>
      </>
    );
  }
  if (s.jenis === 'spek') {
    const k1 = naik(t, a + 0.05, 0.45);
    return (
      <>
        <div style={{ position: 'absolute', left: 140, top: 330, opacity: k1, transform: `scale(${0.95 + 0.05 * k1})` }}>
          <Foto src={foto[it!.kunci]} nama={it!.nama} kaki={(it as any).kaki} w={600} h={420} />
        </div>
        <div style={{ position: 'absolute', left: 860, top: 270 }}>
          <LembarSpek t={t} a={a} d={dur} it={it!} no={s.item! + 1} />
        </div>
      </>
    );
  }
  if (s.jenis === 'guna') {
    const step = Math.min(1.3, (dur * 0.6) / 3);
    const ukG = Math.min(...it!.guna.slice(0, 3).map((g) => ukuranPas(g, 46, 420, SANS, 800, -0.5, 30)));
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', gap: 44 }}>
        {it!.guna.slice(0, 3).map((g, i) => {
          const k = pop(t, a + 0.25 + i * step, 0.4);
          return (
            <div key={i} style={{ opacity: k, transform: `translateY(${(1 - k) * 40}px) scale(${0.9 + 0.1 * k})` }}>
              <Kartu garis={K.cyan} lebar={480} style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 800, color: K.cyan }}>0{i + 1}</div>
                <div style={{ fontSize: ukG, fontWeight: 800, color: K.text, lineHeight: 1.15 }}>{g}</div>
              </Kartu>
            </div>
          );
        })}
      </div>
    );
  }
  if (s.jenis === 'plusmin') {
    const tengah = a + dur * 0.42;
    const Kolom: React.FC<{ judul: string; isi: string[]; warna: string; tanda: string; mulai: number }> = ({ judul, isi, warna, tanda, mulai }) => {
      const k = naik(t, mulai, 0.4);
      return (
        <div style={{ opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
          <Kartu garis={warna} lebar={720} style={{ minHeight: 400 }}>
            <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 800, letterSpacing: 4, color: warna }}>{judul}</div>
            {isi.map((x, i) => (
              <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginTop: 30, opacity: naik(t, mulai + 0.3 + i * 0.5, 0.3) }}>
                <div style={{ fontSize: 44, fontWeight: 900, color: warna, lineHeight: 1 }}>{tanda}</div>
                <div style={{ fontSize: ukuranPas(x, 44, 580, SANS, 700, 0, 30), fontWeight: 700, color: K.text, lineHeight: 1.2 }}>{x}</div>
              </div>
            ))}
          </Kartu>
        </div>
      );
    };
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center', gap: 60 }}>
        <Kolom judul="KELEBIHAN" isi={it!.plus} warna={K.ok} tanda="✓" mulai={a + 0.2} />
        <Kolom judul="KELEMAHAN" isi={it!.minus} warna={K.err} tanda="✕" mulai={tengah} />
      </div>
    );
  }
  if (s.jenis === 'banding') {
    const maks = Math.log10(Math.max(...d.item.map((x) => x.ram)) * 4);
    const min = Math.log10(Math.min(...d.item.map((x) => x.ram)) / 2);
    return (
      <div style={{ position: 'absolute', left: 230, top: 290, width: 1460 }}>
        {d.item.map((x, i) => {
          const m = a + 0.3 + i * 0.45;
          const k = interpolate(t, [m, m + 0.9], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
          const lebar = ((Math.log10(x.ram) - min) / (maks - min)) * 1000;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', height: 88, opacity: Math.min(1, k * 3) }}>
              <div style={{ width: 330, fontSize: 32, fontWeight: 800, color: K.text }}>{x.nama}</div>
              <div style={{ height: 46, width: lebar * k, borderRadius: 8, background: i === d.item.length - 1 ? K.amber : K.cyan, boxShadow: `0 0 24px ${i === d.item.length - 1 ? K.amber : K.cyan}55` }} />
              <div style={{ marginLeft: 18, fontFamily: MONO, fontSize: 30, fontWeight: 800, color: K.text, opacity: k }}>{x.ram_label}</div>
            </div>
          );
        })}
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: K.redup, marginTop: 10 }}>SKALA LOGARITMA · RAM</div>
      </div>
    );
  }
  if (s.jenis === 'cta') {
    const k = pop(t, a + 0.2, 0.45);
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, opacity: k, transform: `scale(${0.9 + 0.1 * k})` }}>
        <Kartu garis={K.cyan} lebar={1100} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: K.cyan }}>KOMENTAR</div>
          <div style={{ fontSize: 58, fontWeight: 800, color: K.text, marginTop: 14 }}>Kamu pakai mikrokontroler yang mana?</div>
        </Kartu>
        <div style={{ fontSize: 34, fontWeight: 800, color: K.bg, background: K.cyan, borderRadius: 999, padding: '16px 46px', opacity: naik(t, a + 1.2) }}>Subscribe ▶</div>
      </div>
    );
  }
  return null;
};

/* ---------------- tangga di bawah (posisi item) ---------------- */
const Tangga: React.FC<{ d: DataPanjang; aktif: number; selesai: number }> = ({ d, aktif, selesai }) => {
  const n = d.item.length;
  const x0 = 520;
  const lebar = 880;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }} data-qa="hias">
      <line x1={x0} y1={1032} x2={x0 + lebar} y2={1032} stroke={K.garis} strokeWidth={4} />
      {d.item.map((x, i) => {
        const cx = x0 + (lebar / (n - 1)) * i;
        const r = 7 + i * 2.2;
        const on = i === aktif;
        const done = i < selesai;
        return (
          <g key={i}>
            <circle cx={cx} cy={1032} r={r + (on ? 4 : 0)} fill={on ? K.cyan : done ? K.ok : K.bg} stroke={on ? K.cyan : done ? K.ok : '#3A4855'} strokeWidth={3} />
            <text x={cx} y={1066} textAnchor="middle" fontFamily={MONO} fontSize={15} fill={on ? K.cyan : '#5D6B78'}>{x.nama.replace('Arduino ', '').replace('Raspberry Pi ', '')}</text>
          </g>
        );
      })}
      <text x={x0 - 30} y={1038} textAnchor="end" fontFamily={MONO} fontSize={16} letterSpacing={2} fill="#5D6B78">KECIL</text>
      <text x={x0 + lebar + 30} y={1038} fontFamily={MONO} fontSize={16} letterSpacing={2} fill="#5D6B78">BESAR</text>
    </svg>
  );
};

/* ---------------- subtitle 16:9 ---------------- */
const kataKira = (segmen: Segmen[]): Kata[] => {
  const out: Kata[] = [];
  for (const s of segmen) {
    if (!s.vo) continue;
    const ws = s.vo.split(/\s+/).filter(Boolean);
    const bobot = ws.map((x) => x.length + 2);
    const tot = bobot.reduce((a, b) => a + b, 0);
    const span = s.selesai - s.mulai - 0.5;
    let acc = 0;
    ws.forEach((x, i) => { const m = s.mulai + 0.1 + (acc / tot) * span; acc += bobot[i]; out.push({ teks: x, mulai: m, selesai: s.mulai + 0.1 + (acc / tot) * span }); });
  }
  return out;
};
const Subjudul: React.FC<{ t: number; kata: Kata[] }> = ({ t, kata }) => {
  const frasa = React.useMemo(() => {
    const f: Kata[][] = [];
    let cur: Kata[] = [];
    kata.forEach((k, i) => {
      cur.push(k);
      const jedaBesar = i + 1 < kata.length && kata[i + 1].mulai - k.selesai > 0.6;
      if (/[.,?:!]$/.test(k.teks) || cur.length >= 8 || jedaBesar || i === kata.length - 1) { f.push(cur); cur = []; }
    });
    return f;
  }, [kata]);
  const f = frasa.find((x) => t >= x[0].mulai - 0.05 && t <= x[x.length - 1].selesai + 0.35);
  if (!f) return null;
  return (
    <div style={{ position: 'absolute', top: 905, left: 260, right: 260, textAlign: 'center', fontSize: 44, fontWeight: 800, lineHeight: 1.2, textShadow: '0 3px 14px rgba(0,0,0,0.9)' }}>
      {f.map((k, i) => (
        <span key={i} style={{ color: K.text, opacity: k.mulai <= t ? 1 : 0.38 }}>{k.teks.replace(/[.,:!]$/, '')}{i < f.length - 1 ? ' ' : ''}</span>
      ))}
    </div>
  );
};

/* ---------------- hantaman 16:9 ---------------- */
const Hantaman16: React.FC<{ t: number; a: number; kata: string; warna: string }> = ({ t, a, kata, warna }) => {
  if (t < a || t >= a + 0.85) return null;
  const s = interpolate(t, [a, a + 0.16], [1.15, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const getar = t - a < 0.12 ? Math.sin((t - a) * 120) * 8 : 0;
  const keluar = interpolate(t, [a + 0.6, a + 0.85], [0, 1], C);
  return (
    <AbsoluteFill style={{ background: warna, alignItems: 'center', justifyContent: 'center', clipPath: `inset(0 ${keluar * 100}% 0 0)` }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(12,17,23,0.10) 2px, transparent 2.2px)', backgroundSize: '36px 36px' }} />
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 260, letterSpacing: -8, color: K.bg, transform: `translateX(${getar}px) scale(${s})` }}>{kata}</div>
      <div style={{ position: 'absolute', bottom: 150, fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: K.bg, opacity: 0.6 }}>1HERTZ</div>
    </AbsoluteFill>
  );
};

/* ---------------- komposisi ---------------- */
export const Panjang1Hertz: React.FC<PropsPanjang> = ({ data, segmen: segmenProp, audio, kata: kataProp, foto = {}, kredit, musik }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const segmen = React.useMemo(() => segmenProp ?? linimasaKira(data), [segmenProp, data]);
  const kata = React.useMemo(() => (kataProp?.length ? kataProp : kataKira(segmen)), [kataProp, segmen]);
  const si = Math.max(0, segmen.findIndex((s) => t >= s.mulai && t < s.selesai));
  const s = segmen[si] ?? segmen[segmen.length - 1];
  const itemAktif = s.item ?? (s.jenis === 'banding' || s.jenis === 'cta' ? data.item.length : -1);
  const it = s.item != null ? data.item[s.item] : undefined;

  // transisi masuk/keluar tiap segmen (bergantian zoom / dorong), menu punya zoom sendiri
  const masuk = s.mulai === 0 ? 1 : naik(t, s.mulai, 0.35);
  const keluarK = s.jenis === 'menu' ? 0 : interpolate(t, [s.selesai - 0.25, s.selesai], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const gaya = si % 2 === 0 ? 'zoom' : 'dorong';
  const tf = gaya === 'zoom' ? `scale(${(0.94 + 0.06 * masuk) * (1 + 0.08 * keluarK)})` : `translateX(${(1 - masuk) * 220 - keluarK * 220}px)`;
  const op = Math.min(masuk, 1 - keluarK);
  const blur = (1 - masuk) * 8 + keluarK * 8;

  const [l1, l2, wj] = judulSegmen(s, data);
  const ukJudul = Math.min(ukuranPas(l1, 62, 1500, SANS, 800, -1.5, 36), ukuranPas(l2, 62, 1500, SANS, 800, -1.5, 36));

  // SFX & hantaman
  const bunyi: Bunyi[] = React.useMemo(() => {
    const b: Bunyi[] = [];
    segmen.forEach((x, i) => {
      if (i > 0) b.push({ t: x.mulai - 0.1, f: 'whoosh', v: 0.32 });
      if (x.jenis === 'menu') b.push({ t: x.selesai - 0.6, f: 'riser', v: 0.25 });
      if (x.jenis === 'intro') data.item.forEach((_, k) => b.push({ t: x.mulai + (x.selesai - x.mulai) * 0.45 + k * 0.35, f: 'pop', v: 0.3 }));
      if (x.jenis === 'guna') [0, 1, 2].forEach((k) => b.push({ t: x.mulai + 0.25 + k * Math.min(1.3, ((x.selesai - x.mulai) * 0.6) / 3), f: 'pop', v: 0.3 }));
      if (x.jenis === 'plusmin') { b.push({ t: x.mulai + 0.2, f: 'ding', v: 0.3 }); b.push({ t: x.mulai + (x.selesai - x.mulai) * 0.42, f: 'buzz', v: 0.18 }); }
      if (x.jenis === 'spek' && x.item != null) data.item[x.item].spek.forEach((_, k) => b.push({ t: x.mulai + 0.3 + k * Math.min(1.1, ((x.selesai - x.mulai) * 0.65) / data.item[x.item!].spek.length), f: 'klik', v: 0.22 }));
      const h = x.item != null ? data.item[x.item].hantaman : undefined;
      if (h && h.segmen === x.jenis) b.push({ t: x.mulai + 0.05, f: 'impact', v: 0.5 });
    });
    return b;
  }, [segmen, data]);
  const hantaman = segmen
    .map((x, i) => ({ x, i, h: x.item != null ? data.item[x.item].hantaman : undefined }))
    .filter((z) => z.h && z.h.segmen === z.x.jenis);

  const menit = Math.floor(t / 60);
  const detik = `${String(menit).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const selesaiItem = s.jenis === 'menu' ? s.item! : s.item != null ? s.item : itemAktif;

  return (
    <AbsoluteFill style={{ backgroundColor: K.bg, fontFamily: SANS }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(140,200,230,0.10) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 52%, rgba(79,227,236,0.07), transparent 70%)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 110% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55))' }} />

      {/* panggung */}
      <div style={{ position: 'absolute', inset: 0, opacity: op, transform: tf, transformOrigin: '960px 560px', filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
        <Panggung t={t} s={s} d={data} foto={foto} segmen={segmen} />
      </div>

      {/* kepala: pil tag, judul kinetik, ikon item aktif */}
      <div style={{ position: 'absolute', top: 44, left: 56, fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: K.bg, background: K.cyan, borderRadius: 999, padding: '8px 20px' }}>{data.tag ?? '1HERTZ'}</div>
      <div style={{ position: 'absolute', top: 52, right: it ? 190 : 56, fontFamily: MONO, fontSize: 24, color: '#5D6B78' }}>@1hertz_lab</div>
      {it && (
        <div style={{ position: 'absolute', top: 26, right: 56, textAlign: 'center' }}>
          <div style={{ border: `4px solid ${K.cyan}`, borderRadius: '50%' }}>
            <Foto src={foto[it.kunci]} nama={it.nama} kaki={(it as any).kaki} w={100} h={100} isi="cover" bulat />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 20, color: K.cyan, marginTop: 6 }}>0{s.item! + 1}/0{data.item.length}</div>
        </div>
      )}
      <div key={si} style={{ position: 'absolute', top: 104, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: interpolate(t, [s.selesai - 0.2, s.selesai], [1, 0], C) }}>
        <BarisKinetik t={t} a={s.mulai} teks={l1} warna={K.text} tunda={0} ukuran={ukJudul} />
        <BarisKinetik t={t} a={s.mulai} teks={l2} warna={w(wj)} tunda={l1.split(' ').length * 0.08 + 0.05} ukuran={ukJudul} />
      </div>

      {/* HUD */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }} data-qa="hias">
        <g stroke="#4FE3EC" strokeOpacity={0.35} strokeWidth={2} fill="none">
          <path d="M28,270 v-30 h30 M1892,270 v-30 h-30 M28,880 v30 h30 M1892,880 v30 h-30" />
        </g>
        <text x={66} y={262} fontFamily={MONO} fontSize={18} letterSpacing={3} fill="#4FE3EC" fillOpacity={0.45}>CH1 · {s.jenis.toUpperCase()}</text>
        <text x={1854} y={902} textAnchor="end" fontFamily={MONO} fontSize={18} letterSpacing={2} fill="#4FE3EC" fillOpacity={0.45}>{detik}</text>
      </svg>

      <Tangga d={data} aktif={itemAktif} selesai={Math.max(0, selesaiItem)} />
      <Subjudul t={t} kata={kata} />
      {kredit && s.jenis !== 'intro' && (
        <div style={{ position: 'absolute', bottom: 6, right: 20, fontFamily: MONO, fontSize: 13, color: '#4A5763', maxWidth: 700, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.item != null ? kredit.split('\n').find((x) => x.startsWith(data.item[s.item!].nama)) ?? '' : ''}
        </div>
      )}

      {hantaman.map((z) => <Hantaman16 key={z.i} t={t} a={z.x.mulai + 0.05} kata={z.h!.kata} warna={z.i % 2 ? K.amber : K.cyan} />)}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 0.045, mixBlendMode: 'overlay', pointerEvents: 'none' }} data-qa="hias">
        <filter id="grain16"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 7} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#grain16)" />
      </svg>
      {audio && <Audio src={staticFile(audio)} />}
      <Sfx daftar={bunyi} musik={musik === 'tanpa' ? 0 : 0.1} />
    </AbsoluteFill>
  );
};
