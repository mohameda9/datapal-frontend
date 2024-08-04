<template>
  <div>
    <div class="tabs">
      <button :class="{'tab-link': true, 'active': activeTab === 'statistical-analysis'}" @click="activeTab = 'statistical-analysis'">Statistical Analysis</button>
      <button :class="{'tab-link': true, 'active': activeTab === 'visualization'}" @click="activeTab = 'visualization'">Visualization</button>
    </div>
    <div class="main-content">
      <div v-show="localDataInstances.length > 0">
        <div v-show="activeTab === 'statistical-analysis'">
          <!-- Statistical Analysis Content -->
          <div class="add-button-container">
            <button class="add-stat-button" @click="openDataInstanceModal('stat')">
              <span class="pi pi-plus"></span> Add Statistical Test
            </button>
          </div>
          <div  class="combined-card">

            <div class="stat-card" v-for="(statCard, statCardIndex) in statCards">
              <statisticalAnalysis
                :tests="statCard.tests"
                :data="statCard.dataInstance.data"
                :variables="statCard.dataInstance.data[0]"
                @deleteTest="removeStatComponent"
                :testData="statCard.dataInstance.testData"
              ></statisticalAnalysis>
            </div>
          </div>
        </div>
        <div v-if="activeTab === 'visualization'">
          <!-- Visualization Content -->
          <div class="add-button-container">
            <button class="add-plot-button" @click="openDataInstanceModal('plot')">
              <span class="pi pi-plus"></span> Add Plot
            </button>
          </div>
          <div  class="combined-card">
            <div class="plot-card" v-for="(visCard, visCardIndex) in visualizationCards">
              <dataVisuals
                :plots="visCard.plots"
                :data="visCard.dataInstance.data"
                :numericalColumns="getColumnNamesByType(visCard.dataInstance, ['numeric', 'numeric binary'])"
                :categoricalColumns="getColumnNamesByType(visCard.dataInstance, ['categorical','categorical binary'])"
                :variables="visCard.dataInstance.data[0]"
                @deletePlot="removeVisualizationComponent"
                @updatePlot="plot => { console.log(plot); }"
                @submittingPlot="handleSubmitPlot"
              ></dataVisuals>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Instance Selection Modal -->
    <Dialog header="Select Data Instance" :visible="showDataInstanceModal" @hide="showDataInstanceModal = false">
      <Dropdown 
        v-model="selectedDataInstanceName" 
        :options="dataInstanceOptions" 
        placeholder="Select Data Instance" 
        class="data-instance-dropdown"
      />
      <template v-slot:footer>
        <button @click="confirmDataInstance" class="p-button p-component">
          Confirm
        </button>
      </template>
    </Dialog>
  </div>
</template>

<script>
import UserDataset from '../components/UserDataset.vue';
import { mapActions, mapGetters } from 'vuex';
import statisticalAnalysis from '../components/statisticalAnalysis.vue';
import dataVisuals from '../components/dataVisuals.vue';
import { OneSampleTTest, KolmogorovSmirnovTest, IndependentTwoSampleTTest, PairedSampleTTest, KruskalWallisTest, MannWhitneyUTest, OneWayANOVA, Correlation, TwoWayANOVA, FTest, ChiSquareTest } from '../classes/StatisticalModel';
import { Histogram, BarPlot, BoxWhiskerPlot, ScatterPlot , PieChart} from '../classes/Visualization';
import Dropdown from 'primevue/dropdown'; // Import PrimeVue Dropdown
import Dialog from 'primevue/dialog'; // Import PrimeVue Dialog
import { getColumnNamesByType } from '../utils/commonFunctions.js';

export default {
  name: 'DataAnalysis',
  components: {
    UserDataset,
    statisticalAnalysis,
    dataVisuals,
    Dropdown,
    Dialog
  },
  data() {
    return {
      activeTab: 'statistical-analysis',
      statCards: [],
      visualizationCards: [],
      showDataInstanceModal: false,
      selectedDataInstanceName: null,
      selectedDataInstance: null,
      isAddingStat: false,
      isAddingPlot: false
    };
  },
  computed: {
    ...mapGetters(['getLocalDataInstances']),
    localDataInstances() {
      return this.getLocalDataInstances;
    },
    dataInstanceOptions() {
      return this.localDataInstances.map(instance => instance.name || 'Unnamed Data Instance');
    }
  },
  created() {
    this.getColumnNamesByType = getColumnNamesByType;
  },
  methods: {
    ...mapActions(['setLocalDataInstances', 'addLocalDataInstance', 'deleteLocalDataInstance', 'editLocalDataInstance']),
    openDataInstanceModal(type) {
      this.isAddingStat = type === 'stat';
      this.isAddingPlot = type === 'plot';
      this.showDataInstanceModal = true;
    },
    confirmDataInstance() {
      if (this.selectedDataInstanceName) {
        this.selectedDataInstance = this.localDataInstances.find(instance => instance.name === this.selectedDataInstanceName);
        
        if (this.isAddingStat) {
          this.statCards.push( {
            tests: [new OneSampleTTest(), new IndependentTwoSampleTTest(), new PairedSampleTTest(), new OneWayANOVA(), new Correlation(), new KolmogorovSmirnovTest(), new KruskalWallisTest(), new MannWhitneyUTest(), new TwoWayANOVA(), new ChiSquareTest(), new FTest()],
            dataInstance: this.selectedDataInstance
          });
        } else if (this.isAddingPlot) {
          this.visualizationCards.push( {
            plots: [new Histogram(), new BarPlot(), new BoxWhiskerPlot(), new ScatterPlot(), new PieChart()],
            dataInstance: this.selectedDataInstance
          })
        }
        
        this.selectedDataInstanceName = null; // Reset the selection
        this.showDataInstanceModal = false; // Close the modal
      }

      console.log(this.statCards)
    },
    removeStatComponent() {
      this.statComponent = null;
    },

    removeVisualizationComponent() {
      this.visualizationComponent = null;
    },
    handleSubmitPlot(selectedValues) {
      console.log(selectedValues);
    },
  },
};
</script>

<style scoped>
/* Add styles for the data instance dropdown and modal */
.data-instance-dropdown {
  margin-bottom: 20px;
}

.p-dialog .p-dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* Existing styles... */
.tabs {
  display: flex;
  justify-content: center;
  margin: 20px 0; /* Adjust margin to give some space around tabs */
}

.tab-link {
  background-color: #354657;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  margin: 0 5px;
}

.tab-link.active {
  background-color: #0056b3;
  transform: translateY(-3px);
}

.main-content {
  width: 100%;
  background-color: #031525;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.user-dataset-container {
  background-color: #263c55;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.user-dataset {
  width: 95%;
  background-color: #031525;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

.combined-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.combined-card {
  flex: 1 1 100%;
  box-sizing: border-box;
  padding: 10px;
}

.plot-card, .stat-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  background-color: #f8f9fa;
  width: 100%;
  box-sizing: border-box;
}

.add-button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.add-plot-button, .add-stat-button {
  background-color: #354657;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.add-plot-button:hover, .add-stat-button:hover {
  background-color: #0056b3;
  transform: translateY(-3px);
}
</style>
