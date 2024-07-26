<template>
  <div class="main-layouttt">
    <div class="main-content">
      <section id="data-upload">
        <div class="upload-card" @dragover.prevent @dragenter.prevent @drop="handleFileDrop" @click="$refs.fileInput.click()">
          <p v-if="!parsing">{{ dropMessage }}</p>
          <div v-else class="loading-line-container">
            <div class="loading-line"></div>
          </div>
          <input type="file" class="visually-hidden" ref="fileInput" @change="handleFileChange" accept=".csv">
        </div>
        <div v-if="uploadError" class="alert alert-danger mt-3 text-center">
          {{ uploadError }}
        </div>
      </section>

      <div v-if="localDataInstances.length > 0 && !dataloadView">
        <div class="user-dataset-container">
          <UserDataset :data="localDataInstances[0].data" />
        </div>
        <div class="plots-container">
          <div v-for="(plotList, plotIndex) in plots" :key="plotIndex" class="plot-card">
            <dataVisuals
              :plots="plotList"
              :data="localDataInstances[0].data"
              :numericalColumns="getColumnNamesByType(localDataInstances[0], ['numeric', 'numeric binary'])"
              :categoricalColumns="getColumnNamesByType(localDataInstances[0], ['categorical','categorical binary' ])"
              :variables="localDataInstances[0].data[0]"
              @deletePlot="() => removePlotCard(plotIndex)"
              @updatePlot="plot => { console.log(plot); }"
              @submittingPlot="handleSubmitPlot"
            ></dataVisuals>
          </div>
        </div>

        <div class="add-plot-container">
          <button class="add-plot-button" @click="addNewPlotCard">
            <span class="pi pi-plus"></span>
          </button>
        </div>
      </div>

      <Dialog
        :visible="dataloadView && localDataInstances.length > 0"
        header="Columns Overview"
        closable="false"
        class="data-load-dialog"
        :style="{ width: '50%', height: 'auto' }"
        :position="position"
        :draggable="false"
      >
        <div class="dialog-content">
          <div v-for="(value, column) in localDataInstances[0].dataTypes" :key="column" class="field column-field">
            <Button icon="pi pi-trash" class="delete-button" @click="addColumnToDeleteList(column)" />
            <label :for="column" class="column-label">{{ column }}</label>
          </div>
        </div>
        <div v-if="submitting" class="loading-bar-container">
          <div class="loading-bar"></div>
        </div>
        <div class="dialog-footer">
          <Button label="Cancel" text severity="secondary" @click="cancelDataUpload()" :disabled="submitting" />
          <Button label="Submit" icon="pi pi-check" @click="submitDataUpload()" :disabled="submitting" />
        </div>
      </Dialog>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex';
import ProjectManagerBar from '../components/ProjectManagerBar.vue';
import UserDataset from '../components/UserDataset.vue';
import { Histogram, BarPlot, BoxWhiskerPlot, ScatterPlot } from '../classes/Visualization';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import dataVisuals from '../components/dataVisuals.vue';
import { getColumnNamesByType } from '../utils/commonFunctions';

