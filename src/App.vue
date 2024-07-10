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


      <Dialog :visible="dataloadView && dataInstances.length > 0" header="Columns Overview" class="data-load-dialog" :style="{ width: '50vw', height:'50vh'}" :position="position" :draggable="false">
    <div class="dialog-content scrollable-content">
      <div v-for="(value, column) in dataInstances[0].dataTypes" :key="column" class="field column-field">
        <Button icon="pi pi-trash" class="delete-button" @click="{columnsTodelete.push(column); delete dataInstances[0].dataTypes[column]}" />
        <label :for="column" class="column-label">{{ column }}</label>

      </div>
    </div>
    <div class="dialog-footer">
      <Button label="Submit" icon="pi pi-check"  @click = "deleteColumns(columnsTodelete, dataInstances[0])" />
    </div>
  </Dialog>

      <!-- Display instances of CSV data -->
      <div v-if="dataInstances.length > 0  && !dataloadView" class = "mt-3">
        <div v-for="(instance, instanceIndex) in dataInstances" :key="instanceIndex" class="instance-container">
          <div class="header">
            <div class="header-content">
              <Button label="Create New Instance" icon="pi pi-plus"  @click="prepareNewInstance(instance)" :loadingNewInstance="creatingInstance"   style="background-color: #28a745; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"   loadingIcon="pi pi-spinner" />

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
                @close="creatingNewColumn = false" @submit="(data) => wf_createNewColumn(data, instance)" />
          
          <missingValueHandler v-if ="handlingMissingValues" @close = "handlingMissingValues = false" :availableColumns = "columnsWithMissingValues(instance)" :columntypes="instance.dataTypes" />   

          <div v-show="instance && !instance.isCollapsed">
            <div class="table-container" @scroll="e => e.target.focus({ focusVisible: true })" @scrollend="(e) => {
              if (instance.numdisplayedRows.length < instance.totalRows)
              loadMoreRows(instance);
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
                  <tr v-for="(row, rowIndex) in instance.data.slice(1,instance.numdisplayedRows)" :key="rowIndex">
                    <td v-for="(value, colIndex) in row" :key="colIndex">{{ value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="!instance.isinbuildingModelPhase" class="button-center-container">


              <Dialog v-if="showonehotmodal" visible editable @hide="showonehotmodal = false" :modal="true"  header="One hot encoding">
                <p>Select a categorical column to one hot encode</p>
                <div class="custom-dropdown-container">
                  <Dropdown v-model="columnValue" :options="getColumnNamesByType(instance, ['categorical'])"  class="w-full"  />

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



          

            <DataProcessingWorkflow :workflows="instance.workflow" @workflow-action="handleWorkflowAction" @execute-workflows="(workflows) => handleExecuteWorkflows(workflows, instance)"  
            @update:workflows="(workflows) => updateWorkflow(workflows, instance)"  />
            

            
          </div>
        </div>
      </div>

    </div>


  </div>

  <Dialog v-model:visible= "showErrorModal" @close="showErrorModal = false">
          <h2>Error</h2>

          <p> {{ errorMessage }}</p>

          <button class="btn btn-danger" @click="showErrorModal = false">Close</button>
      </Dialog>



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
      uploadError: '',
      csvData: [],
      columnsTodelete:[],
      dataInstances: [],
      loadingNewInstance: false,
      creatingInstance: false,
      instanceParent: [],
      currentDataTypes: {}, // New property to store data types for the new instance
      showErrorModal:false,
      parsing: false,
      errorMessage: '', // New property for error message
      dataloadView: false,
      
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

    

    
  },
  methods: {

    handleFileChange(event) {
      console.log("sss")

      const selectedFile = event.target.files[0];
      this.handleFile(selectedFile);
      console.log(this.dataInstances)

    },
    handleFileDrop(event) {
      console.log("sss")
      event.preventDefault();
      const droppedFile = event.dataTransfer.files[0];
      this.handleFile(droppedFile);
      console.log(this.dataInstances)
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
      this.dataloadView = true

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

      this.csvData = [headers, ...data];
      this.dataInstances = [];
      this.instanceParent = [];
      this.createNewInstance({ data: this.csvData, name: "original", dataTypes });
      setTimeout(() => {

        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
      }, 1);
    },
    determineDataTypeForColumn(data, columnIndex) {
      let numeric = true;
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
            numeric = false;
          }


        } else {
          uniqueValues.add(value);
          if (isNaN(value) || value === null || value === undefined) {
            numeric = false;
          }


        }
      });

      const isBinary = uniqueValues.size === 2 
      

      const isCategorical = uniqueValues.size/ data.length <0.03

      if (isBinary && numeric) {
        return 'numeric binary';
      }
      else if (isBinary  ){
          return 'categorical binary'
      }
      else if (numeric) {
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
      console.log(dataTypes)
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



    deleteColumns(columns, instance) {
  // Find the indices of the headers to delete
  const columnIndices = columns.map(column => 
    Object.keys(instance.data[0]).find(key => instance.data[0][key] === column)
  ).sort((a, b) => b - a); // Sort in descending order for safe deletion

  // Loop through all rows and delete the found indices
  for (let i = 0; i < instance.data.length; i++) {
    columnIndices.forEach(index => {
      if (index >= 0 && index < instance.data[i].length) {
        instance.data[i].splice(index, 1);
      }
    });
  }

  // Delete from dataTypes
  columns.forEach(column => {
    delete instance.dataTypes[column];
  });

  console.log(instance.data);
  this.dataloadView = false;
},


updateDataTypesForNewColumns(instance, newColumns =[]) {
      const newHeaders = instance.data[0];
      newHeaders;
      // Determine data types for new columns only
      newHeaders.forEach(header => {
        if (!Object.prototype.hasOwnProperty.call(instance.dataTypes, header) || newColumns.includes(header)) {
          const colIndex = newHeaders.indexOf(header);
          instance.dataTypes[header] = this.determineDataTypeForColumn(instance.data.slice(1), colIndex);
          this.convertColumnData(instance.data.slice(1), colIndex, instance.dataTypes[header]);

        }
      });
},

    loadMoreRows(instance) {
      instance.numdisplayedRows = instance.numdisplayedRows + 20

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
          numdisplayedRows: 20,
          totalRows: data.length - 1,
          loadingNewInstance: false,
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
        this.dataInstances.splice(instanceIndex, 1);
      }
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
      if (value === null || value === undefined || value === '' ) {
          return true; // Skip NaNs, nulls, undefined, and empty strings
          }
        if (typeof value === 'string') {
          const trimmedValue = value.trim();

          if (isNaN(trimmedValue) || trimmedValue === '') {
            return false;
          }


        }

      // Otherwise, return false
      return true;
    },
    showErrorModalWithTimeout(message) {
      this.errorMessage = message;
      this.showErrorModal = true;
      console.log(this.showErrorModal)
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
        console.log("Aaaaa")
        this.showErrorModalWithTimeout(`Column ${columnName} cannot be converted to ${type}.`);
        return ;
      }

      instance.dataTypes[columnName] = type;
      this.convertColumnData(instance.data.slice(1), colIndex, type);


    },




    async handleNewColumnCreation(newColumnCreationMetaData, instance) {
      console.log(1111111)

      const dataToSend = {
        data: instance.data.map(row => ({ columns: row }))
      };
      console.log(dataToSend)

      // Combine data and columnCreationInput into the request body
      const requestBody = {
        data: dataToSend,
        columnCreationInput: newColumnCreationMetaData
      };
      console.log(33333333)


      try {
        // Send the request to the backend
        const response = await axios.post('/columnCreation', requestBody, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log(444444444)


        // Handle the response as needed, for example, update the instance with the new data
        this.updateDataFromBackend(instance, response);
        //this.updateDataTypesForNewColumns(instance, [newColumnCreationMetaData.columnName]); // Ensure you pass the correct instance index
        console.log(555555555)

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
      console.log(instance.workflow)
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
    wf_createNewColumn(newColumnCreationMetaData, instance) {
        this.creatingNewColumn = false;
        console.log("Sss")
        this.handleWorkflowSubmission(instance, 'create-new-column', `new Column: ${newColumnCreationMetaData.columnName}` , newColumnCreationMetaData );
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
        this.updateDataFromBackend(instance, response);
        instance.workflow = workflows

      } catch (error) {
        console.error('Error:', error);
        // Handle error appropriately
      }

    },

    updateDataFromBackend(instance, response){

    
    const updatedData = JSON.parse(response.data.data);

      // Example assuming updatedData is an array of objects (each object is a row)
      let headers_test = updatedData[0]
      let headers = Object.keys(headers_test); // Check if this gives the correct headers


      // Map the updatedData to rows in the expected format
      const rows = updatedData.map(row => headers.map(header => row[header]));
        rows;
      // Update instance data with the new headers and rows
      instance.data = [headers, ...rows];
    },
  

  }

};
</script>


 
<style src="@/assets/styles.css" scoped></style>