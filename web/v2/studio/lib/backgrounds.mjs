/** Fondos dibujados en el lienzo. Código MIT. Sin precios, cifras ni recursos de fuera. */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function paint(rgba, width, x, y, color, alpha) {
  if (alpha <= 0 || x < 0 || y < 0 || x >= width) return;
  const i = (y * width + x) * 4;
  if (i < 0 || i + 3 >= rgba.length) return;
  const keep = 1 - alpha;
  rgba[i] = Math.round((rgba[i] ?? 0) * keep + color[0] * alpha);
  rgba[i + 1] = Math.round((rgba[i + 1] ?? 0) * keep + color[1] * alpha);
  rgba[i + 2] = Math.round((rgba[i + 2] ?? 0) * keep + color[2] * alpha);
  rgba[i + 3] = 255;
}

function fill(rgba, width, height, color) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      rgba[i] = color[0];
      rgba[i + 1] = color[1];
      rgba[i + 2] = color[2];
      rgba[i + 3] = 255;
    }
  }
}

function radial(rgba, width, height, cx, cy, radius, color, peak) {
  const r2 = radius * radius;
  const x0 = clamp(Math.floor(cx - radius), 0, width);
  const x1 = clamp(Math.ceil(cx + radius), 0, width);
  const y0 = clamp(Math.floor(cy - radius), 0, height);
  const y1 = clamp(Math.ceil(cy + radius), 0, height);
  for (let y = y0; y < y1; y += 1) {
    const dy = y - cy;
    for (let x = x0; x < x1; x += 1) {
      const dx = x - cx;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r2) continue;
      const t = 1 - Math.sqrt(d2) / radius;
      paint(rgba, width, x, y, color, peak * t * t);
    }
  }
}

function disc(rgba, width, height, cx, cy, radius, color, alpha) {
  const r2 = radius * radius;
  const x0 = clamp(Math.floor(cx - radius), 0, width);
  const x1 = clamp(Math.ceil(cx + radius), 0, width);
  const y0 = clamp(Math.floor(cy - radius), 0, height);
  const y1 = clamp(Math.ceil(cy + radius), 0, height);
  for (let y = y0; y < y1; y += 1) {
    const dy = y - cy;
    for (let x = x0; x < x1; x += 1) {
      const dx = x - cx;
      if (dx * dx + dy * dy <= r2) paint(rgba, width, x, y, color, alpha);
    }
  }
}

function rect(rgba, width, height, x, y, w, h, color, alpha = 1) {
  const x0 = clamp(Math.floor(x), 0, width);
  const y0 = clamp(Math.floor(y), 0, height);
  const x1 = clamp(Math.ceil(x + w), 0, width);
  const y1 = clamp(Math.ceil(y + h), 0, height);
  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) paint(rgba, width, xx, yy, color, alpha);
  }
}

function roundRect(rgba, width, height, x, y, w, h, radius, color, alpha = 1) {
  const r = Math.min(radius, w / 2, h / 2);
  const x0 = clamp(Math.floor(x), 0, width);
  const y0 = clamp(Math.floor(y), 0, height);
  const x1 = clamp(Math.ceil(x + w), 0, width);
  const y1 = clamp(Math.ceil(y + h), 0, height);
  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      let dx = 0;
      let dy = 0;
      if (xx < x + r && yy < y + r) { dx = x + r - xx; dy = y + r - yy; }
      else if (xx > x + w - r && yy < y + r) { dx = xx - (x + w - r); dy = y + r - yy; }
      else if (xx < x + r && yy > y + h - r) { dx = x + r - xx; dy = yy - (y + h - r); }
      else if (xx > x + w - r && yy > y + h - r) { dx = xx - (x + w - r); dy = yy - (y + h - r); }
      if (dx * dx + dy * dy > r * r) continue;
      paint(rgba, width, xx, yy, color, alpha);
    }
  }
}

function line(rgba, width, height, x0, y0, x1, y1, color, alpha, thickness) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  const half = thickness / 2;
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    disc(rgba, width, height, mix(x0, x1, t), mix(y0, y1, t), half, color, alpha);
  }
}

