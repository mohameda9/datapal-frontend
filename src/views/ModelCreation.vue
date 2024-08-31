<template>
  <div class="model-creation-page">
    <div class="header">
      <h1>Model Creation</h1>
    </div>
    <div class="model-buttons-container">
      <div class="model-buttons">
        <div class="model-button" @click="selectModel('Clustering')" :class="{ active: selectedModelType === 'Clustering' }">
          <i class="fa fa-chart-pie"></i>
          <span>Clustering</span>
        </div>
        <div class="model-button" @click="selectModel('Regression')" :class="{ active: selectedModelType === 'Regression' }">
          <i class="fa fa-chart-line"></i>
          <span>Regression</span>
        </div>
        <div class="model-button" @click="selectModel('Classification')" :class="{ active: selectedModelType === 'Classification' }">
          <i class="fa fa-th-list"></i>
          <span>Classification</span>
        </div>
        <div class="model-button" @click="selectModel('Time Series')" :class="{ active: selectedModelType === 'Time Series' }">
          <i class="fa fa-clock"></i>
          <span>Time Series</span>
        </div>
      </div>
    </div>
    <div class="main-content">
      <div class="content">
        <ClusteringSidebar v-show="selectedModelType === 'Clustering'" :columns="columns" @update-column="updateColumn" />
        <div v-if="selectedModelType === 'Regression'">Regression sidebar placeholder</div>
        <div v-if="selectedModelType === 'Classification'">Classification sidebar placeholder</div>
        <div v-if="selectedModelType === 'Time Series'">Time Series sidebar placeholder</div>
      </div>
    </div>
  </div>
</template>

<script>
import ClusteringSidebar from '../components/modelCreation/ClusteringSidebar.vue';
import { mapGetters } from 'vuex';

export default {
  name: 'ModelCreation',
  components: {
    ClusteringSidebar
  },
  data() {
    return {
      selectedModelType: null,
      columns: {}
    };
  },
  computed: {
    ...mapGetters(['getLocalDataInstances']),
    localDataInstances() {
      return this.getLocalDataInstances;
    }
  },
  methods: {
    initializeColumns(instances) {
      if (instances.length > 0) {
        let clean_columns = {};
        instances[0].data[0].forEach(item => {
          clean_columns[item] = false;
        });
        this.columns = clean_columns;
      }
    },
    selectModel(modelType) {
      this.initializeColumns(this.localDataInstances);
      this.selectedModelType = modelType;
    },
    updateColumn(columnName) {
      console.log(columnName);
      console.log(this.columns[columnName], !this.columns[columnName]);
      console.log(this.columns);
    }
  }
};
</script>

<style scoped>
.model-creation-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1b2735;
  color: #ffffff;
}

.header {
  background-color: #1b2735;
  color: white;
  padding: 10px 20px;
  border-bottom: 1px solid #2e3b4e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-buttons-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.model-buttons {
  display: flex;
  gap: 20px;
}

.model-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #2e3b4e;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  width: 150px;
  text-align: center;
}

.model-button i {
  font-size: 2em;
  margin-bottom: 10px;
}

.model-button span {
  font-size: 1.2em;
  font-weight: bold;
}

.model-button:hover,
.model-button.active {
  background-color: #007bff;
  color: white;
  transform: translateY(-5px);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  padding: 20px;
}

.content {
  display: flex;
  flex: 1;
  overflow: hidden;

}

.tab-content {
  display: flex;
  width: 100%;
  padding: 20px;
  background-color: #2e3b4e;
}
</style>
