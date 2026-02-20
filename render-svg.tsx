import fs from 'fs';
const C = {
  bg: '#ffffff', panel: '#ffffff', border: '#999999',
  hotPipe: '#cc0000', coldPipe: '#0055cc', geoPipe: '#228b22',
  coolPipe: '#0088aa', dim: '#555555', bright: '#111111',
  tankStroke: '#333333', tankFill: '#f8f8f8', accent: '#cc0000',
  text: '#333333',
};
const VL = 240, RL = 360;
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1560 640" width="1560" height="640">
<rect width="1560" height="640" fill="${C.bg}"/>
<defs>
  <linearGradient id="gTankHot" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${C.hotPipe}" stop-opacity="0.12"/>
    <stop offset="100%" stop-color="${C.coldPipe}" stop-opacity="0.08"/>
  </linearGradient>
</defs>

<!-- REGION LABELS -->
<text x="40" y="48" fill="#ccc" font-size="5.5" font-weight="700" letter-spacing="2.5">QUELLEN</text>
<text x="340" y="540" fill="#ccc" font-size="5.5" font-weight="700" letter-spacing="2.5">ERZEUGUNG</text>
<text x="740" y="170" fill="#ccc" font-size="5.5" font-weight="700" letter-spacing="2.5">SPEICHER</text>
<text x="940" y="210" fill="#ccc" font-size="5.5" font-weight="700" letter-spacing="2.5">VERTEILUNG</text>
<text x="1230" y="170" fill="#ccc" font-size="5.5" font-weight="700" letter-spacing="2.5">KÄLTE</text>

<!-- Trennlinie -->
<line x1="1175" y1="50" x2="1175" y2="560" stroke="#ccc" stroke-width="0.6" stroke-dasharray="6,4"/>

<!-- ERDWÄRME -->
<rect x="20" y="${VL-20}" width="95" height="42" rx="3" fill="white" stroke="${C.geoPipe}" stroke-width="1"/>
<text x="67" y="${VL}" text-anchor="middle" fill="#111" font-size="5" font-weight="600">Erdwärme</text>
<text x="67" y="${VL+10}" text-anchor="middle" fill="#555" font-size="3.5">FVU Nahwärme</text>

<!-- PVT Solar -->
<rect x="155" y="55" width="105" height="45" rx="3" fill="white" stroke="${C.hotPipe}" stroke-width="1"/>
<text x="207" y="78" text-anchor="middle" fill="#111" font-size="5" font-weight="600">PVT-Solar</text>
<text x="207" y="90" text-anchor="middle" fill="#555" font-size="3.5">6,2 kW th.</text>

<!-- Abluft WP -->
<rect x="390" y="55" width="130" height="45" rx="3" fill="white" stroke="${C.hotPipe}" stroke-width="1"/>
<text x="455" y="78" text-anchor="middle" fill="#111" font-size="5" font-weight="600">Abluft-WP</text>
<text x="455" y="90" text-anchor="middle" fill="#555" font-size="3.5">auf Dach · Rohrbegl.</text>

<!-- MAIN PIPES Erdwärme → WT -->
<line x1="115" y1="${VL}" x2="350" y2="${VL}" stroke="${C.geoPipe}" stroke-width="3"/>
<line x1="350" y1="${RL}" x2="115" y2="${RL}" stroke="${C.geoPipe}" stroke-width="2.5" stroke-dasharray="5,3"/>

<!-- Pumps -->
<circle cx="162" cy="${VL}" r="10" fill="white" stroke="${C.accent}" stroke-width="1.5"/>
<polygon points="162,${VL-4} 166,${VL+3} 158,${VL+3}" fill="${C.accent}"/>
<text x="162" y="${VL+16}" text-anchor="middle" fill="${C.accent}" font-size="4.5" font-weight="700">P01</text>

<circle cx="330" cy="${VL}" r="10" fill="white" stroke="${C.accent}" stroke-width="1.5"/>
<polygon points="330,${VL-4} 334,${VL+3} 326,${VL+3}" fill="${C.accent}"/>
<text x="330" y="${VL+16}" text-anchor="middle" fill="${C.accent}" font-size="4.5" font-weight="700">P03</text>

<!-- PUFFER PVT 2000L -->
<rect x="211" y="${VL-45}" width="48" height="${RL-VL+90}" rx="24" fill="url(#gTankHot)" stroke="${C.tankStroke}" stroke-width="1.2"/>
<text x="235" y="${VL-52}" text-anchor="middle" fill="#111" font-size="5" font-weight="600">Puffer PVT</text>
<text x="235" y="${VL-62}" text-anchor="middle" fill="#555" font-size="4">2000 L</text>

<!-- WT 47kW -->
<path d="M355,${VL-5} A45,45 0 0,1 355,${RL+5}" fill="none" stroke="${C.tankStroke}" stroke-width="1.5"/>
<text x="380" y="${RL+28}" text-anchor="middle" fill="#555" font-size="4">WT 47 kW</text>

