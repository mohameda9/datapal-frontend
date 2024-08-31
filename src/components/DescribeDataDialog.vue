<template>
    <Dialog :visible="visible" @hide="closeDialog" header="Describe Data" class="custom-dialog" :style="{ width: '46rem' }" modal>
      <div v-if="metadata && metadata.description_metadata">
        <div class="dropdown-container">
          <Dropdown
            v-model="selectedColumn"
            :options="columnOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a column"
            class="column-dropdown"
          />
        </div>
        <div v-if="selectedColumn && selectedColumnDesc" class="column-stats-container">
          <h3>{{ selectedColumn }}</h3>
          <div v-if="selectedColumnDesc.histogram" class="chart-container">
            <canvas id="histogram"></canvas>
          </div>
          <div class="stats-card">
            <h4>Summary stats</h4>
            <div class="stats-table-container">
              <table class="stats-table">
                <tbody>
                  <tr v-for="(value, key, index) in selectedColumnDesc.stats" :key="key" :class="{'grey-row': index % 2 === 0}">
                    <td class="stats-key">{{ key }}</td>
                    <td class="stats-value">{{ formatNumber(value) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <template v-slot:footer>
        <Button label="Submit" icon="pi pi-check" @click="submit" />
        <Button label="Close" icon="pi pi-times" class="p-button-secondary" @click="closeDialog" />
      </template>
    </Dialog>
  </template>
  
  <script>
  import { ref, watch, nextTick } from 'vue';
  import Dialog from 'primevue/dialog';
  import Button from 'primevue/button';
  import Dropdown from 'primevue/dropdown';
  import Chart from 'chart.js/auto';
  
  export default {
    name: 'DescribeDataDialog',
    props: {
      visible: {
        type: Boolean,
        required: true
      },
      metadata: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        selectedDescription: null,
        selectedColumn: null,
        selectedColumnDesc: null,
        columnOptions: [],
        chartInstance: null
      };
    },
    watch: {
      visible(newValue) {
        if (newValue && this.metadata && this.metadata.description_metadata) {
          this.selectDescription(this.metadata);
        }
      },
      selectedDescription: {
        handler(newValue) {
          if (newValue) {
            this.columnOptions = Object.keys(newValue.description_metadata).map(column => ({ label: column, value: column }));
            this.selectColumn(this.columnOptions[0].value);
          }
        },
        immediate: true
      },
      selectedColumn(newValue) {
        if (this.selectedDescription) {
          this.selectedColumnDesc = this.selectedDescription.description_metadata[newValue];
          this.renderHistogram();
        }
      },
      metadata: {
        handler(newValue) {
          if (newValue && newValue.description_metadata) {
            this.selectedDescription = newValue;
            this.selectedColumn = newValue.selectedColumn || null;
            this.selectedColumnDesc = newValue.selectedColumnDesc || null;
            this.columnOptions = Object.keys(newValue.description_metadata).map(column => ({ label: column, value: column }));
          }
        },
        immediate: true
      }
    },
    methods: {
      closeDialog() {
        this.$emit('update:visible', false);
        this.$emit('close');
      },
      submit() {
        // No need to pass any data back to the parent
        this.$emit('submit');
      },
      selectDescription(description) {
        this.selectedDescription = description;
      },
      selectColumn(column) {
        this.selectedColumn = column;
      },
      formatNumber(value) {
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        return value;
      },
      async renderHistogram() {
        if (this.selectedColumnDesc && this.selectedColumnDesc.histogram) {
          await nextTick();
  
          const ctx = document.getElementById('histogram').getContext('2d');
  
          if (this.chartInstance) {
            this.chartInstance.destroy();
          }
  
          this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: this.selectedColumnDesc.histogram.bins,
              datasets: [{
                label: 'Counts',
                data: this.selectedColumnDesc.histogram.counts,
                backgroundColor: 'rgba(0, 0, 255, 0.2)',
                borderColor: 'rgba(0, 0, 255, 1)',
                borderWidth: 1
              }]
            },
            options: {
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Bins'
                  },
                  grid: {
                    display: false
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Counts'
                  },
                  grid: {
                    display: false
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                }
              }
            }
          });
        }
      }
    },
    components: {
      Dialog,
      Button,
      Dropdown
    }
  };
  </script>
  
  <style scoped>
  .custom-dialog .p-dialog-content {
    background-color: #ffffff;
    color: #000000;
  }
  
  .custom-dialog .p-dialog-header {
    background-color: #ffffff;
    color: #000000;
  }
  
  .dropdown-container {
    margin-bottom: 20px;
  }
  
  #histogram {
    max-width: 100%;
    height: auto;
  }
  
  .column-dropdown {
    width: 100%;
  }
  
  .column-stats-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .chart-container {
    flex: 1;
  }
  
  .stats-card {
    background-color: #ffffff;
    padding: 15px;
    border-radius: 5px;
  }
  
  .stats-table-container {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .stats-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #dddddd;
  }
  
  .stats-table tbody tr {
    border-bottom: 1px solid #dddddd;
  }
  
  .grey-row {
    background-color: #e0e0e0;
  }
  
  .stats-key {
    font-weight: bold;
    padding: 8px;
    border: 1px solid #dddddd;
  }
  
  .stats-value {
    padding: 8px;
    border: 1px solid #dddddd;
  }
  </style>
  