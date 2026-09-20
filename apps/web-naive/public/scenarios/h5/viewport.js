const DEFAULT_DESIGN_WIDTH = 750;
const BASE_FONT_SIZE = 100;

function getDesignWidth() {
  const value = Number.parseFloat(document.documentElement.dataset.designWidth);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_DESIGN_WIDTH;
}

function getViewportWidth() {
  return window.innerWidth || document.documentElement.clientWidth;
}

function renderMetrics({ designWidth, dpr, rootFontSize, viewportWidth }) {
  const values = {
    '#viewport-width': `${viewportWidth}px`,
    '#root-font-size': `${rootFontSize.toFixed(2)}px`,
    '#pixel-ratio': String(dpr),
    '#design-width': `${designWidth}px`,
  };

  Object.entries(values).forEach(([selector, value]) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  });
}

function setViewport() {
  const designWidth = getDesignWidth();
  const viewportWidth = getViewportWidth();
  const rootFontSize = (viewportWidth / designWidth) * BASE_FONT_SIZE;
  const dpr = window.devicePixelRatio || 1;

  document.documentElement.style.fontSize = `${rootFontSize}px`;
  document.documentElement.style.setProperty(
    '--viewport-width',
    `${viewportWidth}px`,
  );
  document.documentElement.style.setProperty(
    '--design-width',
    `${designWidth}px`,
  );
  document.documentElement.style.setProperty('--h5-scale', String(viewportWidth / designWidth));
  document.documentElement.style.setProperty('--dpr', String(dpr));

  renderMetrics({ designWidth, dpr, rootFontSize, viewportWidth });
}

let resizeTimer;

function handleResize() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(setViewport, 100);
}

function initViewport() {
  setViewport();
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        setViewport();
      },
      { once: true },
    );
  } else {
    setViewport();
  }
}

initViewport();
