<template>
  <div class="main-layout">
    <div class="main-content">
      <div v-if="localDataInstances.length > 0">
        <div class="user-dataset-container">
          <div class="user-dataset">
            <UserDataset :data="localDataInstances[0].data" />
          </div>
        </div>

        <div class="stats-container">
          <div v-for="(StatList, statIndex) in stats" :key="statIndex" class="stat-card">
            <statisticalAnalysis
              :tests="StatList"
              :data="localDataInstances[0].data"
              :variables="localDataInstances[0].data[0]"
              @deleteTest="removeStatsCard(statIndex)"
              @submittingTest="handleSubmitStat"
            ></statisticalAnalysis>
          </div>
        </div>

        <div class="add-stat-container">
          <button class="add-stat-button" @click="addNewStatCard">
            <span class="pi pi-plus"></span> Add Statistical Test
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProjectManagerBar from '../components/ProjectManagerBar.vue';
import UserDataset from '../components/UserDataset.vue';
import { mapActions, mapGetters } from 'vuex';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import statisticalAnalysis from '../components/statisticalAnalysis.vue';
import { OneSampleTTest, KolmogorovSmirnovTest, IndependentTwoSampleTTest, PairedSampleTTest, KruskalWallisTest, MannWhitneyUTest, OneWayANOVA, Correlation } from '../classes/StatisticalModel';
import axios from 'axios';

export default {
  name: 'DataAnalysis',
  components: {
    ProjectManagerBar,
    UserDataset,
    Button,
    Dialog,
    statisticalAnalysis
  },
  data() {
    return {
      activeInstanceIndex: 0,
      stats: [
        [new OneSampleTTest(), new IndependentTwoSampleTTest(), new PairedSampleTTest(), new KruskalWallisTest(), new MannWhitneyUTest(), new OneWayANOVA(), new Correlation(), new KolmogorovSmirnovTest()]
      ],
    };
  },
  computed: {
    ...mapGetters(['getLocalDataInstances']),
    localDataInstances() {
      return this.getLocalDataInstances;
    },
  },
  methods: {
    ...mapActions(['setLocalDataInstances', 'addLocalDataInstance', 'deleteLocalDataInstance', 'editLocalDataInstance']),
    addNewStatCard() {
      this.stats.push([new OneSampleTTest(), new IndependentTwoSampleTTest(), new PairedSampleTTest(), new OneWayANOVA(), new Correlation(), new KolmogorovSmirnovTest()]);
    },
    removeStatsCard(index) {
      this.stats.splice(index, 1);
    },
    async handleSubmitStat(statConfig) {
      console.log(statConfig);

      const dataToSend = {
        data: this.localDataInstances[this.activeInstanceIndex].data.map(row => ({ columns: row }))
      };
      const requestBody = {
        data: dataToSend,
        statConfig: statConfig
      };

      try {
        const response = await axios.post('/stat', requestBody, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log(response.data);
        // Update the result data in the respective statisticalAnalysis component
        this.$refs[`statAnalysis${statConfig.test}`].resultData = response.data;

      } catch (error) {
        console.error('Error:', error);
      }
    },
  },

};
</script>

<style scoped>
.main-layout {
  background-color: #031525;
  display: flex;
  justify-content: center;
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
  margin-bottom: 100px;
  display: flex;
  justify-content: center;
  align-items: center; /* Vertically center the content */
  padding: 40px 20px; /* Add padding top and bottom */
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

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 15px;
  transition: box-shadow 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.add-stat-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.add-stat-button {
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

.add-stat-button:hover {
  background-color: #0056b3;
  transform: translateY(-3px);
}
</style>
