import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function encodePng(size, drawPixel) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = drawPixel(x, y, size);
      const p = rowStart + 1 + x * 4;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
      raw[p + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderRelayIconPixel(x, y, size) {
  const nx = (x + 0.5) / size;
  const ny = (y + 0.5) / size;

  // Rounded rectangle mask
  const r = 0.22;
  const cx = Math.max(r, Math.min(1 - r, nx));
  const cy = Math.max(r, Math.min(1 - r, ny));
  const dist = Math.hypot(nx - cx, ny - cy);
  if (dist > r) return [0, 0, 0, 0];

  // Subtle blue gradient background
  const baseR = Math.round(37 + nx * 18);
  const baseG = Math.round(99 + ny * 35);
  const baseB = 235;

  // White twin relay bars/chevrons
  const topBar = ny >= 0.30 && ny <= 0.42 && nx >= 0.24 && nx <= 0.76;
  const botBar = ny >= 0.58 && ny <= 0.70 && nx >= 0.24 && nx <= 0.76;
  const rightTip = nx >= 0.60 && nx <= 0.78 && Math.abs(ny - 0.36) <= (0.78 - nx) * 0.9;
  const leftTip = nx >= 0.22 && nx <= 0.40 && Math.abs(ny - 0.64) <= (nx - 0.22) * 0.9;

  if (topBar || botBar || rightTip || leftTip) {
    return [255, 255, 255, 255];
  }
  return [baseR, baseG, baseB, 255];
}

export function generateExtensionIcons(iconsDir) {
  fs.mkdirSync(iconsDir, { recursive: true });
  for (const size of [16, 48, 128]) {
    const png = encodePng(size, renderRelayIconPixel);
    fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  }
}
