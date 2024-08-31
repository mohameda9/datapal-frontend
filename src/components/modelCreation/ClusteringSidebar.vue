<template>
  <div class="clustering-sidebar-container">
    <div class="model-sidebar">
      <h2 class="sidebar-title">Config</h2>
      <div class="tabs">
        <button @click="activeTab = 'features'" :class="{ active: activeTab === 'features' }">
          <i class="fa fa-list"></i>
          <span>Features</span>
        </button>
        <button @click="activeTab = 'model'" :class="{ active: activeTab === 'model' }">
          <i class="fa fa-cogs"></i>
          <span>Algorithm</span>
        </button>
        <button @click="activeTab = 'experiment'" :class="{ active: activeTab === 'experiment' }">
          <i class="fa fa-flask"></i>
          <span>Click Experiment</span>
        </button>
        <button @click="activeTab = 'evaluation'" :class="{ active: activeTab === 'evaluation' }">
          <i class="fa fa-check"></i>
          <span>Model Evaluation</span>
        </button>
      </div>
    </div>
    <div class="tab-content">
      <div v-if="activeTab === 'features'" class="content-column">
        <ColumnList :columns="columns" @update-column="updateColumn" />
      </div>
      <div v-if="activeTab === 'model'" class="content-column">
        <div class="algorithm-list">
          <div class="algorithm-item" v-for="algorithm in algorithms" :key="algorithm.name">
            <span>{{ algorithm.name }}</span>
            <button @click="selectAlgorithm(algorithm.name)">
              <i :class="algorithm.icon"></i>
            </button>
          </div>
        </div>
      </div>
      <div v-if="activeTab === 'experiment'" class="content-column experiment-column">
        <div v-if="hasConfigurations" class="experiment-list">
          <div v-for="(configs, algorithmName) in selectedAlgorithmConfigs" :key="algorithmName">
            <div v-for="(config, index) in configs" :key="index" class="experiment-item">
              <span>{{ algorithmName }} model {{ index + 1 }}</span>
              <InputSwitch v-model="config.run" />
            </div>
          </div>
        </div>
        <div v-else class="no-configurations">
          <p>No configurations found. Please go back to <strong>Algorithms</strong> to create configurations.</p>
        </div>
        <button @click="runSelected" class="run-button">
          Run Selected
        </button>
      </div>
      <div v-if="activeTab === 'evaluation'" class="content-column evaluation-column">
        <div class="model-buttons">
          <button 
            v-for="(result, modelName) in clusterResults" 
            :key="modelName" 
            :class="{ active: selectedModel === modelName }"
            @click="selectModel(modelName)">
            {{ modelName }}
          </button>
        </div>
        
      </div>
    </div>
    <div v-if="activeTab === 'model' && selectedAlgorithm" class="parameters-column">
      <button @click="addAlgorithmConfig(selectedAlgorithm)" class="add-config-button">
        <i class="fa fa-plus"></i> Add {{ selectedAlgorithm }} Config
      </button>
      <AlgorithmParams
        v-for="(config, index) in selectedAlgorithmConfigs[selectedAlgorithm]"
        :key="index"
        :index="index"
        :algorithm="selectedAlgorithm"
        :params="algorithmParameters[selectedAlgorithm]"
        :parameterValues="config.values"
        :modelName="`${selectedAlgorithm} model ${index + 1}`"
        :dropdownOptions="dropdownOptions[selectedAlgorithm]"
        @remove-algorithm="removeAlgorithm(selectedAlgorithm, index)"
      />
    </div>

    <div v-if="selectedModel && activeTab == 'evaluation' ">
      <div class="view-toggle">
        <button @click="viewMode = 'table'" :class="{ active: viewMode === 'table' }">Table View</button>
        <button @click="viewMode = 'figure'" :class="{ active: viewMode === 'figure' }">Figure View</button>
      </div>
      <div v-if="viewMode === 'table'" class="results-table">
        <h3>{{ selectedModel }} Results</h3>
        <table>
          <thead>
            <tr>
              <th>Cluster #</th>
              <th># of Members</th>
              <th v-for="(feature, index) in clusterFeatures" :key="index">{{ feature }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(cluster, clusterName) in clusterResults[selectedModel].clusters" :key="clusterName">
              <td>{{ clusterName }}</td>
              <td>{{ cluster.size }}</td>
              <td v-for="(average, feature) in cluster.averages" :key="feature">{{ average }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="viewMode === 'figure'" class="results-figure">
        <scatter-plot :pcaData="clusterResults[selectedModel].pcaData" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from '@/axios.js'; // Path to the axios.js file
import { mapGetters } from 'vuex';
import ColumnList from './ColumnList.vue';
import AlgorithmParams from './AlgorithmParams.vue';
import InputSwitch from 'primevue/inputswitch';
import ScatterPlot from './ScatterPlot.vue'; // Your ScatterPlot component

export default {
  name: 'ClusteringSidebar',
  components: {
    ColumnList,
    AlgorithmParams,
    InputSwitch,
    ScatterPlot
  },
  props: {
    columns: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'features',
      algorithms: [
        { name: 'DBSCAN', icon: 'fa fa-chart-area' },
        { name: 'K-Means', icon: 'fa fa-bullseye' },
        { name: 'Agglomerative Clustering', icon: 'fa fa-object-group' }
      ],
      algorithmParameters: {
        DBSCAN: {
          eps: { type: 'number', default: 0.5, min: 0.1, max: 10 },
          min_samples: { type: 'number', default: 5, min: 1, max: 100 }
        },
        'K-Means': {
          n_clusters: { type: 'number', default: 8, min: 1, max: 100 },
          init: { type: 'text', default: 'k-means++' }
        },
        'Agglomerative Clustering': {
          n_clusters: { type: 'number', default: 2, min: 1, max: 100 },
          affinity: { type: 'text', default: 'euclidean' }
        }
      },
      dropdownOptions: {
        DBSCAN: {
          // Add any dropdown options for DBSCAN here
        },
        'K-Means': {
          init: [
            { label: 'K-Means++', value: 'k-means++' },
            { label: 'Random', value: 'random' }
          ]
        },
        'Agglomerative Clustering': {
          affinity: [
            { label: 'Euclidean', value: 'euclidean' },
            { label: 'L1', value: 'l1' },
            { label: 'L2', value: 'l2' },
            { label: 'Manhattan', value: 'manhattan' },
            { label: 'Cosine', value: 'cosine' }
          ]
        }
      },
      selectedAlgorithm: null,
      selectedAlgorithmConfigs: {
        DBSCAN: [],
        'K-Means': [],
        'Agglomerative Clustering': []
      },
      isLoading: false,
      clusterResults: {},
      selectedModel: null,
      viewMode: 'table'
    };
  },
  computed: {
    ...mapGetters(['getLocalDataInstances']),
    localDataInstances() {
      return this.getLocalDataInstances;
    },
    hasConfigurations() {
      return Object.values(this.selectedAlgorithmConfigs).some(configs => configs.length > 0);
    },
    clusterFeatures() {
      if (!this.selectedModel) return [];
      const clusters = this.clusterResults[this.selectedModel].clusters;
      if (!clusters || Object.keys(clusters).length === 0) return [];
      return Object.keys(clusters[Object.keys(clusters)[0]].averages);
    }
  },
  methods: {
    updateColumn(columnName) {
      this.$emit('update-column', columnName);
    },
    selectAlgorithm(algorithmName) {
      this.selectedAlgorithm = algorithmName;
    },
    addAlgorithmConfig(algorithmName) {
      this.selectedAlgorithmConfigs[algorithmName].push({
        name: algorithmName,
        values: { ...this.getDefaultParameters(algorithmName) },
        run: true // Default the run switch to true
      });
    },
    removeAlgorithm(algorithmName, index) {
      this.selectedAlgorithmConfigs[algorithmName].splice(index, 1);
    },
    getDefaultParameters(algorithmName) {
      const params = this.algorithmParameters[algorithmName];
      const defaults = {};
      for (const key in params) {
        defaults[key] = params[key].default;
      }
      return defaults;
    },
    async runSelected() {
      const selectedConfigs = [];
      for (const [algorithmName, configs] of Object.entries(this.selectedAlgorithmConfigs)) {
        for (const config of configs) {
          if (config.run) {
            selectedConfigs.push({
              algorithm: algorithmName,
              parameters: config.values
            });
          }
        }
      }
      const dataToSend = {
        data: this.localDataInstances[1].data.map(row => ({ columns: row }))
      };
      const requestBody = {
        data: dataToSend,
        statConfig: {
          test: 'clustering',
          values: selectedConfigs,
          dataSetOption: 'train'
        },
        columns: Object.keys(this.columns).filter(col => this.columns[col])
      };

      try {
        this.isLoading = true;
        const response = await axios.post('/clustering', requestBody, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        this.clusterResults = response.data;
        this.activeTab = 'evaluation';
      } catch (error) {
        console.error('Error:', error);
      } finally {
        this.isLoading = false;
      }
    },
    selectModel(modelName) {
      this.selectedModel = modelName;
    }
  }
};
</script>

<style scoped>
.clustering-sidebar-container {
  display: grid;
  grid-template-columns: 15% 15% 70%;
  height: 100%;
  width: 100%;
}

.model-sidebar {
  background-color: #2e3b4e;
  padding: 20px;
  border-radius: 8px;
  color: #fff;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.sidebar-title {
  margin-bottom: 20px;
  font-size: 1.5em;
  text-align: center;
}

.tabs {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.tabs button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #2e3b4e;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  width: 100%;
  text-align: center;
  box-sizing: border-box;
}

.tabs button i {
  font-size: 2em;
  margin-bottom: 10px;
}

.tabs button span {
  font-size: 1.2em;
  font-weight: bold;
}

.tabs button:hover,
.tabs button.active {
  background-color: #007bff;
  color: white;
  transform: translateY(-5px);
}

.tab-content {
  padding: 20px;
  gap: 20px;
  min-width: 99%;
  box-sizing: border-box;
}

.content-column {
  overflow-y: auto;
  box-sizing: border-box;
  width: 100%;
}

.parameters-column {
  overflow-y: auto;
  padding: 20px;
  border-radius: 8px;
  box-sizing: border-box;
}

.algorithm-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.algorithm-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #2e3b4e;
  border: 1px solid #007bff;
  border-radius: 10px;
}

.algorithm-item span {
  font-size: 1.2em;
}

.algorithm-item button {
  color: white;
  border: none;
  border-radius: 50%;
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.algorithm-item button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.add-config-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  margin-bottom: 20px;
}

.add-config-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.experiment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.experiment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #2e3b4e;
  color: white;
  border: 1px solid #007bff;
  border-radius: 10px;
}

.experiment-item span {
  font-size: 1em;
}

.no-configurations {
  text-align: center;
  color: #6c757d;
}

.run-button {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  margin-top: 20px; /* Margin for spacing */
}

.run-button:hover {
  background-color: #218838;
  transform: translateY(-2px);
}

.evaluation-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.model-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.model-buttons button {
  background-color: #2e3b4e;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.model-buttons button:hover,
.model-buttons button.active {
  background-color: #007bff;
}

.view-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.view-toggle button {
  background-color: #2e3b4e;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.view-toggle button:hover,
.view-toggle button.active {
  background-color: #007bff;
}

.results-table,
.results-figure {
  background-color: #2e3b4e;
  padding: 20px;
  border-radius: 10px;
  color: white;
}

.results-table table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  border: 1px solid #007bff;
  padding: 10px;
}

.results-table th {
  background-color: #263c55;
}

.results-table td {
  background-color: #041727;
}

.results-figure {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
