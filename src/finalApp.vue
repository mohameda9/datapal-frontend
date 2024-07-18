<template>
    <div class="main-layout">
    <CCol class="project-manager-bar" md="{ span: 2 }">
      <ProjectManagerBar @goDataProcessing="activePage = 'dataProcessing'" @goDataUpload="activePage = 'dataUpload'" 
      @goDataAnalysis="activePage = 'dataAnalysis'"/>
    </CCol>

    <CCol class="main-container" md="{ span: 2 }">
      <div :style="{ alignItems: 'center' }">
        <div v-show="activePage === 'dataUpload'">
          <DataUpload_new />
        </div>
        <div v-show="activePage === 'dataAnalysis'">
          <DataAnalysis />
        </div>

        <div v-if="dataInstances.length > 0 && activePage === 'dataProcessing'" class="mt-3">
          <div v-for="(instance, instanceIndex) in dataInstances" :key="instanceIndex" class="instance-container">
            <div class="header">
              <div class="header-content">
                <Button
                  label="Create New Instance"
                  icon="pi pi-plus"
                  @click="prepareNewInstance(instanceIndex)"
                  :loadingNewInstance="creatingInstance"
                  style="font-size: 0.7rem; padding: 0.5rem 0.5rem; background-color: #28a745; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"
                  loadingIcon="pi pi-spinner"
                />
                <h3 class="text-center name-small">Name: {{ instance.name }}</h3>
                <Button
                  label="Delete Instance"
                  icon="pi pi-times"
                  @click="confirmDelete(instanceIndex)"
                  style="font-size: 0.7rem; padding: 0.5rem 0.5rem; background-color: #6f42c1; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"
                  :class="customButtonClass"
                />
              </div>
              <span v-if="instance" :class="{ collapsed: instance.isCollapsed }" @click="toggleCollapse(instance)">&#9660;</span>
            </div>
            <div class="data-manipulation-button-container">
              <Button
                label="Create A new Column"
                icon="pi pi-plus"
                @click="creatingNewColumn = true"
                style="font-size: 0.7rem; padding: 0.5rem 0.5rem; background-color: #6c757d; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"
              />
              <Button
                label="Handle Missing Values (not Implemented)"
                icon="pi pi-exclamation-circle"
                @click="handlingMissingValues = true"
                style="font-size: 0.7rem; padding: 0.5rem 0.5rem; background-color: #6c757d; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"
              />
            </div>
            <ColumnCreator
              v-if="creatingNewColumn"
              :instanceIndex="instanceIndex"
              :availableColumns="instance.data[0]"
              :column-types="instance.dataTypes"
              @close="creatingNewColumn = false"
              @submit="(data) => wf_createNewColumn(data, instanceIndex)"
            />
            <missingValueHandler
              v-if="handlingMissingValues"
              @close="handlingMissingValues = false"
              :availableColumns="columnsWithMissingValues(instance)"
              :columntypes="instance.dataTypes"
            />
            <div v-show="instance && !instance.isCollapsed">
              <div
                class="table-container"
                @scroll="e => e.target.focus({ focusVisible: true })"
                @scrollend="(e) => {
                  if (instance.numdisplayedRows < instance.totalRows) loadMoreRows(instanceIndex);
                }"
              >
                <UserDataset :data="getDataInstances[instanceIndex].data" />
              </div>
              <div class="button-center-container">
                <Dialog v-if="showonehotmodal" visible editable @hide="showonehotmodal = false" :modal="true" header="One hot encoding">
                  <p>Select a categorical column to one hot encode</p>
                  <div class="custom-dropdown-container">
                    <Dropdown v-model="columnValue" :options="getColumnNamesByType(instance, ['categorical'])" class="w-full" />
                  </div>
                  <div class="modal-footer">
                    <Button label="Submit" icon="pi pi-check" @click="wf_oneHotEncode(columnValue, instanceIndex)" />
                    <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="showonehotmodal = false" />
                  </div>
                </Dialog>
                <Dialog v-if="shownormalizemodal" visible hide="shownormalizemodal = false" :modal="true" :closable="false" header="Normalize Column">
                  <p>Select a numerical column to normalize</p>
                  <div class="custom-dropdown-container">
                    <Dropdown v-model="selectedValue" :options="getColumnNamesByType(instance, ['numeric'])" placeholder="Select a column" class="w-full" />
                  </div>
                  <div class="input-group">
                    <div class="input-item">
                      <p>Min value</p>
                      <input type="number" step="1" value="0" v-model.number="newMin" @input="validateMinMax" />
                    </div>
                    <div class="input-item">
                      <p>Max value</p>
                      <input type="number" value="1" step="1" v-model.number="newMax" @input="validateMinMax" />
                    </div>
                  </div>
                  <div v-if="minMaxvalidationError" class="error-message">
                    {{ minMaxvalidationError }}
                  </div>
                  <div class="modal-footer">
                    <Button
                      label="Submit"
                      icon="pi pi-check"
                      @click="wf_scaleColumn(selectedValue ? selectedValue : getColumnNamesByType(instance, ['numeric'])[0], instanceIndex, 'normalize', newMin, newMax)"
                    />
                    <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="shownormalizemodal = false" />
                  </div>
                </Dialog>
              </div>

              <DataProcessingWorkflow
                :index="instanceIndex"
                :workflows="dataInstances[instanceIndex].workflow"
                @workflow-action="handleWorkflowAction"
                @execute-workflows="handleExecuteWorkflows"
                @update:workflows="updateWorkflow"
              />
            </div>
          </div>
        </div>
      </div>
    </CCol>
  </div>

  <Dialog v-model:visible="showErrorModal" @close="showErrorModal = false">
    <h2>Error</h2>
    <p>{{ errorMessage }}</p>
    <button class="btn btn-danger" @click="showErrorModal = false">Close</button>
  </Dialog>

  <myModal
    v-if="creatingInstance"
    @close="creatingInstance = false"
    @submit="name => createNewInstance({ name: name })"
    :existingNames="dataInstances.map(instance => instance.name)"
  />

