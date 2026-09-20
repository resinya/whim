<script lang="ts" setup>
import type { ComponentPublicInstance } from 'vue';

import type { ParallaxFrame } from './use-parallax-scroll';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NAlert, NButton } from 'naive-ui';

import { $t } from '#/locales';

import {
  clamp,
  scrolledPast,
  track,
  useParallaxScroll,
  viewportProgress,
} from './use-parallax-scroll';

/**
 * 拼接 public 目录下的图片地址。
 *
 * 壁纸文件名带中文和全角符号，所以先基于部署 base 拼出路径，再做百分号编码，
 * 避免中文名在不同服务器上解析不一致。
 */
function wallpaper(file: string) {
  return `${import.meta.env.BASE_URL}img/${encodeURIComponent(file)}`;
}

const images = {
  avatar: wallpaper('头像.png'),
  closeup: wallpaper('【哲风壁纸】二次元-动漫少女.jpg'),
  portrait: wallpaper('【哲风壁纸】人物-动漫-惊艳.jpg'),
  town: wallpaper('【哲风壁纸】孩童-小镇-暖光.jpg'),
};

/** 页面根节点，用于向上查找真正的滚动容器 */
const rootRef = ref<HTMLElement | null>(null);

/** 第一屏：多层景深，背景 / 中景 / 前景三个图层 */
const heroRef = ref<HTMLElement | null>(null);
const heroBackRef = ref<HTMLElement | null>(null);
const heroMidRef = ref<HTMLElement | null>(null);
const heroFrontRef = ref<HTMLElement | null>(null);

/** 第二屏：异速视差，图片列与文字列 */
const differentialRef = ref<HTMLElement | null>(null);
const differentialImageRef = ref<HTMLElement | null>(null);
const differentialTextRef = ref<HTMLElement | null>(null);

/** 第三屏：吸附揭示的容器 */
const pinnedRef = ref<HTMLElement | null>(null);

/** 第四屏：结尾 */
const outroRef = ref<HTMLElement | null>(null);
const outroContentRef = ref<HTMLElement | null>(null);

/** 顶部滚动进度条 */
const progressBarRef = ref<HTMLElement | null>(null);

/** 第一屏展示用的三个速度层文案 */
const heroLayers = computed(() => [
  $t('demos.parallaxLayerBack'),
  $t('demos.parallaxLayerMid'),
  $t('demos.parallaxLayerFront'),
]);

/** 吸附揭示的三个阶段，每个阶段对应一张图 */
const steps = computed(() => [
  {
    description: $t('demos.parallaxStep1Description'),
    image: images.town,
    title: $t('demos.parallaxStep1Title'),
  },
  {
    description: $t('demos.parallaxStep2Description'),
    image: images.portrait,
    title: $t('demos.parallaxStep2Title'),
  },
  {
    description: $t('demos.parallaxStep3Description'),
    image: images.closeup,
    title: $t('demos.parallaxStep3Title'),
  },
]);

/**
 * 吸附图层的 DOM 引用。
 *
 * 故意用普通数组而不是响应式数据：这些节点只会被直接写 style，不参与模板渲染，
 * 放进响应式里只会白白触发额外的更新。
 */
const stepElements: (HTMLElement | undefined)[] = [];

/** 收集 v-for 中渲染出的吸附图层节点 */
function setStepElement(element: ComponentPublicInstance | Element | null, index: number) {
  stepElements[index] = element instanceof HTMLElement ? element : undefined;
}

/** 接入滚动驱动，回调里按当前帧计算所有图层的位置 */
const { reducedMotion, scrollTo, viewportHeight } = useParallaxScroll(rootRef, render);

/** 统一写 transform / opacity，节点不存在时静默跳过 */
function apply(element: HTMLElement | null, transform: string, opacity?: number) {
  if (!element) {
    return;
  }
  element.style.transform = transform;
  if (opacity !== undefined) {
    element.style.opacity = String(opacity);
  }
}

