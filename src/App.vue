<template>
  <div class="body">
    <h1 class="page-title">DataPal - No Code ML</h1>

    <div class="main-container">
      <!-- Drop area for file upload -->
      <div
        class="file-drop-area"
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
        <div v-for="(instance, instanceIndex) in dataInstances" :key="instanceIndex" class="instance-container">
          <div class="header">
            <div class="header-content">
              <button class="btn btn-success btn-very-small" @click="prepareNewInstance(instance)">
                <span v-if="creatingInstance" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span v-else>Create New Instance</span>
              </button>
              <h3 class="text-center name-small" >Name: {{ instance.name }}</h3>
              <button class="btn btn-danger btn-very-small" @click="confirmDelete(instanceIndex)">
                <span>Delete Instance</span>
              </button>
            </div>
            <span v-if="instance" :class="{ collapsed: instance.isCollapsed }" @click="toggleCollapse(instanceIndex)">&#9660;</span>
          </div>

          <div v-if="instance && !instance.isCollapsed">
            <div class="table-container" @scrollend="() => instance.displayedRows.length < instance.totalRows ? loadMoreRowsForInstance(instanceIndex) : {}">
              <table class="table table-bordered table-striped">
                <thead class="fixed-header">
                  <tr>
                    <th v-for="(header, colIndex) in instance.data[0]" :key="colIndex">
                      <CDropdown>
                        <CDropdownToggle class="table-headers">
                          {{ header }}
                        </CDropdownToggle>
                        <CDropdownMenu>
                          <CDropdownItem @click="changeMetricType(header, 'numeric', instanceIndex)">
                            <span class="d-flex align-items-center">
                              Numeric
                              <span v-if="instance.dataTypes[header] === 'numeric'" class="active-indicator ml-2"></span>
                            </span>
                          </CDropdownItem>
                          <CDropdownItem @click="changeMetricType(header, 'categorical', instanceIndex)">
                            <span class="d-flex align-items-center">
                              Categorical
                              <span v-if="instance.dataTypes[header] === 'categorical'" class="active-indicator ml-2"></span>
                            </span>
                          </CDropdownItem>
                          <CDropdownItem @click="changeMetricType(header, 'binary', instanceIndex)">
                            <span class="d-flex align-items-center">
                              Binary
                              <span v-if="instance.dataTypes[header] === 'binary'" class="active-indicator ml-2"></span>
                            </span>
                          </CDropdownItem>
                          <CDropdownItem @click="changeMetricType(header, 'date', instanceIndex)">
                            <span class="d-flex align-items-center">
                              Date
                              <span v-if="instance.dataTypes[header] === 'date'" class="active-indicator ml-2"></span>
                            </span>
                          </CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown>
                    </th>
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
                  <CDropdownItem href="#" @click="showonehotmodal = true">One hot encoding</CDropdownItem>
                  <CDropdownItem href="#" @click="shownormalizemodal = true">Normalize columns</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>

              <Modal v-if="showonehotmodal" @close="showonehotmodal = false">
                <template v-slot:header>
                  <h2>One hot encoding</h2>
                </template>
 
                <template v-slot:body>
                  <p>Select a categorical column to one hot encode</p>
                  <CFormSelect size="lg" class="mb-3" aria-label="Large select example" :model-value="test" >
                    <option disabled value="">Open this select menu</option>
                    <option v-for="(value, key) in getColumnNamesByType(instance, 'categorical')" :key="key" :value="value">
                      {{ value }}
                    </option>
                  </CFormSelect>
                </template>

                <template v-slot:footer>
                  <button @click= "featureEngineering(model-value, instanceIndex )">Submit</button>
                </template>
              </Modal>
              <Modal v-if="shownormalizemodal" @close="shownormalizemodal = false">
                <template v-slot:header>
                  <h2>Normalize column values</h2>
                </template>

                <template v-slot:body>
                  <p>Select a numerical column to normalize</p>
                  <CFormSelect size="lg" class="mb-3" aria-label="Large select example" v-model="selectedItem">
                    <option disabled value="">Open this select menu</option>
                    <option v-for="(value, key) in getColumnNamesByType(instance, 'numeric')" :key="key" :value="value">
                      {{ value }}
                    </option>
                  </CFormSelect>
                </template>

                <template v-slot:footer>
                  <button @click="shownormalizemodal = false">Close</button>
                </template>
              </Modal>
            </div>
            <CCard>
              <CCardHeader>
                Models
                <div class="addmodel-button-container">
                  <button class="btn btn-success mt-3 btn-very-small"  @click="addnewModel(instanceIndex)">
                    &#43;  
                  </button>
                </div>
              </CCardHeader>
              <div class="card-content">
                <ModelInfo v-for="(value, key) in instance.models"
                  :models="value"
                  :key="key"
                  :variables="instance.data[0]"
                  @deleteModel="key => {
                    instance.models.splice(key, 1);
                  }"
                  @updateModel="model => {
                    console.log(model);
                  }">
                </ModelInfo>
              </div>
            </CCard>
          </div>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="uploadError" class="alert alert-danger mt-3 text-center">
        {{ uploadError }}
      </div>

      <!-- Error modal -->
      <Modal v-if="showErrorModal" @close="showErrorModal = false">
        <template v-slot:header>
          <h2>Error</h2>
        </template>

        <template v-slot:body>
          <p>{{ errorMessage }}</p>
        </template>

        <template v-slot:footer>
          <button class="btn btn-danger" @click="showErrorModal = false">Close</button>
        </template>
      </Modal>
    </div>

  <Modal
    v-if="creatingInstance"
    @close="creatingInstance = false"
    @submit="name => createNewInstance({ data: instanceParent, name, dataTypes: currentDataTypes })"
    :existingNames="dataInstances.map(instance => instance.name)"
  />
