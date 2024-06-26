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
              <h3 class="text-center name-small">Name: {{ instance.name }}</h3>
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

            <div v-if = "!instance.isinbuildingModelPhase" class="button-center-container">
              <CDropdown>
                <CDropdownToggle color="primary">Feature Engineering options</CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem href="#" @click="showonehotmodal = true; currentInstanceIndex = instanceIndex;">One hot encoding</CDropdownItem>
                  <CDropdownItem href="#" @click="shownormalizemodal = true; currentInstanceIndex = instanceIndex;">Normalize columns</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>

              <Modal v-if="showonehotmodal " @close="showonehotmodal = false">
                <template v-slot:header>
                  <h2>One hot encoding</h2>
                </template>

                <template v-slot:body>
                  <p>Select a categorical column to one hot encode</p>
                  <CFormSelect size="lg" class="mb-3" aria-label="Large select example" v-model="selectedValue" @change="updateRelevantEvent">
                    <option disabled value="">Open this select menu</option>
                    <option v-for="(value, key) in getColumnNamesByType(dataInstances[currentInstanceIndex], 'categorical')" :key="key" :value="value">
                      {{ value }}
                    </option>
                  </CFormSelect>

                </template>

                <template v-slot:footer>
                  <button @click="featureEngineering(selectedValue, currentInstanceIndex)">Submit</button>
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
                    <option v-for="(value, key) in getColumnNamesByType(dataInstances[currentInstanceIndex], 'numeric')" :key="key" :value="value">
                      {{ value }}
                    </option>
                  </CFormSelect>
                </template>

                <template v-slot:footer>
                  <button @click="shownormalizemodal = false">Close</button>
                </template>
              </Modal>
            </div>

          <div> 
            <button class="goto-build-phase" @click=" handleBuildingPhase(instanceIndex)">
              <span v-if="!dataInstances[instanceIndex].isinbuildingModelPhase"> Go To building phase</span>
              <span v-if="dataInstances[instanceIndex].isinbuildingModelPhase"> Go back to data processing and engineering</span>
            </button>

          </div>




            <CCard v-if = "instance.isinbuildingModelPhase">
              <CCardHeader>
                Models
                <div class="addmodel-button-container">
                  <button class="btn btn-success mt-3 btn-very-small" @click="addnewModel(instanceIndex)">
                    &#43;
                  </button>
                </div>
              </CCardHeader>

            
              
              <div  class="card-content">
                <ModelInfo v-for="(value, key) in instance.models"
                  :models="value"
                  :key="key"
                  :variables="instance.data[0]"
                  @deleteModel="key => {
                    instance.models.splice(key, 1);
                  }"
                  @updateModel="model => {
                    console.log(model);
                  }"
                  @submittingModel="handleSubmitModel">
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
  </div>



  

  <Modal
    v-if="creatingInstance"
    @close="creatingInstance = false"
    @submit="name => createNewInstance({ data: instanceParent, name, dataTypes: currentDataTypes })"
    :existingNames="dataInstances.map(instance => instance.name)"
  />
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
      latestRelevantEvent: null,
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
      showErrorModal: false, // New property for error modal visibility
      errorMessage: '', // New property for error message
      currentInstanceIndex: null, // Track the current instance index for modals
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
        console.log(testResponse.data);
      } else {
        this.file = null;
        this.uploadError = 'Please choose a valid CSV file.';
      }
      this.parsing = false;
      console.l
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

        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
      }, 1);
    },
    determineDataTypeForColumn(data, columnIndex) {
      let isNumeric = true;
      let isDate = true;
      const uniqueValues = new Set();

      data.forEach(row => {
        const value = row[columnIndex];
        if (typeof value === 'string') {
          const trimmedValue = value.trim();
          uniqueValues.add(trimmedValue);

          if (isNaN(trimmedValue) || trimmedValue === '') {
            isNumeric = false;
          }

          if (!this.isValidDate(trimmedValue)) {
            isDate = false;
          }
        } else {
          uniqueValues.add(value);

          if (isNaN(value) || value === null || value === undefined) {
            isNumeric = false;
          }

          if (!this.isValidDate(value)) {
            isDate = false;
          }
        }
      });

      if (uniqueValues.size === 2) {
        return 'binary';
      } else if (isNumeric) {
        return 'numeric';
      } else if (isDate) {
        return 'date';
      } else {
        return 'categorical';
      }
    },
    determineDataTypes(data, headers) {
  const dataTypes = {};
  headers.forEach((header, index) => {
    dataTypes[header] = this.determineDataTypeForColumn(data, index);
    this.convertColumnData(data, index, dataTypes[header]);
  });
  return dataTypes;
},

