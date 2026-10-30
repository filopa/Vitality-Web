"use client";

import { useEffect, useRef } from "react";

const PEOPLE = [
  {
    src: "https://f003.backblazeb2.com/file/Video-Dolphin/Gemini_Generated_Image_jpi6jvjpi6jvjpi6.jpg",
    alt: "Female doctor",
  },
  {
    src: "https://f003.backblazeb2.com/file/Video-Dolphin/Gemini_Generated_Image_jo8pfrjo8pfrjo8p.jpg",
    alt: "Male doctor",
  },
  {
    src: "https://f003.backblazeb2.com/file/Video-Dolphin/Gemini_Generated_Image_nebtvznebtvznebt.jpg",
    alt: "Male patient",
  },
  {
    src: "https://f003.backblazeb2.com/file/Video-Dolphin/Gemini_Generated_Image_7me0f47me0f47me0.jpg",
    alt: "Female patient",
  },
];

const BUBBLE_TYPES = ["chat", "shield", "heart", "chat", "shield"];

/* ---------- مواضع العناصر في كل لحظة (النسب من 0 إلى 100) ---------- */

// الأشخاص: يدورون حول اللوجو + تنفس في نصف القطر + اهتزاز خفيف
function personPos(i, t, n) {
  const angle = -Math.PI * 0.75 + (i / n) * Math.PI * 2 + t * 0.16;
  const r = 26 + 3 * Math.sin(t * 0.7 + i * 1.7);
  return {
    x: 50 + r * Math.cos(angle) + 1.3 * Math.sin(t * 1.3 + i * 2),
    y: 50 + r * Math.sin(angle) + 1.3 * Math.cos(t * 1.1 + i * 3),
  };
}

// الفقاعات: تدور على مدار خارجي بعكس الاتجاه
function bubblePos(i, t, n) {
  const angle = (i / n) * Math.PI * 2 - t * 0.22;
  const r = 45 + 0.8 * Math.sin(t * 0.9 + i);
  return { x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) };
}

function formatPercent(value) {
  return `${value.toFixed(4)}%`;
}

function formatCoordinate(value) {
  return Number(value.toFixed(4));
}

function ringCurve(a, b) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx + (mx - 50) * 0.45;
  const cy = my + (my - 50) * 0.45;
  return { cx, cy };
}

const quad = (p0, c, p1, u) => {
  const k = 1 - u;
  return {
    x: k * k * p0.x + 2 * k * u * c.x + u * u * p1.x,
    y: k * k * p0.y + 2 * k * u * c.y + u * u * p1.y,
  };
};

/* ---------- الأيقونات ---------- */

function BubbleIcon({ type }) {
  const p = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  if (type === "shield")
    return (
      <svg {...p}>
        <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  if (type === "heart")
    return (
      <svg {...p}>
        <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z" />
    </svg>
  );
}

function VitalityLogo({ className = "" }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="white"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 41S6 31 6 18.5A9.5 9.5 0 0124 13a9.5 9.5 0 0118 5.5C42 31 24 41 24 41z" />
      <path d="M12 24h7l3-6 4 11 3-5h7" />
    </svg>
  );
}

/* ---------- المكون ---------- */

