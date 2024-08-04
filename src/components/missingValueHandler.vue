<template>
  <div
    class="MissingValue-backdrop"
    role="dialog"
    aria-labelledby="column-modal-title"
    aria-describedby="column-modal-desc"
  >
    <div class="MissingValue">
      <header class="MissingValue-header">
        <slot name="header">
          <h2 id="column-modal-title">Handle Missing Values</h2>
        </slot>
        <button
          type="button"
          class="btn-close"
          @click="close"
          aria-label="Close modal"
        ></button>
      </header>

      <section class="MissingValue-body" id="column-modal-desc">
        <div class="column-selection">
          <slot name="body">
            <h4>Select a column:</h4>
            <Dropdown 
              v-model="selectedColumn" 
              :options="columnsOptions" 
              class="column-select" 
              optionLabel="label" 
              placeholder="Select a column" 
              :disabled="metadata && !metadata.submittable"
            />
          </slot>
        </div>
        <div class="column-methods">
          <h4 v-if="selectedColumn">Methods to handle missing values for {{ selectedColumn.label }}:</h4>
          <h4 v-else>Select a column to see methods to handle missing values</h4>
          <Dropdown 
            v-if="selectedColumn" 
            v-model="selectedMethod" 
            :options="methodsOptions" 
            class="method-select" 
            optionLabel="label" 
            placeholder="Select a method" 
            :disabled="metadata && !metadata.submittable"
          />
          <input 
            v-if="selectedMethod.value === 'Assign Value'" 
            v-model="assignValue" 
            placeholder="Assign Value" 
            class="assign-input" 
            :disabled="metadata && !metadata.submittable"
          />
          
          <div v-if="['Mean', 'Median', 'Most Common'].includes(selectedMethod.value)">
            <h4>Select a column to group by (optional):</h4>
            <Dropdown 
              v-model="selectedGroupBy" 
              :options="categoricalColumnsOptions" 
              class="group-by-select" 
              optionLabel="label" 
              placeholder="Select a grouping column" 
              :disabled="metadata && !metadata.submittable"
            />
          </div>

          <div v-if="selectedGroupBy && ['Mean', 'Median', 'Most Common'].includes(selectedMethod.value)" class="consider-nan-container">
            <h4>Consider NaN as a separate category:</h4>
            <InputSwitch v-model="considerNaNAsCategory" :disabled="metadata && !metadata.submittable"/>
          </div>
          
          <div v-if="selectedMethod.value === 'Interpolate'">
            <h4>Select a column to interpolate by (optional):</h4>
            <Dropdown 
              v-model="selectedInterpolateBy" 
              :options="filteredNumericColumnsOptions" 
              class="interpolate-by-select" 
              optionLabel="label" 
              placeholder="Select an interpolation column" 
              :disabled="metadata && !metadata.submittable"
            />
          </div>

          <div class="fit-to-train-container" v-if="['Mean', 'Median', 'Most Common'].includes(selectedMethod.value)">
            <h4>Fit to Train Data:</h4>
            <InputSwitch v-model="fitToTrain" :disabled="metadata && !metadata.submittable"/>
          </div>
        </div>
      </section>

      <footer class="MissingValue-footer">
        <slot name="footer">
          <Button 
            label="Fill Missing Value" 
            class="btn-green" 
            @click="submit" 
            :disabled="!selectedColumn || !selectedMethod || (metadata && !metadata.submittable)"
          />
        </slot>
      </footer>
    </div>
  </div>
</template>

<script>
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch';
import { watch } from 'vue';

