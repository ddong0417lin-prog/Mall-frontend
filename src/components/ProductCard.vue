<template>
  <article class="product-card" @click="$router.push(`/product/${item.id}`)">
    <span class="card-glint" />
    <img :src="item.pic" :alt="item.name" />
    <h4>{{ item.name }}</h4>
    <p>{{ item.subTitle || '精选单品，支持极速发货与售后保障。' }}</p>
    <div class="bottom">
      <span class="price">￥{{ item.price }}</span>
      <span class="tag">{{ Number(item.sale) > 0 ? 'hot' : 'new' }}</span>
    </div>
  </article>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  }
})
</script>