export default function ConnectedCommunity({ people = PEOPLE }) {
  const n = people.length;
  const nb = BUBBLE_TYPES.length;

  const personEls = useRef([]);
  const bubbleEls = useRef([]);
  const spokeEls = useRef([]); // خطوط من المركز لكل شخص
  const ringEls = useRef([]); // منحنيات بين الأشخاص
  const spokeDots = useRef([]);
  const ringDots = useRef([]);
  const logoEl = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let raf;
    const start = performance.now();
    const center = { x: 50, y: 50 };

    const frame = (now) => {
      const t = reduce ? 0 : (now - start) / 1000;

      const pts = people.map((_, i) => personPos(i, t, n));

      pts.forEach((p, i) => {
        const el = personEls.current[i];
        if (el) {
          el.style.left = `${p.x}%`;
          el.style.top = `${p.y}%`;
        }

        // خط المركز -> الشخص
        const line = spokeEls.current[i];
        if (line) {
          line.setAttribute("x2", p.x);
          line.setAttribute("y2", p.y);
        }

        // نقطة تواصل تمشي على الخط (اتجاه بالتبادل)
        const dot = spokeDots.current[i];
        if (dot) {
          let u = (t * (0.28 + i * 0.03) + i * 0.27) % 1;
          if (i % 2) u = 1 - u;
          dot.setAttribute("cx", center.x + (p.x - center.x) * u);
          dot.setAttribute("cy", center.y + (p.y - center.y) * u);
        }
      });

      // منحنيات بين كل شخص والتالي
      pts.forEach((a, i) => {
        const b = pts[(i + 1) % n];
        const c = ringCurve(a, b);
        const path = ringEls.current[i];
        if (path)
          path.setAttribute(
            "d",
            `M${a.x} ${a.y} Q${c.cx} ${c.cy} ${b.x} ${b.y}`,
          );
        const dot = ringDots.current[i];
        if (dot) {
          const u = (t * (0.2 + i * 0.025) + i * 0.31) % 1;
          const q = quad(a, { x: c.cx, y: c.cy }, b, u);
          dot.setAttribute("cx", q.x);
          dot.setAttribute("cy", q.y);
        }
      });

      for (let i = 0; i < nb; i++) {
        const el = bubbleEls.current[i];
        if (!el) continue;
        const p = bubblePos(i, t, nb);
        el.style.left = `${p.x}%`;
        el.style.top = `${p.y}%`;
      }

      // اللوجو يتنفس
      if (logoEl.current) {
        logoEl.current.style.transform = `scale(${1 + 0.04 * Math.sin(t * 2)})`;
      }

      if (!reduce) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [people, n, nb]);

  // مواضع البداية (للـ SSR وللحظة الأولى)
  const initialPeople = people.map((_, i) => personPos(i, 0, n));
  const initialBubbles = BUBBLE_TYPES.map((_, i) => bubblePos(i, 0, nb));

  return (
    <section className="relative  h-full overflow-hidden ">
      <style>{`
        @keyframes vt-flow { to { stroke-dashoffset: -24 } }
        @keyframes vt-pulse { 0% { transform: scale(1); opacity: .45 } 100% { transform: scale(1.9); opacity: 0 } }
        @keyframes vt-in { from { opacity: 0; transform: scale(.8) } to { opacity: 1; transform: scale(1) } }
        @keyframes vt-glow { 0%,100% { opacity: .6; transform: scale(1) } 50% { opacity: 1; transform: scale(1.12) } }
        .vt-flow { stroke-dasharray: 4 8; animation: vt-flow 1.8s linear infinite }
        .vt-pulse { animation: vt-pulse 2.8s ease-out infinite }
        .vt-in { animation: vt-in .7s ease-out both }
        .vt-glow { animation: vt-glow 6s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) {
          .vt-flow, .vt-pulse, .vt-in, .vt-glow { animation: none }
        }
      `}</style>

      <div className="mx-auto flex justify-center  h-full max-w-6xl items-center gap-12 px-6  lg:grid-cols-2 lg:py-24">
        {/* الرسم المتحرك */}
        <div className="relative mx-auto aspect-square  w-full">
          <div className="vt-glow absolute inset-[8%] rounded-full bg-[#0b9ab8]/10 blur-3xl" />

          {/* الخطوط والنقاط */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {initialPeople.map((p, i) => (
              <line
                key={`s${i}`}
                ref={(el) => (spokeEls.current[i] = el)}
                x1="50"
                y1="50"
                x2={formatCoordinate(p.x)}
                y2={formatCoordinate(p.y)}
                stroke="#0b9ab8"
                strokeOpacity="0.45"
                strokeWidth="0.35"
                className="vt-flow"
                style={{ animationDelay: `${i * -0.4}s` }}
              />
            ))}
            {initialPeople.map((_, i) => (
              <path
                key={`r${i}`}
                ref={(el) => (ringEls.current[i] = el)}
                fill="none"
                stroke="#0b9ab8"
                strokeOpacity="0.25"
                strokeWidth="0.35"
                className="vt-flow"
                style={{ animationDelay: `${i * -0.5}s` }}
              />
            ))}
            {initialPeople.map((_, i) => (
              <circle
                key={`sd${i}`}
                ref={(el) => (spokeDots.current[i] = el)}
                r="1.1"
                fill="#0b9ab8"
              />
            ))}
            {initialPeople.map((_, i) => (
              <circle
                key={`rd${i}`}
                ref={(el) => (ringDots.current[i] = el)}
                r="0.8"
                fill="#38bdd6"
              />
            ))}
          </svg>

          {/* الفقاعات */}
          {BUBBLE_TYPES.map((type, i) => (
            <div
              key={i}
              ref={(el) => (bubbleEls.current[i] = el)}
              className="absolute w-[7%] min-w-[26px] -translate-x-1/2 -translate-y-1/2"
              style={{
                left: formatPercent(initialBubbles[i].x),
                top: formatPercent(initialBubbles[i].y),
              }}
            >
              <div className="flex aspect-square items-center justify-center rounded-full bg-white text-[#0b9ab8] shadow-md ring-1 ring-[#0b9ab8]/20">
                <BubbleIcon type={type} />
              </div>
            </div>
          ))}

          {/* الدكاترة والمرضى */}
          {people.map((p, i) => (
            <div
              key={i}
              ref={(el) => (personEls.current[i] = el)}
              className="absolute w-[25%] -translate-x-1/2 -translate-y-1/2"
              style={{
                left: formatPercent(initialPeople[i].x),
                top: formatPercent(initialPeople[i].y),
              }}
            >
              <div
                className="vt-in aspect-square overflow-hidden rounded-full bg-white shadow-xl shadow-[#0b9ab8]/20 ring-4 ring-white"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <img
                  src={p.src}
                  alt={p.alt}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ))}

          {/* اللوجو في المنتصف */}
          <div className="absolute left-1/2 top-1/2 w-[20%] -translate-x-1/2 -translate-y-1/2">
            <span className="vt-pulse absolute inset-0 rounded-full bg-[#0b9ab8]" />
            <span
              className="vt-pulse absolute inset-0 rounded-full bg-[#0b9ab8]"
              style={{ animationDelay: "-1.4s" }}
            />
            <div
              ref={logoEl}
              className="relative flex aspect-square items-center justify-center rounded-full bg-gradient-to-br from-[#b8c5f6] to-[#02fcd6] p-[5%] shadow-xl shadow-[#0b9ab8]/40 ring-4 ring-white/80"
            >
              <img
                className="w-full h-full"
                src="https://f003.backblazeb2.com/file/Video-Dolphin/android-icon-foreground.png"
                alt="Vitality"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