export default {
  name: 'MissingValueHandler',
  components: {
    Dropdown,
    Button,
    InputSwitch
  },
  props: {
    availableColumns: Array,
    columntypes: Object,
    categoricalColumns: Array,
    numericColumns: Array,
    metadata: {
      type: Object,
      default: null,
    }
  },
  data() {
    return {
      selectedColumn: null,
      selectedMethod: '',
      assignValue: '',
      selectedGroupBy: null,
      selectedInterpolateBy: null,
      fitToTrain: true,  // default to true
      considerNaNAsCategory: false, // new property for considering NaN as a category
      searchQuery: '',
      methodsToHandleMissingValuesNumericalCols: ["Mean", "Median", "Most Common", "Assign Value", "Remove Row", "Interpolate", "Forward Fill", "Back Fill"],
      methodsToHandleMissingValuesOtherCols: ["Most Common", "Assign Value", "Remove Row", "Forward Fill", "Back Fill"]
    };
  },
  computed: {
    columnsOptions() {
      return this.availableColumns.map(col => ({ label: col, value: col }));
    },
    methodsOptions() {
      const methods = this.getMethodsForColumn();
      return methods.map(method => ({ label: method, value: method }));
    },
    categoricalColumnsOptions() {
      return this.categoricalColumns.map(col => ({ label: col, value: col }));
    },
    numericColumnsOptions() {
      return this.numericColumns.map(col => ({ label: col, value: col }));
    },
    filteredNumericColumnsOptions() {
      return this.numericColumnsOptions.filter(col => col.value !== this.selectedColumn?.value);
    }
  },
  watch: {
    metadata: {
      immediate: true,
      handler(newVal) {
        console.log(newVal)
        if (newVal) {
          this.selectedColumn = newVal.column ? { label: newVal.column, value: newVal.column } : null;
          this.selectedMethod = newVal.method ? { label: newVal.method, value: newVal.method } : '';
          this.assignValue = newVal.value || '';
          this.selectedGroupBy = newVal.group_by ? { label: newVal.group_by, value: newVal.group_by } : null;
          this.selectedInterpolateBy = newVal.interpolate_col ? { label: newVal.interpolate_col, value: newVal.interpolate_col } : null;
          this.fitToTrain = newVal.fit_to_train || true;
          this.considerNaNAsCategory = newVal.consider_nan_as_category || false; // initialize considerNaNAsCategory
        }
      }
    }
  },
  methods: {
    getMethodsForColumn() {
      if (!this.selectedColumn) {
        return [];
      }
      const selectedColumnType = this.columntypes[this.selectedColumn.value];
      if (selectedColumnType === "numeric") {
        return this.methodsToHandleMissingValuesNumericalCols;
      } else {
        return this.methodsToHandleMissingValuesOtherCols;
      }
    },
    close() {
      this.$emit('close');
    },
    submit() {
      this.$emit('submit', {
        column: this.selectedColumn.value,
        method: this.selectedMethod.value,
        value: this.assignValue,
        group_by: this.selectedGroupBy ? this.selectedGroupBy.value : null,
        interpolate_col: this.selectedInterpolateBy ? this.selectedInterpolateBy.value : null,
        fit_to_train: this.fitToTrain,
        consider_nan_as_category: this.considerNaNAsCategory // include considerNaNAsCategory in the submit event
      });
      this.close();
    }
  }
};
</script>

<style>
body,
html,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: 'Arial', sans-serif;
  background-color: #f0f2f5;
}

.MissingValue-backdrop {
  z-index: 1000;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.MissingValue {
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 800px;
  height: 500px;
  border-radius: 10px;
}

.MissingValue-header,
.MissingValue-footer {
  padding: 15px;
  display: flex;
  align-items: center;
  margin: 0;
  background: linear-gradient(135deg, #4aae9b, #2b8c87);
  color: white;
}

.MissingValue-header {
  position: relative;
  border-bottom: 1px solid #eeeeee;
  justify-content: space-between;
}

.MissingValue-footer {
  border-top: 1px solid #eeeeee;
  justify-content: flex-end;
  background: #f9f9f9;
}

.MissingValue-body {
  padding: 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  overflow-y: auto;
  margin: 0;
  background-color: #ffffff;
  height: calc(100% - 90px); /* Adjusting for header and footer height */
}

.column-selection {
  flex: 1;
  padding-right: 10px;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.column-methods {
  flex: 1;
  padding-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;
}

.consider-nan-container,
.fit-to-train-container {
  margin-top: 10px;
}

.column-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
  overflow-y: auto;
}

.column-list li {
  padding: 8px;
  cursor: pointer;
  border: 1px solid #ddd;
  margin-bottom: 5px;
  border-radius: 4px;
}

.column-list li.selected {
  background-color: #4aae9b;
  color: white;
}

.method-select, .group-by-select, .interpolate-by-select, .column-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 10px;
}

.search-input {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
}

.assign-input {
  margin-top: 10px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
}

.btn-green {
  background-color: #4aae9b;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-green:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