</div>

</template>

<script>
import Modal from './components/Modal.vue';
import ModelInfo from './components/ModelInfo.vue';
import { LinearRegression, LogisticRegression } from './classes/Model';
import {
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CFormSelect,
  CCard,
  CCardHeader
} from '@coreui/vue';


import axios from '@/axios.js'; // Path to the axios.js file

export default {
  name: 'FileUpload',
  data() {
    return {
      showonehotmodal: false,
      shownormalizemodal: false,

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
      currentDataTypes: {}, // New property to store data types for the new instance
      instanceName: "",
      parsing: false,
      models: [
        new LinearRegression(),
        new LogisticRegression()
      ],
      showErrorModal: false, // New property for error modal visibility
      errorMessage: '' // New property for error message
    };
  },
  components: {
    Modal,
    ModelInfo,
    CDropdown,
    CDropdownToggle,
    CDropdownMenu,
    CDropdownItem,
    CFormSelect,
    CCard,
    CCardHeader
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
    async handleFile(file) {
      if (file && file.type === 'text/csv') {
        this.file = file;
        this.uploadError = '';
        this.parsing = true;
        this.readCSV(file);
        const testResponse = await axios.get('/test', {
        params: { k: 'yes' },
        });
        console.log(testResponse.data)
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

      const dataTypes = this.determineDataTypes(data, headers);
      this.csvDataTypes = dataTypes; // Store data types

      this.csvData = [headers, ...data];
      this.dataInstances = [];
      this.instanceParent = [];
      this.createNewInstance({ data: this.csvData, name: "original", dataTypes });
      this.displayedRows = this.csvData.slice(1, this.rowsPerPage + 1);
      setTimeout(() => {
        this.uploadSuccess = true;
        this.parsing = false;
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
      }, 1);
    },
    determineDataTypes(data, headers) {
    const dataTypes = {};
    headers.forEach(header => {
      dataTypes[header] = 'categorical';
      });

    headers.forEach((header, instanceIndex) => {
      let isNumeric = true;
      let isDate = true;
      const uniqueValues = new Set();

      data.forEach(row => {
      const value = row[instanceIndex].trim();
      uniqueValues.add(value);

      // Check if the value is numeric
      if (isNaN(value) || value === '') {
        isNumeric = false;
      }

      // Check if the value is a valid date
      if (!this.isValidDate(value)) {
        isDate = false;
      }
    });

    if (uniqueValues.size === 2) {
      dataTypes[header] = 'binary';
    } else if (isNumeric) {
      dataTypes[header] = 'numeric';
    } else if (isDate) {
      dataTypes[header] = 'date';
    }
  });

  return dataTypes;
},

  isValidDate(dateString) {
    // Try to create a date object from the string
    const date = new Date(dateString);
    // Check if the date is valid and the parsed date matches the input date
    return date instanceof Date && !isNaN(date);
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
    loadMoreRowsForInstance(instanceIndex) {
      this.dataInstances[instanceIndex].loading = true;
      setTimeout(() => {
        const instance = this.dataInstances[instanceIndex];
        const startIndex = instance.currentPage * this.rowsPerPage + 1;
        const endIndex = startIndex + this.rowsPerPage;
        if (startIndex < instance.data.length) {
          instance.displayedRows.push(...instance.data.slice(startIndex, endIndex));
          instance.currentPage++;
        }
        instance.loading = false;
      }, 1000);
    },
    prepareNewInstance(instance) {
      this.instanceParent = instance.data;
      this.currentDataTypes = instance.dataTypes;
      this.creatingInstance = true;
    },
    createNewInstance({ data, name, dataTypes }) {
      setTimeout(() => {
        this.dataInstances.push({
          data: JSON.parse(JSON.stringify(data)),
          displayedRows: JSON.parse(JSON.stringify(data.slice(1, this.rowsPerPage + 1))),
          currentPage: 1,
          totalRows: data.length - 1,
          loading: false,
          name: name,
          dataTypes: JSON.parse(JSON.stringify(dataTypes)), // Ensure independent copy
          modelInfo: null,
          isCollapsed: false,
          models: []
        });
        this.creatingInstance = false;
      }, 1000);
    },
    confirmDelete(instanceIndex) {
      if (window.confirm('Are you sure you want to delete this instance?')) {
        this.deleteInstance(instanceIndex);
      }
    },
    deleteInstance(instanceIndex) {
      this.dataInstances.splice(instanceIndex, 1);
    },
    addnewModel(instanceIndex) {
      
      this.dataInstances[instanceIndex].models.push(this.models);
    },
    toggleCollapse(instanceIndex) {
      if (this.dataInstances[instanceIndex]) {
        this.dataInstances[instanceIndex].isCollapsed = !this.dataInstances[instanceIndex].isCollapsed;
      }
    },
    showErrorModalWithTimeout(message) {
      this.errorMessage = message;
      this.showErrorModal = true;
      setTimeout(() => {
        this.showErrorModal = false;
      }, 1000); // Hide the modal after 1 second
    },
    changeMetricType(columnName, type, instanceIndex) {
  const colIndex = this.dataInstances[instanceIndex].data[0].indexOf(columnName);
  let isConvertible = true;

  if (type === 'numeric') {
    // Check if all values can be converted to numeric
    isConvertible = this.dataInstances[instanceIndex].data.slice(1).every(row => !isNaN(row[colIndex]) && row[colIndex].trim() !== '');
  } else if (type === 'binary') {
    // Check if there are only two unique values
    const uniqueValues = new Set(this.dataInstances[instanceIndex].data.slice(1).map(row => row[colIndex].trim()));
    isConvertible = uniqueValues.size === 2;
  } else if (type === 'date') {
    // Check if all values can be converted to valid dates
    isConvertible = this.dataInstances[instanceIndex].data.slice(1).every(row => this.isValidDate(row[colIndex].trim()));
  }

  if (!isConvertible) {
    this.showErrorModalWithTimeout(`Column ${columnName} cannot be converted to ${type}.`);
    return;
  }

  this.dataInstances[instanceIndex].dataTypes[columnName] = type;
  console.log(this.dataInstances[instanceIndex].dataTypes);
},


    getColumnNamesByType(dataInstance, columnType) {
      return Object.keys(dataInstance.dataTypes).filter(key => dataInstance.dataTypes[key] === columnType);
    },

    async featureEngineering(columnName, instanceIndex){
      console.log("fe")
      console.log(columnName)
      const instance = this.dataInstances[instanceIndex];
      console.log(instance)

      const dataToSend = {
          data: instance.data.map(row => ({ columns: row }))
        };

      console.log(dataToSend)

      const response = await axios.post('/onehotencoding', dataToSend, {
        params: {
          column_name: columnName
        }
      });

      console.log(response)

      const updatedData = JSON.parse(response.data.data);
      instance.data = [Object.keys(updatedData[0]), ...updatedData.map(row => Object.values(row))];

      this.showonehotmodal = false

    }
 

  }
};





</script>





<style scoped>
.active-indicator {
  width: 10px;
  height: 10px;
  background-color: green;
  border-radius: 50%;
  display: inline-block;
}

.header-content {
  color: wheat;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.btn-very-small {
  font-size: 0.6rem;
  padding: 0.2rem 0.4rem;
}

.name-small {
  font-size: 1rem;
  margin: 0;
}
</style>

<style src="@/assets/styles.css" scoped></style>