/**
 * 第一屏：多层景深。
 *
 * 记 past 为本屏已经滚过去的距离。图层本身跟着页面上移了 past，我们再让它额外
 * 往下移动 k × past，于是它在屏幕上真正上移的距离只有 (1 - k) × past：
 *
 *   背景 k = 0.75 → 屏幕速度 0.25x（最慢，看起来最远）
 *   中景 k = 0.50 → 屏幕速度 0.50x（居中）
 *   前景 k = 0.15 → 屏幕速度 0.85x（最快，看起来最近）
 *
 * 这就是视差的全部秘密：让近的东西走得快、远的东西走得慢。速度差一变，大脑
 * 就自动把画面读成有纵深的三层。
 */
function renderHero(frame: ParallaxFrame) {
  const hero = heroRef.value;
  if (!hero) {
    return;
  }
  const rect = hero.getBoundingClientRect();
  const past = scrolledPast(rect, frame);
  const left = 1 - past / Math.max(1, rect.height);

  apply(heroBackRef.value, `translate3d(0, ${past * 0.75}px, 0)`);
  apply(heroMidRef.value, `translate3d(0, ${past * 0.5}px, 0)`);
  apply(heroFrontRef.value, `translate3d(0, ${past * 0.15}px, 0)`, clamp(left * 1.6));
}

/**
 * 第二屏：异速视差。
 *
 * 图片和文字读的是同一个进度值，但映射到不同区间：图片 ±96px、文字 ±200px，
 * 位移差把同一屏里的两列在视觉上拉开层次。
 */
function renderDifferential(frame: ParallaxFrame) {
  const section = differentialRef.value;
  if (!section) {
    return;
  }
  const progress = viewportProgress(section.getBoundingClientRect(), frame);

  apply(differentialImageRef.value, `translate3d(0, ${track(progress, 96, -96)}px, 0)`);
  apply(differentialTextRef.value, `translate3d(0, ${track(progress, 200, -200)}px, 0)`);
}

/**
 * 第三屏：吸附分区揭示。
 *
 * 外层 section 有 3 屏高，内层 sticky 容器只有 1 屏高，所以它会「粘」在顶部，
 * 多出来的 2 屏滚动距离就是这段动画的行程。把行程归一化成 0~1 的进度后，再映射
 * 成 0 ~ (阶段数 - 1) 的游标：第 i 层与游标的距离 delta 决定它的透明度，同一个
 * delta 又拿去算位移和缩放，于是三层依次淡入淡出。
 *
 * delta 为正是「已经翻过去的那一层」，为负是「还没轮到的那一层」。位移取
 * -delta，也就是两层都朝上移动：下一页从下方顶上来、上一页向上退场，方向和
 * 页面整体「往下滚、内容往上走」保持一致。
 */
function renderPinned(frame: ParallaxFrame) {
  const section = pinnedRef.value;
  if (!section) {
    return;
  }
  const rect = section.getBoundingClientRect();
  const distance = rect.height - frame.viewportHeight;
  if (distance <= 0) {
    return;
  }

  const progress = clamp((frame.viewportTop - rect.top) / distance);
  const cursor = progress * Math.max(1, steps.value.length - 1);

  for (const [index, element] of stepElements.entries()) {
    if (!element) {
      continue;
    }
    const delta = cursor - index;
    const opacity = clamp(1 - Math.abs(delta));
    element.style.opacity = String(opacity);
    element.style.transform = `translate3d(0, ${-delta * 9}%, 0) scale(${
      1 + Math.abs(delta) * 0.06
    })`;
    // 只让完全可见的那一层接收鼠标事件，避免透明层挡住上层的操作
    element.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
  }
}

/** 第四屏：结尾区轻微上浮，收尾用 */
function renderOutro(frame: ParallaxFrame) {
  const section = outroRef.value;
  if (!section) {
    return;
  }
  const progress = viewportProgress(section.getBoundingClientRect(), frame);
  apply(outroContentRef.value, `translate3d(0, ${track(progress, 64, -64)}px, 0)`);
}

