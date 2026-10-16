// UJI v2 — baud rate dengan transisi ekstrem (tiap perpindahan beda teknik). Tanpa garis sinyal di awal/akhir.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AdeganSub } from '../v2/pustaka';
import { C, Kerangka3, Grain, Sfx, Bab, Bunyi } from './gb';
import { Adegan4, Hantaman2, TitikCahaya } from './transisi';
import { Pembuka, Banding, Gelombang, Samakan, Datasheet, UsbNative, Penutup } from './UjiBaud';

export const DURASI = 37;

const ADEGAN: AdeganSub[] = [
  { mulai: 0, selesai: 3, vo: 'Serial Monitor-mu cuma keluar huruf aneh kayak gini?', kunci: 'aneh' },
  { mulai: 3, selesai: 7, vo: 'Itu bukan error kode. Itu baud rate yang beda.', kunci: 'baud' },
  { mulai: 7, selesai: 14, vo: 'Baud itu kecepatan kirim data. Board kirim 115200, monitor baca di 9600. Bit-nya kebaca salah, jadilah sampah.', kunci: 'salah' },
  { mulai: 14, selesai: 20, vo: 'Aturannya: angka di Serial.begin harus sama dengan angka di Serial Monitor.', kunci: 'sama' },
  { mulai: 20, selesai: 28, vo: 'Tiap board beda kebiasaan. Contoh Arduino pakai 9600, log boot ESP32 115200, ESP8266 malah 74880.', kunci: '74880' },
  { mulai: 28, selesai: 32, vo: 'Board USB native kayak Leonardo? Baud-nya nggak ngaruh.', kunci: 'Leonardo' },
  { mulai: 32, selesai: 37, vo: 'Samakan angkanya, teks langsung terbaca. Board-mu pakai baud berapa? Tulis di komentar.', kunci: 'komentar' },
];

const BAB: Bab[] = [
  { a: 0, b: 3, l1: 'Serial Monitor', l2: 'isinya huruf aneh?', warna: 'err' },
  { a: 3.65, b: 7, l1: 'Bukan error kode,', l2: 'baud-nya beda', warna: 'amber' },
  { a: 7, b: 14, l1: 'Dibaca terlalu lambat,', l2: 'bit-nya meleset', warna: 'err' },
  { a: 14, b: 20, l1: 'Angkanya', l2: 'harus sama', warna: 'cyan' },
  { a: 20, b: 28, l1: 'Tiap board', l2: 'beda kebiasaan', warna: 'cyan' },
  { a: 28, b: 32, l1: 'USB native?', l2: 'Baud tak ngaruh', warna: 'cyan' },
  { a: 32.6, b: 37.1, l1: 'Samakan angkanya,', l2: 'langsung terbaca', warna: 'ok' },
];

const BUNYI: Bunyi[] = [
  { t: 0.0, f: 'whoosh', v: 0.4 },
  { t: 1.4, f: 'buzz', v: 0.45 },
  { t: 2.72, f: 'glitch', v: 0.5 },
  { t: 3.0, f: 'impact', v: 0.65 },
  { t: 3.62, f: 'whoosh', v: 0.45 },
  { t: 4.3, f: 'pop', v: 0.35 },
  { t: 4.9, f: 'pop', v: 0.35 },
  { t: 5.3, f: 'buzz', v: 0.35 },
  { t: 6.7, f: 'riser', v: 0.3 },
  { t: 7.0, f: 'beep', v: 0.5 },
  { t: 9.9, f: 'pop', v: 0.4 },
  { t: 10.2, f: 'pop', v: 0.4 },
  { t: 12.0, f: 'glitch', v: 0.35 },
  { t: 13.65, f: 'whoosh', v: 0.45 },
  { t: 16.0, f: 'klik', v: 0.5 },
  { t: 17.2, f: 'klik', v: 0.5 },
  { t: 17.6, f: 'ding', v: 0.45 },
  { t: 19.98, f: 'impact', v: 0.4 },
  { t: 21.0, f: 'pop', v: 0.35 },
  { t: 23.2, f: 'pop', v: 0.35 },
  { t: 25.4, f: 'pop', v: 0.35 },
  { t: 27.7, f: 'whoosh', v: 0.4 },
  { t: 28.8, f: 'klik', v: 0.45 },
  { t: 29.6, f: 'klik', v: 0.45 },
  { t: 30.4, f: 'klik', v: 0.45 },
  { t: 30.8, f: 'ding', v: 0.35 },
  { t: 31.2, f: 'riser', v: 0.35 },
  { t: 32.0, f: 'impact', v: 0.65 },
  { t: 32.6, f: 'whoosh', v: 0.35 },
  { t: 33.0, f: 'ding', v: 0.45 },
  { t: 34.5, f: 'pop', v: 0.4 },
];

export const UjiBaud2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // titik cahaya: tujuan runtuhnya adegan "≠" dan awal gelombang sinyal
  const opTitik = interpolate(t, [6.82, 7.0, 7.25, 7.5], [0, 1, 1, 0], C);
  const besarTitik = interpolate(t, [6.82, 7.0, 7.1, 7.5], [0.3, 1.6, 1, 0.4], C);
  return (
    <AbsoluteFill>
      <Kerangka3 t={t} tag="1HERTZ · SERIAL" bab={BAB} adegan={ADEGAN} sumber="ILUSTRASI · ARDUINO IDE 2" hud="CH1 · UART">
        <Adegan4 t={t} frame={frame} a={0} b={3.0} masuk="zoomMundur" dMasuk={0.6} keluar="glitch" dKeluar={0.3}>
          <Pembuka t={t} />
        </Adegan4>
        <Adegan4 t={t} frame={frame} a={3.65} b={7.0} masuk="sapuan" dMasuk={0.3} keluar="runtuh" dKeluar={0.3} titik={[60, 190]}>
          <Banding t={t} />
        </Adegan4>
        <Adegan4 t={t} frame={frame} a={7.0} b={14.0} masuk="titik" keluar="zoomTembus" dKeluar={0.38} titik={[911, 680]}>
          <Gelombang t={t} />
        </Adegan4>
        <Adegan4 t={t} frame={frame} a={14.0} b={20.38} masuk="zoomMasuk" dMasuk={0.4} keluar="terdorong" dKeluar={0.38}>
          <Samakan t={t} />
        </Adegan4>
        <Adegan4 t={t} frame={frame} a={20.0} b={28.0} masuk="tampar" dMasuk={0.42} keluar="balik" dKeluar={0.28}>
          <Datasheet t={t} />
        </Adegan4>
        <Adegan4 t={t} frame={frame} a={28.0} b={32.0} masuk="balik" dMasuk={0.3}>
          <UsbNative t={t} />
        </Adegan4>
        <Adegan4 t={t} frame={frame} a={32.6} b={37.1}>
          <Penutup t={t} />
        </Adegan4>
        <TitikCahaya x={60} y={190} besar={besarTitik} op={opTitik} />
      </Kerangka3>
      <Hantaman2 t={t} a={3.0} b={3.9} kata="BAUD." warna="amber" keluar="sapuan" dKeluar={0.28} />
      <Hantaman2 t={t} a={32.0} b={32.95} kata="TERBACA." warna="cyan" keluar="iris" iris={[960, 600]} dKeluar={0.35} />
      <Grain frame={frame} />
      <Sfx daftar={BUNYI} />
    </AbsoluteFill>
  );
};