</template>

  <script>
  import myModal from './components/myModal.vue';

  import {
    CDropdown,
    CDropdownToggle,
    CDropdownMenu,
    
    CDropdownItem,
    CCol,
  } from '@coreui/vue'; 
  

  import { mapActions, mapGetters } from 'vuex';

  import axios from '@/axios.js'; // Path to the axios.js file
  import ColumnCreator from './components/ColumnCreator.vue';
  import missingValueHandler from './components/missingValueHandler.vue';
  import {getColumnNamesByType} from './utils/commonFunctions.js';
  import Button from 'primevue/button';
  import DataProcessingWorkflow from './components/DataProcessingWorkflow.vue';
  import Dropdown from 'primevue/dropdown';
  import Dialog from 'primevue/dialog';
  import ProjectManagerBar from './components/ProjectManagerBar.vue';
  import DataUpload_new from './views/DataUpload_new.vue';
  import UserDataset from './components/UserDataset.vue';
  import DataAnalysis from './views/DataAnalysis.vue';


  export default {
  name: 'DataManipulation',
  data() {
    return {
      activePage:"dataUpload",
      showonehotmodal: false,
      minMaxvalidationError: null,
      creatingNewColumn: false,
      shownormalizemodal: false,
      handlingMissingValues: false,
      loadingNewInstance: false, 
      creatingInstance: false,
      instanceParent: [],
      currentDataTypes: {},
      showErrorModal: false,
      errorMessage: '',
      dataloadView: false,
      columnValue: null,
      selectedValue: null,
      newMin: 0,
      newMax: 1,
      modalForIndex: 0 // tells us the modal is open for which data instance index
    };
  },
  created() {
    this.getColumnNamesByType = getColumnNamesByType;
  },
  components: {
    ColumnCreator,
    UserDataset,
    missingValueHandler,
    myModal,
    Dialog,
    CDropdown,
    DataUpload_new,
    ProjectManagerBar,
    DataProcessingWorkflow,
    CDropdownToggle,
    CDropdownMenu,
    CDropdownItem,
    DataAnalysis,
    Dropdown,
    Button
  },
  computed: {
    ...mapGetters(['getDataInstances']),
    dataInstances() {
      return this.getDataInstances;
    }
  },
  methods: {
    ...mapActions(['setDataInstances', 'addDataInstance', 'deleteDataInstance', 'editDataInstance']),

    determineDataTypeForColumn(data, columnIndex) {
      let numeric = true;
      const uniqueValues = new Set();

      data.forEach(row => {
        const value = row[columnIndex];
        if (value === null || value === undefined || value === '') {
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

      const isBinary = uniqueValues.size === 2;
      const isCategorical = uniqueValues.size / data.length < 0.03;

      if (isBinary && numeric) {
        return 'numeric binary';
      } else if (isBinary) {
        return 'categorical binary';
      } else if (numeric) {
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
    updateDataTypesForNewColumns(instance, newColumns = []) {
      const newHeaders = instance.data[0];
      newHeaders.forEach(header => {
        if (!Object.prototype.hasOwnProperty.call(instance.dataTypes, header) || newColumns.includes(header)) {
          const colIndex = newHeaders.indexOf(header);
          instance.dataTypes[header] = this.determineDataTypeForColumn(instance.data.slice(1), colIndex);
          this.convertColumnData(instance.data.slice(1), colIndex, instance.dataTypes[header]);
        }
      });
    },
    loadMoreRows(instanceIndex) {
      const updatedInstances = [...this.dataInstances];
      updatedInstances[instanceIndex].numdisplayedRows += 5;
      this.setDataInstances(updatedInstances);
    },
    columnsWithMissingValues(instance) {
      const columnsWithMissing = [];
      const headers = instance.data[0];
      headers.forEach((header, index) => {
        const hasMissing = instance.data.slice(1).some(row => row[index] === '' || row[index] === null || row[index] === undefined);
        if (hasMissing) {
          columnsWithMissing.push(header);
        }
      });
      return columnsWithMissing;
    },
    prepareNewInstance(instanceIndex) {
      this.ParentInstanceIndex = instanceIndex;
      this.creatingInstance = true;
    },
    createNewInstance({name }) {
      let cloneInstance = this.dataInstances[this.ParentInstanceIndex]
      console.log(cloneInstance)

        this.addDataInstance({
          data: JSON.parse(JSON.stringify(cloneInstance.data)),
          numdisplayedRows: 20,
          totalRows: cloneInstance.data.length - 1,
          loadingNewInstance: false,
          name: name,
          dataTypes: JSON.parse(JSON.stringify(cloneInstance.dataTypes)),
          workflow: [],
          isCollapsed: false,
        });
        console.log("sss"),

        this.creatingInstance = false;
    },
    confirmDelete(instanceIndex) {
      if (window.confirm('Are you sure you want to delete this instance?')) {
        this.deleteDataInstance(instanceIndex);
      }
    },
    toggleCollapse(instance) {
      const updatedInstances = [...this.dataInstances];
      const index = updatedInstances.indexOf(instance);
      if (index !== -1) {
        updatedInstances[index].isCollapsed = !updatedInstances[index].isCollapsed;
        this.setDataInstances(updatedInstances);
      }
    },

    isNumeric(value) {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (isNaN(trimmedValue) || trimmedValue === '') {
          return false;
        }
      }
      return true;
    },
    showErrorModalWithTimeout(message) {
      this.errorMessage = message;
      this.showErrorModal = true;
      setTimeout(() => {
        this.showErrorModal = false;
      }, 1000);
    },
    changeMetricType(columnName, type, instanceIndex) {
      const updatedInstances = [...this.dataInstances];
      const instance = updatedInstances[instanceIndex];
      const colIndex = instance.data[0].indexOf(columnName);
      let isConvertible = true;

      if (type === 'numeric') {
        isConvertible = instance.data.slice(1).every(row => this.isNumeric(row[colIndex]));
      } else if (type === 'numeric binary') {
        let isNumeric = instance.data.slice(1).every(row => this.isNumeric(row[colIndex]));
        const uniqueValues = new Set(instance.data.slice(1).map(row => row[colIndex]));
        isConvertible = uniqueValues.size === 2 && isNumeric;
      } else if (type === 'categorical binary') {
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
      this.setDataInstances(updatedInstances);
    },
    async handleNewColumnCreation(newColumnCreationMetaData, instanceIndex) {
      const updatedInstances = [...this.dataInstances];
      const instance = updatedInstances[instanceIndex];
      const dataToSend = {
        data: instance.data.map(row => ({ columns: row }))
      };
      const requestBody = {
        data: dataToSend,
        columnCreationInput: newColumnCreationMetaData
      };
      try {
        const response = await axios.post('/columnCreation', requestBody, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        updatedInstances[instanceIndex] = this.updateDataFromBackend(instance, response);
        this.setDataInstances(updatedInstances);
      } catch (error) {
        console.error('Error:', error);
      }
    },




    handleWorkflowAction(action, index) {
      console.log("ggg")
      if (action === 'onehot-encoding') {
        this.showonehotmodal = true;
      } else if (action === 'normalize-column') {
        this.shownormalizemodal = true;
      } else if (action === 'create-new-column') {
        this.creatingNewColumn = true;
      }
      this.modalForIndex = index
    },
    updateWorkflow(workflow, instanceIndex) {
      console.log(instanceIndex)
      const updatedInstances = [...this.dataInstances];
      console.log(workflow)
      updatedInstances[instanceIndex].workflow = workflow;
      this.setDataInstances(updatedInstances);
    },
    handleWorkflowSubmission(instanceIndex, action, description, APIdata) {
      console.log(instanceIndex)
      const updatedInstances = [...this.dataInstances];
      const actionDescriptions = {
        'onehot-encoding': 'One Hot Encoding',
        'normalize-column': 'Normalize Column',
        'create-new-column': 'Create New Column',
        'standardize-column': 'Standardize Column'
      };
      const newWorkflow = { title: actionDescriptions[action], description: description, APIdata: APIdata };
      updatedInstances[instanceIndex].workflow.push(newWorkflow);
      this.setDataInstances(updatedInstances);
    },
    wf_oneHotEncode(columnName) {
      console.log(this.modalForIndex)
      if (!columnName) {
        alert('Please select a column to one hot encode.');
        return;
      }
      this.showonehotmodal = false;
      this.handleWorkflowSubmission(this.modalForIndex, 'onehot-encoding', `one hot encode Column: ${columnName}`, { columnName: columnName });
    },
    wf_scaleColumn(columnName, method, newMin = 0, newMax = 1) {
      newMin = Number(newMin);
      newMax = Number(newMax);

      if (isNaN(newMin) || isNaN(newMax)) {
        this.minMaxvalidationError = 'newMin and newMax must be valid numbers';
        return;
      }

      if (newMax <= newMin) {
        this.minMaxvalidationError = 'max must be greater than min and valid numbers';
        return;
      }
      this.minMaxvalidationError = null;

      if (method === "normalize") {
        this.shownormalizemodal = false;
        this.handleWorkflowSubmission(this.modalForIndex, 'normalize-column', `normalize Column: ${columnName} values from ${newMin} to ${newMax}`, { columnName: columnName, newMin: newMin, newMax: newMax });
      } else if (method === "standardize") {
        this.shownormalizemodal = false;
        this.handleWorkflowSubmission(this.modalForIndex, 'standardize-column', `standardize Column: ${columnName}`);
      }
    },
    wf_createNewColumn(newColumnCreationMetaData) {
      this.creatingNewColumn = false;
      this.handleWorkflowSubmission(this.modalForIndex, 'create-new-column', `new Column: ${newColumnCreationMetaData.columnName}`, newColumnCreationMetaData);
    },
    async handleExecuteWorkflows(workflows, instanceIndex) {
      console.log("sssss")
      console.log(instanceIndex)
      const updatedInstances = [...this.dataInstances];
      const instance = updatedInstances[instanceIndex];
      console.log(instance)
      const dataToSend = {
        data: instance.data.map(row => ({ columns: row }))
      };
      const requestBody = {
        data: dataToSend,
        workflow: workflows
      };
      try {
        const response = await axios.post('/executeWorkflow', requestBody, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        updatedInstances[instanceIndex] = this.updateDataFromBackend(instance, response);
        console.log(updatedInstances[instanceIndex])

        instance.workflow = workflows;

        updatedInstances[instanceIndex].workflow.forEach(workflow => {
          if (!workflow.executed) {
            // Execute workflow logic here
            workflow.executed = true;
          }
        });

        this.setDataInstances(updatedInstances);
      } catch (error) {
        console.error('Error:', error);
      }
    },
    updateDataFromBackend(instance, response) {
      const updatedData = JSON.parse(response.data.data);
      console.log(updatedData)
      const headers_test = updatedData[0];
      const headers = Object.keys(headers_test);
      const rows = updatedData.map(row => headers.map(header => row[header]));
      instance.data = [headers, ...rows];
      return instance
    },

  }
};
</script>

<style src="@/assets/styles.css" scoped></style>