/** 每一帧的总入口：先同步顶部进度条，再逐个区块计算 */
function render(frame: ParallaxFrame) {
  const bar = progressBarRef.value;
  if (bar) {
    bar.style.transform = `scaleX(${frame.progress})`;
  }
  renderHero(frame);
  renderDifferential(frame);
  renderPinned(frame);
  renderOutro(frame);
}

/** 回到顶部：要滚的是布局内层容器，具体交给 composable 处理 */
function backToTop() {
  scrollTo({ behavior: 'smooth', top: 0 });
}
</script>

<template>
  <Page :description="$t('demos.parallaxDescription')" :title="$t('demos.parallax')">
    <!-- 负外边距抵消 Page 自带的内边距，让各区块可以通栏铺满 -->
    <div ref="rootRef" class="-m-4 bg-background text-foreground">
      <!-- 滚动进度条：sticky 吸附在滚动容器顶部 -->
      <div class="sticky top-0 z-30 h-1 w-full bg-border/50">
        <div ref="progressBarRef" class="h-full origin-left scale-x-0 bg-primary"></div>
      </div>

      <!-- 系统开启「减弱动态效果」时的提示 -->
      <NAlert v-if="reducedMotion" class="mx-4 mt-4" type="info">
        {{ $t('demos.parallaxReducedMotion') }}
      </NAlert>

      <!--
        第一屏：多层景深。
        背景层做成 170% 高、上移 35%，为位移留出余量，滚动时不会露出白边。
      -->
      <section ref="heroRef" class="relative h-[120vh] overflow-hidden">
        <div
          ref="heroBackRef"
          class="absolute -top-[35%] left-0 h-[170%] w-full bg-cover bg-center will-change-transform"
          :style="{ backgroundImage: `url(${images.town})` }"
        ></div>

        <!-- 压暗遮罩：保证白色文字压在亮部时也能看清 -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/85"></div>

        <!-- 中景：内联 SVG 山影，速度介于背景与前景之间 -->
        <div ref="heroMidRef" class="absolute bottom-0 left-0 w-full will-change-transform">
          <svg
            aria-hidden="true"
            class="h-[38vh] w-full"
            preserveAspectRatio="none"
            viewBox="0 0 1440 400"
          >
            <path
              d="M0,170 C180,80 360,235 540,165 C720,95 900,215 1080,145 C1260,75 1380,135 1440,115 L1440,400 L0,400 Z"
              fill="currentColor"
              class="text-black/45"
            />
            <path
              d="M0,255 C200,195 400,295 620,245 C840,195 1040,285 1240,235 C1340,210 1400,230 1440,220 L1440,400 L0,400 Z"
              fill="currentColor"
              class="text-black/70"
            />
          </svg>
        </div>

        <!-- 前景：标题，速度最快，滚出视口时同步淡出 -->
        <div
          ref="heroFrontRef"
          class="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white will-change-transform"
        >
          <p class="text-xs tracking-[0.4em] text-white/60 uppercase">
            {{ $t('demos.parallaxHeroEyebrow') }}
          </p>
          <h1 class="mt-4 text-4xl font-semibold sm:text-6xl">
            {{ $t('demos.parallaxHeroTitle') }}
          </h1>
          <p class="mt-5 max-w-xl text-sm text-white/75 sm:text-base">
            {{ $t('demos.parallaxHeroSubtitle') }}
          </p>
          <div class="mt-8 flex flex-wrap justify-center gap-2">
            <span
              v-for="layer in heroLayers"
              :key="layer"
              class="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-white/85 backdrop-blur"
            >
              {{ layer }}
            </span>
          </div>
          <p class="mt-12 animate-bounce text-xs text-white/60">
            {{ $t('demos.parallaxScrollHint') }}
          </p>
        </div>
      </section>

      <!-- 第二屏：异速视差，图文两列共用同一进度、位移区间不同 -->
      <section ref="differentialRef" class="bg-background px-6 py-[16vh] sm:px-12">
        <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div ref="differentialImageRef" class="relative will-change-transform">
            <img
              :alt="$t('demos.parallaxDifferentialTitle')"
              class="aspect-3/2 w-full rounded-3xl object-cover shadow-2xl"
              :src="images.portrait"
            />
            <span
              class="absolute -bottom-4 left-6 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground shadow-lg"
            >
              {{ $t('demos.parallaxDifferentialImage') }}
            </span>
          </div>

          <div ref="differentialTextRef" class="will-change-transform">
            <p class="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              {{ $t('demos.parallaxDifferentialEyebrow') }}
            </p>
            <h2 class="mt-4 text-3xl font-semibold sm:text-4xl">
              {{ $t('demos.parallaxDifferentialTitle') }}
            </h2>
            <p class="mt-5 text-sm leading-relaxed text-muted-foreground">
              {{ $t('demos.parallaxDifferentialDescription') }}
            </p>
            <p class="mt-6 font-mono text-xs text-primary">
              {{ $t('demos.parallaxDifferentialText') }}
            </p>
          </div>
        </div>
      </section>

      <!--
        第三屏：吸附分区揭示。
        外层 3 屏高提供滚动行程，内层 sticky 只有 1 屏高，因此会吸附在顶部。
        注意 sticky 的祖先链上不能有 overflow: hidden，所以裁切放在 sticky 自身。
      -->
      <section
        ref="pinnedRef"
        class="relative bg-black"
        :class="reducedMotion ? 'flex flex-col gap-8 px-6 py-16 sm:px-12' : ''"
        :style="reducedMotion ? undefined : { height: `${steps.length * 100}vh` }"
      >
        <!--
          减弱动效时用 display: contents 让三个阶段直接排成静态列表；
          正常模式则是铺满一屏、吸附在顶部的容器。
        -->
        <div
          :class="reducedMotion ? 'contents' : 'sticky top-0 overflow-hidden'"
          :style="
            reducedMotion ? undefined : { height: viewportHeight ? `${viewportHeight}px` : '100vh' }
          "
        >
          <!-- 三个阶段绝对定位互相叠放，由滚动进度驱动透明度交叉淡入淡出 -->
          <div
            v-for="(step, index) in steps"
            :key="step.image"
            :ref="(element) => setStepElement(element, index)"
            :class="
              reducedMotion
                ? 'relative mx-auto h-[70vh] w-full max-w-5xl overflow-hidden rounded-3xl'
                : 'absolute inset-0'
            "
            :style="reducedMotion ? undefined : { opacity: index === 0 ? 1 : 0 }"
          >
            <img :alt="step.title" class="h-full w-full object-cover" :src="step.image" />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/55"
            ></div>
            <div class="absolute bottom-0 left-0 w-full p-6 sm:p-12">
              <div
                class="max-w-xl rounded-2xl border border-white/15 bg-black/45 p-6 text-white backdrop-blur"
              >
                <p class="text-xs tracking-[0.3em] text-white/60 uppercase">
                  {{ $t('demos.parallaxPinStep', { index: index + 1 }) }}
                </p>
                <h3 class="mt-3 text-2xl font-semibold">{{ step.title }}</h3>
                <p class="mt-3 text-sm leading-relaxed text-white/75">
                  {{ step.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 第四屏：结尾，轻微视差 + 回到顶部按钮 -->
      <section ref="outroRef" class="border-t border-border bg-card px-6 py-[14vh] text-center">
        <div ref="outroContentRef" class="mx-auto max-w-xl will-change-transform">
          <img
            :alt="$t('demos.parallaxOutroTitle')"
            class="mx-auto size-20 rounded-full border-2 border-primary/40 object-cover"
            :src="images.avatar"
          />
          <h2 class="mt-6 text-2xl font-semibold">
            {{ $t('demos.parallaxOutroTitle') }}
          </h2>
          <p class="mt-3 text-sm text-muted-foreground">
            {{ $t('demos.parallaxOutroDescription') }}
          </p>
          <NButton class="mt-8" secondary type="primary" @click="backToTop">
            {{ $t('demos.parallaxBackToTop') }}
          </NButton>
        </div>
      </section>
    </div>
  </Page>
</template>
