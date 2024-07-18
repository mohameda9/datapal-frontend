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
        <div v-if="Object.keys(groupedTests).length > 0" class="info-section">
          <p>Start by selecting a test type:</p>
          <div class="test-groups">
            <div v-for="(group, groupName) in groupedTests" :key="groupName">
              <div class="group-header" @click="toggleGroup(groupName)">
                <h3>{{ groupName }}</h3>
                <span :class="{ 'arrow-down': !groupCollapsed[groupName], 'arrow-up': groupCollapsed[groupName] }"></span>
              </div>
              <div v-show="!groupCollapsed[groupName]" class="test-list row">
                <button
                  v-for="(test, idx) in group"
                  :key="idx"
                  @click="selectTest(test, groupName)"
                  :class="{ selected: test === selectedTest }"
                  class="test-button"
                >
                  {{ test._name }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="selectedTest && !groupCollapsed[selectedTestGroup]" class="test-section">
          <p>Select properties:</p>
          <div class="property-list column">
            <div v-for="(property, index) in selectedTest._properties" :key="index" class="property-item" v-show="showProperty(property.name)">
              <div class="property-description">{{ property.desc }}</div>
              <div v-if="property.expects === 'variable'" class="property-options">
                <CDropdown class="variable-dropdown">
                  <CDropdownToggle color="primary">
                    {{ property.value || 'Select a variable' }}
                  </CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem
                      v-for="(variable, idx) in variables"
                      :key="idx"
                      @click="setProperty(index, variable)"
                    >
                      {{ variable }}
                    </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
              </div>
              <div v-if="property.expects === 'number'" class="property-options">
                <input 
                  type="number" 
                  v-model.number="property.value" 
                  @input="validateNumber(index, property.value)" 
                  placeholder="Enter value" 
                  step="0.01"
                />
                <span v-if="property.error" class="error">{{ property.error }}</span>
              </div>
              <div v-if="property.expects === 'comparison'" class="property-options">
                <CDropdown class="comparison-dropdown">
                  <CDropdownToggle color="primary">
                    {{ property.value || 'Select comparison' }}
                  </CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem @click="setProperty(index, '<')"> < </CDropdownItem>
                    <CDropdownItem @click="setProperty(index, '>')"> > </CDropdownItem>
                    <CDropdownItem @click="setProperty(index, '=')"> = </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
              </div>
              <div v-if="property.expects === 'categories'" class="property-options">
                <MultiSelect
                  :options="getCategoryOptions(property)"
                  :model-value="Array.from(property.value)"
                  @update:model-value="value => handleCategorySelection(index, value)"
                  :placeholder="'Select exactly two categories'"
                />
              </div>
              <div v-if="property.expects === 'variables'" class="property-options">
                <MultiSelect
                  :options="variables"
                  :model-value="Array.from(property.value)"
                  :placeholder="'Select columns'"
                  @update:model-value="value => setProperty(index, value)"
                />
              </div>
              <div v-if="property.expects === 'select'" class="property-options">
                <CDropdown class="comparison-dropdown">
                  <CDropdownToggle color="primary">
                    {{ property.value || 'Select comparison type' }}
                  </CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem
                      v-for="(option, idx) in property.options"
                      :key="idx"
                      @click="setProperty(index, option)"
                    >
                      {{ option }}
                    </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
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
      <div class="main-output" :class="{ 'expanded': isLeftPanelCollapsed }">
        <p v-if="!resultData" class="output-placeholder">Results will be displayed here</p>
        <div v-if="resultData && resultData.test_results" class="result-container">
          <h4>Ho: {{ resultData.test_results.null_hypothesis }}</h4>
          <h4>H1: {{ resultData.test_results.alternative_hypothesis }}</h4>
          <div v-if="resultData.summary_statistics" class="summary-statistics">
            <h4>Summary Statistics</h4>
            <table class="result-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th v-for="stat in getSummaryStatsHeaders(resultData.summary_statistics)" :key="stat">{{ stat }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(stats, group) in resultData.summary_statistics" :key="group">
                  <td>{{ group }}</td>
                  <td v-for="stat in getSummaryStatsHeaders(resultData.summary_statistics)" :key="stat">{{ stats[stat] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h4>Test Results</h4>
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
          <div v-if="resultData.group_summary" class="group-summary">
            <h4>Group Summary</h4>

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
          <div v-if="resultData.post_hoc && resultData.post_hoc.results.length" class="post-hoc-analysis">
            <h4>Post Hoc Analysis ({{ resultData.post_hoc.test }})</h4>
            <div class="result-table-wrapper">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { nextTick } from 'vue';
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem } from '@coreui/vue';
import MultiSelect from 'primevue/multiselect';
import axios from '@/axios.js'; // Path to the axios.js file

export default {
  name: 'statisticalAnalysis',
  components: {
    CDropdown,
    CDropdownToggle,
    CDropdownMenu,
    CDropdownItem,
    MultiSelect,
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
      }
    };
  },
  created() {
    this.groupTests();
  },
  methods: {
    groupTests() {
      this.tests.forEach(test => {
        if (['OneSampleTTest', 'IndependentTwoSampleTTest', 'PairedSampleTTest', 'OneWayANOVA'].includes(test._name)) {
          this.groupedTests['Parametric Tests'].push(test);
        } else if (['MannWhitneyUTest', 'KruskalWallisTest'].includes(test._name)) {
          this.groupedTests['Non-Parametric Tests'].push(test);
        }
      });

      Object.keys(this.groupedTests).forEach(group => {
        this.groupCollapsed[group] = true;
      });
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
    toggleLeftPanel() {
      this.isLeftPanelCollapsed = !this.isLeftPanelCollapsed;
    },
    toggleGroup(groupName) {
      Object.keys(this.groupCollapsed).forEach(group => {
        if (group !== groupName) {
          this.groupCollapsed[group] = true;
        }
      });
      this.groupCollapsed[groupName] = !this.groupCollapsed[groupName];

      if (this.groupCollapsed[groupName]) {
        this.selectedTest = null;
        this.selectedTestGroup = null;
      }
    },
    selectTest(test, groupName) {
      this.selectedTest = test;
      this.selectedTestGroup = groupName;
    },
    setProperty(index, value) {
      const property = this.selectedTest._properties[index];
      if (property.isArray) {
        property.value = value;
        property.isValid = value.length > 0;
      } else {
        property.value = value;
        property.isValid = value !== null && value !== undefined && value !== '';
      }
      this.testUpdated();
    },
    setPropertyByName(name, value) {
      const property = this.selectedTest._properties.find(prop => prop.name === name);
      if (property) {
        property.value = value;
        property.isValid = value !== null && value !== undefined && value !== '';
        this.testUpdated();
      }
    },
    setGroupRepresentation(value) {
      const property = this.selectedTest._properties.find(prop => prop.name === 'group_representation');
      if (property) {
        property.value = value;
        property.isValid = value !== null && value !== undefined && value !== '';
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
      return this.selectedTest && this.selectedTest.isValid();
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
        const response = await axios.post('/stat', requestBody, {
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
      const firstGroup = Object.values(summaryStatistics)[0];
      return Object.keys(firstGroup);
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
  background: #f4f4f9;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #007bff;
  color: white;
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
  width: 35%;
  padding: 20px;
  border-right: 1px solid #ddd;
  background-color: #f9f9f9;
  position: relative;
  max-height: calc(100vh - 100px); /* Adjust height based on your header/footer size */
  overflow-y: auto;
}

.centered-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  position: sticky;
  bottom: 0;
  background-color: #f9f9f9;
  padding: 10px 0;
}

.inline {
  display: flex;
  align-items: center;
  gap: 15px;
}

.main-output {
  flex-grow: 1;
  padding: 20px;
  background-color: #fff;
  overflow-y: auto;
  max-height: calc(100vh - 100px); /* Adjust height based on your header/footer size */
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
  background-color: #e9ecef;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
}

.group-header h3 {
  margin: 0;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.test-button {
  flex: 1 1 30%;
  background-color: #007bff;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.test-button:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

.test-button.selected {
  background-color: #0056b3;
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
  color: #333;
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
  background-color: #007bff;
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
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #ffffff;
}

.result-container h3,
.result-container h4 {
  margin: 0 0 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ddd;
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
  border: 1px solid #ddd;
  text-align: left;
}

.result-table th {
  background-color: #f2f2f2;
}

.result-table td {
  background-color: #fafafa;
}
</style>
