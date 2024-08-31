<template>
  <div class="dataVisual-container" role="dialog">
    <div class="dataVisual">
      <!-- Square Tabs at the top -->
      <div class="dataVisual-tabs">
        <ul>
          <li
            v-for="(plot, index) in plots"
            :key="index"
            :class="{ active: selectedPlot === plot }"
            @click="selectPlot(plot)"
          >
            <i :class="getIconForPlot(plot._name)" class="tab-icon"></i>
            <span>{{ plot._name }}</span>
          </li>
        </ul>
      </div>

      <div class="header" @click="toggleCollapse">
        <h2>{{ selectedPlot?._name }}</h2>
        <span :class="{ 'arrow-down': isCollapsed, 'arrow-up': !isCollapsed }"></span>
        <button @click.stop="deleteComponent" class="delete-button">
          <span class="pi pi-minus"></span>
        </button>
      </div>

      <div v-show="!isCollapsed" class="content">
        <div :class="{ 'left-panel': true, 'hidden': isLeftPanelCollapsed }">
          <div v-if="selectedPlot && selectedPlot._properties.length > 0">
            <div class="dataVisual-section">
              <p>Select properties:</p>
              <div class="property-list">
                <div v-for="(property, index) in selectedPlot?._properties" :key="index" class="property-item">
                  <div v-if="index === 0 || (index > 0 && (selectedPlot?._properties[index-1]?.isValid || selectedPlot?._properties[index-1]?.isOptional))">
                    <div class="property-description">{{ property.desc }}</div>
                    <div v-if="property.expects === 'variables'" class="property-options">
                      <Dropdown
                        v-model="property.value"
                        :options="getColumnOptions(property)"
                        placeholder="Select a variable"
                        class="scrollable-dropdown"
                        @change="setProperty(index, property.value)"
                        :show-clear="true"
                      />
                    </div>
                    <div v-if="property.expects === 'values'" class="property-options">
                      <MultiSelect
                        v-if="property.name === 'x_values' ? xValues.length > 0 : hueValues.length > 0"
                        :options="property.name === 'x_values' ? xValues : hueValues"
                        :model-value="Array.from(property.value)"
                        @update:model-value="value => setProperty(index, value)"
                        placeholder="Select values"
                        class="scrollable-dropdown"
                        :show-clear="true"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Advanced Settings Section -->
            <div class="dataVisual-section advanced-settings">
              <div class="advanced-settings-header" @click="toggleAdvancedSettings">
                <span>Advanced Settings</span>
                <i :class="advancedSettingsExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
              </div>
              <div v-show="advancedSettingsExpanded" class="advanced-settings-content">
                <div class="property-list">
                  <div v-for="(property, index) in selectedPlot?._properties" :key="index" class="property-item">
                    <div v-if="property.expects === 'boolean'" class="property-options boolean-property">
                      <span>{{ property.name }}</span>
                      <label class="switch">
                        <input
                          type="checkbox"
                          :checked="property.value"
                          @change="toggleBooleanProperty(index)"
                        />
                        <span class="slider round"></span>
                      </label>
                    </div>
                    <div v-if="property.expects === 'number'" class="property-options">
                      <input type="number" v-model.number="property.value" @input="setProperty(index, property.value)" placeholder="Enter number of bins" />
                    </div>
                    <div v-if="property.expects === 'orientation'" class="property-options">
                      <Dropdown
                        v-model="property.value"
                        :options="['vertical', 'horizontal']"
                        placeholder="Select orientation"
                        class="scrollable-dropdown"
                        :show-clear="true"
                      />
                    </div>
                    <div v-if="property.expects === 'aggregate'" class="property-options">
                      <Dropdown
                        v-model="property.value"
                        :options="['count', 'sum', 'mean', 'min', 'max']"
                        placeholder="Select aggregate function"
                        class="scrollable-dropdown"
                        :show-clear="true"
                      />
                    </div>
                  </div>
                </div>

                <div class="dataVisual-section">
                  <p>Select color theme:</p>
                  <div class="property-options">
                    <Dropdown
                      v-model="selectedColorTheme"
                      :options="colorThemes"
                      optionLabel="name"
                      placeholder="Select a color theme"
                      class="scrollable-dropdown"
                      :show-clear="true"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="canSubmitPlot" class="centered-section">
              <button @click="submitPlot" class="p-button p-component submit-button" :disabled="isLoading">
                Submit Plot
                <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </div>

        <button @click="toggleLeftPanel" class="collapse-button">
          <span v-if="isLeftPanelCollapsed">></span>
          <span v-else><</span>
        </button>

        <div class="main-output" :class="{ 'expanded': isLeftPanelCollapsed }">
          <p v-if="!chartData" class="output-placeholder">Output will be displayed here</p>
          <div v-if="chartType === 'box'" ref="plotlyChart" class="chart-container"></div>
          <canvas v-else ref="chartCanvas" class="chart-container"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>



