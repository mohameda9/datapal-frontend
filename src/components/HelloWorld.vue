<template>
  <div class="body">
    <h1 class="page-title">DATAPAL - Auto ML</h1>

    <div class="main-container">
      <!-- Drop area for file upload -->
      <div class="file-drop-area" @dragover.prevent @dragenter.prevent @drop="handleFileDrop"
        @click="$refs.fileInput.click()">
        <p v-if="!parsing">{{ dropMessage }}</p>
        <div v-else class="spinner-border" role="status"></div>
        <input type="file" class="visually-hidden" ref="fileInput" @change="handleFileChange" accept=".csv">
      </div>
      <div v-if="uploadError" class="alert alert-danger mt-3 text-center">
        {{ uploadError }}
      </div>

      <!-- Display instances of CSV data -->
      <div v-if="dataInstances.length > 0" class="mt-5">
        <div v-for="(instance, instanceIndex) in dataInstances" :key="instanceIndex" class="instance-container">
          <div class="header">
            <div class="header-content">
              <Button label="Create New Instance" icon="pi pi-plus"  @click="prepareNewInstance(instance)" :loading="creatingInstance"   style="background-color: #28a745; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"   loadingIcon="pi pi-spinner" />

              <h3 class="text-center name-small">Name: {{ instance.name }}</h3>
              <Button label="Delete Instance" icon="pi pi-times" @click="confirmDelete(instanceIndex)" style="background-color: #6f42c1; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);" :class="customButtonClass"/>
            </div>
            <span v-if="instance" :class="{ collapsed: instance.isCollapsed }"
              @click="toggleCollapse(instanceIndex)">&#9660;</span>
          </div>
          <div class = "data-manipulation-button-container ">
            <Button label="Create A new Column" icon="pi pi-plus" @click="creatingNewColumn = true" style="background-color: #6c757d; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"/>
            <Button label="Handle Missing Values (not Implemented)" icon="pi pi-exclamation-circle"  @click="handlingMissingValues = true" style="background-color: #6c757d; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"/>

          </div>
          <ColumnCreator v-if="creatingNewColumn" :instanceIndex="instanceIndex"
                :availableColumns="instance.data[0]" :column-types="instance.dataTypes"
                @close="creatingNewColumn = false" @submit="(data) => handleNewColumnCreation(data, instanceIndex)" />
          
          <missingValueHandler v-if ="handlingMissingValues" @close = "handlingMissingValues = false" :availableColumns = "columnsWithMissingValues(instance)" :columntypes="instance.dataTypes" />   

          <div v-show="instance && !instance.isCollapsed">
            <div class="table-container" @scroll="e => e.target.focus({ focusVisible: true })" @scrollend="(e) => {
              if (instance.displayedRows.length < instance.totalRows)
                loadMoreRowsForInstance(instanceIndex);
              e.target.focus();
            }">
              <table class="table table-bordered table-striped">
                <thead class="fixed-header">
                  <tr>
                    <th v-for="(header, colIndex) in instance.data[0]" :key="colIndex">
                      <CDropdown>
                        <CDropdownToggle class="table-headers">
                          {{ header }}
                        </CDropdownToggle>
                        <CDropdownMenu>
                          <CDropdownItem @click="changeMetricType(header, 'numeric', instance)">
                            <span class="d-flex align-items-center">
                              Numeric
                              <span v-if="instance.dataTypes[header] === 'numeric'"
                                class="active-indicator ml-2"></span>
                            </span>
                          </CDropdownItem>
                          <CDropdownItem @click="changeMetricType(header, 'string', instance)">
                            <span class="d-flex align-items-center">
                              String
                              <span v-if="instance.dataTypes[header] === 'string'"
                                class="active-indicator ml-2"></span>
                            </span>
                          </CDropdownItem>
                          <CDropdownItem @click="changeMetricType(header, 'categorical', instance)">
                            <span class="d-flex align-items-center">
                              Categorical
                              <span v-if="instance.dataTypes[header] === 'categorical'"
                                class="active-indicator ml-2"></span>
                            </span>
                          </CDropdownItem>
                          <CDropdownItem @click="changeMetricType(header, 'numeric binary', instance)">
                            <span class="d-flex align-items-center">
                              Binary (Numeric)
                              <span v-if="instance.dataTypes[header] === 'numeric binary'" class="active-indicator ml-2"></span>
                            </span>
                          </CDropdownItem>
                          <CDropdownItem @click="changeMetricType(header, 'categorical binary', instance)">
                            <span class="d-flex align-items-center">
                              Binary (Categorical)
                              <span v-if="instance.dataTypes[header] === 'categorical binary'" class="active-indicator ml-2"></span>
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

            <div v-if="!instance.isinbuildingModelPhase" class="button-center-container">
              <CDropdown>
                <CDropdownToggle color="primary">Feature Engineering options</CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem href="#" @click="shownormalizemodal = true;">Standardize columns</CDropdownItem>
                  <CDropdownItem href="#" @click="showonehotmodal = true;">One hot encoding</CDropdownItem>
                  <CDropdownItem href="#" @click="shownormalizemodal = true;">Normalize columns</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>


              <Modal v-if="showonehotmodal" @close="showonehotmodal = false">
                <template v-slot:header>
                  <h2>One hot encoding</h2>
                </template>

                <template v-slot:body>
                  <p>Select a categorical column to one hot encode</p>
                  <select size="lg" class="mb-3" aria-label="Large select example" v-model="selectedValue">
                    <option disabled value="">Open this select menu</option>
                    <option v-for="(value, key) in getColumnNamesByType(instance, ['categorical'])" :key="key" :value="value">
                      {{ value }}
                    </option>
                </select>

                </template>

                <template v-slot:footer>
                  <button @click="onehotEncode(selectedValue, instance)">Submit</button>
                </template>
              </Modal>

              <Modal v-if="shownormalizemodal" @close="shownormalizemodal = false">
                <template v-slot:body>
                  <p>Select a numerical column to normalize</p>
                  <CFormSelect size="lg" class="mb-3" aria-label="Large select example"
                    @update:model-value="val => selectedColumn = val">
                    <option disabled value="">Open this select menu</option>
                    <option v-for="(value, key) in getColumnNamesByType(instance, ['numeric'])" :key="key" :value="value">
                      {{ value }}
                    </option>
                  </CFormSelect>

                  <div>
                    <p>Min value</p>
                    <input type="number" step="1" v-model.number="newMin" @input="validateMinMax" />
                  </div>
                  <div>
                    <p>Max value</p>
                    <input type="number" step="1" v-model.number="newMax" @input="validateMinMax" />
                  </div>

                  <div v-if="validationError" class="error-message">
                    {{ validationError }}
                  </div>
                </template>

                <template v-slot:footer>
                  <button :disabled="!!validationError"
                    @click="scaleColumn(selectedColumn ? selectedColumn : getColumnNamesByType(instance, ['numeric'])[0], instance, 'normalize', newMin, newMax)">
                    Normalize column
                  </button>
                </template>

              </Modal>
            </div>

            <div>
              <button class="goto-build-phase" @click=" handleBuildingPhase(instance)">
                <span v-if="!dataInstances[instanceIndex].isinbuildingModelPhase"> Go To building phase</span>
                <span v-if="dataInstances[instanceIndex].isinbuildingModelPhase"> Go back to data processing and
                  engineering</span>
              </button>

              <div v-if="instance.isinbuildingModelPhase" @click="switchmodelzoneview">
                <button class="toggle-stats-ml-view">
                  <span v-if="currentModelView === 'stats'"> switch to ML Models View</span>
                  <span v-if="currentModelView === 'ml'"> switch to statistical Analysis View</span>
                </button>
              </div>
            </div>

            <div v-show="instance.isinbuildingModelPhase && currentModelView === 'ml'">
              <CCard :class="{ collapsed: true }">
                <CCardHeader>
                  Models
                  <div class="addmodel-button-container">
                    <button class="btn btn-success mt-3 btn-very-small" @click="addnewMLModel(instanceIndex)">
                      &#43;
                    </button>
                  </div>
                </CCardHeader>

                <div class="card-content">
                  <ModelInfo v-for="(value, key) in instance.MLmodels" :models="value" :key="key"
                    :variables="instance.data[0]" @deleteModel="key => {
                      instance.MLmodels.splice(key, 1);
                    }" @updateModel="model => {
                      console.log(model);
                    }" @submittingModel="handleSubmitModel">
                  </ModelInfo>
                </div>
              </CCard>
            </div>

            <div v-show="instance.isinbuildingModelPhase && currentModelView === 'stats'" class="stats-models-view">
              <CCard>
                <CCardHeader>
                  Statistical Analysis
                  <div class="addmodel-button-container">
                    <button class="btn btn-success mt-3 btn-very-small" @click="addnewStatsModel(instanceIndex)">
                      &#43;
                    </button>
                  </div>
                </CCardHeader>

                <div class="card-content">
                  <ModelInfo v-for="(value, key) in instance.Statsmodels" :models="value" :key="key"
                    :variables="instance.data[0]" @deleteModel="key => {
                      instance.Statsmodels.splice(key, 1);
                    }" @updateModel="model => {
                      console.log(model);
                    }" @submittingModel="handleSubmitModel">
                  </ModelInfo>
                </div>
              </CCard>
            </div>
          </div>
        </div>
      </div>

      <!-- Error message -->

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





  <Modal v-if="creatingInstance" @close="creatingInstance = false"
    @submit="name => createNewInstance({ data: instanceParent, name, dataTypes: currentDataTypes })"
    :existingNames="dataInstances.map(instance => instance.name)" />
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
import ColumnCreator from './components/ColumnCreator.vue';
import missingValueHandler from './components/missingValueHandler.vue';
import {getColumnNamesByType} from './utils/commonFunctions.js';
import Button from 'primevue/button';