function rand(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function solana(rgba, width, height) {
  fill(rgba, width, height, [7, 4, 24]);
  radial(rgba, width, height, width * 0.18, height * 0.16, width * 0.62, [153, 69, 255], 0.95);
  radial(rgba, width, height, width * 0.86, height * 0.78, width * 0.55, [20, 241, 149], 0.72);
  radial(rgba, width, height, width * 0.62, height * 0.42, width * 0.38, [0, 209, 255], 0.55);
  for (let i = 0; i < 7; i += 1) {
    const y = height * (0.18 + i * 0.1);
    line(rgba, width, height, width * 0.04, y, width * 0.96, y + height * 0.08, [244, 247, 251], 0.05, Math.max(1, width * 0.004));
  }
  radial(rgba, width, height, width * 0.5, height * 0.5, width * 0.72, [0, 0, 0], 0.28);
}

function vineta(rgba, width, height) {
  fill(rgba, width, height, [18, 8, 28]);
  const cx = width * 0.46;
  const cy = height * 0.5;
  for (let i = 0; i < 46; i += 1) {
    const angle = (i / 46) * Math.PI * 2;
    const inner = Math.min(width, height) * 0.22;
    const outer = Math.hypot(width, height);
    line(
      rgba,
      width,
      height,
      cx + Math.cos(angle) * inner,
      cy + Math.sin(angle) * inner,
      cx + Math.cos(angle) * outer,
      cy + Math.sin(angle) * outer,
      i % 2 ? [255, 225, 120] : [255, 45, 111],
      0.55,
      Math.max(2, width * 0.012),
    );
  }
  roundRect(rgba, width, height, width * 0.07, height * 0.08, width * 0.86, height * 0.72, width * 0.04, [12, 8, 22], 0.94);
  roundRect(rgba, width, height, width * 0.09, height * 0.1, width * 0.82, height * 0.68, width * 0.035, [255, 45, 111], 0.18);
}

function talon(rgba, width, height) {
  fill(rgba, width, height, [7, 20, 34]);
  radial(rgba, width, height, width * 0.72, height * 0.28, width * 0.46, [16, 36, 63], 0.95);
  radial(rgba, width, height, width * 0.2, height * 0.8, width * 0.4, [255, 45, 111], 0.28);
  const x = width * 0.58;
  const y = height * 0.18;
  const w = width * 0.3;
  const h = height * 0.46;
  roundRect(rgba, width, height, x, y, w, h, w * 0.18, [255, 45, 111], 1);
  disc(rgba, width, height, x + w * 0.08, y + h * 0.32, w * 0.09, [7, 20, 34], 1);
  disc(rgba, width, height, x + w * 0.92, y + h * 0.32, w * 0.09, [7, 20, 34], 1);
  disc(rgba, width, height, x + w * 0.38, y + h * 0.4, w * 0.035, [255, 247, 250], 1);
  disc(rgba, width, height, x + w * 0.62, y + h * 0.4, w * 0.035, [255, 247, 250], 1);
  line(rgba, width, height, x + w * 0.4, y + h * 0.58, x + w * 0.6, y + h * 0.58, [20, 6, 12], 0.9, Math.max(2, w * 0.03));
  for (let i = 0; i < 5; i += 1) {
    disc(rgba, width, height, width * (0.12 + i * 0.08), height * (0.16 + (i % 2) * 0.08), width * 0.012, [142, 172, 207], 0.85);
  }
}

function pixel(rgba, width, height) {
  fill(rgba, width, height, [8, 10, 22]);
  const cell = Math.max(8, Math.round(Math.min(width, height) / 28));
  const colors = [[255, 45, 111], [20, 241, 149], [124, 92, 255], [0, 209, 255], [16, 36, 63], [28, 22, 48]];
  const next = rand(8619);
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const roll = next();
      if (roll > 0.72) continue;
      const color = colors[Math.floor(next() * colors.length) % colors.length];
      const inset = roll > 0.45 ? 1 : Math.max(1, Math.floor(cell * 0.18));
      rect(rgba, width, height, col * cell + inset, row * cell + inset, cell - inset * 2, cell - inset * 2, color, roll > 0.45 ? 0.35 : 1);
    }
  }
}

function velas(rgba, width, height) {
  fill(rgba, width, height, [8, 14, 28]);
  for (let i = 1; i < 6; i += 1) {
    const y = height * (0.16 + i * 0.12);
    rect(rgba, width, height, width * 0.06, y, width * 0.88, Math.max(1, height * 0.002), [142, 172, 207], 0.16);
  }
  const next = rand(1080);
  const count = 14;
  const gap = width * 0.78 / count;
  for (let i = 0; i < count; i += 1) {
    const up = next() > 0.46;
    const body = height * (0.08 + next() * 0.22);
    const wick = body + height * (0.04 + next() * 0.1);
    const mid = height * (0.28 + next() * 0.38);
    const x = width * 0.12 + i * gap;
    const color = up ? [20, 241, 149] : [255, 77, 109];
    rect(rgba, width, height, x + gap * 0.42, mid - wick / 2, Math.max(1, gap * 0.08), wick, color, 0.95);
    rect(rgba, width, height, x + gap * 0.22, mid - body / 2, gap * 0.5, body, color, 1);
  }
}

