<template>
    <Dialog :visible="visible" @hide="closeModal" :modal="true" :closable="false" header="Scale Column">
      <div class="scale-column-modal">
        <p>Select a numerical column to scale</p>
        <div class="custom-dropdown-container">
          <Dropdown v-model="selectedColumn" :options="availableColumns" placeholder="Select a column" class="w-full" :disabled="metaData && metaData.executed" />
        </div>
        <div class="custom-dropdown-container">
          <Dropdown v-model="scaleType" :options="scaleOptions" optionLabel="label" optionValue="value" placeholder="Select scale type" class="w-full" :disabled="metaData && metaData.executed" />
        </div>
        <div v-if="scaleType === 'normalize'" class="input-group">
          <div class="input-item">
            <p>Min value</p>
            <input type="number" step="1" v-model.number="newMin" @input="validateMinMax" :disabled="metaData && metaData.executed" />
          </div>
          <div class="input-item">
            <p>Max value</p>
            <input type="number" v-model.number="newMax" @input="validateMinMax" :disabled="metaData && metaData.executed" />
          </div>
        </div>
        <div v-if="scaleType === 'log'" class="input-group">
          <div class="input-item">
            <p>Base</p>
            <input type="number" step="1" v-model.number="logBase" :disabled="metaData && metaData.executed" />
          </div>
        </div>
        <div v-if="scaleType === 'box-cox' || scaleType === 'yeo-johnson'" class="input-group">
          <div class="input-item">
            <p>Lambda</p>
            <input type="number" step="0.01" v-model.number="lambda" :disabled="metaData && metaData.executed" />
          </div>
        </div>
        <div class="input-group">
          <div class="input-item">
            <p>Fit on Train Data Only</p>
            <InputSwitch v-model="fitOnTrain" :disabled="metaData && metaData.executed" />
          </div>
        </div>
        <div v-if="minMaxvalidationError" class="error-message">
          {{ minMaxvalidationError }}
        </div>
        <div class="modal-footer">
          <Button
            label="Submit"
            icon="pi pi-check"
            @click="submit"
            :disabled="!isFormValid || (metaData && metaData.executed)"
          />
          <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="closeModal" />
        </div>
      </div>
    </Dialog>
  </template>
  
  <script>
  import { ref, watch, computed } from 'vue';
  import Dropdown from 'primevue/dropdown';
  import Dialog from 'primevue/dialog';
  import Button from 'primevue/button';
  import InputSwitch from 'primevue/inputswitch';
  
  export default {
    name: 'ScaleColumn',
    components: {
      Dropdown,
      Dialog,
      Button,
      InputSwitch,
    },
    props: {
      visible: {
        type: Boolean,
        default: false,
      },
      availableColumns: {
        type: Array,
        required: true,
      },
      metaData: {
        type: Object,
        default: () => ({}),
      },
    },
    emits: ['close', 'submit'],
    setup(props, { emit }) {
      const selectedColumn = ref('');
      const scaleType = ref('');
      const newMin = ref(0);
      const newMax = ref(1);
      const logBase = ref(10);
      const lambda = ref(0);
      const fitOnTrain = ref(true);
      const minMaxvalidationError = ref(null);
      const scaleOptions = [
        { label: 'Normalize', value: 'normalize' },
        { label: 'Standardize', value: 'standardize' },
        { label: 'Robust Scale', value: 'robust' },
        { label: 'Log Scale', value: 'log' },
        { label: 'L1 Normalize', value: 'l1' },
        { label: 'L2 Normalize', value: 'l2' },
        { label: 'Box-Cox', value: 'box-cox' },
        { label: 'Yeo-Johnson', value: 'yeo-johnson' },
      ];
  
      const resetForm = () => {
        selectedColumn.value = '';
        scaleType.value = '';
        newMin.value = 0;
        newMax.value = 1;
        logBase.value = 10;
        lambda.value = 0;
        fitOnTrain.value = true;
        minMaxvalidationError.value = null;
      };
  
      watch(() => props.metaData, (newVal) => {
        if (newVal) {
          selectedColumn.value = newVal.columnName || '';
          scaleType.value = newVal.method || '';
          newMin.value = newVal.newMin ?? 0;
          newMax.value = newVal.newMax ?? 1;
          logBase.value = newVal.base ?? 10;
          lambda.value = newVal.lambda ?? 0;
          fitOnTrain.value = newVal.fitOnTrain ?? true;
        } else {
          resetForm();
        }
      }, { immediate: true });
  
      watch(() => props.visible, (newVal) => {
        if (!newVal) {
          resetForm();
        }
      });
  
      watch(scaleType, (newVal) => {
        if (newVal !== 'normalize') {
          newMin.value = 0;
          newMax.value = 1;
          minMaxvalidationError.value = null;
        }
      });
  
      const validateMinMax = () => {
        if (newMax.value <= newMin.value) {
          minMaxvalidationError.value = 'Max value must be greater than Min value';
        } else {
          minMaxvalidationError.value = null;
        }
      };
  
      const closeModal = () => {
        emit('close');
      };
  
      const submit = () => {
        if (scaleType.value === 'normalize' && (newMax.value <= newMin.value || isNaN(newMin.value) || isNaN(newMax.value))) {
          minMaxvalidationError.value = 'Please provide valid Min and Max values';
          return;
        }
  
        const APIdata = {
          method: scaleType.value,
          columnName: selectedColumn.value,
          fitOnTrain: fitOnTrain.value,
          ...(scaleType.value === 'normalize' && { newMin: newMin.value, newMax: newMax.value }),
          ...(scaleType.value === 'log' && { base: logBase.value }),
          ...(scaleType.value === 'box-cox' && { lambda: lambda.value }),
          ...(scaleType.value === 'yeo-johnson' && { lambda: lambda.value }),
        };
  
        let description = `${scaleType.value.charAt(0).toUpperCase() + scaleType.value.slice(1)}: ${selectedColumn.value}`;
        if (scaleType.value === 'normalize') {
          description = `Normalize Column: ${selectedColumn.value} values from ${newMin.value} to ${newMax.value}`;
        }
  
        emit('submit', { description, APIdata });
        closeModal();
      };
  
      const isFormValid = computed(() => {
        if (scaleType.value === 'normalize') {
          return selectedColumn.value && newMin.value < newMax.value;
        }
        return selectedColumn.value && scaleType.value;
      });
  
      return {
        selectedColumn,
        scaleType,
        newMin,
        newMax,
        logBase,
        lambda,
        fitOnTrain,
        minMaxvalidationError,
        scaleOptions,
        validateMinMax,
        closeModal,
        submit,
        resetForm,
        isFormValid,
      };
    },
  };
  </script>
  
  <style scoped>
  .scale-column-modal {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .input-group {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  
  .input-item {
    flex: 1;
  }
  
  .error-message {
    color: red;
  }
  
  .modal-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  }
  </style>
  