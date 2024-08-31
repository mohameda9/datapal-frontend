<template>
  <div class="column-list">
    <div v-for="(value, columnName) in columns" :key="columnName" class="column-item">
      <span>{{ columnName }}</span>
      <InputSwitch v-model="columns[columnName]" @change="toggleInclude(columnName)" />
    </div>
  </div>
</template>

<script>
import InputSwitch from 'primevue/inputswitch';

export default {
  name: 'ColumnList',
  components: {
    InputSwitch
  },
  props: {
    columns: {
      type: Object,
      required: true
    }
  },
  methods: {
    toggleInclude(columnName) {
      console.log(columnName)
      this.$emit('update-column', columnName);
    }
  }
};
</script>

<style scoped>
.column-list {
  display: flex;
  flex-direction: column;
}
.column-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}
</style>
