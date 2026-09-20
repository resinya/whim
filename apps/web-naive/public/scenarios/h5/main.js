const messages = {
  'zh-CN': {
    badge: 'Vue CDN 独立环境',
    title: 'H5 Viewport 适配',
    description: '当前页面拥有独立的 viewport 和根字体大小，不会影响后台布局。',
    viewportWidth: '视口宽度',
    rootFontSize: '根字体大小',
    pixelRatio: '设备像素比',
    designWidth: '设计稿宽度',
    sampleTitle: '适配结果',
    sampleDescription: '当前页面通过 Vue CDN 运行，尺寸使用 rem 编写。',
    sampleAction: '示例按钮',
  },
  'en-US': {
    badge: 'Isolated Vue CDN environment',
    title: 'H5 Viewport Adaptation',
    description:
      'This page owns its viewport and root font size without affecting the admin layout.',
    viewportWidth: 'Viewport width',
    rootFontSize: 'Root font size',
    pixelRatio: 'Device pixel ratio',
    designWidth: 'Design width',
    sampleTitle: 'Adaptation result',
    sampleDescription: 'This page runs from the Vue CDN and uses rem dimensions.',
    sampleAction: 'Example button',
  },
};

const requestedLocale = new URLSearchParams(window.location.search).get('lang');
const locale = requestedLocale === 'en-US' ? 'en-US' : 'zh-CN';
const { createApp } = window.Vue;

document.documentElement.lang = locale;

createApp({
  data() {
    return {
      text: messages[locale],
    };
  },
}).mount('#h5-app');
