/* Dependency-free progressive enhancement. SVG + CSS remain usable without JS. */
(() => {
  'use strict';
  let instance = 0;
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs = {}, value = '') => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, val));
    if (value) el.textContent = value;
    return el;
  };

  function init(root) {
    if (root.dataset.initialized) return;
    root.dataset.initialized = 'true';
    const uid = `fiz-loop-${++instance}`;
    const ids = new Map();
    root.querySelectorAll('[id]').forEach(el => {
      const old = el.id;
      ids.set(old, `${uid}-${old}`);
      el.id = ids.get(old);
    });
    root.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        let value = attr.value;
        ids.forEach((next, old) => {
          value = value.replaceAll(`url(#${old})`, `url(#${next})`);
          if ((attr.name === 'href' || attr.name === 'xlink:href') && value === `#${old}`) value = `#${next}`;
          if (attr.name === 'aria-labelledby' || attr.name === 'aria-describedby') {
            value = value.split(' ').map(id => id === old ? next : id).join(' ');
          }
        });
        if (value !== attr.value) el.setAttribute(attr.name, value);
      });
    });

    const svg = root.querySelector('.fl-diagram');
    const nodes = [...root.querySelectorAll('.fl-node')];
    const links = root.querySelector('.fl-links');
    const labels = root.querySelector('.fl-path-labels');
    const button = root.querySelector('.fl-play');
    const buttonLabel = root.querySelector('.fl-button-label');
    const note = root.querySelector('.fl-note');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let lastWidth = -1;
    let offscreen = false;
    const marker = kind => `url(#${ids.get(`fl-arrow-${kind}`)})`;

    function path(d, { at, kind = 'main', purple = false, animated = true } = {}) {
      links.append(make('path', {
        d, class: `fl-link ${kind === 'feedback' ? 'fl-feedback' : kind === 'secondary' ? 'fl-secondary' : ''}`,
        'marker-end': marker(kind === 'secondary' ? 'purple' : kind === 'feedback' ? 'blue' : 'gray')
      }));
      if (animated) links.append(make('path', {
        d, class: `fl-packet fl-motion${purple ? ' fl-purple-packet' : ''}`,
        pathLength: '1', style: `--fl-at:${at}s`
      }));
    }

    function label(text, x, y, rotate = false) {
      const g = make('g', { transform: `translate(${x} ${y})${rotate ? ' rotate(-90)' : ''}` });
      const width = text.length * 5.6 + 14;
      g.append(make('rect', { x: -width / 2, y: -10, width, height: 15, class: 'fl-label-bg' }));
      g.append(make('text', { class: 'fl-path-label', 'text-anchor': 'middle' }, text));
      labels.append(g);
    }

    function layout() {
      const width = Math.round(svg.getBoundingClientRect().width);
      if (width < 240 || width === lastWidth) return;
      lastWidth = width;
      const clock = nodes[0].querySelector('.fl-focus').getAnimations()[0];
      const cycleTime = clock ? clock.currentTime : 0;
      const compact = width < 500;
      const wide = width >= 700;
      const cols = wide ? 3 : width < 335 ? 1 : 2;
      root.dataset.layout = compact ? 'compact' : wide ? 'wide' : 'medium';
      root.dataset.columns = String(cols);
      root.style.setProperty('--fl-small-title', cols === 1 ? '16px' : width < 385 ? '12px' : '13px');
      const left = compact ? 2 : 8;
      const right = compact ? 21 : 36;
      const gapX = compact ? 22 : 36;
      const gapY = wide ? 64 : compact ? 37 : 48;
      const cardW = (width - left - right - (cols - 1) * gapX) / cols;
      const cardH = cols === 1 ? 200 : compact ? 147 + Math.max(0, cardW - 160) * .43 : 184 + Math.max(0, cardW - 224) * .16;
      root.style.setProperty('--fl-title-size', cardW < 245 ? '16px' : '18px');
      const top = 13;
      const rows = Math.ceil(9 / cols);
      const height = top + rows * cardH + (rows - 1) * gapY + (wide ? 66 : 54);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      const positions = nodes.map((node, i) => {
        const row = Math.floor(i / cols);
        const column = row % 2 ? cols - 1 - i % cols : i % cols;
        const x = left + column * (cardW + gapX);
        const y = top + row * (cardH + gapY);
        node.setAttribute('transform', `translate(${x} ${y})`);
        node.querySelectorAll('.fl-card, .fl-card-wash, .fl-focus').forEach(rect => {
          rect.setAttribute('width', cardW);
          rect.setAttribute('height', cardH);
        });
        const title = node.querySelector('.fl-title');
        title.setAttribute('x', compact ? 10 : 14);
        const names = ['Physical wireless environment', 'Multimodal sensing', 'Real-time Digital Twin', 'Multimodal LLM', 'Autonomous problem formulation', 'Feasibility guardrail', 'Task Expert Models', 'Wireless task solutions', 'Network evaluation'];
        const available = cardW - (compact ? 20 : 28);
        const baseSize = compact ? (cols === 1 ? 16 : width < 385 ? 12 : 13) : cardW < 245 ? 16 : 18;
        title.style.fontSize = `${baseSize}px`;
        const probe = make('tspan', {}, names[i]);
        title.replaceChildren(probe);
        const measure = text => {
          probe.textContent = text;
          if (typeof probe.getComputedTextLength === 'function') return probe.getComputedTextLength();
          const widths = {"A": 0.7739, "B": 0.7622, "C": 0.7339, "D": 0.8301, "E": 0.6831, "F": 0.6831, "G": 0.8208, "H": 0.8369, "I": 0.3721, "J": 0.3721, "K": 0.7749, "L": 0.6372, "M": 0.9951, "N": 0.8369, "O": 0.8501, "P": 0.7329, "Q": 0.8501, "R": 0.77, "S": 0.7202, "T": 0.6821, "U": 0.812, "V": 0.7739, "W": 1.103, "X": 0.771, "Y": 0.7241, "Z": 0.7251, "a": 0.6748, "b": 0.7158, "c": 0.5928, "d": 0.7158, "e": 0.6782, "f": 0.4351, "g": 0.7158, "h": 0.7119, "i": 0.3428, "j": 0.3428, "k": 0.665, "l": 0.3428, "m": 1.042, "n": 0.7119, "o": 0.687, "p": 0.7158, "q": 0.7158, "r": 0.4932, "s": 0.5952, "t": 0.478, "u": 0.7119, "v": 0.6519, "w": 0.9238, "x": 0.645, "y": 0.6519, "z": 0.582, " ": 0.3481, "-": 0.415, "\u00b7": 0.3799, "+": 0.8379};
          return [...text].reduce((sum, c) => sum + (widths[c] || .65), 0) * baseSize;
        };
        let lines = [names[i]];
        if (measure(names[i]) > available) {
          if (i === 6) title.style.fontSize = `${baseSize * available / measure(names[i])}px`;
          else {
            lines = [''];
            names[i].split(' ').forEach(word => {
              const j = lines.length - 1;
              const candidate = lines[j] ? `${lines[j]} ${word}` : word;
              if (lines[j] && measure(candidate) > available) lines.push(word);
              else lines[j] = candidate;
            });
          }
        }
        if (lines.length > 2) {
          const words = names[i].split(' ');
          let best = null;
          for (let split = 1; split < words.length; split++) {
            const pair = [words.slice(0, split).join(' '), words.slice(split).join(' ')];
            const widest = Math.max(...pair.map(measure));
            if (!best || widest < best.width) best = { lines: pair, width: widest };
          }
          lines = best.lines;
          title.style.fontSize = `${Math.min(baseSize, baseSize * available / best.width)}px`;
        }
        title.replaceChildren(...lines.map((text, j) => make('tspan', {
          x: compact ? 10 : 14,
          y: (compact && cols > 1 ? 27 : 31) + j * (compact && cols > 1 ? 17 : 23)
        }, text)));
        const number = node.querySelector('.fl-number');
        number.setAttribute('x', cardW - (compact ? 8 : 12));
        number.setAttribute('y', 13);
        const scene = node.querySelector('.fl-scene');
        const scale = Math.min(1, (cardW - (compact ? 18 : 28)) / 224);
        scene.setAttribute('transform', `translate(${(cardW - 224 * scale) / 2} ${compact && cols > 1 ? 54 : 66}) scale(${scale})`);
        const detail = node.querySelector('.fl-detail');
        if (!detail.dataset.fullText) detail.dataset.fullText = [...detail.querySelectorAll('tspan')].map(t => t.textContent).join(' · ');
        if (!detail.dataset.originalLines) detail.dataset.originalLines = JSON.stringify([...detail.querySelectorAll('tspan')].map(t => t.textContent));
        const detailProbe = make('tspan', {}, detail.dataset.fullText);
        detail.replaceChildren(detailProbe);
        const detailSize = compact && cols > 1 ? 10.5 : 12;
        const detailWidth = typeof detailProbe.getComputedTextLength === 'function' ? detailProbe.getComputedTextLength() : detail.dataset.fullText.length * detailSize * .56;
        const detailLines = detailWidth <= available ? [detail.dataset.fullText] : JSON.parse(detail.dataset.originalLines);
        detail.replaceChildren(...detailLines.map((text, j) => make('tspan', {
          x: compact ? 10 : 14,
          y: cardH - (detailLines.length > 1 ? 24 : 15) + j * (compact ? 12 : 14)
        }, text)));
        return { x, y, cx: x + cardW / 2, cy: y + cardH / 2, right: x + cardW, bottom: y + cardH };
      });

      links.replaceChildren();
      labels.replaceChildren();
      const starts = [.48, 1.53, 2.58, 3.85, 4.85, 6.0, 7.26, 8.48];
      for (let i = 0; i < 8; i++) {
        const a = positions[i], b = positions[i + 1];
        let d;
        if (Math.abs(a.y - b.y) < 1) {
          const forward = b.x > a.x;
          d = `M${forward ? a.right + 2 : a.x - 2} ${a.cy} H${forward ? b.x - 6 : b.right + 6}`;
        } else {
          d = `M${a.cx} ${a.bottom + 2} V${b.y - 6}`;
        }
        path(d, { at: starts[i], purple: i >= 2 && i <= 5 });
      }
      const twin = positions[2], evaluation = positions[8];
      const rail = width - (compact ? 6 : 12);
      const endX = twin.right + 6;
      // The main feedback route always terminates at the Digital Twin.
      path(`M${evaluation.right + 2} ${evaluation.cy} H${rail - 6} Q${rail} ${evaluation.cy} ${rail} ${evaluation.cy - 6} V${twin.cy + 6} Q${rail} ${twin.cy} ${rail - 6} ${twin.cy} H${endX}`, { at: 9.64, kind: 'feedback' });
      if (!compact) label('State feedback', rail, (evaluation.cy + twin.cy) / 2, true);

      // Two distinct learning loops from the proposal; neither is a main control edge.
      if (wide) {
        const guard = positions[5], llm = positions[3], expert = positions[6];
        const repairY = llm.y - 30;
        path(`M${guard.cx} ${guard.y - 2} V${repairY + 5} Q${guard.cx} ${repairY} ${guard.cx + 5} ${repairY} H${llm.cx - 5} Q${llm.cx} ${repairY} ${llm.cx} ${repairY + 5} V${llm.y - 6}`, { kind: 'secondary', animated: false });
        label('Revise if infeasible', (guard.cx + llm.cx) / 2, repairY);
        const learnY = evaluation.bottom + 34;
        path(`M${evaluation.cx} ${evaluation.bottom + 2} V${learnY - 5} Q${evaluation.cx} ${learnY} ${evaluation.cx - 5} ${learnY} H${expert.cx + 5} Q${expert.cx} ${learnY} ${expert.cx} ${learnY - 5} V${expert.bottom + 6}`, { at: 9.7, kind: 'secondary', purple: true });
        label('Natural-language feedback · learning', (evaluation.cx + expert.cx) / 2, learnY);
      } else {
        label('Evaluation → Digital Twin', width / 2, height - 17);
      }
      // Preserve the shared clock when responsive routing rebuilds the link paths.
      svg.querySelectorAll('.fl-motion').forEach(el => {
        el.getAnimations().forEach(animation => { animation.currentTime = cycleTime; });
      });
    }

    function suspended() { root.dataset.suspended = String(document.hidden || offscreen); }
    function motionPreference() {
      button.hidden = reduce.matches;
      note.textContent = reduce.matches ? 'Static view · reduced motion' : '11.5 s conceptual cycle';
    }
    button.hidden = false;
    button.addEventListener('click', () => {
      const paused = root.dataset.paused !== 'true';
      root.dataset.paused = String(paused);
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Resume workflow animation' : 'Pause workflow animation');
      buttonLabel.textContent = paused ? 'Play' : 'Pause';
    });
    if (reduce.addEventListener) reduce.addEventListener('change', motionPreference);
    motionPreference();
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(svg);
    else window.addEventListener('resize', layout, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      offscreen = !entries[0].isIntersecting;
      suspended();
    }, { rootMargin: '80px' }).observe(root);
    document.addEventListener('visibilitychange', suspended);
    layout();
    suspended();
  }
  const initialize = () => document.querySelectorAll('[data-fiz-loop]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