convertColumnData(data, columnIndex, dataType) {
  data.forEach(row => {
    let value = row[columnIndex];

    if (dataType === 'numeric') {
      row[columnIndex] = parseFloat(value);
    } else if (dataType === 'date') {
      row[columnIndex] = new Date(value);
    } 
  });
},
      
    updateDataTypesForNewColumns(instanceIndex) {
      const instance = this.dataInstances[instanceIndex];
      const newHeaders = instance.data[0];

      // Determine data types for new columns only
      newHeaders.forEach(header => {
        if (!Object.prototype.hasOwnProperty.call(instance.dataTypes, header)) {
          const colIndex = newHeaders.indexOf(header);
          instance.dataTypes[header] = this.determineDataTypeForColumn(instance.data.slice(1), colIndex);
          this.convertColumnData(instance.data, colIndex, instance.dataTypes[header]);

        }
      });

      // Remove columns from dataTypes that no longer exist
      Object.keys(instance.dataTypes).forEach(header => {
        if (!newHeaders.includes(header)) {
          delete instance.dataTypes[header];
        }
      });

      console.log(instance.dataTypes);
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
          isinbuildingModelPhase: false,
          models: [[
        new LinearRegression(),
        new LogisticRegression()
      ]]
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

      const models= [
        new LinearRegression(),
        new LogisticRegression()
      ]
      this.dataInstances[instanceIndex].models.push(models);

    },
    toggleCollapse(instanceIndex) {
      if (this.dataInstances[instanceIndex]) {
        this.dataInstances[instanceIndex].isCollapsed = !this.dataInstances[instanceIndex].isCollapsed;
      }
    },

    isNumeric(value) {
    // Check for null or empty string
    if (value === null || value === '') {
        return false;
    }

    // Check if the value is a number or can be converted to a number
    if (!isNaN(value)) {
        return true;
    }

    // Otherwise, return false
    return false;
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
        isConvertible = this.dataInstances[instanceIndex].data.slice(1).every(row => this.isNumeric(row[colIndex]));
      } else if (type === 'binary') {
        // Check if there are only two unique values
        const uniqueValues = new Set(this.dataInstances[instanceIndex].data.slice(1).map(row => row[colIndex]));
        isConvertible = uniqueValues.size === 2;
      } else if (type === 'date') {
        // Check if all values can be converted to valid dates
        isConvertible = this.dataInstances[instanceIndex].data.slice(1).every(row => this.isValidDate(row[colIndex]));
      }

      if (!isConvertible) {
        this.showErrorModalWithTimeout(`Column ${columnName} cannot be converted to ${type}.`);
        return;
      }

      this.dataInstances[instanceIndex].dataTypes[columnName] = type;
      console.log(this.dataInstances[instanceIndex].dataTypes);
    },

    updateRelevantEvent(event) {
      this.latestRelevantEvent = event;
      console.log(event);
    },

    getColumnNamesByType(dataInstance, columnType) {
      return Object.keys(dataInstance.dataTypes).filter(key => dataInstance.dataTypes[key] === columnType);
    },

    async featureEngineering(columnName, instanceIndex) {
      console.log("fe");
      console.log(columnName);
      const instance = this.dataInstances[instanceIndex];
      console.log(instance);

      const dataToSend = {
        data: instance.data.map(row => ({ columns: row }))
      };


    console.log("Data to send before encoding:", JSON.stringify(dataToSend, null, 2));

      const response = await axios.post('/onehotencoding', dataToSend, {
        params: {
          column_name: columnName
        }
      });

      console.log(response);

      const updatedData = JSON.parse(response.data.data);
      console.log(updatedData);

      // Update instance data with the new one-hot encoded data
      instance.data = [Object.keys(updatedData[0]), ...updatedData.map(row => Object.values(row))];
      instance.displayedRows = instance.data.slice(1, this.rowsPerPage + 1);

      // Update data types for new columns and remove obsolete ones
      this.updateDataTypesForNewColumns(instanceIndex);

      this.showonehotmodal = false;
    },
    handleBuildingPhase(InstanceIndex){
      this.dataInstances[InstanceIndex].isinbuildingModelPhase = !this.dataInstances[InstanceIndex].isinbuildingModelPhase ;
      this.dataInstances[InstanceIndex].models = [[
        new LinearRegression(),
        new LogisticRegression()
      ]]
    },

    isValidDate(value) {
    // Check if the value is a Date object
    if (Object.prototype.toString.call(value) === "[object Date]") {
        return !isNaN(value.getTime());
    }

    // Check if the value is a string that can be converted to a valid date
    if (typeof value === 'string') {
        const date = new Date(value);
        return !isNaN(date.getTime());
    }

    // If the value is not a Date object or a valid date string, return false
    return false;
},
    handleSubmitModel(selectedValues) {
      console.log('Submitted Model Values:', selectedValues);
    }
  }
};
</script>



<style src="@/assets/styles.css" scoped></style>
