<template>
  <Dialog :visible="visible" :modal="true" header="Column Discretization" @hide="closeModal" :style="{ width: '70vw' }">
    <div class="discretization-modal">
      <Dropdown
        v-model="selectedColumn"
        :options="numericColumns"
        class="w-full"
        placeholder="Select Numeric Column"
        @change="handleColumnChange"
        :disabled="isExecuted"
      />
      <div v-for="(interval, index) in intervals" :key="index" class="interval-value-pair">
        <input
          type="text"
          v-model="interval.min"
          :placeholder="index === 0 ? 'Min Value (-inf)' : 'Previous Bound'"
          class="interval-input"
          :readonly="index !== 0 || isExecuted"
          @input="validateInterval(index)"
        />
        <div class="interval-sign"><span>&lt;</span></div>
        <span class="x-sign">x</span>
        <div class="interval-sign"><span>&lt;</span></div>
        <input
          type="text"
          v-model="interval.max"
          placeholder="Max Value"
          class="interval-input"
          @input="adjustNextMin(index); validateInterval(index)"
          :disabled="isExecuted"
        />
        <input
          type="number"
          v-model.number="interval.value"
          placeholder="Assign Value"
          class="value-input"
          :disabled="isExecuted"
        />
        <Button icon="pi pi-times" class="delete-button" @click="removeInterval(index)" :disabled="isExecuted" />
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <Button label="Add Interval" icon="pi pi-plus" @click="addInterval" :disabled="isExecuted" />
      <div class="inf-note">Note: Use <strong>-inf</strong> for negative infinity and <strong>inf</strong> for infinity</div>
      <div class="modal-footer">
        <Button label="Submit" icon="pi pi-check" @click="submit" :disabled="!isFormValid || isExecuted" />
        <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="closeModal" />
      </div>
    </div>
  </Dialog>
</template>

<script>
import { ref, computed, watch } from 'vue';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

export default {
  name: 'DiscretizationModal',
  components: {
    Dropdown,
    Dialog,
    Button,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    numericColumns: {
      type: Array,
      required: true,
    },
    metadata: {
      type: Object,
      default: null,
    },
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const selectedColumn = ref(null);
    const intervals = ref([{ min: '-inf', max: null, value: null }]);
    const isExecuted = ref(false);
    const errorMessage = ref("");

    const addInterval = () => {
      const lastMax = intervals.value[intervals.value.length - 1].max;
      intervals.value.push({ min: lastMax, max: null, value: null });
      adjustNextMin(intervals.value.length - 2);  // Set min for new interval
    };

    const removeInterval = (index) => {
      intervals.value.splice(index, 1);
      adjustNextMin(index - 1);  // Adjust the min value for the subsequent interval
      validateIntervals();  // Re-validate all intervals after removal
    };

    const adjustNextMin = (index) => {
      if (index < intervals.value.length - 1) {
        intervals.value[index + 1].min = intervals.value[index].max || intervals.value[index + 1].min;
        validateInterval(index + 1);
      }
    };

    const validateInterval = (index) => {
      const interval = intervals.value[index];
      const minVal = parseFloat(interval.min === '-inf' ? '-Infinity' : interval.min);
      const maxVal = parseFloat(interval.max === 'inf' ? 'Infinity' : interval.max);

      if ((minVal >= maxVal && interval.max !== 'inf') || (index === 0 && interval.min !== '-inf' && isNaN(minVal)) || (index === intervals.value.length - 1 && interval.max !== 'inf' && isNaN(maxVal))) {
        errorMessage.value = `Interval ${index + 1}: Max value must be strictly greater than Min value, and bounds must be valid.`;
      } else {
        errorMessage.value = "";
      }
    };

    const validateIntervals = () => {
      intervals.value.forEach((_, index) => validateInterval(index));
    };

    const validateIntervalValue = (value) => {
      if (value === '-inf' || value === 'inf') {
        return true;
      }
      return !isNaN(parseFloat(value)) && isFinite(value);
    };

    const isFormValid = computed(() => {
      return (
        selectedColumn.value &&
        !errorMessage.value &&
        intervals.value.every(interval =>
          interval.min !== null && validateIntervalValue(interval.min) &&
          interval.max !== null && validateIntervalValue(interval.max) &&
          interval.value !== null
        )
      );
    });

    const submit = () => {
      if (isFormValid.value) {
        emit('submit', {
          selectedColumn: selectedColumn.value,
          intervals: intervals.value,
        });
        closeModal();
      }
    };

    const closeModal = () => {
      emit('close');
    };

    const resetForm = () => {
      selectedColumn.value = null;
      intervals.value = [{ min: '-inf', max: null, value: null }];
      errorMessage.value = "";
      isExecuted.value = false;
    };

    const handleColumnChange = async () => {
      if (selectedColumn.value && props.metadata) {
        intervals.value = JSON.parse(JSON.stringify(props.metadata.intervals || [{ min: '-inf', max: null, value: null }]));
        adjustNextMin(0);  // Adjust intervals based on metadata
      }
    };

    watch(
      () => props.metadata,
      (newVal) => {
        if (newVal) {
          selectedColumn.value = newVal.selectedColumn;
          intervals.value = JSON.parse(JSON.stringify(newVal.intervals || [{ min: '-inf', max: null, value: null }]));
          isExecuted.value = newVal.executed || false;
          validateIntervals();
        } else {
          resetForm();
        }
      },
      { immediate: true }
    );

    watch(
      () => props.visible,
      (newVal) => {
        if (!newVal) {
          resetForm();
        }
      }
    );

    return {
      selectedColumn,
      intervals,
      addInterval,
      removeInterval,
      adjustNextMin,
      closeModal,
      submit,
      isFormValid,
      validateInterval,
      errorMessage,
      isExecuted,
    };
  },
};
</script>

<style scoped>
.discretization-modal {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.interval-value-pair {
  display: flex;
  align-items: center;
  gap: 10px;
}

.interval-sign,
.x-sign {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  color: #6c757d;
}

.interval-input {
  width: 20%;
}

.value-input {
  width: 20%;
}

.error-message {
  color: red;
  font-size: 0.9em;
  margin-top: 10px;
}

.inf-note {
  margin-top: 10px;
  font-style: italic;
  color: #6c757d;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.delete-button {
  background-color: #dc3545;
  border: none;
  border-radius: 50px;
  color: white;
}
</style>