function confeti(rgba, width, height) {
  fill(rgba, width, height, [16, 8, 24]);
  radial(rgba, width, height, width * 0.5, height * 0.45, width * 0.48, [48, 16, 64], 0.55);
  const colors = [[255, 45, 111], [255, 225, 74], [20, 241, 149], [0, 209, 255], [153, 69, 255], [244, 247, 251]];
  const next = rand(2026);
  for (let i = 0; i < 70; i += 1) {
    const color = colors[i % colors.length];
    const x = next() * width;
    const y = next() * height;
    const w = width * (0.012 + next() * 0.03);
    const h = height * (0.02 + next() * 0.045);
    const angle = next() * Math.PI;
    const steps = 8;
    for (let sy = -h; sy <= h; sy += h / steps) {
      for (let sx = -w; sx <= w; sx += w / steps) {
        const rx = sx * Math.cos(angle) - sy * Math.sin(angle);
        const ry = sx * Math.sin(angle) + sy * Math.cos(angle);
        paint(rgba, width, Math.round(x + rx), Math.round(y + ry), color, 0.9);
      }
    }
  }
  for (let i = 0; i < 18; i += 1) {
    const x = next() * width;
    const y = next() * height;
    const arm = width * 0.012;
    rect(rgba, width, height, x - arm, y, arm * 2, Math.max(1, width * 0.003), [255, 247, 250], 0.85);
    rect(rgba, width, height, x, y - arm, Math.max(1, width * 0.003), arm * 2, [255, 247, 250], 0.85);
  }
}

function estrellas(rgba, width, height) {
  fill(rgba, width, height, [5, 8, 22]);
  radial(rgba, width, height, width * 0.3, height * 0.25, width * 0.5, [70, 30, 120], 0.7);
  radial(rgba, width, height, width * 0.75, height * 0.7, width * 0.42, [10, 60, 90], 0.45);
  const next = rand(404);
  for (let i = 0; i < 90; i += 1) {
    const x = Math.floor(next() * width);
    const y = Math.floor(next() * height);
    const bright = 180 + Math.floor(next() * 75);
    const arm = next() > 0.86 ? width * 0.014 : 0;
    paint(rgba, width, x, y, [bright, bright, 255], 1);
    if (arm) {
      rect(rgba, width, height, x - arm, y, arm * 2, Math.max(1, width * 0.003), [bright, bright, 255], 0.8);
      rect(rgba, width, height, x, y - arm, Math.max(1, width * 0.003), arm * 2, [bright, bright, 255], 0.8);
    }
  }
}

function rafaga(rgba, width, height) {
  fill(rgba, width, height, [20, 6, 16]);
  const cx = width * 0.5;
  const cy = height * 0.58;
  for (let i = 0; i < 28; i += 1) {
    const angle = (i / 28) * Math.PI * 2;
    line(
      rgba,
      width,
      height,
      cx,
      cy,
      cx + Math.cos(angle) * width,
      cy + Math.sin(angle) * height,
      i % 2 ? [255, 214, 74] : [255, 45, 111],
      0.85,
      Math.max(3, width * 0.02),
    );
  }
  const points = 16;
  const radius = Math.min(width, height) * 0.28;
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const next = ((i + 1) / points) * Math.PI * 2 - Math.PI / 2;
    const r0 = i % 2 ? radius : radius * 0.48;
    const r1 = (i + 1) % 2 ? radius : radius * 0.48;
    line(rgba, width, height, cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0, cx + Math.cos(next) * r1, cy + Math.sin(next) * r1, [255, 236, 160], 0.95, Math.max(2, width * 0.01));
  }
  disc(rgba, width, height, cx, cy, radius * 0.42, [28, 8, 22], 0.92);
  const dot = Math.max(3, width * 0.008);
  for (let y = height * 0.08; y < height * 0.28; y += dot * 2.4) {
    for (let x = width * 0.08; x < width * 0.92; x += dot * 2.4) {
      disc(rgba, width, height, x, y, dot * 0.45, [255, 45, 111], 0.35);
    }
  }
}

export const BACKGROUND_PAINT = {
  "fondo-solana": solana,
  "fondo-vineta": vineta,
  "fondo-talon": talon,
  "fondo-pixel": pixel,
  "fondo-velas": velas,
  "fondo-confeti": confeti,
  "fondo-estrellas": estrellas,
  "fondo-rafaga": rafaga,
};

export function paintBackground(rgba, width, height, id) {
  const paintId = BACKGROUND_PAINT[id];
  if (paintId) paintId(rgba, width, height);
}
