<template>
    <div class="model-sidebar">
      <h2>{{ modelType }} Configuration</h2>
      <!-- Render configuration options based on the model type -->
      <div v-if="modelType === 'Clustering'">
        <!-- Clustering configuration options -->
      </div>
      <div v-if="modelType === 'Regression'">
        <!-- Regression configuration options -->
      </div>
      <div v-if="modelType === 'Classification'">
        <!-- Classification configuration options -->
      </div>
      <div v-if="modelType === 'Time Series'">
        <!-- Time Series configuration options -->
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ModelSidebar',
    props: {
      modelType: {
        type: String,
        required: true,
      },
    },
  };
  </script>
  
  <style scoped>
  .model-sidebar {
    background-color: #2e3b4e;
    padding: 20px;
    border-radius: 8px;
    width: 300px;
    color: #fff;
  }
  </style>
  