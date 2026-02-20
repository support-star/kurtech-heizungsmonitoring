import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PIDDiagram } from './src/sections/PIDDiagram';
import * as fs from 'fs';

globalThis.React = React;

const html = renderToStaticMarkup(
  React.createElement(PIDDiagram, { data: {
    status: 'heizen',
    vorlauftemperatur: 38,
    ruecklauftemperatur: 32,
    puffer_oben: 42,
    puffer_mitte: 38,
    puffer_unten: 34,
    cop: 4.2,
    aussentemperatur: 5.3,
    sole_ein: 8.2,
    sole_aus: 4.1,
    volumenstrom: 1850,
    verdichter_leistung: 2.8,
    heizkreis1_aktiv: true,
    heizkreis2_aktiv: true,
    brauchwasser_temp: 48,
    brauchwasser_soll: 50,
    betriebsstunden: 3250,
    starts_verdichter: 1420,
    letzte_abtauung: new Date().toISOString(),
  } as any })
);

// Find the main diagram SVG (viewBox="0 0 1560 640")
const svgStart = html.indexOf('<svg viewBox="0 0 1560 640"');
if (svgStart === -1) {
  console.log('ERROR: Main SVG not found');
  process.exit(1);
}

// Find matching closing tag by counting nesting
let depth = 0;
let i = svgStart;
let svgEnd = -1;
while (i < html.length) {
  if (html.substring(i, i + 4) === '<svg') {
    depth++;
    i += 4;
  } else if (html.substring(i, i + 6) === '</svg>') {
    depth--;
    if (depth === 0) {
      svgEnd = i + 6;
      break;
    }
    i += 6;
  } else {
    i++;
  }
}

if (svgEnd === -1) {
  console.log('ERROR: Could not find closing SVG tag');
  process.exit(1);
}

let svg = html.substring(svgStart, svgEnd);

// Add namespace and fix attributes
svg = svg.replace(
  '<svg viewBox="0 0 1560 640"',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1560 640" width="1560" height="640"'
);

// Remove React style attribute
svg = svg.replace(/style="display:block;[^"]*"/, '');

// Add dark background rect at the beginning
svg = svg.replace(
  '<defs>',
  '<rect width="1560" height="640" fill="#0c1017"/>\n<defs>'
);

const output = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg;
fs.writeFileSync('/home/claude/pid-diagram.svg', output);
const kb = (fs.statSync('/home/claude/pid-diagram.svg').size / 1024).toFixed(0);
console.log(`✅ pid-diagram.svg gespeichert (${kb} KB)`);