export default {
  name: 'DataUpload_new',
  components: {
    ProjectManagerBar,
    UserDataset,
    Button,
    Dialog,
    dataVisuals
  },
  data() {
    return {
      file: null,
      uploadError: '',
      parsing: false,
      dataloadView: false,
      columnsTodelete: [],
      plots: [
        [new Histogram(), new BarPlot(), new BoxWhiskerPlot(), new ScatterPlot()]
      ],
      numericalColumns: [],
      categoricalColumns: [],
      submitting: false,
    };
  },
  computed: {
    ...mapGetters(['getLocalDataInstances', 'getUser', 'getCurrentProject']),
    localDataInstances() {
      return this.getLocalDataInstances;
    },
    dropMessage() {
      return 'Drag & Drop a CSV file here';
    },
  },
  created() {
    this.getColumnNamesByType = getColumnNamesByType;
  },
  methods: {
    ...mapActions([  'addLocalDataInstance', 'deleteLocalDataInstance', 'editLocalDataInstance']),
    ...mapMutations(['setLocalDataInstances']),



    handleFileChange(event) {
      const selectedFile = event.target.files[0];
      this.handleFile(selectedFile);
      this.resetFileInput();
    },
    
    handleFileDrop(event) {
      event.preventDefault();
      const droppedFile = event.dataTransfer.files[0];
      this.handleFile(droppedFile);
    },
    
    async handleFile(file) {
      if (file && file.type === 'text/csv') {
        this.file = file;
        this.uploadError = '';
        this.parsing = true;
        
        // Clear existing data before reading new CSV file
        this.setLocalDataInstances([]);
        
        this.readCSV(file);
      } else {
        this.file = null;
        this.uploadError = 'Please choose a valid CSV file.';
      }
    },
    
    readCSV(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        this.parseCSV(csv);
        this.parsing = false;
        this.dataloadView = true;
      };
      reader.readAsText(file);
    },
    
    parseCSV(csv) {
      const rows = csv.trim().split(/\r?\n/);
      const headers = rows[0].split(',');
      const data = rows.slice(1).map(row => row.split(','));

      const dataTypes = this.determineDataTypes(data, headers);
      this.convertNumericColumns(data, dataTypes);
      this.createNewInstance({ data: [headers, ...data], name: "original", dataTypes });
    },
    
    createNewInstance({ data, name, dataTypes }) {
      console.log("1")
      this.setLocalDataInstances([{
        data: JSON.parse(JSON.stringify(data)),
        testData: [],
        numdisplayedRows: 5,
        totalRows: data.length - 1,
        loadingNewInstance: false,
        name: name,
        dataTypes: JSON.parse(JSON.stringify(dataTypes)),
        workflow: [],
        isCollapsed: false,
      }]);
      console.log("2")

      this.creatingInstance = false;
      this.numericalColumns = getColumnNamesByType(this.localDataInstances[0], ['numeric', 'numeric binary']);
      this.categoricalColumns = getColumnNamesByType(this.localDataInstances[0], ['categorical', 'categorical binary']);
    },
    
    determineDataTypes(data, headers) {
      const dataTypes = {};
      headers.forEach((header, index) => {
        dataTypes[header] = this.determineDataTypeForColumn(data, index);
      });
      return dataTypes;
    },
    
    determineDataTypeForColumn(data, columnIndex) {
      let numeric = true;
      const uniqueValues = new Set();
      data.forEach(row => {
        const value = row[columnIndex];
        if (typeof value === 'string' && isNaN(value.trim())) {
          numeric = false;
        }
        uniqueValues.add(value);
      });
      if (uniqueValues.size === 2) {
        return numeric ? 'numeric binary' : 'categorical binary';
      }
      return numeric ? 'numeric' : 'categorical';
    },
    
    convertNumericColumns(data, dataTypes) {
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const header = Object.keys(dataTypes)[j];
          if (dataTypes[header].includes('numeric')) {
            data[i][j] = Number(data[i][j]);
          }
        }
      }
    },
    
    async submitDataUpload() {
      this.submitting = true;
      const instance = this.localDataInstances[0];
      this.columnsTodelete.forEach(column => {
        const colIndex = instance.data[0].indexOf(column);
        if (colIndex > -1) {
          instance.data.forEach(row => row.splice(colIndex, 1));
          delete instance.dataTypes[column];
        }
      });
      this.columnsTodelete = [];
      await this.editLocalDataInstance({ index: 0, newData: instance });
      this.submitting = false;
      this.dataloadView = false;
    },
    
    addColumnToDeleteList(column) {
      const dataInstances = this.localDataInstances;
      this.columnsTodelete.push(column);
      delete dataInstances[0].dataTypes[column];
      this.setLocalDataInstances(dataInstances);
    },
    
    resetFileInput() {
      this.$refs.fileInput.value = null;
    },
    
    cancelDataUpload() {
      this.dataloadView = false;
      this.setLocalDataInstances([]);
    },
    
    addNewPlotCard() {
      this.plots.push([new Histogram(), new BarPlot(), new BoxWhiskerPlot(), new ScatterPlot()]);
    },
    
    removePlotCard(index) {
      this.plots.splice(index, 1);
    },
    
    handleSubmitPlot(selectedValues) {
      console.log(selectedValues);
    },
  },
};
</script>


<style scoped>
.main-layouttt {
  display: flex;
  justify-content: center;
  

}

.main-content {
  width: 100%;
  background-color: #263c55;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 30px;
  transition: all 0.3s ease;
  align-items: center;
  /* To center horizontally as well */
}

#data-upload {
  margin-bottom: 20px;
  text-align: center;
}

.upload-card {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 25%;
  height: 50px;
  margin: 0 auto;
  border: 1px solid #007bff;
  border-radius: 12px;
  background-color: #041727;
  cursor: pointer;
  transition: background-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
}

.upload-card:hover {
  background-color: #c7d2fe;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
}

.upload-card p {
  margin: 0;
  font-size: 1.2rem;
  color: #007bff;
}

.loading-line-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 9999;
}

.loading-line {
  width: 100px;
  height: 4px;
  background-color: #4f46e5;
  animation: loading 1s infinite;
}

@keyframes loading {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(50px);
  }
  100% {
    transform: translateX(0);
  }
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

.data-load-dialog {
  max-width: 50%;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background-color: #ffffff;
  color: black;
}

.data-load-dialog .dialog-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 10px;
}

.data-load-dialog .field {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.data-load-dialog .column-label {
  flex: 1;
  margin-left: 10px;
  color: black;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-top: 1px solid #4f46e5;
}

.delete-button {
  background-color: #e3342f;
  color: white;
  border-radius: 50%;
  margin-right: 10px;
}

.delete-button:hover {
  background-color: #cc1f1a;
}

.user-dataset-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  height: 500px;
}

.plots-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.plot-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  background-color: #f8f9fa;
}

.add-plot-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.add-plot-button {
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.add-plot-button:hover {
  background-color: #0056b3;
  transform: translateY(-3px);
}


</style>