<script>
import { nextTick } from 'vue';
import { CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem } from '@coreui/vue';
import MultiSelect from 'primevue/multiselect';
import Dropdown from 'primevue/dropdown';
import { Chart, registerables } from 'chart.js';
import Plotly from 'plotly.js-dist';

Chart.register(...registerables);

export default {
  name: 'dataVisuals',
  components: {
    CDropdown,
    CDropdownToggle,
    CDropdownMenu,
    CDropdownItem,
    MultiSelect,
    Dropdown // Register the component
  },
  props: {
    plots: {
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
    },
    numericalColumns: {
      type: Array,
      required: true,
    },
    categoricalColumns: {
      type: Array,
      required: true,
    }
  },
  data() {
    return {
      selectedPlot: null,
      selectedColorTheme: { name: 'Default', colors: ['#FF6384', '#36A2EB', '#FFCE56'] },
      isCollapsed: false,
      isLeftPanelCollapsed: false,
      chartData: null,
      chartOptions: {},
      chartType: 'bar',
      advancedSettingsExpanded: false,
      chart: null,
      isLoading: false,
      colorThemes: [
        { name: 'Default', colors: ['#FF6384', '#36A2EB', '#FFCE56'] },
        { name: 'Cool', colors: ['#4BC0C0', '#36A2EB', '#9966FF'] },
        { name: 'Warm', colors: ['#FF6384', '#FF9F40', '#FFCD56'] },
        { name: 'Monochrome', colors: ['#AAAAAA', '#BBBBBB', '#CCCCCC'] }
      ]
    };
  },
  computed: {
    canSubmitPlot() {
      if (!this.selectedPlot) return false;
      const allValid = this.selectedPlot._properties.every((property) => property.isValid || property.isOptional);
      return allValid;
    },
    hueValues() {
      const hueColumn = this.selectedPlot?._properties.find(prop => prop.name === 'hue')?.value;
      const columnIndex = this.variables.indexOf(hueColumn);
      if (columnIndex !== -1) {
        const uniqueValues = new Set(this.data.slice(1).map(row => row[columnIndex]));
        return Array.from(uniqueValues);
      }
      return [];
    },
    xValues() {
      const xColumn = this.selectedPlot?._properties.find(prop => prop.name === 'x')?.value;
      const columnIndex = this.variables.indexOf(xColumn);
      if (columnIndex !== -1) {
        const uniqueValues = new Set(this.data.slice(1).map(row => row[columnIndex]));
        return Array.from(uniqueValues);
      }
      return [];
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
    toggleAdvancedSettings() {
      this.advancedSettingsExpanded = !this.advancedSettingsExpanded;
    },
    toggleLeftPanel() {
      this.isLeftPanelCollapsed = !this.isLeftPanelCollapsed;
    },
    selectPlot(plot) {
      this.selectedPlot = plot;
      this.plotUpdated();
    },
    setProperty(index, value) {
      const property = this.selectedPlot._properties[index];
      if (property.isArray) {
        property.value = new Set(value);
      } else {
        property.value = value;
      }
      property.isValid = (property.isArray && property.value.size > 0) || (!property.isArray && value !== null && value !== undefined && value !== '');
      
      // Automatically select all unique values in the hue column if the hue property is set
      if (property.name === 'hue' && property.isValid) {
        const hueIndex = this.variables.indexOf(value);
        const uniqueValues = new Set(this.data.slice(1).map(row => row[hueIndex]));
        const hueValuesProperty = this.selectedPlot._properties.find(prop => prop.name === 'hue_values');
        if (hueValuesProperty) {
          hueValuesProperty.value = new Set(uniqueValues);
          hueValuesProperty.isValid = true;
        }
      }
      
      this.plotUpdated();
    },
    toggleBooleanProperty(index) {
      this.selectedPlot._properties[index].value = !this.selectedPlot._properties[index].value;
      this.plotUpdated();
    },
    plotUpdated() {
      this.$emit('updatePlot', this.selectedPlot);
    },
    deleteComponent() {
      this.$emit('deletePlot');
    },
    async submitPlot() {
      this.isLoading = true;
      const selectedValues = this.selectedPlot._properties.reduce((acc, property) => {
        acc[property.name] = property.isArray ? Array.from(property.value) : property.value;
        return acc;
      }, {});

      // Process the selected values to create chartData
      this.generateChartData(selectedValues);

      this.$emit('submittingPlot', selectedValues);

      await nextTick(); // Ensure DOM is updated

      this.renderChart();
      this.isLoading = false;
    },
    getColumnOptions(property) {
      if (property.expects === 'variables') {
        if (this.selectedPlot._name === 'BarPlot' || this.selectedPlot._name === 'BoxWhiskerPlot' || this.selectedPlot._name === 'PieChart') {
          if (property.name === 'x' || property.name === 'hue' || property.name === 'by') {
            return this.categoricalColumns;
          } else if (property.name === 'y' || property.name === 'show') {
            return this.numericalColumns;
          }
        } else if (this.selectedPlot._name === 'Histogram' || this.selectedPlot._name === 'ScatterPlot') {
          if (property.name === 'x' || property.name === 'y') {
            return this.numericalColumns;
          } else if (property.name === 'hue') {
            return this.categoricalColumns;
          }
        }
      }
      return [];
    },
    getIconForPlot(plotName) {
      switch (plotName.toLowerCase()) {
        case 'clustering':
          return 'pi pi-chart-pie';
        case 'regression':
          return 'pi pi-chart-line';
        case 'classification':
          return 'pi pi-list';
        case 'time series':
          return 'pi pi-clock';
        default:
          return 'pi pi-chart-bar';
      }},

    generatePlotTitle(selectedValues) {
      let title = '';
      console.log(selectedValues)
      
      if (selectedValues.y) {
        title += `${selectedValues.y}`;
      }
      
      if (selectedValues.x) {
        title += ` by ${selectedValues.x}`;
      } else if (selectedValues.hue) {
        title += ` by ${selectedValues.hue}`;
      }

      if (selectedValues.hue && selectedValues.x) {
        title += ` and ${selectedValues.hue}`;
      }

      return title;
    },
    generateChartData(selectedValues) {
      const plotType = this.selectedPlot._name.toLowerCase();

      switch (plotType) {
        case 'histogram':
          this.chartType = 'bar';
          this.chartData = this.getHistogramData(selectedValues);
          this.chartOptions = this.getHistogramOptions(selectedValues);
          break;
        case 'barplot':
          this.chartType = 'bar';
          this.chartData = this.getBarPlotData(selectedValues);
          this.chartOptions = this.getBarPlotOptions(selectedValues);
          break;
        case 'boxwhiskerplot':
          this.chartType = 'box';
          this.chartData = this.getBoxWhiskerPlotData(selectedValues);
          this.chartOptions = this.getBoxWhiskerPlotOptions(selectedValues);
          break;
        case 'scatterplot':
          this.chartType = 'scatter';
          this.chartData = this.getScatterPlotData(selectedValues);
          this.chartOptions = this.getScatterPlotOptions(selectedValues);
          break;
        case 'piechart':
          this.chartType = 'pie';
          this.chartData = this.getPieChartData(selectedValues);
          this.chartOptions = this.getPieChartOptions(selectedValues);
          break;
        default:
          console.error('Unsupported plot type:', plotType);
      }
    },
    getPieChartData(selectedValues) {
      const showVariable = selectedValues.y;
      const byVariable = selectedValues.hue;

      const showIndex = this.variables.indexOf(showVariable);
      const byIndex = this.variables.indexOf(byVariable);

      const groupedData = this.data.slice(1).reduce((acc, row) => {
        const byValue = row[byIndex];
        const showValue = Number(row[showIndex]);

        if (!acc[byValue]) {
          acc[byValue] = 0;
        }

        acc[byValue] += showValue;
        return acc;
      }, {});

      const labels = Object.keys(groupedData);
      const data = labels.map(label => groupedData[label]);

      // Use selected color theme for the background color
      const backgroundColor = labels.map((_, index) => {
        return this.selectedColorTheme.colors[index % this.selectedColorTheme.colors.length];
      });

      return {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
          borderColor: '#000000',
          borderWidth: 1,
        }],
      };
    },
    getPieChartOptions(selectedValues) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.generatePlotTitle(selectedValues)
          },
          legend: {
            display: true,
          },
        },
      };
    },
    getBoxWhiskerPlotData(selectedValues) {
      const xVariable = selectedValues.x;
      const yVariable = selectedValues.y;
      const hueVariable = selectedValues.hue || null;
      const hueValues = Array.isArray(selectedValues.hue_values) ? selectedValues.hue_values : Array.from(selectedValues.hue_values || []);

      const xIndex = this.variables.indexOf(xVariable);
      const yIndex = this.variables.indexOf(yVariable);
      const hueIndex = hueVariable ? this.variables.indexOf(hueVariable) : -1;

      const groupedData = this.data.slice(1).reduce((acc, row) => {
        const xValue = row[xIndex];
        const yValue = Number(row[yIndex]);
        const hueValue = hueVariable ? row[hueIndex] : null;

        if (!acc[xValue]) {
          acc[xValue] = {};
        }

        if (hueVariable) {
          if (!acc[xValue][hueValue]) {
            acc[xValue][hueValue] = [];
          }
          acc[xValue][hueValue].push(yValue);
        } else {
          if (!acc[xValue].total) {
            acc[xValue].total = [];
          }
          acc[xValue].total.push(yValue);
        }

        return acc;
      }, {});

      const labels = Object.keys(groupedData);
      let traces = [];
      if (hueVariable) {
        hueValues.forEach(hueValue => {
          const trace = {
            type: 'box',
            name: hueValue,
            x: [],
            y: [],
            boxpoints: false,
            jitter: 0.5,
            pointpos: 0,
            marker: { color: this.getColorForHue(hueValue) }
          };
          labels.forEach(label => {
            const hueData = groupedData[label][hueValue];
            if (hueData) {
              hueData.forEach(y => {
                trace.x.push(label);
                trace.y.push(y);
              });
            }
          });
          traces.push(trace);
        });
      } else {
        const trace = {
          type: 'box',
          name: yVariable,
          x: [],
          y: [],
          boxpoints: false,
          jitter: 0.5,
          pointpos: 0,
          marker: { color: this.getColorForHue(yVariable) }
        };
        labels.forEach(label => {
          const totalData = groupedData[label].total;
          if (totalData) {
            totalData.forEach(y => {
              trace.x.push(label);
              trace.y.push(y);
            });
          }
        });
        traces.push(trace);
      }

      return traces;
    },
    getBoxWhiskerPlotOptions(selectedValues) {
      return {
        title: {
          display: true,
          text: this.generatePlotTitle(selectedValues),
        },
        xaxis: {
          title: selectedValues.x,
        },
        yaxis: {
          title: selectedValues.y,
        },
        boxmode: 'group',
        showlegend: selectedValues.hue ? true : false,
      };
    },
    getHistogramData(selectedValues) {
      const yVariable = selectedValues.y;
      const numBins = selectedValues.num_bins || this.getDefaultNumBins(selectedValues.x);
      const hueVariable = selectedValues.hue || null;
      const hueValues = Array.isArray(selectedValues.hue_values) ? selectedValues.hue_values : Array.from(selectedValues.hue_values || []);

      const yIndex = this.variables.indexOf(yVariable);
      const hueIndex = hueVariable ? this.variables.indexOf(hueVariable) : -1;

      const allValues = this.data.slice(1).map(row => Number(row[yIndex]));

      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      const binSize = (maxValue - minValue) / numBins;

      const bins = Array.from({ length: numBins }, (_, i) => ({
        range: `${(minValue + i * binSize).toFixed(2)} - ${(minValue + (i + 1) * binSize).toFixed(2)}`,
        count: 0,
        hueCounts: hueValues.reduce((acc, hue) => {
          acc[hue] = 0;
          return acc;
        }, {})
      }));

      this.data.slice(1).forEach(row => {
        const value = Number(row[yIndex]);
        const binIndex = Math.min(Math.floor((value - minValue) / binSize), numBins - 1);
        bins[binIndex].count += 1;
        if (hueVariable) {
          const hueValue = row[hueIndex];
          if (hueValues.includes(hueValue)) {
            bins[binIndex].hueCounts[hueValue] += 1;
          }
        }
      });

      let datasets;
      if (hueVariable && hueIndex !== -1) {
        datasets = hueValues.map(hueValue => {
          return {
            label: hueValue,
            data: bins.map(bin => bin.hueCounts[hueValue]),
            backgroundColor: this.getColorForHue(hueValue),
            borderColor: '#000000',
            borderWidth: 1,
          };
        });
      } else {
        datasets = [{
          label: yVariable,
          data: bins.map(bin => bin.count),
          backgroundColor: this.getColorForHue(yVariable),
          borderColor: '#000000',
          borderWidth: 1,
        }];
      }

      return {
        labels: bins.map(bin => bin.range),
        datasets: datasets,
      };
    },
    getHistogramOptions(selectedValues) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: selectedValues.y,
            },
            stacked: true,
          },
          y: {
            title: {
              display: true,
              text: 'Frequency',
            },
            stacked: true,
          },
        },
        plugins: {
          title: {
            display: true,
            text: this.generatePlotTitle(selectedValues),
          },
          legend: {
            display: selectedValues.hue ? true : false,
          },
        },
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      };
    },
    getBarPlotData(selectedValues) {
      const xVariable = selectedValues.x;
      const yVariable = selectedValues.y;
      const hueVariable = selectedValues.hue || null;
      const hueValues = Array.isArray(selectedValues.hue_values) ? selectedValues.hue_values : Array.from(selectedValues.hue_values || []);
      const xValuesFilter = Array.isArray(selectedValues.x_values) ? selectedValues.x_values : Array.from(selectedValues.x_values || []);
      const aggregateFunction = selectedValues.aggregate;

      const xIndex = this.variables.indexOf(xVariable);
      const yIndex = this.variables.indexOf(yVariable);
      const hueIndex = hueVariable ? this.variables.indexOf(hueVariable) : -1;

      const groupedData = this.data.slice(1).filter(row => xValuesFilter.length === 0 || xValuesFilter.includes(row[xIndex])).reduce((acc, row) => {
        const xValue = row[xIndex];
        const yValue = Number(row[yIndex]);
        const hueValue = hueVariable ? row[hueIndex] : null;

        if (!acc[xValue]) {
          acc[xValue] = {};
        }

        if (hueVariable) {
          if (!acc[xValue][hueValue]) {
            acc[xValue][hueValue] = [];
          }
          acc[xValue][hueValue].push(yValue);
        } else {
          if (!acc[xValue].total) {
            acc[xValue].total = [];
          }
          acc[xValue].total.push(yValue);
        }

        return acc;
      }, {});

      const labels = Object.keys(groupedData);
      let datasets;
      if (hueVariable) {
        datasets = hueValues.map(hueValue => {
          return {
            label: `${hueVariable}: ${hueValue}`,
            data: labels.map(label => {
              const hueData = groupedData[label][hueValue];
              if (!hueData) return 0;
              switch (aggregateFunction) {
                case 'count': return hueData.length;
                case 'sum': return hueData.reduce((a, b) => a + b, 0);
                case 'mean': return hueData.reduce((a, b) => a + b, 0) / hueData.length;
                case 'min': return Math.min(...hueData);
                case 'max': return Math.max(...hueData);
                default: return hueData.reduce((a, b) => a + b, 0) / hueData.length;
              }
            }),
            backgroundColor: this.getColorForHue(hueValue),
            borderColor: '#000000',
            borderWidth: 1,
          };
        });
      } else {
        datasets = [{
          label: yVariable,
          data: labels.map(label => {
            const totalData = groupedData[label].total;
            if (!totalData) return 0;
            switch (aggregateFunction) {
              case 'count': return totalData.length;
              case 'sum': return totalData.reduce((a, b) => a + b, 0);
              case 'mean': return totalData.reduce((a, b) => a + b, 0) / totalData.length;
              case 'min': return Math.min(...totalData);
              case 'max': return Math.max(...totalData);
              default: return totalData.reduce((a, b) => a + b, 0) / totalData.length;
            }
          }),
          backgroundColor: this.getColorForHue(yVariable),
          borderColor: '#000000',
          borderWidth: 1,
        }];
      }

      return {
        labels: labels,
        datasets: datasets,
      };
    },
    getBarPlotOptions(selectedValues) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: selectedValues.orientation === 'horizontal' ? 'y' : 'x',
        scales: {
          x: {
            title: {
              display: true,
              text: selectedValues.orientation === 'horizontal' ? selectedValues.y : selectedValues.x,
            },
            stacked: false,
          },
          y: {
            title: {
              display: true,
              text: selectedValues.orientation === 'horizontal' ? selectedValues.x : `${selectedValues.aggregate} of ${selectedValues.y}`,
            },
            stacked: false,
          },
        },
        plugins: {
          title: {
            display: true,
            text: this.generatePlotTitle(selectedValues),
          },
          legend: {
            display: selectedValues.hue ? true : false,
            labels: {
              generateLabels: (chart) => {
                const datasets = chart.data.datasets;
                return datasets.map((dataset, index) => ({
                  text: dataset.label,
                  fillStyle: dataset.backgroundColor,
                  hidden: !chart.isDatasetVisible(index),
                  lineCap: dataset.borderCapStyle,
                  lineDash: dataset.borderDash,
                  lineDashOffset: dataset.borderDashOffset,
                  lineJoin: dataset.borderJoinStyle,
                  strokeStyle: dataset.borderColor,
                  pointStyle: dataset.pointStyle,
                  rotation: 0,
                }));
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function(tooltipItem) {
                const dataset = tooltipItem.dataset;
                const label = dataset.label || '';
                return `${label}: ${tooltipItem.raw}`;
              },
            },
          },
        },
      };
    },
    getScatterPlotData(selectedValues) {
      const xVariable = selectedValues.x;
      const yVariable = selectedValues.y;

      const xIndex = this.variables.indexOf(xVariable);
      const yIndex = this.variables.indexOf(yVariable);

      const xValues = this.data.slice(1).map(row => Number(row[xIndex]));
      const yValues = this.data.slice(1).map(row => Number(row[yIndex]));

      return {
        labels: xValues,
        datasets: [{
          label: `${yVariable} vs ${xVariable}`,
          data: xValues.map((x, i) => ({ x, y: yValues[i] })),
          backgroundColor: this.getColorForHue(xVariable),
          borderColor: '#000000',
          borderWidth: 1,
          pointRadius: 5,
        }],
      };
    },
    getScatterPlotOptions(selectedValues) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: selectedValues.x,
            },
          },
          y: {
            title: {
              display: true,
              text: selectedValues.y,
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: this.generatePlotTitle(selectedValues),
          },
          legend: {
            display: true,
          },
        },
      };
    },
    getDefaultNumBins(xVariable) {
      const dataLength = this.data.length - 1;
      return Math.ceil(Math.sqrt(dataLength));
    },
    getColorForHue(hue) {
      if (this.selectedColorTheme) {
        const themeColors = this.selectedColorTheme.colors;
        const hueIndex = this.hueValues.indexOf(hue);
        if (hueIndex !== -1) {
          return themeColors[hueIndex % themeColors.length];
        } else {
          return themeColors[0];
        }
      }
      return '#000000'; // Default to black if no theme is selected
    },
    renderChart() {
      if (this.chart) {
        this.chart.destroy();
      }
      if (this.chartType === 'box') {
        Plotly.newPlot(this.$refs.plotlyChart, this.chartData, this.chartOptions);
      } else {
        const ctx = this.$refs.chartCanvas.getContext('2d');
        this.chart = new Chart(ctx, {
          type: this.chartType,
          data: this.chartData,
          options: this.chartOptions,
        });
      }
    }
  }
};
</script>


