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
      <div v-if="dataInstances.length > 0" class = "mt-3">
        <div v-for="(instance, instanceIndex) in dataInstances" :key="instanceIndex" class="instance-container">
          <div class="header">
            <div class="header-content">
              <Button label="Create New Instance" icon="pi pi-plus"  @click="prepareNewInstance(instance)" :loading="creatingInstance"   style="background-color: #28a745; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"   loadingIcon="pi pi-spinner" />

              <h3 class="text-center name-small">Name: {{ instance.name }}</h3>
              <Button label="Delete Instance" icon="pi pi-times" @click="confirmDelete(instanceIndex)" style="background-color: #6f42c1; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);" :class="customButtonClass"/>
            </div>
            <span v-if="instance" :class="{ collapsed: instance.isCollapsed }"
              @click="toggleCollapse(instance)">&#9660;</span>
              
          </div>
          <div class = "data-manipulation-button-container ">
            <Button label="Create A new Column" icon="pi pi-plus" @click="creatingNewColumn = true" style="background-color: #6c757d; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"/>
            <Button label="Handle Missing Values (not Implemented)" icon="pi pi-exclamation-circle"  @click="handlingMissingValues = true" style="background-color: #6c757d; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"/>

          </div>
          <ColumnCreator v-if="creatingNewColumn" :instanceIndex="instanceIndex"
                :availableColumns="instance.data[0]" :column-types="instance.dataTypes"
                @close="creatingNewColumn = false" @submit="(data) => wf_createNewColumn(data, instanceIndex)" />
          
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


              <Dialog v-if="showonehotmodal" visible editable @hide="showonehotmodal = false" :modal="true" :closable="true" header="One hot encoding">
                <p>Select a categorical column to one hot encode</p>
                <div class="custom-dropdown-container">
                  <Dropdown v-model="columnValue" :options="getColumnNamesByType(instance, ['categorical'])" :option-label="getColumnNamesByType(instance, ['categorical'])" type = "text" class="w-full"  />

                </div>
                <div class="modal-footer">
                  <Button label="Submit" icon="pi pi-check" @click="wf_oneHotEncode(columnValue, instance)" />
                  <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="showonehotmodal = false" />
                </div>
              </Dialog>

              <Dialog  v-if="shownormalizemodal" visible hide="shownormalizemodal = false" :modal="true" :closable="false"  header="One hot encoding">
                <p>Select a numerical column to normalize</p>
                <div class="custom-dropdown-container">
                  <Dropdown v-model="selectedValue" :options="getColumnNamesByType(instance, ['numeric'])" placeholder="Select a column" class="w-full"  />
                    </div>
                    <div class="input-group">
                      <div class="input-item">
                        <p>Min value</p>
                        <input type="number" step="1" value="0" v-model.number="newMin"  @input="validateMinMax" />
                      </div>

                      <div class="input-item">
                        <p>Max value</p>
                        <input  type="number"  value="1" step="1"  v-model.number="newMax" @input="validateMinMax" />
                      </div>
                    </div>

                    <div v-if="minMaxvalidationError" class="error-message">
                      {{ minMaxvalidationError }}
                    </div>

                    <div class="modal-footer">
                      <Button label="Submit" icon="pi pi-check" @click="wf_scaleColumn(selectedValue ? selectedValue : getColumnNamesByType(instance, ['numeric'])[0], instance, 'normalize', newMin, newMax)" />
                      <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="shownormalizemodal = false" />
                    </div>
                </Dialog>
            </div>

            <div>
              <button class="goto-build-phase" @click=" handleBuildingPhase(instance)">
                <span v-if="!dataInstances[instanceIndex].isinbuildingModelPhase"> Go To building phase</span>
                <span v-if="dataInstances[instanceIndex].isinbuildingModelPhase"> Go back to data processing and
                  engineering</span>
              </button>

            </div>

            


            <DataProcessingWorkflow :workflows="instance.workflow" @workflow-action="handleWorkflowAction" @execute-workflows="(workflows) => handleExecuteWorkflows(workflows, instance)"  
            @update:workflows="(workflows) => updateWorkflow(workflows, instance)"  />
            

            
          </div>
        </div>
      </div>

    </div>


  </div>





  <myModal v-if="creatingInstance" @close="creatingInstance = false"
    @submit="name => createNewInstance({ data: instanceParent, name, dataTypes: currentDataTypes })"
    :existingNames="dataInstances.map(instance => instance.name)" />
</template>