<!-- WP Einhausung -->
<rect x="460" y="${VL-55}" width="180" height="${RL-VL+110}" rx="5" fill="none" stroke="${C.coldPipe}" stroke-width="0.8" stroke-dasharray="8,4" opacity="0.5"/>
<text x="550" y="${VL-62}" text-anchor="middle" fill="${C.coldPipe}" font-size="4" font-weight="600" opacity="0.7">Maschinenraum WP</text>

<!-- WP 175kW -->
<rect x="475" y="${VL-26}" width="110" height="${RL-VL+52}" rx="5" fill="white" stroke="${C.accent}" stroke-width="1.5"/>
<text x="530" y="${VL-8}" text-anchor="middle" fill="#111" font-size="5.5" font-weight="700">Wärmepumpe</text>
<text x="530" y="${VL+5}" text-anchor="middle" fill="#555" font-size="4">175 kW th · 38,9 kW el</text>

<!-- WP→P04→Puffer HZ pipes -->
<line x1="585" y1="${VL}" x2="720" y2="${VL}" stroke="${C.hotPipe}" stroke-width="3"/>
<line x1="585" y1="${RL}" x2="720" y2="${RL}" stroke="${C.coldPipe}" stroke-width="2.5" stroke-dasharray="5,3"/>

<circle cx="660" cy="${VL}" r="10" fill="white" stroke="${C.accent}" stroke-width="1.5"/>
<polygon points="660,${VL-4} 664,${VL+3} 656,${VL+3}" fill="${C.accent}"/>
<text x="660" y="${VL+16}" text-anchor="middle" fill="${C.accent}" font-size="4.5" font-weight="700">P04</text>

<!-- PUFFER HZ 1500L -->
<rect x="728" y="${VL-45}" width="44" height="${RL-VL+90}" rx="22" fill="url(#gTankHot)" stroke="${C.tankStroke}" stroke-width="1.2"/>
<text x="750" y="${VL-52}" text-anchor="middle" fill="#111" font-size="5" font-weight="600">Puffer HZ</text>
<text x="750" y="${VL-62}" text-anchor="middle" fill="#555" font-size="4">1500 L</text>

<!-- Puffer→P05→Verteiler -->
<line x1="772" y1="${VL}" x2="895" y2="${VL}" stroke="${C.hotPipe}" stroke-width="3"/>
<line x1="772" y1="${RL}" x2="895" y2="${RL}" stroke="${C.coldPipe}" stroke-width="2.5" stroke-dasharray="5,3"/>

<circle cx="835" cy="${VL}" r="10" fill="white" stroke="${C.accent}" stroke-width="1.5"/>
<polygon points="835,${VL-4} 839,${VL+3} 831,${VL+3}" fill="${C.accent}"/>
<text x="835" y="${VL+16}" text-anchor="middle" fill="${C.accent}" font-size="4.5" font-weight="700">P05</text>

<!-- VERTEILER HEIZUNG -->
<rect x="895" y="${VL+20}" width="180" height="18" rx="3" fill="white" stroke="${C.hotPipe}" stroke-width="1.5"/>
<text x="985" y="${VL+33}" text-anchor="middle" fill="#111" font-size="5" font-weight="700">VERTEILER HEIZUNG</text>
<rect x="895" y="${VL+44}" width="180" height="14" rx="3" fill="white" stroke="${C.coldPipe}" stroke-width="1" stroke-dasharray="4,2"/>
<text x="985" y="${VL+54}" text-anchor="middle" fill="${C.coldPipe}" font-size="3.5">Rücklauf</text>

<!-- KÄLTE BEREICH -->
<path d="M1180,${VL-12} A55,55 0 0,1 1180,${RL+12}" fill="none" stroke="${C.tankStroke}" stroke-width="1.5"/>
<text x="1210" y="${RL+28}" text-anchor="middle" fill="#555" font-size="4" font-weight="600">Brunnen-WT</text>

<rect x="1155" y="${VL-78}" width="115" height="48" rx="3" fill="white" stroke="${C.coolPipe}" stroke-width="0.8"/>
<text x="1212" y="${VL-64}" text-anchor="middle" fill="${C.coolPipe}" font-size="4" font-weight="700">Nullenergiebrunnen</text>
<text x="1212" y="${VL-52}" text-anchor="middle" fill="#555" font-size="3">4/50 · 40m³ · 1000 L</text>

<rect x="1170" y="${RL+40}" width="240" height="85" rx="5" fill="none" stroke="${C.coolPipe}" stroke-width="1" opacity="0.5"/>
<text x="1290" y="${RL+52}" text-anchor="middle" fill="${C.coolPipe}" font-size="3.5" font-weight="600">Kältegestell · Einhausung</text>

<!-- Title block -->
<line x1="20" y1="600" x2="1540" y2="600" stroke="#999" stroke-width="0.5"/>
<text x="40" y="620" fill="#111" font-size="7" font-weight="700">2 · Hauptstation + Anschluss an Satellitenhaus - Detail</text>
<text x="40" y="632" fill="#555" font-size="4">Darmstadt 2026 · KurTech</text>
</svg>`;

fs.writeFileSync('pid-diagram.svg', svg);
console.log(`✅ pid-diagram.svg gespeichert (${Math.round(svg.length/1024)} KB)`);