<style>
.dataVisual-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: 'Roboto', sans-serif;
}

.dataVisual {
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 15px;
  margin: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  background-color: #0e2962;
}

.header:hover {
  background-color: #92a6d1;
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
  color: #fff;
}

.content {
  display: flex;
}

.left-panel {
  width: 30%;
  padding: 20px;
  border-right: 1px solid #eee;
  background-color: #ffffff;
  position: relative;
  transition: width 0.3s ease;
}

.hidden {
  display: none;
}

.collapse-button {
  position: absolute;
  right: -10px;
  background: #5d80ca;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background 0.3s ease;
  z-index: 1;
}

.main-output {
  flex-grow: 1;
  padding: 20px;
  background-color: #ffffff;
  transition: flex-grow 0.3s ease;
}

.main-output.expanded {
  flex-grow: 1;
}

.dataVisual-list {
  display: flex;
  flex-direction: column;
}

.property-list {
  display: flex;
  flex-direction: column;
}

.property-item {
  margin-bottom: 15px;
}

.property-description {
  margin-bottom: 5px;
  font-weight: bold;
}

.property-options {
  display: flex;
  flex-direction: column;
}

.variable-dropdown {
  width: 100%;
}

.boolean-property {
  display: flex;
  align-items: center;
}

.boolean-property .switch {
  margin-left: 10px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(14px);
}

