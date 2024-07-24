<template>
  <div class="data-processing-workflow">
    <h2 class="page-title">Workflow History</h2>
    <div class="workflow-container">
      <div
        :class="['workflow-item', { executed: workflow.executed }]"
        v-for="(workflow, index) in localWorkflows"
        :key="index"
        :draggable="!workflow.executed"
        @dragstart="onDragStart($event, index)"
        @dragover.prevent="!workflow.executed"
        @drop="!workflow.executed && onDrop($event, index)"
        @click="openDetail(index)"
      >
        <div class="workflow-label">{{ index + 1 }}</div>
        <div class="workflow-content">
          <h3>{{ workflow.title }}</h3>
          <p>{{ workflow.description }}</p>
        </div>
        <Button
          icon="pi pi-times"
          @click.stop="deleteWorkflow(index)"
          class="delete-button"
          v-if="!workflow.executed"
        />
      </div>
      <svg v-if="index < localWorkflows.length - 1" class="arrow" viewBox="0 0 24 24">
        <path d="M12 2v20m0 0l8-8m-8 8l-8-8" />
      </svg>
    </div>
    <div class="button-container">
      <CDropdown>
        <CDropdownToggle class="workflow-button add-button">
          <i class="pi pi-plus"></i> Add Workflow
        </CDropdownToggle>
        <CDropdownMenu class="custom-dropdown-menu">
          <CDropdownItem class="custom-dropdown-item" @click="selectWorkflow('onehot-encoding')">One Hot Encoding</CDropdownItem>
          <CDropdownItem class="custom-dropdown-item" @click="selectWorkflow('normalize-column')">Normalize Column</CDropdownItem>
          <CDropdownItem class="custom-dropdown-item" @click="selectWorkflow('create-new-column')">Create New Column</CDropdownItem>
          <CDropdownItem class="custom-dropdown-item" @click="selectWorkflow('categorical-labeling')">Categorical Labeling</CDropdownItem>
          <CDropdownItem class="custom-dropdown-item" @click="selectWorkflow('partition-data')">Partition Data</CDropdownItem>
        </CDropdownMenu>
      </CDropdown>
      <div v-if="localWorkflows.length > 0" class="execute-button-container">
        <Button label="Execute" icon="pi pi-play" @click="executeWorkflows" class="workflow-button execute-button" />
      </div>
    </div>
    <Dialog v-if="showPartitionModal" :visible="showPartitionModal" @hide="showPartitionModal = false" :modal="true" header="Partition Data">
      <div class="partition-modal">
        <p>Specify Split Size</p>
        <input type="number" v-model.number="splitSize" min="0" max="1" step="0.01" />
        <div class="modal-footer">
          <Button label="Submit" icon="pi pi-check" @click="submitPartition" />
          <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="showPartitionModal = false" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script>
import Button from 'primevue/button';
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem } from '@coreui/vue';

export default {
  name: 'DataProcessingWorkflow',
  props: {
    workflows: {
      type: Array,
      required: true
    },
    index: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      localWorkflows: this.workflows.map(workflow => ({ ...workflow, executed: workflow.executed || false })),
      draggedIndex: null,
      showPartitionModal: false,
      splitSize: 0.8
    };
  },
  methods: {
    deleteWorkflow(index) {
      this.localWorkflows.splice(index, 1);
      this.$emit('update:workflows', this.localWorkflows, this.index);
    },
    selectWorkflow(action) {
      this.$emit('workflow-action', action, this.index);
    },
    onDragStart(event, index) {
      this.draggedIndex = index;
    },
    onDrop(event, index) {
      if (this.draggedIndex !== null) {
        const draggedItem = this.localWorkflows[this.draggedIndex];
        this.localWorkflows.splice(this.draggedIndex, 1);
        this.localWorkflows.splice(index, 0, draggedItem);
        this.draggedIndex = null;
        this.$emit('update:workflows', this.localWorkflows, this.index);
      }
    },
    executeWorkflows() {
      this.$emit('execute-workflows', this.localWorkflows, this.index);
    },
    openDetail(index) {
      this.$emit('open-workflow-detail', index, this.index);
    },
    submitPartition() {
      const description = `Partition Data: ${this.splitSize}`;
      const APIdata = { splitSize: this.splitSize };
      this.$emit('workflow-action', 'partition-data', this.index, description, APIdata);
      this.showPartitionModal = false;
    }
  },
  watch: {
    workflows: {
      handler(newWorkflows) {
        this.localWorkflows = newWorkflows.map(workflow => ({ ...workflow, executed: workflow.executed || false }));
      },
      deep: true
    }
  },
  components: {
    Button,
    CDropdown,
    CDropdownToggle,
    CDropdownMenu,
    CDropdownItem
  }
};
</script>

<style scoped>
.data-processing-workflow {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-title {
  margin-bottom: 20px;
  font-size: 100%;
  font-weight: bold;
}

.workflow-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 40px;
  width: 100%;
}

.workflow-item {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.3s, box-shadow 0.3s;
  width: 10%;
  height: 100px;
  text-align: center;
  cursor: pointer;
}

.workflow-item.executed {
  background-color: #0e0e11ae;
  color: #ffffff;
  cursor: default;
}

.workflow-label {
  position: absolute;
  top: -10px;
  left: -10px;
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 100%;
  font-weight: bold;
}

.workflow-item:hover:not(.executed) {
  background-color: #f1f1f1;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.workflow-content h3 {
  margin: 0;
  font-size: 80%;
  color: inherit;
}

.workflow-content p {
  margin: 10px 0 0;
  font-size: 80%;
  color: inherit;
}

.delete-button {
  background-color: #dc3545;
  border: none;
  border-radius: 50px;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  position: absolute;
  top: -10px;
  right: -10px;
  padding: 5px;
}

.arrow {
  width: 40px;
  height: 40px;
  fill: #007bff;
  margin: 0 10px;
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.workflow-button {
  border: none;
  border-radius: 50px;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-button {
  background-color: #fd7e14; /* Orange color */
}

.execute-button {
  background-color: #007bff; /* Blue color */
}

.custom-dropdown-menu {
  background-color: #ffffff;
  border: 1px solid #ced4da;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  margin-top: 10px;
}

.custom-dropdown-item {
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
  background-color: #e9ecef; /* Light gray background */
  border-bottom: 1px solid #ced4da; /* Border between items */
}

.custom-dropdown-item:last-child {
  border-bottom: none; /* Remove border from the last item */
}

.custom-dropdown-item:hover {
  background-color: #adb5bd; /* Darker gray background on hover */
  color: #ffffff; /* White text on hover */
}
</style>
