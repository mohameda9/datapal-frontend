<template>
  <div class="statistical-analysis-container" role="dialog">
    <div class="header" @click="toggleCollapse">
      <h2>Statistical Analysis</h2>
      <span :class="{ 'arrow-down': isCollapsed, 'arrow-up': !isCollapsed }"></span>
      <button @click.stop="deleteComponent" class="delete-button">
        <span class="pi pi-minus"></span>
      </button>
    </div>
    <div v-show="!isCollapsed" class="content">
      <div class="left-panel">
        <div class="left-panel-content">
          <div v-if="groupedTestOptions.length > 0" class="info-section">
            <p class = "property-description">Start by selecting a test type:</p>
            <Dropdown 
              v-model="selectedTestOption" 
              :options="groupedTestOptions" 
              optionLabel="name" 
              optionGroupLabel="group" 
              optionGroupChildren="tests" 
              placeholder="Select Test" 
              class="small-dropdown"
              @change="selectTest"
            >
              <template #optiongroup="slotProps">
                <div class="flex items-center">
                  <div>{{ slotProps.option.group }}</div>
                </div>
              </template>
              <template #option="slotProps">
                <div class="flex items-center">
                  <div>{{ slotProps.option.name }}</div>
                </div>
              </template>
            </Dropdown>
          </div>
          <div v-if="selectedTest && selectedTest._properties && selectedTest._properties.length > 0" class="test-section">
            <div class="property-list column">
              <div v-for="(property, index) in selectedTest._properties" :key="index" class="property-item" v-show="showProperty(property.name)">
                <div class="property-description">{{ property.desc }}</div>
                <div v-if="property.expects === 'variable'" class="property-options">
                  <Dropdown 
                    v-model="property.value" 
                    :options="variables" 
                    placeholder="Select a variable"
                    @change="setProperty(index, property.value)"
                    class="small-dropdown"
                  />
                </div>
                <div v-if="property.expects === 'number'" class="property-options">
                  <input 
                    type="number" 
                    v-model.number="property.value" 
                    @input="validateNumber(index, property.value)" 
                    placeholder="Enter value" 
                    step="0.01"
                    class="small-input"
                  />
                  <span v-if="property.error" class="error">{{ property.error }}</span>
                </div>
                <div v-if="property.expects === 'comparison'" class="property-options">
                  <Dropdown 
                    v-model="property.value" 
                    :options="['<', '>', '=']" 
                    placeholder="Select comparison"
                    @change="setProperty(index, property.value)"
                    class="small-dropdown"
                  />
                </div>
                <div v-if="property.expects === 'categories'" class="property-options">
                  <MultiSelect
                    :options="getCategoryOptions(property)"
                    :model-value="Array.from(property.value)"
                    @update:model-value="value => handleCategorySelection(index, value)"
                    placeholder="Select exactly two categories"
                    class="small-dropdown"
                  />
                </div>
                <div v-if="property.expects === 'variables'" class="property-options">
                  <MultiSelect
                    :options="variables"
                    :model-value="Array.from(property.value)"
                    placeholder="Select columns"
                    @update:model-value="value => setProperty(index, value)"
                    class="small-dropdown"
                  />
                </div>
                <div v-if="property.expects === 'select'" class="property-options">
                  <Dropdown 
                    v-model="property.value" 
                    :options="property.options" 
                    placeholder="Select option"
                    @change="setProperty(index, property.value)"
                    class="small-dropdown"
                  />
                </div>
                <div v-if="property.expects === 'boolean'" class="property-options">
                  <label>
                    <input 
                      type="checkbox" 
                      v-model="property.value" 
                      @change="setProperty(index, property.value)"
                    />
                    Assume equal variances
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div v-if="selectedTest && isFormValid()" class="centered-section sticky-submit">
            <button @click="submitTest" class="p-button p-component submit-button" :disabled="isLoading">
              Submit Test
              <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>
      <div class="main-output-container">
        <div class="main-output" :class="{ 'expanded': isLeftPanelCollapsed }">
          <p v-if="!resultData" class="property-description">Results will be displayed here</p>
          <div v-if="resultData && resultData.summary_statistics" class="summary-statistics">
            <h4 class="property-description">Summary Statistics</h4>
            <div class="table-container">
              <table class="result-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Count</th>
                    <th>Sum</th>
                    <th>Mean</th>
                    <th>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(stats, group) in resultData.summary_statistics" :key="group">
                    <td>{{ group }}</td>
                    <td>{{ stats.count }}</td>
                    <td>{{ stats.sum }}</td>
                    <td>{{ stats.mean }}</td>
                    <td>{{ stats.variance }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="resultData && resultData.test_results" class="result-container">
            <h4 class="property-description">Test Results</h4>
            <div class="table-container">
              <table class="result-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(value, key) in resultData.test_results" :key="key">
                    <td>{{ key }}</td>
                    <td>{{ value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="resultData && resultData.distribution_parameters" class="distribution-parameters">
            <h4 class="property-description">Distribution Parameters</h4>
            <div class="table-container">
              <table class="result-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(value, key) in resultData.distribution_parameters" :key="key">
                    <td>{{ key}}</td>
                    <td>{{ value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="resultData && resultData.correlation_matrix" class="correlation-matrix">
            <h4 class="property-description">Correlation Matrix</h4>
            <div class="table-container">
              <table class="result-table heatmap-table">
                <thead>
                  <tr>
                    <th> </th>
                    <th v-for="(value, key) in resultData.correlation_matrix" :key="key">{{ key }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowKey) in resultData.correlation_matrix" :key="rowKey">
                    <td>{{ rowKey }}</td>
                    <td v-for="(value, colKey) in row" :key="colKey" :style="{ backgroundColor: getHeatmapColor(value) }">{{ value.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="resultData && resultData.p_value_matrix" class="p-value-matrix">
            <h4 class="property-description">P-Value Matrix</h4>
            <div class="table-container">
              <table class="result-table">
                <thead>
                  <tr>
                    <th> </th>
                    <th v-for="(value, key) in resultData.p_value_matrix" :key="key">{{ key }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rowKey) in resultData.p_value_matrix" :key="rowKey">
                    <td>{{ rowKey }}</td>
                    <td v-for="(value, colKey) in row" :key="colKey">{{ value.toFixed(3) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="resultData && resultData.group_summary" class="group-summary">
            <h4 class = "property-description">Group Summary</h4>
            <div class="table-container">
              <table class="result-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th v-for="stat in getSummaryStatsHeaders(resultData.group_summary)" :key="stat">{{ stat }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(stats, group) in resultData.group_summary" :key="group">
                    <td>{{ group }}</td>
                    <td v-for="stat in getSummaryStatsHeaders(resultData.group_summary)" :key="stat">{{ stats[stat] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="resultData && resultData.post_hoc && resultData.post_hoc.results.length" class="post-hoc-analysis">
            <h4 class = "property-description">Post Hoc Analysis ({{ resultData.post_hoc.test }})</h4>
            <div class="table-container">
              <table class="result-table">
                <thead>
                  <tr>
                    <th v-for="(value, key) in resultData.post_hoc.results[0]" :key="key">{{ key }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(result, index) in resultData.post_hoc.results" :key="index">
                    <td v-for="(value, key) in result" :key="key">{{ value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-if="resultData && resultData.histogram_data && resultData.distribution_data" class="distribution-plot">
            <h4>Distribution Plot</h4>
            <line-chart :histogram-data="resultData.histogram_data" :distribution-data="resultData.distribution_data"></line-chart>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { nextTick } from 'vue';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import axios from '@/axios.js'; // Path to the axios.js file
import LineChart from '@/components/LineChart.vue'; // Import the LineChart component

export default {
  name: 'statisticalAnalysis',
  components: {
    MultiSelect,
    Dropdown,
    LineChart, // Register the LineChart component
  },
  props: {
    tests: {
      type: Array,
      required: true,
    },
    variables: {
      type: Array,
      default: () => [],
    },
    data: {
      type: Array,
      required: true,
    }
  },
  data() {
    return {
      selectedTestOption: null, // To store the selected option from dropdown
      selectedTest: null,
      selectedTestGroup: null,
      isCollapsed: false,
      isLeftPanelCollapsed: false,
      isLoading: false,
      resultData: null,
      groupCollapsed: {},
      groupedTests: {
        'Parametric Tests': [],
        'Non-Parametric Tests': [],
        'Correlation Tests': [],
        'Distribution Tests': [], // Added group for distribution tests
      },
      groupedTestOptions: [],
    };
  },
  created() {
    this.groupTests();
    this.prepareGroupedTestOptions();
  },
  methods: {
    groupTests() {
      this.tests.forEach(test => {
        if (['OneSampleTTest', 'IndependentTwoSampleTTest', 'PairedSampleTTest', 'OneWayANOVA'].includes(test._name)) {
          this.groupedTests['Parametric Tests'].push(test);
        } else if (['MannWhitneyUTest', 'KruskalWallisTest'].includes(test._name)) {
          this.groupedTests['Non-Parametric Tests'].push(test);
        } else if (['Correlation'].includes(test._name)) {
          this.groupedTests['Correlation Tests'].push(test);
        } else if (['KolmogorovSmirnovTest'].includes(test._name)) {
          this.groupedTests['Distribution Tests'].push(test);
        }
      });

      Object.keys(this.groupedTests).forEach(group => {
        this.groupCollapsed[group] = true;
      });
    },
    prepareGroupedTestOptions() {
      this.groupedTestOptions = Object.keys(this.groupedTests).map(group => {
        return {
          group: group,
          tests: this.groupedTests[group].map(test => {
            return {
              name: test._name,
              test: test,
            };
          }),
        };
      });
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
    toggleLeftPanel() {
      this.isLeftPanelCollapsed = !this.isLeftPanelCollapsed;
    },
    toggleGroup(groupName) {
      this.$set(this.groupCollapsed, groupName, !this.groupCollapsed[groupName]);
    },
    selectTest() {
      this.selectedTest = this.selectedTestOption.test;
      console.log("Selected Test: ", this.selectedTest);
    },
    setProperty(index, value) {
      this.selectedTest.updateProperty(index, value);
      console.log("Updated Property: ", this.selectedTest._properties[index]);
      this.testUpdated();
    },
    setPropertyByName(name, value) {
      const property = this.selectedTest._properties.find(prop => prop.name === name);
      if (property) {
        this.selectedTest.updateProperty(this.selectedTest._properties.indexOf(property), value);
        console.log("Updated Property By Name: ", property);
        this.testUpdated();
      }
    },
    setGroupRepresentation(value) {
      const property = this.selectedTest._properties.find(prop => prop.name === 'group_representation');
      if (property) {
        this.selectedTest.updateProperty(this.selectedTest._properties.indexOf(property), value);
        console.log("Updated Group Representation: ", property);
        this.testUpdated();
      }
    },
    handleCategorySelection(index, value) {
      if (value.length > 2) {
        value.splice(2); // Keep only the first two selections
      }
      this.setProperty(index, value);
    },
    handleFactorSelection(index, value) {
      if (value.length > 3) {
        value.splice(3); // Keep only up to three selections
      }
      this.setProperty(index, value);
    },
    showProperty(propertyName) {
      if (!this.selectedTest) return false;

      if (this.selectedTest._name === 'Correlation') {
        return propertyName === 'columns' || propertyName === 'correlation_type' || propertyName === 'nan_handling';
      }

      if (this.selectedTest._name === 'IndependentTwoSampleTTest' || this.selectedTest._name === 'PairedSampleTTest' || this.selectedTest._name === 'MannWhitneyUTest') {
        const comparisonType = this.selectedTest._properties.find(prop => prop.name === 'comparison_type')?.value;
        if (propertyName === 'variable1' || propertyName === 'variable2') {
          return comparisonType === 'Compare two columns';
        }
        if (propertyName === 'numeric_variable' || propertyName === 'categorical_variable' || propertyName === 'categories') {
          return comparisonType === 'Compare one column by category';
        }
      }

      if (this.selectedTest._name === 'OneWayANOVA' || this.selectedTest._name === 'KruskalWallisTest') {
        const groupRepresentation = this.selectedTest._properties.find(prop => prop.name === 'group_representation')?.value;
        if (propertyName === 'numeric_variable' || propertyName === 'categorical_variable') {
          return groupRepresentation === 'Groups in one column';
        }
        if (propertyName === 'group_columns') {
          return groupRepresentation === 'Groups in separate columns';
        }
        return true;
      }

      return true;
    },
    testUpdated() {
      this.$emit('updateTest', this.selectedTest);
    },
    validateConfidenceLevel(index, value) {
      const property = this.selectedTest._properties[index];
      if (value < 0 || value > 1) {
        property.error = 'Confidence level must be between 0 and 1';
        property.isValid = false;
      } else {
        property.error = null;
        property.isValid = true;
      }
      this.setProperty(index, value);
    },
    validateNumber(index, value) {
      const property = this.selectedTest._properties[index];
      property.error = null;
      property.isValid = true;
      this.setProperty(index, value);
    },
    isFormValid() {
      if (!this.selectedTest || !this.selectedTest._properties) return false;
      const isValid = this.selectedTest.isValid();
      console.log("Form Valid: ", isValid, " for test ", this.selectedTest._name);
      return isValid;
    },
    async submitTest() {
      this.isLoading = true;
      const selectedValues = this.selectedTest._properties.reduce((acc, property) => {
        acc[property.name] = property.isArray ? Array.from(property.value) : property.value;
        return acc;
      }, {});

      const dataToSend = {
        data: this.data.map(row => ({ columns: row }))
      };
      const requestBody = {
        data: dataToSend,
        statConfig: {
          test: this.selectedTest._name,
          values: selectedValues
        }
      };

      try {
        const response = await axios.post(this.selectedTest._name === 'KolmogorovSmirnovTest' ? '/goodFit' : '/stat', requestBody, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        this.resultData = response.data;
      } catch (error) {
        console.error('Error:', error);
        this.resultData = 'An error occurred while processing the request.';
      }

      await nextTick();
      this.isLoading = false;
    },
    getSummaryStatsHeaders(summaryStatistics) {
      return Object.keys(summaryStatistics[Object.keys(summaryStatistics)[0]]);
    },
    getCategoryOptions(property) {
      if (property.expects === 'categories') {
        const categoricalVariable = this.selectedTest._properties.find(prop => prop.name === 'categorical_variable').value;
        const columnIndex = this.variables.indexOf(categoricalVariable);
        if (columnIndex !== -1) {
          const uniqueValues = new Set(this.data.slice(1).map(row => row[columnIndex]));
          return Array.from(uniqueValues);
        }
      }
      return [];
    },
    getHeatmapColor(value) {
      const intensity = Math.abs(value);
      const lightness = 1 - intensity;
      const hue = value > 0 ? 120 : 0; // 120 for green, 0 for red
      return `hsl(${hue}, 100%, ${lightness * 80 + 20}%)`;
    },
    getParameterLabel(key) {
      switch (key) {
        case 0:
          return 'Location (Mean)';
        case 1:
          return 'Scale (Standard Deviation)';
        default:
          return `Shape Parameter ${key}`;
      }
    }
  }
};
</script>

<style scoped>
.statistical-analysis-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: 'Roboto', sans-serif;
  margin-bottom: 20px;
  background: #5f748e;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #71ace3;
  color: rgb(0, 0, 0);
  cursor: pointer;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.header h2 {
  margin: 0;
  font-size: 1.5em;
}

.header .pi {
  font-size: 1.2em;
}

.header .arrow-down:before {
  content: '▼';
}

.header .arrow-up:before {
  content: '▲';
}

.header .delete-button {
  background: none;
  border: none;
  cursor: pointer;
  color: white;
}

.content {
  display: flex;
  flex-direction: row;
}

.left-panel {
  width: 25%;
  display: flex;
  justify-content: center;
  border-right: 5px solid #0f151a;
  background: #5f748e;
  position: relative;
  min-height: 10vh;
  max-height: 60vh; /* Adjust height based on your header/footer size */
  overflow-y: auto;
}

.left-panel-content {
  width: 100%;
  max-width: 300px;
  padding: 20px;
}

.centered-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  position: sticky;
  bottom: 0;
  padding: 10px 0;
}

.inline {
  display: flex;
  align-items: center;
  gap: 15px;
}

.main-output-container {
  width: 75%;
  padding: 20px;
  max-height: 60vh; /* Adjust height based on your header/footer size */
  overflow-y: auto;
}

.main-output {
  background: #5f748e;
  padding-bottom: 20px;
  border-radius: 10px;
}

.main-output.expanded {
  flex-grow: 1;
}

.test-groups {
  display: flex;
  flex-direction: column;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #263c55;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
}

.group-header h3 {
  margin: 0;
  color: #007bff;
}

.test-dropdown .group-item {
  display: flex;
  flex-direction: column;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-toggle {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
}

.dropdown-toggle:hover {
  background-color: #0056b3;
}

.dropdown-menu {
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
  margin-top: 5px;
  border-radius: 5px;
  overflow: hidden;
}

.dropdown-menu.show {
  display: block;
}

.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #ddd;
}

.nested-dropdown {
  padding-left: 20px;
}

.nested-dropdown-item {
  padding: 5px 0;
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.property-item {
  display: flex;
  flex-direction: column;
}

.property-description {
  margin-bottom: 5px;
  font-weight: bold;
  color: #ffffff;
}

.property-options {
  display: flex;
  flex-direction: column;
}

.error {
  color: red;
  font-size: 0.9em;
}

.variable-dropdown,
.comparison-dropdown {
  width: 100%;
}

.submit-button {
  padding: 10px 20px;
  background-color: #010912;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.submit-button:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

.submit-button[disabled] {
  background-color: #b0c4de;
  cursor: not-allowed;
}

.spinner-border {
  margin-left: 10px;
}

.output-placeholder {
  color: #888;
  font-size: 1.2em;
  text-align: center;
}

.result-container {
  padding: 20px;
  border: 1px solid #20272e;
  border-radius: 5px;
}

.result-container h3,
.result-container h4 {
  margin: 0 0 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #007bff;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.result-table-wrapper {
  overflow-x: auto;
}

.result-table th,
.result-table td {
  padding: 10px;
  border: 1px solid #007bff;
  text-align: left;
}

.result-table th {
  background-color: #263c55;
  color: #ffffff;
  font-weight: bold;
}

.result-table td {
  background-color: #041727;
  color: #ffffff;
}

.heatmap-table td {
  text-align: center;
}

.table-container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 400px;
}

.table-container::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.table-container::-webkit-scrollbar-thumb {
  background-color: #007bff;
  border-radius: 10px;
}

.table-container::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

/* Custom styles for smaller dropdowns */
.small-dropdown {
  width: 100%;
  max-width: 300px;
}

.small-input {
  width: 100%;
  max-width: 300px;
}
</style>