<script>
import myModal from './components/myModal.vue';
//import ModelInfo from './components/ModelInfo.vue';
import { LinearRegression, LogisticRegression } from './classes/Model';
import {
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/vue'; 

import axios from '@/axios.js'; // Path to the axios.js file
import ColumnCreator from './components/ColumnCreator.vue';
import missingValueHandler from './components/missingValueHandler.vue';
import {getColumnNamesByType} from './utils/commonFunctions.js';
import Button from 'primevue/button';
import DataProcessingWorkflow from './components/DataProcessingWorkflow.vue';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';


export default {
  name: 'FileUpload',
  data() {
    return {
      showonehotmodal: false,
      minMaxvalidationError : null,
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
    myModal,
    Dialog,
    CDropdown,
    DataProcessingWorkflow,
    CDropdownToggle,
    CDropdownMenu,
    CDropdownItem,
    Dropdown,
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
          workflow:[],
          histWf_isCollapsed :true,
          historicalWorkflow:[],
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
    toggleCollapse(instance) {
      if (instance) {
        instance.isCollapsed = !instance.isCollapsed;
      }
    },
    togglehist_wf_Collapse(instance) {
      if (instance) {
      instance.histWf_isCollapsed = !instance.histWf_isCollapsed;
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
        this.validateMinMax('newMin and newMax must be valid numbers');
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
    },


    handleWorkflowAction(action) {
      if (action === 'onehot-encoding') {
        this.showonehotmodal = true;
      } else if (action === 'normalize-column') {
        this.shownormalizemodal = true;
      } else if (action === 'create-new-column') {
        this.creatingNewColumn = true;
      }
    },

    updateWorkflow(workflow, instance){
      console.log("aaaa")
      console.log(workflow)
      instance.workflow = workflow

      
    },
    handleWorkflowSubmission(instance, action, description, APIdata) {
      console.log("sshdjs")
      const actionDescriptions = {
        'onehot-encoding': 'One Hot Encoding',
        'normalize-column': 'Normalize Column',
        'create-new-column': 'Create New Column',
        'standardize-column': 'standardize Column'
      };
      const newWorkflow = { title: actionDescriptions[action], description: description, APIdata: APIdata };
      instance.workflow.push(newWorkflow);
    },


    wf_oneHotEncode(columnName, instance) {
      if (!columnName) {
        alert('Please select a column to one hot encode.');
        return;
      }

      this.showonehotmodal = false;
        this.handleWorkflowSubmission(instance, 'onehot-encoding', `one hot encode Column: ${columnName}`, {"columnName": columnName}  );

      },
    wf_scaleColumn(columnName, instance, method, newMin =0, newMax=1) {

      newMin = Number(newMin);
      newMax = Number(newMax);

      // Validate newMin and newMax
      if (isNaN(newMin) || isNaN(newMax)) {
        this.minMaxvalidationError = 'newMin and newMax must be valid numbers';
        return;
      }

      if (newMax <= newMin) {
        this.minMaxvalidationError = 'max must be greater than min and valid numbers';
        return;
      }
      this.minMaxvalidationError = null

      if (method ==="normalize"){

      
        this.shownormalizemodal = false;
        this.handleWorkflowSubmission(instance,'normalize-column', `normalize Column: ${columnName} values from ${newMin} to ${newMax}`,
                                {"columnName": columnName, "newMin":newMin, "newMax":newMax});
      
    }
    else if (method ==="standardize"){
        this.shownormalizemodal = false;
        this.handleWorkflowSubmission(instance, 'standardize-column', `standardize Column: ${columnName}`);

      }
    },
    wf_createNewColumn(newColumnCreationMetaData, instanceIndex) {
      this.handleNewColumnCreation(newColumnCreationMetaData, instanceIndex).then(() => {
        this.creatingNewColumn = false;
        this.handleWorkflowSubmission('create-new-column');
      });
    },



    async handleExecuteWorkflows(workflows,instance) {
      console.log("fdhsjksaffhfjdjjs")
      console.log('Workflows to execute:', workflows);
      console.log(instance.data)
      // Here you can add the logic to send the workflows to your API

      const dataToSend = {
        data: instance.data.map(row => ({ columns: row }))
      };
      console.log(dataToSend)

      // Combine data and columnCreationInput into the request body
      const requestBody = {
        data: dataToSend,
        workflow: workflows
      };

      requestBody;


      try {
        // Send the request to the backend
        const response = await axios.post('/executeWorkflow', requestBody, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Handle the response as needed, for example, update the instance with the new data
        this.updateDataFromBackend_new(instance, response);
        instance.workflow = workflows
        //this.updateDataTypesForNewColumns(instance, [newColumnCreationMetaData.columnName]); // Ensure you pass the correct instance index

      } catch (error) {
        console.error('Error:', error);
        // Handle error appropriately
      }

    },

    updateDataFromBackend_new(instance, response){

    
    const updatedData = JSON.parse(response.data.data);

      // Example assuming updatedData is an array of objects (each object is a row)
      let headers_test = updatedData[0]
      let headers = Object.keys(headers_test); // Check if this gives the correct headers


      // Map the updatedData to rows in the expected format
      const rows = updatedData.map(row => headers.map(header => row[header]));
        rows;
      // Update instance data with the new headers and rows
      instance.data = [headers, ...rows];
      instance.displayedRows = instance.data.slice(1, this.rowsPerPage + 1);
    },
  

  }

};
</script>



<style src="@/assets/styles.css" scoped></style>