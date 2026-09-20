import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      order: 1000,
      title: $t('demos.title'),
    },
    name: 'Demos',
    path: '/demos',
    children: [
      {
        meta: {
          title: $t('demos.naive'),
        },
        name: 'NaiveDemos',
        path: 'naive',
        component: () => import('#/views/demos/naive/index.vue'),
      },
      {
        meta: {
          title: $t('demos.table'),
        },
        name: 'Table',
        path: 'table',
        component: () => import('#/views/demos/table/index.vue'),
      },
      {
        meta: {
          title: $t('demos.form'),
        },
        name: 'Form',
        path: 'form',
        component: () => import('#/views/demos/form/basic.vue'),
      },
      {
        meta: {
          title: $t('demos.arrayForm'),
        },
        name: 'ArrayForm',
        path: 'array-form',
        component: () => import('#/views/demos/naive/array-form/index.vue'),
      },
      {
        meta: {
          icon: 'lucide:smartphone',
          title: $t('demos.h5Builder'),
        },
        name: 'H5Builder',
        path: 'h5',
        component: () => import('#/views/demos/h5/index.vue'),
      },
      {
        meta: {
          icon: 'lucide:shield-check',
          title: $t('demos.permissionControl'),
        },
        name: 'PermissionControl',
        path: 'permission-control',
        component: () => import('#/views/demos/permission-control/index.vue'),
      },
      {
        meta: {
          icon: 'lucide:map',
          title: $t('demos.mapVisualization'),
        },
        name: 'MapVisualization',
        path: 'map-visualization',
        component: () => import('#/views/demos/map-visualization/index.vue'),
      },
      {
        meta: {
          icon: 'lucide:video',
          title: $t('demos.webrtc'),
        },
        name: 'WebRTC',
        path: 'webrtc',
        component: () => import('#/views/demos/webrtc/index.vue'),
      },
      {
        meta: {
          icon: 'lucide:shield-alert',
          title: $t('demos.frontendSecurity'),
        },
        name: 'FrontendSecurity',
        path: 'frontend-security',
        component: () => import('#/views/demos/frontend-security/index.vue'),
      },
      {
        meta: {
          icon: 'lucide:layers',
          title: $t('demos.parallax'),
        },
        name: 'ParallaxScrolling',
        path: 'parallax',
        component: () => import('#/views/demos/parallax/index.vue'),
      },
    ],
  },
];

export default routes;
