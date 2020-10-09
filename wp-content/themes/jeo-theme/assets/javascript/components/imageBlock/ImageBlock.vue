<template>
  <div class="credited-image-block" :class="[displayDescription && 'active', 'align' + alignment]">
    <div class="image-wrapper">
      <img :src="mediaurl" />
      <div class="image-info-wrapper">
        <span class="image-meta" v-if="displayDescription" v-html="mediadescription"/>
        <span class="image-description-toggle fas" :class="displayDescription ? 'fa-times' : 'fa-camera'" @click="toggleDescription()"></span>
      </div>
    </div>
    <div class="image-description">
        {{title}}
    </div>
  </div>
</template>

<script>
export default {
  name: "ImageBlock",
  props: ["title", "mediaurl", "mediadescription", "alignment"],
  data() {
      return {
          displayDescription: false,
      };
  },
  methods: {
      toggleDescription() {
          this.displayDescription = !this.displayDescription;
      }
  },
};
</script>