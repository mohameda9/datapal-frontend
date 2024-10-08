<template>
  <div class="main-layout">
    <CCol class="project-manager-bar" md="{ span: 2 }">
      <ProjectManagerBar
        @goDataProcessing="navigateTo('dataProcessing')"
        @goDataUpload="navigateTo('dataUpload')"
        @goDataAnalysis="navigateTo('dataAnalysis')"
        @goModelCreation="navigateTo('modelCreation')"

      />
    </CCol>

    <CCol class="main-container" md="{ span: 2 }">
      <div :style="{ alignItems: 'center' }">
        <div v-show="activePage === 'dataUpload'">
          <DataUpload_new />
        </div>
        <div v-show="activePage === 'dataAnalysis'">
          <DataAnalysis />
        </div>

        <div v-show="activePage === 'modelCreation'">
          <ModelCreation />
        </div>

        <div v-if="localDataInstances.length > 0 && activePage === 'dataProcessing'" class="mt-3">
          <div v-for="(instance, instanceIndex) in localDataInstances"  :key="instanceIndex" >
          <div v-if = "instanceIndex >0" class="instance-container">
            <div  class="instance-header">
              <div class="header-content">
                <Button
                  label="Create New Instance"
                  icon="pi pi-plus"
                  @click="prepareNewInstance(instanceIndex)"
                  :loadingNewInstance="creatingInstance"
                  style="font-size: 0.7rem; padding: 0.5rem 0.5rem; background-color: #28a745; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"
                  loadingIcon="pi pi-spinner"
                />
                <h3 :style="{'color': '#007bff','cursor':'pointer'}" :class="{ collapsed: instance.isCollapsed }" @click="toggleCollapse(instance)">Name: {{ instance.name }} </h3>
                <Button
                  label="Delete Instance"
                  icon="pi pi-times"
                  @click="confirmDelete(instanceIndex)"
                  style="font-size: 0.7rem; padding: 0.5rem 0.5rem; background-color: #6f42c1; border: none; border-radius: 50px; color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);"
                  :class="customButtonClass"
                />
              </div>
            </div>
            <span v-if="instance" :class="{ collapsed: instance.isCollapsed }" @click="toggleCollapse(instance)">&#9660;</span>

            <div class="data-manipulation-button-container">


            </div>
            <ColumnCreator
              v-if="showColumnCreatorModal"
              :instanceIndex="instanceIndex"
              :availableColumns="instance.data[0]"
              :column-types="instance.dataTypes"
              @close="showColumnCreatorModal = false"
              @submit="(data) => wf_createNewColumn(data, instanceIndex)"
            />
            <missingValueHandler
              v-if="showhandlingMissingValues"
              @close="showhandlingMissingValues = false"
              :availableColumns="columnsWithMissingValues(currentInstance)"
              :columntypes="currentInstance.dataTypes"
              :categoricalColumns="getColumnNamesByType(currentInstance, ['categorical', 'categorical binary'])"
              :numericColumns="getColumnNamesByType(currentInstance, ['numeric', 'numeric binary'])"
              @submit="(data) => handleMissingValuesSubmission(data, currentInstanceIndex)"
              :metadata="metaDataForEditingModal"
            />

            <DescribeDataDialog
              :visible="showDescribeDataModal"
              @close="showDescribeDataModal = false"
              :metadata="metaDataForEditingModal"
              @submit="handleDescribeDataSubmit"
            />





            <ScaleColumn
              v-if="shownormalizemodal"
              :visible="shownormalizemodal"
              :metaData="metaDataForEditingModal"
              @close="shownormalizemodal = false"
              :availableColumns="getColumnNamesByType(currentInstance, ['numeric'])"
              @submit="(payload) => wf_scaleColumn(payload.description, payload.APIdata)"
            />
            <CategoricalLabelingModal
              v-if="showCategoricalLabelingModal"
              :visible="showCategoricalLabelingModal"
              :categoricalColumns="getColumnNamesByType(currentInstance, ['categorical'])"
              :getColumnUniqueValues="(column) => getColumnUniqueValues(currentInstanceIndex, column)"
              @close="showCategoricalLabelingModal = false"
              @submit="handleCategoricalLabeling"
              @update:visible="showCategoricalLabelingModal = $event"
              :metadata="metaDataForEditingModal"
            />
            <!-- Partition Data Modal -->
            <Dialog v-if="showPartitionModal" :visible="showPartitionModal" @hide="showPartitionModal = false" :modal="true" header="Partition Data" :style="{ width: '400px' }">
              <div class="partition-data-modal">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <p style="margin: 0; font-weight: bold;">Specify the Train data size:</p>
                  <input type="number" v-model="splitSize" :disabled="metaDataForEditingModal && !metaDataForEditingModal.executed" min="0.5" max="1" step="0.01" placeholder="Enter split size (e.g., 0.8)" style="margin-left: 10px; padding: 5px; border-radius: 5px; border: 1px solid #ced4da;" />
                </div>
                <p style="margin-top: 10px; font-style: italic; color: #6c757d;">Test size: {{ (1 - splitSize).toFixed(2) }}</p>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; margin-top: 20px;">
                  <Button label="Submit" icon="pi pi-check" @click="wf_partitionData(splitSize)" :disabled="metaDataForEditingModal && metaDataForEditingModal.executed" />
                  <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="showPartitionModal = false" style="margin-left: 10px;" />
                </div>
              </div>
            </Dialog>
            <DiscretizationModal
              v-if="showDiscretizationModal"
              :visible="showDiscretizationModal"
              :numericColumns="getColumnNamesByType(currentInstance, ['numeric'])"
              @close="showDiscretizationModal = false"
              @submit="handleDiscretizationSubmit"
              :metadata="metaDataForEditingModal"
            />



            <div v-show="instance && !instance.isCollapsed">
              <div
                class="table-container"
                @scroll="e => e.target.focus({ focusVisible: true })"
                @scrollend="(e) => {
                  if (instance.numdisplayedRows < instance.totalRows) loadMoreRows(instanceIndex);
                }"
              >
                <UserDataset :data="localDataInstances[instanceIndex].data" />
              </div>
              <div class="button-center-container">
                <Dialog v-if="showOneHotModal" :visible="showOneHotModal" @hide="showOneHotModal = false" :modal="true" header="One hot encoding">
                <p>Select a categorical column to one hot encode</p>
                <div class="custom-dropdown-container">
                  <Dropdown v-model="oneHotColumnValue" :options="getColumnNamesByType(currentInstance, ['categorical'])" class="w-full" :disabled="metaDataForEditingModal && metaDataForEditingModal.executed" />
                </div>
                <div class="modal-footer">
                  <Button label="Submit" icon="pi pi-check" @click="wf_oneHotEncode(oneHotColumnValue)" :disabled="metaDataForEditingModal && metaDataForEditingModal.executed" />
                  <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="showOneHotModal = false" />
                </div>
              </Dialog>
              </div>

              <DataProcessingWorkflow
                :index="instanceIndex"
                :workflows="localDataInstances[instanceIndex].workflow"
                @workflow-action="handleWorkflowAction"
                @execute-workflows="handleExecuteWorkflows"
                @update:workflows="updateWorkflow"
                @open-workflow-detail="openWorkflowDetail"
              />
            </div>
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
    :existingNames="localDataInstances.map(instance => instance.name)"
  />