export default {
  name: 'FileUpload',
  data() {
    return {
      showonehotmodal: false,
      creatingNewColumn: false,
      shownormalizemodal: false,
      handlingMissingValues: false,
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
      currentModelView: "ml", // 
      instanceParent: [],
      currentDataTypes: {}, // New property to store data types for the new instance
      instanceName: "",
      parsing: false,
      showErrorModal: false, // New property for error modal visibility
      errorMessage: '', // New property for error message
    };
  },
  created(){
    this.getColumnNamesByType = getColumnNamesByType
  },
  components: {
    ColumnCreator,
    missingValueHandler,
    Modal,
    ModelInfo,
    CDropdown,
    CDropdownToggle,
    CDropdownMenu,
    CDropdownItem,
    CFormSelect,
    CCard,
    CCardHeader,
    Button
  },
  computed: {
    dropMessage() {
      return 'Drag & Drop a CSV file here';
    },
    totalRows() {
      return this.csvData.length > 0 ? this.csvData.length - 1 : 0;
    }, 
    

    
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
      } else {
        this.file = null;
        this.uploadError = 'Please choose a valid CSV file.';
      }
      this.parsing = false;
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
      const uniqueValues = new Set();

      data.forEach(row => {
        const value = row[columnIndex];
        if (value === null || value === undefined || value === '' ) {
          return; // Skip NaNs, nulls, undefined, and empty strings
          }
        if (typeof value === 'string') {
          const trimmedValue = value.trim();
          uniqueValues.add(trimmedValue);

          if (isNaN(trimmedValue) || trimmedValue === '') {
            isNumeric = false;
          }


        } else {
          uniqueValues.add(value);
          if (isNaN(value) || value === null || value === undefined) {
            isNumeric = false;
          }


        }
      });

      const isBinary = uniqueValues.size === 2 
      

      const isCategorical = uniqueValues.size/ data.length <0.03

      if (isBinary && isNumeric) {
        return 'numeric binary';
      }
      else if (isBinary  ){
          return 'categorical binary'
      }
      else if (isNumeric) {
        return 'numeric';
      } else if (isCategorical) {
        return 'categorical';
      } else {
        return 'string';
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

    convertColumnData(row_data, columnIndex, dataType) {

      row_data.forEach(row => {
        let value = row[columnIndex];

        if (dataType === 'numeric' || dataType === 'numeric binary') {
          row[columnIndex] = parseFloat(value);
        } 
      });
    },




    updateDataTypesForNewColumns(instance, newColumns, DataType) {
      
      newColumns.forEach(column => {
        instance.dataTypes[column] = DataType;
        });
        console.log(instance.dataTypes)
    
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
      const instance = this.dataInstances[instanceIndex];
      const startIndex = instance.currentPage * this.rowsPerPage + 1;
      const endIndex = startIndex + this.rowsPerPage;
      if (startIndex < instance.data.length) {
        instance.displayedRows.push(...instance.data.slice(startIndex, endIndex));
        instance.currentPage++;
      }
      instance.loading = false;
    },
    columnsWithMissingValues(instance) {
    const columnsWithMissing = [];
    const headers = instance.data[0];
    console.log(headers)

    headers.forEach((header, index) => {
      const hasMissing = instance.data.slice(1).some(row => row[index] === ''  || row[index] === null || row[index] === undefined);
      if (hasMissing) {
        columnsWithMissing.push(header);
      }
    });
    console.log(columnsWithMissing)

    return columnsWithMissing;
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
          MLmodels: [[
            new LinearRegression(),
            new LogisticRegression()
          ]],
          Statsmodels: [[
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
    addnewMLModel(instanceIndex) {

      const models = [
        new LinearRegression(),
        new LogisticRegression()
      ]
      this.dataInstances[instanceIndex].MLmodels.push(models);

    },

    addnewStatsModel(instanceIndex) { /// neeed to change

      const models = [
        new LinearRegression(),
        new LogisticRegression()
      ]
      this.dataInstances[instanceIndex].Statsmodels.push(models);

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
    changeMetricType(columnName, type, instance) {
      const colIndex = instance.data[0].indexOf(columnName);
      let isConvertible = true;

      if (type === 'numeric') {
        // Check if all values can be converted to numeric
        isConvertible = instance.data.slice(1).every(row => this.isNumeric(row[colIndex]));
      } else if (type === 'numeric binary') {
        // Check if there are only two unique values
        let isNumeric = instance.data.slice(1).every(row => this.isNumeric(row[colIndex]));
        const uniqueValues = new Set(instance.data.slice(1).map(row => row[colIndex]));
        isConvertible = uniqueValues.size === 2 && isNumeric;
      } 

      else if (type === 'categorical binary') {
        // Check if there are only two unique values
        let isNumeric = instance.data.slice(1).every(row => this.isNumeric(row[colIndex]));
        const uniqueValues = new Set(instance.data.slice(1).map(row => row[colIndex]));
        isConvertible = uniqueValues.size === 2 && !isNumeric;
      } 


      if (!isConvertible) {
        this.showErrorModalWithTimeout(`Column ${columnName} cannot be converted to ${type}.`);
        return;
      }

      instance.dataTypes[columnName] = type;
      this.convertColumnData(instance.data.slice(1), colIndex, type);


    },


    switchmodelzoneview() {
      if (this.currentModelView === "ml") {
        this.currentModelView = "stats"
      } else {
        this.currentModelView = "ml"
      }
    },



    async scaleColumn(columnName, instance, method, newMin = 0, newMax = 1) {
      newMin = Number(newMin);
      newMax = Number(newMax);

      // Validate newMin and newMax
      if (isNaN(newMin) || isNaN(newMax)) {
        this.showErrorModalWithTimeout('newMin and newMax must be valid numbers');
        return;
      }

      if (newMax <= newMin) {
        this.showErrorModalWithTimeout('newMax must be greater than newMin');
        return;
      }

      const index = instance.data[0].indexOf(columnName)
      console.log(index)

      const columnData = instance.data.map(row => {
        return [row[index]] ;
      })

      const dataToSend = {
        data: columnData.map(row => ({ columns: row }))
      };

      const response = await axios.post('/scale', dataToSend, {
        params: {
          column_name: columnName,
          method: method,
          new_min: newMin,
          new_max: newMax
        }
      });

      const new_headers = this.updateDataFromBackend(instance, response);
      this.updateDataTypesForNewColumns(instance, new_headers, ["numeric"]);
      this.shownormalizemodal = false;
    },


    async onehotEncode(columnName, instance) {
      console.log(columnName)

      const index = instance.data[0].indexOf(columnName)
      console.log(index)

      const columnData = instance.data.map(row => {
        return [row[index]] ;
      })


      const dataToSend = {
        data: columnData.map(row => ({ columns: row }))
      };

      console.log(dataToSend)



      const response = await axios.post('/onehotencoding', dataToSend, {
        params: {
          column_name: columnName
        }
      });


      const headers = this.updateDataFromBackend(instance, response)
      console.log(headers)
      // Update data types for new columns and remove obsolete ones
       this.updateDataTypesForNewColumns(instance, headers, "numeric binary");

      this.showonehotmodal = false;
    },

    updateDataFromBackend(instance, response) {
      const updatedData = JSON.parse(response.data.data);
      console.log("received")

      // Assuming updatedData is an array of objects (each object is a row)
      const headers_test = updatedData[0];
      const headers = Object.keys(headers_test); // Extract headers from the updated data

      // Map the updatedData to rows in the expected format
      const rows = updatedData.map(row => headers.map(header => row[header]));

      // Initialize the mergedData array
      const mergedData = [];

      // Merge headers, ensuring uniqueness
      const headers1 = instance.data[0];
      const headersSet = new Set([...headers1, ...headers]); // Use a Set to ensure headers are unique
      const mergedHeaders = Array.from(headersSet); // Convert Set back to array
      mergedData.push(mergedHeaders);

      // Create a map for quick lookup of header indices
      const headerIndexMap = {};
      mergedHeaders.forEach((header, index) => {
        headerIndexMap[header] = index;
      });

      // Merge each row
      for (let i = 1; i < instance.data.length; i++) {
        const row1 = instance.data[i];
        const row2 = rows[i - 1] || []; // Use an empty array if rows[i-1] is undefined

        // Create a new merged row with null values for all headers
        const mergedRow = new Array(mergedHeaders.length).fill(null);

        // Copy values from row1 into the merged row
        row1.forEach((value, index) => {
          const header = headers1[index];
          mergedRow[headerIndexMap[header]] = value;
        });

        // Override values from row2 into the merged row
        row2.forEach((value, index) => {
          const header = headers[index];
          mergedRow[headerIndexMap[header]] = value;
        });

        mergedData.push(mergedRow);
      }
      console.log("test3")

      // Update instance data with the new headers and rows
      instance.data = mergedData;
      instance.displayedRows = instance.data.slice(1, this.rowsPerPage + 1);
      return headers
    },

    handleBuildingPhase(instance) {
      instance.isinbuildingModelPhase = !instance.isinbuildingModelPhase;
      instance.MLmodels = [[
        new LinearRegression(),
        new LogisticRegression()
      ]]
      instance.Statsmodels = [[
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
      return false;
    },

    handleSubmitModel(selectedValues) {
      console.log('Submitted Model Values:', selectedValues);
    },

    async handleNewColumnCreation(newColumnCreationMetaData, instanceIndex) {
      const instance = this.dataInstances[instanceIndex];

      const dataToSend = {
        data: instance.data.map(row => ({ columns: row }))
      };
      console.log(dataToSend)

      // Combine data and columnCreationInput into the request body
      const requestBody = {
        data: dataToSend,
        columnCreationInput: newColumnCreationMetaData
      };


      try {
        // Send the request to the backend
        const response = await axios.post('/columnCreation', requestBody, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Handle the response as needed, for example, update the instance with the new data
        this.updateDataFromBackend(instance, response);
        this.updateDataTypesForNewColumns(instance, [newColumnCreationMetaData.columnName]); // Ensure you pass the correct instance index

      } catch (error) {
        console.error('Error:', error);
        // Handle error appropriately
      }
    }


    // workflow logic

    

  }
};
</script>



<style src="@/assets/styles.css" scoped></style>