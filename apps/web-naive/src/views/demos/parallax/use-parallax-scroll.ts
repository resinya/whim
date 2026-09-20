import type { Ref } from 'vue';

import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
} from 'vue';

/**
 * 滚动容器在某一帧的状态快照。
 *
 * 每个视差图层都是这份数据的纯函数，所以无论用户滚动多快，图层位置都由
 * 当前帧直接算出，不会出现位移累积或丢帧导致的错位。
 */
export interface ParallaxFrame {
  /** 整页滚动进度，0 ~ 1 */
  progress: number;
  /** 滚动容器的可滚动总高度 */
  scrollHeight: number;
  /** 滚动容器当前的滚动距离 */
  scrollTop: number;
  /** 滚动容器的可视区域高度 */
  viewportHeight: number;
  /** 滚动容器可视区域顶边在视口中的位置，window 滚动时为 0 */
  viewportTop: number;
}

/** 将 value 限制在 min ~ max 区间内 */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** 把 0 ~ 1 的进度映射到 from ~ to 的数值区间，两端截断 */
export function track(progress: number, from: number, to: number): number {
  return from + (to - from) * clamp(progress);
}

/**
 * 元素穿过可视区域的进度：顶边刚进屏时为 0，底边离开顶边时为 1。
 * 适用于「进入 → 离开」整段区间驱动的视差。
 */
export function viewportProgress(rect: DOMRect, frame: ParallaxFrame): number {
  const distance = rect.height + frame.viewportHeight;
  if (distance <= 0) {
    return 0;
  }
  return clamp(
    (frame.viewportHeight - (rect.top - frame.viewportTop)) / distance,
  );
}

/** 元素顶边已被推到滚动容器顶边之上的距离（px），截断在元素自身高度内 */
export function scrolledPast(rect: DOMRect, frame: ParallaxFrame): number {
  return clamp(frame.viewportTop - rect.top, 0, rect.height);
}

/**
 * 查找真正的滚动容器。
 *
 * 本项目页面并不随 window 滚动：布局内部有一层 `overflow-y: auto` 的元素才是
 * 滚动容器。这里从页面根节点逐层向上找，所以无论当前使用哪种布局、页面被包在
 * 哪一层内容容器里，都能定位正确。
 */
function findScrollport(element: HTMLElement): HTMLElement | Window {
  let current = element.parentElement;
  while (current) {
    const { overflowY } = getComputedStyle(current);
    if (
      overflowY === 'auto' ||
      overflowY === 'overlay' ||
      overflowY === 'scroll'
    ) {
      return current;
    }
    current = current.parentElement;
  }
  // 兜底：没有内层滚动容器时按 window 滚动处理
  return window;
}

/**
 * 以 rootRef 最近的可滚动祖先为驱动源，每个动画帧最多回调一次 onFrame。
 *
 * 同时遵循 prefers-reduced-motion：命中后 reducedMotion 变为 true，并且不再
 * 产生任何帧回调，页面据此降级为静态布局。
 */
export function useParallaxScroll(
  rootRef: Ref<HTMLElement | null | undefined>,
  onFrame: (frame: ParallaxFrame) => void,
) {
  /** 系统是否开启了「减弱动态效果」 */
  const reducedMotion = ref(false);
  /** 滚动容器可视高度，用于让吸附容器正好占满一屏 */
  const viewportHeight = ref(0);

  /** 滚动容器，找不到内层容器时降级为 window */
  let scrollport: HTMLElement | null | Window = null;
  /** 排队中的 rAF id，0 表示当前没有待执行的帧 */
  let pending = 0;
  let motion: MediaQueryList | null = null;
  let resizeObserver: null | ResizeObserver = null;

  /** 读取滚动容器的当前状态 */
  function readFrame(): ParallaxFrame {
    const area = scrollport instanceof HTMLElement ? scrollport : null;
    const height = area ? area.clientHeight : window.innerHeight;
    const top = area ? area.scrollTop : window.scrollY;
    const total = area
      ? area.scrollHeight
      : document.documentElement.scrollHeight;

    viewportHeight.value = height;
    return {
      progress: clamp(top / Math.max(1, total - height)),
      scrollHeight: total,
      scrollTop: top,
      viewportHeight: height,
      viewportTop: area ? area.getBoundingClientRect().top : 0,
    };
  }

  /** 执行一帧回调 */
  function paint() {
    pending = 0;
    if (!reducedMotion.value) {
      onFrame(readFrame());
    }
  }

  /** 合并同一帧内的多次 scroll / resize 事件 */
  function schedule() {
    if (pending !== 0 || reducedMotion.value) {
      return;
    }
    pending = requestAnimationFrame(paint);
  }

  /** 解绑所有监听 */
  function detach() {
    if (pending !== 0) {
      cancelAnimationFrame(pending);
      pending = 0;
    }
    const target: EventTarget | null = scrollport;
    target?.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', schedule);
    resizeObserver?.disconnect();
    resizeObserver = null;
    scrollport = null;
  }

  /** 绑定监听并立即渲染一帧，保证首次进入页面时图层位置就是对的 */
  function attach() {
    const root = rootRef.value;
    detach();
    if (!root) {
      return;
    }

    scrollport = findScrollport(root);
    const target: EventTarget = scrollport;
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(
        scrollport instanceof HTMLElement ? scrollport : document.body,
      );
    }

    paint();
  }

  /** 供「回到顶部」使用：要滚的是内层容器，不是 window */
  function scrollTo(options: ScrollToOptions) {
    if (scrollport instanceof HTMLElement) {
      scrollport.scrollTo(options);
    } else {
      window.scrollTo(options);
    }
  }

  /** 系统动效偏好变化时切换，从「减弱」切回来要立刻补一帧 */
  function handleMotionChange(event: MediaQueryListEvent) {
    reducedMotion.value = event.matches;
    if (reducedMotion.value) {
      if (pending !== 0) {
        cancelAnimationFrame(pending);
        pending = 0;
      }
    } else {
      schedule();
    }
  }

  onMounted(() => {
    motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.value = motion.matches;
    motion.addEventListener('change', handleMotionChange);
    attach();
  });

  // 父级路由开启了 keepAlive：重新进入时重新测量，缓存期间停止监听
  onActivated(attach);
  onDeactivated(detach);

  onBeforeUnmount(() => {
    detach();
    motion?.removeEventListener('change', handleMotionChange);
  });

  return {
    reducedMotion,
    scrollTo,
    viewportHeight,
  };
}