</template>




<script>
import myModal from './components/myModal.vue';
import { mapActions, mapGetters } from 'vuex';
import axios from '@/axios.js'; // Path to the axios.js file
import ColumnCreator from './components/ColumnCreator.vue';
import missingValueHandler from './components/missingValueHandler.vue';
import CategoricalLabelingModal from './components/CategoricalLabelingModal.vue';
import { getColumnNamesByType } from './utils/commonFunctions.js';
import Button from 'primevue/button';
import DataProcessingWorkflow from './components/DataProcessingWorkflow.vue';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import ProjectManagerBar from './components/ProjectManagerBar.vue';
import DataUpload_new from './views/DataUpload_new.vue';
import UserDataset from './components/UserDataset.vue';
import DataAnalysis from './views/DataAnalysis.vue'; 
import ScaleColumn from './components/ScaleColumn.vue';
import ModelCreation from './views/ModelCreation.vue';
import DescribeDataDialog from './components/DescribeDataDialog.vue';
import DiscretizationModal from './components/DiscretizationModal.vue';


export default {
  name: 'ProjectPage',
  props: {
    activePage: {
      type: String,
      default: 'dataUpload'
    }
  },
  data() {
    return {
      activePage: 'dataUpload',
      showCategoricalLabelingModal: false,
      showColumnCreatorModal: false,
      showOneHotModal: false,
      minMaxvalidationError: null,
      showColumnCreatorModal: false,
      shownormalizemodal: false,
      showhandlingMissingValues: false,
      loadingNewInstance: false,
      creatingInstance: false,
      categoricalLabeling: false,
      instanceParent: [],
      currentDataTypes: {},
      showErrorModal: false,
      errorMessage: '',
      dataloadView: false,
      columnValue: null,
      selectedValue: null,
      newMin: 0,
      newMax: 1,
      modalForIndex: 0, // tells us the modal is open for which data instance index
      currentWorkflow: null,
      currentInstance: null,
      currentInstanceIndex: null,
      oneHotColumnValue: null,
      isEditingWorkflow: false,
      editingWorkflowIndex: null,
      metaDataForEditingModal: null,
      showPartitionModal: false,
      splitSize: 0.8,
      showDescribeDataModal: false,
      describeDataResult: null,
      showDiscretizationModal: false,

    };
  },
  created() {
    this.getColumnNamesByType = getColumnNamesByType;
  },
  components: {
    ColumnCreator,
    UserDataset,
    missingValueHandler,
    CategoricalLabelingModal,
    myModal,
    Dialog,
    DataUpload_new,
    ProjectManagerBar,
    DiscretizationModal,
    DataProcessingWorkflow,
    Dropdown,
    Button,
    DataAnalysis,
    DescribeDataDialog,
    ScaleColumn,
    ModelCreation
  },
  computed: {
    ...mapGetters(['getLocalDataInstances']),
    localDataInstances() {
      console.log("aaaa")
      console.log(this.getLocalDataInstances)
      return this.getLocalDataInstances;
    },
    activePage() {
      return this.$route.params.activePage || 'dataUpload';
    }
  },
  methods: {
    ...mapActions(['setLocalDataInstances', 'addLocalDataInstance', 'deleteLocalDataInstance', 'editLocalDataInstance']),
    loadMoreRows(instanceIndex) {
      const updatedInstances = [...this.localDataInstances];
      updatedInstances[instanceIndex].numdisplayedRows += 5;
      this.setLocalDataInstances(updatedInstances);
    },
    navigateTo(page) {
    this.$router.push({ name: 'ProjectPage', params: { activePage: page } });
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
      console.log(instanceIndex)
      this.ParentInstanceIndex = instanceIndex;
      this.creatingInstance = true;
    },
    createNewInstance({ name }) {
      let cloneInstance = this.localDataInstances[this.ParentInstanceIndex];
      console.log(cloneInstance);

      this.addLocalDataInstance({
        data: JSON.parse(JSON.stringify(cloneInstance.data)),
        numdisplayedRows: 20,
        totalRows: cloneInstance.data.length - 1,
        loadingNewInstance: false,
        name: name,
        dataTypes: JSON.parse(JSON.stringify(cloneInstance.dataTypes)),
        workflow: [],
        isCollapsed: false
      });
      console.log('sss');

      this.creatingInstance = false;
    },
    confirmDelete(instanceIndex) {
      if (window.confirm('Are you sure you want to delete this instance?')) {
        this.deleteLocalDataInstance(instanceIndex);
      }
    },
    toggleCollapse(instance) {
      const updatedInstances = [...this.localDataInstances];
      const index = updatedInstances.indexOf(instance);
      if (index !== -1) {
        updatedInstances[index].isCollapsed = !updatedInstances[index].isCollapsed;
        this.setLocalDataInstances(updatedInstances);
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

    changeMetricType(columnName, type, instanceIndex) {
      const updatedInstances = [...this.localDataInstances];
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
        this.raiseErrorToUser(`Column ${columnName} cannot be converted to ${type}.`);
        return;
      }

      instance.dataTypes[columnName] = type;
      this.convertColumnData(instance.data.slice(1), colIndex, type);
      this.setLocalDataInstances(updatedInstances);
    },
    async handleNewColumnCreation(newColumnCreationMetaData, instanceIndex) {
      const updatedInstances = [...this.localDataInstances];
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
        this.setLocalDataInstances(updatedInstances);
      } catch (error) {
        console.error('Error:', error);
      }
    },

    handleWorkflowAction(action, index, description = null, APIdata = null) {
      this.currentInstanceIndex = index;
      this.currentInstance = this.localDataInstances[index];
      this.metaDataForEditingModal = null;
      this.isEditingWorkflow = false;
      console.log(action)

      if (action === 'onehot-encoding') {
        this.showOneHotModal = true;
      } else if (action === 'normalize-column') {
        this.shownormalizemodal = true;
      } else if (action === 'handle-missing') {
        this.showhandlingMissingValues = true;
      } else if (action === 'create-new-column') {
        this.showColumnCreatorModal = true;
      } else if (action === 'categorical-labeling') {
        this.showCategoricalLabelingModal = true;
      } else if (action === 'partition-data') {
        this.showPartitionModal = true;
      } else if (action === 'describe-data') {
        console.log("fff")
        this.showDescribeDataModal = true;
      }
      else if (action === 'discretize-column') {
        this.showDiscretizationModal = true;
      }
    },
    handleDiscretizationSubmit(data) {
      this.showDiscretizationModal = false;
      if (this.isEditingWorkflow) {
        this.updateWorkflowItem('discretize-column', `Discretize Column: ${data.selectedColumn}`, data);
      } else {
        this.handleWorkflowSubmission(this.currentInstanceIndex, 'discretize-column', `Discretize Column: ${data.selectedColumn}`, data);
      }
    },
    handleDescribeDataSubmit() {
    if (this.isEditingWorkflow) {
      this.updateWorkflowItem('describe-data', 'Describe Data', {});
    } else {
      this.handleWorkflowSubmission(this.currentInstanceIndex, 'describe-data', 'Describe Data', {});
    }
    this.showDescribeDataModal = false;
  },
    updateWorkflow(updatedWorkflows, instanceIndex) {
      this.localDataInstances[instanceIndex].workflow = updatedWorkflows;
      this.setLocalDataInstances(this.localDataInstances);
    },
    openWorkflowDetail(workflowIndex, currentInstanceIndex) {
    const workflow = this.localDataInstances[currentInstanceIndex].workflow[workflowIndex];
    this.currentInstance = this.localDataInstances[currentInstanceIndex];
    this.currentWorkflow = workflow;
    console.log("fjdks", workflow)
    this.isEditingWorkflow = true;
    this.editingWorkflowIndex = workflowIndex;
    this.metaDataForEditingModal = workflow.APIdata;
    this.metaDataForEditingModal["executed"] = workflow.executed
    console.log( this.metaDataForEditingModal)

    if (workflow.title === 'One Hot Encoding') {
      this.oneHotColumnValue = workflow.APIdata.columnName;
      this.showOneHotModal = true;
    } else if (workflow.title === 'Scale Column') {
      this.shownormalizemodal = true;
    } else if (workflow.title === 'Handle Missing Values') {
      this.showhandlingMissingValues = true;
    } else if (workflow.title === 'Create New Column') {
      this.showColumnCreatorModal = true;
    } else if (workflow.title === 'Categorical Labeling') {
      this.showCategoricalLabelingModal = true;
    } else if (workflow.title === 'Partition Data') {
      this.splitSize = workflow.APIdata.splitSize;
      this.showPartitionModal = true;
    } else if (workflow.title === 'Describe Data') {
      this.showDescribeDataModal = true;
    }
    else if (workflow.title === 'Discretize Column') {
      this.showDiscretizationModal = true;
      this.metaDataForEditingModal = workflow.APIdata;
    }

  },
  async handleExecuteWorkflows(workflows, instanceIndex) {
    const updatedInstances = [...this.localDataInstances];
    const instance = updatedInstances[instanceIndex];
    const dataToSend = {
      data: instance.data.map(row => ({ columns: row }))
    };
    const testDataToSend = {
      data: instance.testData.map(row => ({ columns: row }))
    };

    const requestBody = {
      data: dataToSend,
      workflow: workflows,
      testData: testDataToSend
    };

    try {
      const response = await axios.post('/executeWorkflow', requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(response.data.workflow_results);

      if (response.data.workflow_results) {
        // Update workflow metadata using the workflow index
        response.data.workflow_results.forEach((result, index) => {
          if (!updatedInstances[instanceIndex].workflow[index].executed) {
            updatedInstances[instanceIndex].workflow[index].APIdata["description_metadata"] = result["description_metadata"];
          }
        });
      }

      updatedInstances[instanceIndex] = this.updateDataFromBackend(instance, response);

      // Update the data types with the returned column types
      updatedInstances[instanceIndex].dataTypes = response.data.column_types;

      instance.workflow = workflows;

      updatedInstances[instanceIndex].workflow.forEach(workflow => {
        if (!workflow.executed) {
          workflow.executed = true;
        }
      });

      this.setLocalDataInstances(updatedInstances);
    } catch (error) {
      console.error('Error:', error);
    }
  },

    updateDataFromBackend(instance, response) {
      const updatedData = JSON.parse(response.data.data);
      const headers = Object.keys(updatedData[0]);
      const rows = updatedData.map(row => headers.map(header => row[header]));
      instance.data = [headers, ...rows];

      /// test data
      console.log("test")

      const updatedTestData = JSON.parse(response.data.testData);
      console.log(updatedTestData)
      if (updatedTestData.length >0){
        
        const headers_test = Object.keys(updatedTestData[0]);
        const rows_test = updatedTestData.map(row => headers_test.map(header => row[header]));
        instance.testData = [headers_test, ...rows_test];
      }


      console.log(instance.testData)


      console.log("test2")


      return instance;
    },
    async getColumnUniqueValues(instanceIndex, column) {
      const instance = this.localDataInstances[instanceIndex];
      const columnIndex = instance.data[0].indexOf(column);
      const uniqueValues = new Set(instance.data.slice(1).map(row => row[columnIndex]));
      return Array.from(uniqueValues);
    },
    wf_categoricalLabeling(data, instanceIndex) {
      this.categoricalLabeling = false;
      this.handleWorkflowSubmission(instanceIndex, 'categorical-labeling', `Categorical Labeling`, data);
    },
    wf_createNewColumn(newColumnCreationMetaData) {
      this.showColumnCreatorModal = false;
      this.handleWorkflowSubmission(this.currentInstanceIndex, 'create-new-column', `new Column: ${newColumnCreationMetaData.columnName}`, newColumnCreationMetaData);
    },
    wf_oneHotEncode(columnName) {
      if (!columnName) {
        alert('Please select a column to one hot encode.');
        return;
      }
      this.showOneHotModal = false;
      if (this.isEditingWorkflow) {
        this.updateWorkflowItem('onehot-encoding', `One hot encode Column: ${columnName}`, { columnName });
      } else {
        this.handleWorkflowSubmission(this.currentInstanceIndex, 'onehot-encoding', `One hot encode Column: ${columnName}`, { columnName });
      }
    },
    handleMissingValuesSubmission(data, instanceIndex) {
      
    this.showhandlingMissingValues = false;
    if (this.isEditingWorkflow) {
      this.updateWorkflowItem('handle-missing', `Handle missing values for column: ${data.column}`, data);
    } else {
      this.handleWorkflowSubmission(instanceIndex, 'handle-missing', `Handle missing values for column: ${data.column}`, data);
    }
  },
    wf_scaleColumn(description, APIdata) {
      if (this.isEditingWorkflow) {
        this.updateWorkflowItem('scale-column', description, APIdata);
      } else {
        this.handleWorkflowSubmission(this.currentInstanceIndex, 'scale-column', description, APIdata);
      }
      this.shownormalizemodal = false;
    },

    handleWorkflowSubmission(instanceIndex, action, description, APIdata) {
      console.log("api data: ", APIdata)
      APIdata["executed"] = false
      const updatedInstances = [...this.localDataInstances];
      console.log(description)
      const actionDescriptions = {
        'onehot-encoding': 'One Hot Encoding',
        'scale-column': 'Scale Column',
        'create-new-column': 'Create New Column',
        'categorical-labeling': 'Categorical Labeling',
        'partition-data': 'Partition Data',
        'handle-missing': 'Handle Missing Values',
        'describe-data': 'Describe Data',
        'discretize-column': 'Discretize Column'


      };
      const newWorkflow = {
        title: actionDescriptions[action],
        description: description,
        APIdata: APIdata
      };
      updatedInstances[instanceIndex].workflow.push(newWorkflow);
      this.setLocalDataInstances(updatedInstances);
    },
    updateWorkflowItem(action, description, APIdata) {
      const updatedInstances = [...this.localDataInstances];
      const workflow = updatedInstances[this.currentInstanceIndex].workflow[this.editingWorkflowIndex];
      if (!workflow) {
        console.error('Workflow not found:', this.editingWorkflowIndex, updatedInstances[this.currentInstanceIndex].workflow);
        return;
      }
      workflow.title = this.getActionTitle(action);
      workflow.description = description;
      workflow.APIdata = APIdata;
      this.setLocalDataInstances(updatedInstances);
    },
    getActionTitle(action) {
      const actionDescriptions = {
        'onehot-encoding': 'One Hot Encoding',
        'scale-column': 'Scale Column',
        'create-new-column': 'Create New Column',
        'categorical-labeling': 'Categorical Labeling',
        'partition-data': 'Partition Data',
        'handle-missing': 'Handle Missing Values',
        'create-new-column': 'Create New Column',
        'discretize-column': 'Discretize Column'

      };
      return actionDescriptions[action] || action;
    },
    handleCategoricalLabeling(data) {
      this.showCategoricalLabelingModal = false;
      if (this.isEditingWorkflow) {
        this.updateWorkflowItem('categorical-labeling', `Categorical Labeling`, data);
      } else {
        this.handleWorkflowSubmission(this.currentInstanceIndex, 'categorical-labeling', `Categorical Labeling`, data);
      }
    },
    wf_partitionData(splitSize) {
      const description = `Partition Data: ${splitSize}`;
      const APIdata = { splitSize: splitSize };
    if (this.isEditingWorkflow) {
      this.updateWorkflowItem('partition-data', description, APIdata);
    } else {
      this.handleWorkflowSubmission(this.currentInstanceIndex, 'partition-data', description, APIdata);
    }
    this.showPartitionModal = false;
  },
  raiseErrorToUser(message, timeout=3000) {
  this.errorMessage = message;
  this.showErrorModal = true;
  setTimeout(() => {
    this.showErrorModal = false;
  }, timeout);
}
  }
};
</script>


<style src="@/assets/styles.css" scoped></style>