.centered-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.submit-button {
  padding: 10px 20px;
  background-color: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

.submit-button:hover {
  background-color: #6d7d9f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.spinner-border {
  margin-left: 10px;
}

.output-placeholder {
  color: #888;
  font-size: 1.2em;
  text-align: center;
}

.chart-container {
  width: 100%;
  height: 400px;
}
.dataVisual-tabs ul {
  display: flex;
  justify-content: space-around;
  padding: 0;
  margin: 20px 0;
  list-style: none;
  gap: 10px; /* Add gap between the tabs */
}

.dataVisual-tabs li {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 13%;
  height: 100px;
  cursor: pointer;
  color: #ffffff;
  background-color: #0e2962;
  transition: background-color 0.3s ease;
  text-align: center;
  border-radius: 10px;
}

.dataVisual-tabs li.active {
  background-color: #5d80ca;
  font-weight: bold;
}

.dataVisual-tabs li:hover {
  background-color: #3b82f6;
}

.tab-icon {
  font-size: 24px;
  margin-bottom: 10px; /* Add space between the icon and the text */
}


.advanced-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  margin-top: 10px;
}

.advanced-settings-header:hover {
  background-color: #e0e0e0;
}

.advanced-settings-content {
  padding: 10px;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-top: 5px;
}

.scrollable-dropdown {
  width: 100%;
}

.p-button.p-component .submit-button {
  margin-top: 20px;
}

</style>
