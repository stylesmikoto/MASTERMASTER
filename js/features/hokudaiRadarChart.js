const DEFAULT_OPTIONS = Object.freeze({
  size: 360,
  maxValue: 100,
  levels: 5,
  padding: 44,
  axisColor: '#AEB7C2',
  gridColor: '#DDE3EA',
  fillColor: 'rgba(41, 128, 185, 0.22)',
  strokeColor: '#2A74B8',
  pointColor: '#1E5C99',
  labelColor: '#1F2933',
  font: '13px sans-serif'
});

export function buildHokudaiRadarChartData(unitResults = [], options = {}){
  const maxValue = options.maxValue || DEFAULT_OPTIONS.maxValue;
  return {
    maxValue,
    axes: unitResults.map(result => ({
      id: result.unitId,
      label: result.shortLabel || result.label,
      fullLabel: result.label,
      value: clamp(Number(result.scorePct || 0), 0, maxValue),
      mastery: result.mastery || null
    }))
  };
}

export function drawHokudaiRadarChart(canvas, chartData, options = {}){
  if(!canvas) return null;
  const ctx = canvas.getContext('2d');
  if(!ctx) return null;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const dpr = window.devicePixelRatio || 1;
  canvas.width = opts.size * dpr;
  canvas.height = opts.size * dpr;
  canvas.style.width = `${opts.size}px`;
  canvas.style.height = `${opts.size}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, opts.size, opts.size);

  const axes = chartData?.axes || [];
  if(axes.length < 3){
    drawEmptyState(ctx, opts, '3単元以上でレーダーチャートを表示できます');
    return null;
  }

  const center = { x: opts.size / 2, y: opts.size / 2 };
  const radius = (opts.size / 2) - opts.padding;
  drawGrid(ctx, axes, center, radius, opts);
  drawLabels(ctx, axes, center, radius, opts);
  const points = toRadarPoints(axes, center, radius, chartData.maxValue || opts.maxValue);
  drawPolygon(ctx, points, opts);
  return points;
}

export function toHokudaiRadarPolygonPoints(chartData, options = {}){
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const axes = chartData?.axes || [];
  const center = { x: opts.size / 2, y: opts.size / 2 };
  const radius = (opts.size / 2) - opts.padding;
  return toRadarPoints(axes, center, radius, chartData?.maxValue || opts.maxValue);
}

export function getHokudaiRadarChartSvg(chartData, options = {}){
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const axes = chartData?.axes || [];
  if(axes.length < 3) return '';

  const center = { x: opts.size / 2, y: opts.size / 2 };
  const radius = (opts.size / 2) - opts.padding;
  const points = toRadarPoints(axes, center, radius, chartData.maxValue || opts.maxValue);
  const polygon = points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const grid = Array.from({ length: opts.levels }, (_, i) => {
    const r = radius * ((i + 1) / opts.levels);
    const ring = axes.map((_, idx) => {
      const angle = angleForIndex(idx, axes.length);
      return `${(center.x + Math.cos(angle) * r).toFixed(1)},${(center.y + Math.sin(angle) * r).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${ring}" fill="none" stroke="${opts.gridColor}" stroke-width="1"/>`;
  }).join('');

  return `<svg viewBox="0 0 ${opts.size} ${opts.size}" role="img" aria-label="習熟度レーダーチャート">${grid}<polygon points="${polygon}" fill="${opts.fillColor}" stroke="${opts.strokeColor}" stroke-width="2"/></svg>`;
}

function drawGrid(ctx, axes, center, radius, opts){
  ctx.strokeStyle = opts.gridColor;
  ctx.lineWidth = 1;
  for(let level = 1; level <= opts.levels; level += 1){
    const r = radius * (level / opts.levels);
    drawClosedPath(ctx, axes.map((_, idx) => {
      const angle = angleForIndex(idx, axes.length);
      return {
        x: center.x + Math.cos(angle) * r,
        y: center.y + Math.sin(angle) * r
      };
    }), false);
  }

  ctx.strokeStyle = opts.axisColor;
  axes.forEach((_, idx) => {
    const angle = angleForIndex(idx, axes.length);
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
    ctx.stroke();
  });
}

function drawLabels(ctx, axes, center, radius, opts){
  ctx.fillStyle = opts.labelColor;
  ctx.font = opts.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  axes.forEach((axis, idx) => {
    const angle = angleForIndex(idx, axes.length);
    const x = center.x + Math.cos(angle) * (radius + 26);
    const y = center.y + Math.sin(angle) * (radius + 26);
    ctx.fillText(axis.label, x, y);
  });
}

function drawPolygon(ctx, points, opts){
  ctx.fillStyle = opts.fillColor;
  ctx.strokeStyle = opts.strokeColor;
  ctx.lineWidth = 2;
  drawClosedPath(ctx, points, true);

  ctx.fillStyle = opts.pointColor;
  points.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawClosedPath(ctx, points, fill){
  if(!points.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  if(fill) ctx.fill();
  ctx.stroke();
}

function drawEmptyState(ctx, opts, message){
  ctx.fillStyle = opts.labelColor;
  ctx.font = opts.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, opts.size / 2, opts.size / 2);
}

function toRadarPoints(axes, center, radius, maxValue){
  return axes.map((axis, idx) => {
    const angle = angleForIndex(idx, axes.length);
    const r = radius * (clamp(axis.value, 0, maxValue) / maxValue);
    return {
      id: axis.id,
      label: axis.label,
      value: axis.value,
      x: center.x + Math.cos(angle) * r,
      y: center.y + Math.sin(angle) * r
    };
  });
}

function angleForIndex(index, total){
  return (-Math.PI / 2) + ((Math.PI * 2 * index) / total);
}

function clamp(value, min, max){
  return Math.min(max, Math.max(min, value));
}
