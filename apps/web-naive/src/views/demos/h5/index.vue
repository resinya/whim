<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';
import { preferences } from '@vben/preferences';

import { NAlert, NCard } from 'naive-ui';

import { $t } from '#/locales';

const previewUrl = computed(() => {
  const url = new URL(
    'scenarios/h5/index.html',
    `${window.location.origin}${import.meta.env.BASE_URL}`,
  );
  url.searchParams.set('lang', preferences.app.locale);
  return url.toString();
});
</script>

<template>
  <Page :description="$t('demos.h5Description')" :title="$t('demos.h5Builder')">
    <NAlert class="mb-4" type="info">
      {{ $t('demos.h5IsolationNote') }}
    </NAlert>

    <div class="flex justify-center overflow-auto py-4">
      <iframe
        class="h-[932px] w-[430px] shrink-0 rounded-2xl border-0 bg-white shadow-xl"
        :src="previewUrl"
        :title="$t('demos.h5PreviewTitle')"
      ></iframe>
    </div>
  </Page>
</template>
