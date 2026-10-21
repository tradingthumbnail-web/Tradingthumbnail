<template>
  <div>
    <ClickLabLandingLandingNav />
    <main>
      <ClickLabLandingHeroSection />
      <ClickLabLandingNichesSection />
      <ClickLabLandingFeaturesSection />
      <ClickLabLandingHowItWorksSection />
      <ClickLabLandingGallerySection />
      <ClickLabLandingPricingSection />
      <ClickLabLandingFinalCtaSection />
    </main>
    <ClickLabLandingLandingFooter />
  </div>
</template>

<script setup lang="ts">
import { CLICKLAB_PRODUCT_NAME, CLICKLAB_TAGLINE } from '~~/shared/clicklab/brand';

definePageMeta({ layout: 'clicklab-landing' });

useSeoMeta({
  title: `${CLICKLAB_PRODUCT_NAME} — AI Thumbnails for Trading Creators`,
  description: CLICKLAB_TAGLINE,
});
</script>
