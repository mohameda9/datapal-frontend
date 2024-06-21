<template>
  <div class="file-upload-container">
    <h1 class="text-center">DataPal - No Code ML</h1>

    <div class="container mt-5">
      <!-- Drop area for file upload -->
      <div
        class="file-drop-area text-center"
        @dragover.prevent
        @dragenter.prevent
        @drop="handleFileDrop"
        @click="$refs.fileInput.click()"
      >
        <p v-if="!parsing">{{ dropMessage }}</p>
        <div v-else class="spinner-border" role="status"></div>
        <input 
          type="file"
          class="visually-hidden"
          ref="fileInput"
          @change="handleFileChange"
          accept=".csv"
        >
      </div>

      <!-- Display instances of CSV data -->
      <div v-if="dataInstances.length > 0" class="mt-5">
        <div v-for="(instance, index) in dataInstances" :key="index" class="mt-3 instance-container">
          <div class="header" @click="toggleCollapse(index)">
            <h3 class="text-center">Name: {{ instance.name }}</h3>
            <span :class="{ collapsed: instance.isCollapsed }">&#9660;</span>
          </div>

          <div v-if="!instance.isCollapsed">
            <div class="table-container" @scrollend="() => instance.displayedRows.length < instance.totalRows ? loadMoreRowsForInstance(index) : {}">
              <table class="table table-bordered table-striped">
                <thead class="fixed-header">
                  <tr>
                    <th v-for="(header, index) in instance.data[0]" :key="index">{{ header }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowIndex) in instance.displayedRows" :key="rowIndex">
                    <td v-for="(value, colIndex) in row" :key="colIndex">{{ value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="button-center-container">
              <CDropdown>
                <CDropdownToggle color="primary">Feature Engineering options</CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem href="#" @click="showonehot = true">One hot encoding</CDropdownItem>
                  <CDropdownItem href="#">Another action</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>

              <Modal v-if="showonehot" @close="showonehot = false">
                <template v-slot:header>
                  <h2> One hot encoding </h2>
                </template>

                <template v-slot:body>
                  <p2> Select a column from below</p2>
                  <CFormSelect size="lg" class="mb-3" aria-label="Large select example" v-model="selectedItem">
                    <option disabled value="">Open this select menu</option>
                    <option v-for="(value, key) in instance.data[0]" :key="key" :value="value">
                      {{ value }}
                    </option>
                  </CFormSelect>
                </template>

                <template v-slot:footer>
                  <button @click="showonehot = false">Close</button>
                </template>
              </Modal>

              <button class="btn btn-success mt-3" @click="ev => { instanceParent = instance.data; creatingInstance = true; }">
                <span v-if="creatingInstance" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span v-else>Create New Instance</span>
              </button>

              <button class="btn btn-danger mt-3" @click="deleteInstance(index)">
                <span>Delete Instance</span>
              </button>
            </div>

            <ModelInfo 
              :models="this.models" 
              :key="instance.modelInfo?.version" 
              :variables="instance.data[0]"
              @updateModel="(model) => {
                console.log(model);
                instance.model = model;
                instance.model.version++;
            }"></ModelInfo>
          </div>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="uploadError" class="alert alert-danger mt-3 text-center">
        {{ uploadError }}
      </div>
    </div>
  </div>

  <Modal 
    v-if="creatingInstance" 
    @close="creatingInstance = false" 
    @submitName="(name) => createNewInstance(this.instanceParent, name)"
    :existingNames="dataInstances.map(instance => instance.name)"
  />
</template>

<script>
import Modal from './components/Modal.vue';
import ModelInfo from './components/ModelInfo.vue';
import { LinearRegression, LassoRegression } from './classes/Model';

export default {
  name: 'FileUpload',
  data() {
    return {
      showonehot: false,
      file: null,
      uploadSuccess: false,
      uploadError: '',
      csvData: [],
      displayedRows: [],
      rowsPerPage: 5,
      currentPage: 1,
      dataInstances: [],
      loading: false,
      creatingInstance: false,
      instanceParent: [],
      instanceName: "",
      parsing: false,
      models: [
        new LinearRegression(),
        new LassoRegression()
      ]
    };
  },
  components: {
    Modal,
    ModelInfo
  },
  computed: {
    dropMessage() {
      return 'Drag & Drop a CSV file here';
    },
    totalRows() {
      return this.csvData.length > 0 ? this.csvData.length - 1 : 0;
    }
  },
  methods: {
    handleFileChange(event) {
      const selectedFile = event.target.files[0];
      this.handleFile(selectedFile);
    },
    handleFileDrop(event) {
      event.preventDefault();
      const droppedFile = event.dataTransfer.files[0];
      this.handleFile(droppedFile);
    },
    handleFile(file) {
      if (file && file.type === 'text/csv') {
        this.file = file;
        this.uploadError = '';
        this.parsing = true;
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
      };
      reader.readAsText(file);
    },
    parseCSV(csv) {
      const rows = csv.trim().split(/\r?\n/);
      const headers = rows[0].split(',');
      const data = rows.slice(1).map(row => row.split(','));
      this.csvData = [headers, ...data];
      this.dataInstances = [];
      this.instanceParent = [];
      this.createNewInstance(this.csvData, "original");
      this.displayedRows = this.csvData.slice(1, this.rowsPerPage + 1);
      setTimeout(() => {
        this.uploadSuccess = true;
        this.parsing = false;
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
      }, 1);
    },
    loadMoreRows() {
      this.loading = true;
      setTimeout(() => {
        const startIndex = this.currentPage * this.rowsPerPage + 1;
        const endIndex = startIndex + this.rowsPerPage;
        if (startIndex < this.csvData.length) {
          this.displayedRows.push(...this.csvData.slice(startIndex, endIndex));
          this.currentPage++;
        }
        this.loading = false;
      }, 1000);
    },
    loadMoreRowsForInstance(index) {
      this.dataInstances[index].loading = true;
      setTimeout(() => {
        const instance = this.dataInstances[index];
        const startIndex = instance.currentPage * this.rowsPerPage + 1;
        const endIndex = startIndex + this.rowsPerPage;
        if (startIndex < instance.data.length) {
          instance.displayedRows.push(...instance.data.slice(startIndex, endIndex));
          instance.currentPage++;
        }
        instance.loading = false;
      }, 1000);
    },
    createNewInstance(data, name) {
      setTimeout(() => {
        this.dataInstances.push({
          data: JSON.parse(JSON.stringify(data)),
          displayedRows: JSON.parse(JSON.stringify(data.slice(1, this.rowsPerPage + 1))),
          currentPage: 1,
          totalRows: data.length - 1,
          loading: false,
          name: name,
          modelInfo: null,
          isCollapsed: true
        });
        this.creatingInstance = false;
      }, 1000);
    },
    deleteInstance(index) {
      this.dataInstances.splice(index, 1);
    },
    toggleCollapse(index) {
      this.dataInstances[index].isCollapsed = !this.dataInstances[index].isCollapsed;
    }
  }
};
</script>

<style scoped>
.file-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.text-center {
  text-align: center;
}

.file-drop-area {
  border: 2px dashed #bdc3c7;
  padding: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.file-drop-area:hover {
  background-color: #ecf0f1;
}

.visually-hidden {
  display: none;
}

.mt-5 {
  margin-top: 3rem;
}

.mt-3 {
  margin-top: 1rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border-width: 0.3rem;
}

.table-container {
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: #ffffff;
}

.table {
  width: 100%;
  margin-bottom: 1rem;
  background-color: transparent;
  border-collapse: separate;
  border-spacing: 0;
}

.table-bordered {
  border: 1px solid #dee2e6;
}

.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.fixed-header {
  position: sticky;
  top: 0;
  background: #2c3e50;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 10px;
  text-align: left;
}

.table th, .table td {
  padding: 12px;
  border: 1px solid #dee2e6;
}

.table th {
  background-color: #34495e;
  color: #ffffff;
  text-align: center;
}

.table td {
  background-color: #ffffff;
  text-align: left;
}

.button-center-container {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}

.btn {
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: #fff;
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: #fff;
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.header h3 {
  font-size: 24px;
  margin-right: 10px;
  color: #2c3e50;
}

.header span {
  font-size: 24px;
  transition: transform 0.3s ease;
}

.header span.collapsed {
  transform: rotate(180deg);
}
</style>

