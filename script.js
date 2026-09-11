const byId = (id) => document.getElementById(id);

const inputs = {
  inertia: byId("inertia"),
  damping: byId("damping"),
  load: byId("load-step")
};

function simulate() {
  const inertia = Number(inputs.inertia.value);
  const damping = Number(inputs.damping.value);
  const load = Number(inputs.load.value);

  byId("inertia-value").value = inertia.toFixed(1) + " s";
  byId("damping-value").value = damping.toFixed(1) + " pu";
  byId("load-value").value = load.toFixed(1) + " MW";

  const points = [];
  const dt = 0.02;
  let deviation = 0;
  let velocity = 0;
  const natural = 1.2 / Math.sqrt(inertia);
  const dampingRatio = Math.min(1.5, damping / (1.45 * Math.sqrt(inertia)));
  const forcing = -0.115 * load / inertia;

  for (let t = 0; t <= 10; t += dt) {
    if (t >= 1) {
      const acceleration = forcing - 2 * dampingRatio * natural * velocity - natural * natural * deviation;
      velocity += acceleration * dt;
      deviation += velocity * dt;
    }
    points.push({ t, f: 60 + deviation });
  }

  const nadir = Math.min(...points.map((p) => p.f));
  const initialRocof = -0.5 * load / inertia;
  byId("nadir").textContent = nadir.toFixed(3) + " Hz";
  byId("rocof").textContent = "−" + Math.abs(initialRocof).toFixed(2) + " Hz/s";
  draw(points);
}

function draw(points) {
  const canvas = byId("response-chart");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(600, rect.width * ratio);
  canvas.height = Math.max(310, rect.width * 0.48 * ratio);
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  const width = canvas.width / ratio;
  const height = canvas.height / ratio;
  const pad = { l: 54, r: 20, t: 20, b: 38 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const minF = Math.min(59.45, ...points.map((p) => p.f)) - 0.02;
  const maxF = 60.05;
  const x = (t) => pad.l + (t / 10) * w;
  const y = (f) => pad.t + ((maxF - f) / (maxF - minF)) * h;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#19344b";
  ctx.fillStyle = "#8ca3b5";
  ctx.font = "12px ui-monospace, monospace";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 5; i++) {
    const yy = pad.t + (i / 5) * h;
    const value = maxF - (i / 5) * (maxF - minF);
    ctx.beginPath(); ctx.moveTo(pad.l, yy); ctx.lineTo(width - pad.r, yy); ctx.stroke();
    ctx.fillText(value.toFixed(2), 6, yy + 4);
  }
  for (let i = 0; i <= 5; i++) {
    const xx = pad.l + (i / 5) * w;
    ctx.beginPath(); ctx.moveTo(xx, pad.t); ctx.lineTo(xx, height - pad.b); ctx.stroke();
    ctx.fillText(String(i * 2), xx - 4, height - 13);
  }

  ctx.strokeStyle = "#42d9e8";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  points.forEach((point, index) => {
    const px = x(point.t), py = y(point.f);
    if (index === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.fillStyle = "#9fb1c2";
  ctx.fillText("Time (s)", width / 2 - 22, height - 4);
  ctx.save();
  ctx.translate(12, height / 2 + 30);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Frequency (Hz)", 0, 0);
  ctx.restore();

  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#4c8dff";
  ctx.beginPath(); ctx.moveTo(x(1), pad.t); ctx.lineTo(x(1), height - pad.b); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#7fa9fa";
  ctx.fillText("Load step", x(1) + 6, pad.t + 16);
}

Object.values(inputs).forEach((input) => input.addEventListener("input", simulate));
byId("reset-lab").addEventListener("click", () => {
  inputs.inertia.value = 4;
  inputs.damping.value = 1.2;
  inputs.load.value = 1.2;
  simulate();
});

const menuButton = document.querySelector(".menu-button");
const nav = byId("site-nav");
menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
}));

byId("year").textContent = new Date().getFullYear();
window.addEventListener("resize", simulate);
simulate();
