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
            <h2 id="column-modal-title"> Handle Missing Values </h2>
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
              <h3>Select a column:</h3>
              <input type="text" v-model="searchQuery" placeholder="Search columns" class="search-input" />
              <ul class="column-list">
                <li
                  v-for="col in filteredColumns"
                  :key="col"
                  :class="{ selected: col === selectedColumn }"
                  @click="selectColumn(col)"
                >
                  {{ col }}
                </li>
              </ul>
            </slot>
          </div>
          <div class="column-methods">
            <h3 v-if="selectedColumn">Methods to handle missing values for {{ selectedColumn }}:</h3>
            <h3 v-else>Select a column to see methods to handle missing values</h3>
            <select v-if="selectedColumn" v-model="selectedMethod" class="method-select">
              <option v-for="method in getMethodsForColumn" :key="method" :value="method">
                {{ method }}
              </option>
            </select>
            <input v-if="selectedMethod === 'Assign Value'" v-model="assignValue" placeholder="Result Expression" />
          </div>
        </section>
  
        <footer class="MissingValue-footer">
          <slot name="footer">
            <button type="button" class="btn-green" @click="submit" :disabled="!selectedColumn || !selectedMethod">
              Fill Missing Value
            </button>
          </slot>
        </footer>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'MissingValueHandler',
    props: {
      availableColumns: Array,
      columntypes: Array
    }, 
    data() {
      return {
        selectedColumn: '',
        selectedMethod: '',
        assignValue: '',
        searchQuery: '',
        methodsToHandleMissingValuesNumericalCols: ["Mean", "Median", "Most Common", "Assign Value", "Remove Row"],
        methodsToHandleMissingValuesOtherCols: ["Most Common", "Assign Value", "Remove Row"]
      };
    },
    computed: {
      filteredColumns() {
        return this.availableColumns.filter(col =>
          col.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      },
      getMethodsForColumn() {
        const selectedColumnType = this.columntypes[this.selectedColumn];
        if (selectedColumnType === "numeric") {
          return this.methodsToHandleMissingValuesNumericalCols;
        } else {
          return this.methodsToHandleMissingValuesOtherCols;
        }
      }
    },
    methods: {
      selectColumn(col) {
        this.selectedColumn = col;
        this.selectedMethod = '';
      },
      close() {
        this.$emit('close');
      },
      submit() {
        this.$emit('submit', { column: this.selectedColumn, method: this.selectedMethod, value: this.assignValue });
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
    width: 800px; /* Fixed width */
    height: 500px; /* Fixed height */
    border-radius: 10px;
  }
  
  .MissingValue-header,
  .MissingValue-footer {
    padding: 20px;
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
    padding: 20px;
    flex-grow: 1; /* Ensure the body grows to fill available space */
    display: flex;
    flex-direction: row; /* Change to row to place columns side by side */
    overflow-y: hidden; /* Prevent body from scrolling */
    margin: 0;
    background-color: #ffffff;
  }
  
  .column-selection {
    flex: 1; /* Takes up half the space */
    padding-right: 10px;
    border-right: 1px solid #eee;
    display: flex;
    flex-direction: column;
  }
  
  .column-methods {
    flex: 1; /* Takes up half the space */
    padding-left: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .column-list {
    list-style: none;
    padding: 0;
    margin: 0;
    flex-grow: 1;
    overflow-y: auto; /* Make the column list scrollable */
  }
  
  .column-list li {
    padding: 10px;
    cursor: pointer;
    border: 1px solid #ddd;
    margin-bottom: 5px;
    border-radius: 4px;
  }
  
  .column-list li.selected {
    background-color: #4aae9b;
    color: white;
  }
  
  .method-select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .search-input {
    margin-bottom: 10px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 100%;
  }
  
  .btn-green {
    background-color: #4aae9b;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .btn-green:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  </style>
  