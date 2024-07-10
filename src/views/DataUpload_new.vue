<template>
  <div class="main-layout">
    <div class="main-content">
      <section id="data-upload">
        <div class="upload-card" @dragover.prevent @dragenter.prevent @drop="handleFileDrop" @click="$refs.fileInput.click()">
          <p v-if="!parsing">{{ dropMessage }}</p>
          <div v-else class="spinner-border" role="status"></div>
          <input type="file" class="visually-hidden" ref="fileInput" @change="handleFileChange" accept=".csv">
        </div>
        <div v-if="uploadError" class="alert alert-danger mt-3 text-center">
          {{ uploadError }}
        </div>
      </section>

      <UserDataset v-if="getDataInstances.length > 0 && !dataloadView" :data="getDataInstances[0].data" />
      
      <Dialog :visible="dataloadView && dataInstances.length > 0" header="Columns Overview" closable="false" class="data-load-dialog" :style="{ width: '50%', height: 'auto' }" :position="position" :draggable="false">
        <div class="dialog-content">
          <div v-for="(value, column) in dataInstances[0].dataTypes" :key="column" class="field column-field">
            <Button icon="pi pi-trash" class="delete-button" @click="addColumnToDeleteList(column)" />
            <label :for="column" class="column-label">{{ column }}</label>
          </div>
        </div>
        <div class="dialog-footer">
          <Button label="Cancel" text severity="secondary" @click="cancelDataUpload()" />
          <Button label="Submit" icon="pi pi-check" @click="submitDataUpload()" />
        </div>
      </Dialog>
    </div>
  </div>
</template>

<script>
import ProjectManagerBar from '../components/ProjectManagerBar.vue';
import UserDataset from '../components/UserDataset.vue';
import { mapActions, mapGetters } from 'vuex';
import { createNewInstance } from '@/utils/commonFunctions';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

export default {
  name: 'DataUpload_new',
  components: {
    ProjectManagerBar,
    UserDataset,
    Button,
    Dialog,
  },
  data() {
    return {
      file: null,
      uploadError: '',
      parsing: false,
      dataloadView: false,
      columnsTodelete: []
    };
  },
  computed: {
    ...mapGetters(['getDataInstances']),
    dataInstances() {
      return this.getDataInstances;
    },
    dropMessage() {
      return 'Drag & Drop a CSV file here';
    },
  },
  methods: {
    ...mapActions(['setDataInstances', 'addDataInstance', 'deleteDataInstance', 'editDataInstance']),
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
        this.readCSV(file);
      } else {
        this.file = null;
        this.uploadError = 'Please choose a valid CSV file.';
      }
      this.parsing = false;
      this.dataloadView = true;
    },
    readCSV(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        this.parseCSV(csv);
      };
      reader.readAsText(file);
    },
    parseCSV(csv) {
      const rows = csv.trim().split(/\r?\n/);
      const headers = rows[0].split(',');
      const data = rows.slice(1).map(row => row.split(','));
      const dataTypes = this.determineDataTypes(data, headers);
      this.createNewInstance({ data: [headers, ...data], name: "original", dataTypes });
    },
    createNewInstance({ data, name, dataTypes }) {
      this.setDataInstances([{
        data: JSON.parse(JSON.stringify(data)),
        numdisplayedRows: 20,
        totalRows: data.length - 1,
        loadingNewInstance: false,
        name: name,
        dataTypes: JSON.parse(JSON.stringify(dataTypes)),
        modelInfo: null,
        workflow: [],
        histWf_isCollapsed: true,
        historicalWorkflow: [],
        isCollapsed: false,
        isinbuildingModelPhase: false,
      }]);
      this.creatingInstance = false;
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
    submitDataUpload() {
      const instance = this.getDataInstances[0];
      this.columnsTodelete.forEach(column => {
        const colIndex = instance.data[0].indexOf(column);
        if (colIndex > -1) {
          instance.data.forEach(row => row.splice(colIndex, 1));
          delete instance.dataTypes[column];
        }
      });
      this.columnsTodelete = [];
      this.dataloadView = false;
      this.editDataInstance(0, instance);
    },
    addColumnToDeleteList(column) {
      const DataInstances = this.getDataInstances;
      this.columnsTodelete.push(column);
      delete DataInstances[0].dataTypes[column];
      this.setDataInstances(DataInstances);
    },
    resetFileInput() {
      this.$refs.fileInput.value = null;
    },
    cancelDataUpload() {
      this.dataloadView = false;
      this.setDataInstances([]);
    }
  }
};
</script>

<style scoped>
.main-layout {
  background-color: #f9f9f9;
  display: flex;
  justify-content: center;
}

.main-content {
  height: 50%;
  width: 80%;
  background: #ffffff;
  padding: 20px;
  transition: all 0.3s ease;
}

#data-upload {
  margin-bottom: 20px;
  text-align: center;
}

.upload-card {
  display: flex;
  justify-content: center;
  width: 50%;
  height: 100px;
  margin: 0 auto;
  border-radius: 12px;
  background-color: #e0e7ff;
  border: 2px dashed #4f46e5;
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
  font-size: 3.2rem;
  color: #4f46e5;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  margin: auto;
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
</style>
