<template>
  <div class="sidebar">
    <h1 class="name" @click="goHome">DataPal</h1>
    <h2 class="active-project">{{ activeProject ? activeProject.name : 'No Active Project' }}</h2>
    <div class="save-work" @click="saveDataInstances">
      <CRow>
        <i class="fa fa-save"></i>
        <span v-if="!isSaving">Save Work</span>
        <span v-else>Saving...</span>
      </CRow>
      <div v-if="isSaving" class="loading-bar-container">
        <div class="loading-bar"></div>
      </div>
    </div>
    <div class="menu">
      <div class="menu-item" @click="$emit('goDataUpload')">
        <CRow class="menu-text">
          <i class="fa fa-upload"></i>
          <span>Data Upload</span>
        </CRow>
      </div>
      <div class="menu-item" @click="$emit('goDataProcessing')">
        <CRow class="menu-text">
          <i class="fa fa-cogs"></i>
          <span>Data Processing</span>
        </CRow>
      </div>
      <div class="menu-item" @click="$emit('goDataAnalysis')">
        <CRow class="menu-text">
          <i class="fa fa-chart-bar"></i>
          <span>Data Analysis</span>
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
import { mapActions, mapGetters } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'ProjectManagerBar',
  data() {
    return {
      isSaving: false,
    };
  },
  setup() {
    const router = useRouter();

    const goHome = () => {
      router.push('/');
    };

    return {
      goHome,
    };
  },
  computed: {
    ...mapGetters(['getCurrentProject']),
    activeProject() {
      return this.getCurrentProject;
    },
  },
  methods: {
    ...mapActions(['loadProject', 'saveLocalDataInstances']),
    async saveDataInstances() {
      this.isSaving = true;
      await this.saveLocalDataInstances();
      this.isSaving = false;
    },
  },
  async created() {
    await this.loadProject();
  },
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');

.sidebar {
  display: flex;
  align-items: center;
  width: 10%;
  height: 100%;
  background-color: #263c55;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1), 0 12px 30px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
  overflow-y: auto;
  position: fixed;
  left: 0;
  transition: all 0.3s ease;
  padding: 20px 0;
  border: 2px solid #0b0000;
  animation: glowing 1.5s infinite;
}

.sidebar .name {
  font-size: 200%;
  margin-bottom: 20px;
  font-weight: 600;
  color: #007bff;
  cursor: pointer;
}

.sidebar .active-project {
  font-size: 120%;
  margin-bottom: 20px;
  font-weight: 500;
  color: #ffffff;
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
  padding: 20px;
  margin: 10px 0;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #c2cbd5;
  cursor: pointer;
}

.menu-item i {
  font-size: 150%;
}

.menu-item span {
  font-size: 100%;
  font-weight: 600;
}

.menu-item:hover {
  background-color: #455a72;
  color: #fff;
}

.save-work {
  margin-bottom: 50px;
  display: flex;
  align-items: center;
  padding: 20px;
  margin: 10px 0;
  color: #a4c5e8;
  cursor: pointer;
}

.save-work i {
  font-size: 200%;
}

.save-work:hover {
  color: #007bff;
}

.menu-text {
  display: flex;
  align-items: center;
  width: 100%;
}

.loading-bar-container {
  position: relative;
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  margin-top: 10px;
}

.loading-bar {
  width: 0;
  height: 100%;
  background: #4f46e5;
  animation: loading-bar 3s linear infinite;
}

@keyframes loading-bar {
  0% {
    width: 0;
  }
  50% {
    width: 50%;
  }
  100% {
    width: 100%;
  }
}
</style>
