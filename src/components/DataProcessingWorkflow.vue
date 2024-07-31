<template>
  <div class="data-processing-workflow">
    <h2 class="page-title">Workflow History</h2>
    <div class="workflow-layout">
      <div class="left-panel">
        <button class="workflow-option onehot-encoding" @click="selectWorkflow('onehot-encoding')">
          <i class="pi pi-tag"></i> One Hot Encoding
        </button>
        <button class="workflow-option normalize-column" @click="selectWorkflow('normalize-column')">
          <i class="pi pi-sort-numeric-down"></i> Scale Column
        </button>
        <button class="workflow-option create-new-column" @click="selectWorkflow('create-new-column')">
          <i class="pi pi-plus"></i> Create New Column
        </button>
        <button class="workflow-option categorical-labeling" @click="selectWorkflow('categorical-labeling')">
          <i class="pi pi-tag"></i> Categorical Labeling
        </button>
        <button class="workflow-option handle-missing" @click="selectWorkflow('handle-missing')">
          <i class="pi pi-exclamation-circle"></i> Handle Missing Values           

        </button>
        <button class="workflow-option partition-data" @click="selectWorkflow('partition-data')">
          <i class="pi pi-th-large"></i> Partition Data
        </button>
      </div>
      <div class="right-panel">
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
        </div>
        <div class="button-container">
          <div v-if="localWorkflows.length > 0" class="execute-button-container">
            <Button label="Execute" icon="pi pi-play" @click="executeWorkflows" class="workflow-button execute-button" />
          </div>
        </div>
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
      console.log('index', this.index)
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
    Button
  }
};
</script>

<style scoped>
.data-processing-workflow {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #263c55;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 100%;
  font-weight: bold;
  color: #ffffff;
}

.workflow-layout {
  display: flex;
  width: 100%;
  background-color: #6286a4;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  position: relative;
}

.left-panel {
  width: 20%;
  padding: 20px;
  background-color: #6286a4;
  border-right: 8px solid #455a72;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 8px 0 0 8px;
}

.workflow-option {
  background-color: #4db8ff;
  color: white;
  border: none;
  border-radius: 30px;
  padding: 10px 20px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
  font-size: 1rem;
  display: flex;
  align-items: center;
}

.workflow-option i {
  margin-right: 10px;
}

.workflow-option:hover {
  background-color: #007bff;
  transform: scale(1.05);
}

.workflow-option.onehot-encoding {
  background-color: #4db8ff;
}

.workflow-option.normalize-column {
  background-color: #42a5f5;
}

.workflow-option.create-new-column {
  background-color: #26c6da;
}

.workflow-option.categorical-labeling {
  background-color: #66bb6a;
}
.workflow-option.handle-missing {
  background-color: #1775c7;
}

.workflow-option.partition-data {
  background-color: #ffa726;
}

.right-panel {
  width: 80%;
  padding: 20px;
}

.workflow-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 30px;
  width: 100%;
}

.workflow-item {
  background-color: #455a72;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.3s, box-shadow 0.3s;
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
  background-color: #96b9df;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.workflow-content h3 {
  margin: 0;
  font-size: 80%;
  color: white;
}

.workflow-content p {
  margin: 10px 0 0;
  font-size: 80%;
  color: white;
}

.delete-button {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: #e80202;
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

.execute-button {
  background-color: #007bff; /* Blue color */
}

.partition-modal {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
