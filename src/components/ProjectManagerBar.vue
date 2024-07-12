<template>
  <div class="sidebar">
    <h1 class="name">DataPal</h1>
    <div class="menu">
      <div class="menu-item" @click="$emit('goDataUpload')">
        <CRow class="menu-text">
          <i class="fa fa-chart-bar"></i>
          <span>Data Upload</span>
        </CRow>
      </div>
      <div class="menu-item" @click="$emit('goDataProcessing')">
        <CRow class="menu-text">
          <i class="fa fa-cogs"></i>
          <span>Data Processing</span>
        </CRow>
      </div>
      <div class="menu-item" @click="$emit('goModelCreation')">
        <CRow class="menu-text">
          <i class="fa fa-project-diagram"></i>
          <span>Model Creation</span>
        </CRow>
      </div>
      <div class="menu-item" @click="$emit('goModelEvaluation')">
        <CRow class="menu-text">
          <i class="fa fa-chart-line"></i>
          <span>Model Evaluation</span>
        </CRow>
      </div>
      <router-view />
    </div>
  </div>
</template>

<script>
import { CRow } from '@coreui/vue';

export default {
  name: 'ProjectManagerBar',
  methods: {}
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');

.sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 10%; /* Increased width */
  height: 98%;
  background-color: #e0e7ff;
  color: #2f3640;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1), 0 12px 30px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
  overflow-y: auto;
  position: fixed;
  top: 1%;
  left: 0.3%;
  transition: all 0.3s ease;
  border-radius: 15px;
  padding: 20px 10px;
  /* Glowing Effect */
  border: 2px solid #0b0000;
  animation: glowing 1.5s infinite;
}


.sidebar .name {
  font-size: 2.8em; /* Increased font size */
  margin-bottom: 50px;
  font-weight: 600;
  color: #2f3640;
}

.menu {
  width: 100%;
  text-align: left;
  list-style-type: none;
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 20px; /* Increased padding */
  margin: 20px 0; /* Increased margin */
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #2f3640;
  cursor: pointer;
}

.menu-item i {
  font-size: 3em; /* Increased icon size */
  margin-right: 15px; /* Increased margin */
}

.menu-item span {
  font-size: 2.2em; /* Increased text size */
}

.menu-item:hover {
  background-color: #000;
  color: #fff;
}

.menu-text {
  display: flex;
  align-items: center;
  width: 100%;
}

</style>
