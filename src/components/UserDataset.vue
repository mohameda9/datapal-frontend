<template>
  <div class="data-table-container">
    <div class="table-header">
      Data Overview
      <button @click="openStatsModal" class="stats-button">View Column Stats</button>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="(header, colIndex) in dataHeaders" :key="colIndex">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in paginatedData" :key="rowIndex">
            <td v-for="(header, colIndex) in dataHeaders" :key="colIndex">{{ row[header] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <button @click="firstPage" :disabled="currentPage === 1">&lt;&lt;</button>
      <button @click="prevPage" :disabled="currentPage === 1">&lt;</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">&gt;</button>
      <button @click="lastPage" :disabled="currentPage === totalPages">&gt;&gt;</button>
    </div>

    <Dialog header="Column Statistics" v-model:visible="statsModalVisible" class="custom-dialog">
      <div class="dialog-content">
        <Dropdown v-model="selectedColumn" :options="dropdownOptions" placeholder="Select a column" @change="fetchColumnStats" class="dropdown" />
        <div v-if="columnStats">
          <h3>Statistics for {{ selectedColumn }}</h3>
          <div class="stats-container">
            <div class="stats-details" v-if="columnStats.stats">
              <p><strong>Count:</strong> {{ columnStats.stats.count }}</p>
              <p v-if="isNumeric"><strong>Mean:</strong> {{ columnStats.stats.mean.toFixed(2) }}</p>
              <p v-if="isNumeric"><strong>Median:</strong> {{ columnStats.stats.median }}</p>
              <p v-if="!isNumeric"><strong>Mode (top 3):</strong> {{ columnStats.stats.mode.join(', ') }}</p>
              <p v-if="isNumeric"><strong>StdDev:</strong> {{ columnStats.stats.std.toFixed(2) }}</p>
              <p v-if="isNumeric"><strong>Variance:</strong> {{ columnStats.stats.var.toFixed(2) }}</p>
              <p v-if="isNumeric"><strong>Min:</strong> {{ columnStats.stats.min }}</p>
              <p v-if="isNumeric"><strong>25%:</strong> {{ columnStats.stats['25%'] }}</p>
              <p v-if="isNumeric"><strong>50%:</strong> {{ columnStats.stats['50%'] }}</p>
              <p v-if="isNumeric"><strong>75%:</strong> {{ columnStats.stats['75%'] }}</p>
              <p v-if="isNumeric"><strong>Max:</strong> {{ columnStats.stats.max }}</p>
              <p><strong>Missing:</strong> {{ columnStats.stats.missing }}</p>
            </div>
            <div class="chart-container">
              <canvas v-if="columnStats.histogram" id="histogram" class="stats-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script>
import { ref, nextTick } from 'vue';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import Chart from 'chart.js/auto';
import axios from '@/axios.js'; // Path to the axios.js file

export default {
  name: 'UserDataset',
  components: {
    Dropdown,
    Dialog
  },
  props: {
    data: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      currentPage: 1,
      rowsPerPage: 20,
      statsModalVisible: false,
      selectedColumn: null,
      columnStats: null,
      isLoading: false,
      chartInstance: null, // Track the Chart.js instance
      isNumeric: true, // Track if the column is numeric
    };
  },
  computed: {
    dataHeaders() {
      return this.data.length > 0 ? this.data[0] : [];
    },
    tableData() {
      return this.data.slice(1).map(row => {
        const obj = {};
        this.dataHeaders.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
    },
    totalPages() {
      return Math.ceil(this.tableData.length / this.rowsPerPage);
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.rowsPerPage;
      const end = start + this.rowsPerPage;
      return this.tableData.slice(start, end);
    },
    pageOptions() {
      return Array.from({ length: this.totalPages }, (_, i) => ({ label: `Page ${i + 1}`, value: i + 1 }));
    },
    dropdownOptions() {
      return this.dataHeaders;
    }
  },
  methods: {
    firstPage() {
      this.currentPage = 1;
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    lastPage() {
      this.currentPage = this.totalPages;
    },
    openStatsModal() {
      this.statsModalVisible = true;
    },
    async fetchColumnStats() {
      if (this.selectedColumn) {
        this.isLoading = true;

        const requestBody = { data: this.data.map(row => ({ columns: row })) };

        try {
          const response = await axios.post(`/getColumnDescriptiveStats?column=${this.selectedColumn}`, requestBody, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          const responseData = JSON.parse(response.data.data);
          this.columnStats = {
            stats: responseData.stats,
            histogram: responseData.histogram
          };
          this.isNumeric = responseData.is_numeric;
          await nextTick();
          this.renderHistogram();
        } catch (error) {
          console.error('Error fetching column stats:', error);
          this.columnStats = 'An error occurred while fetching the column stats.';
        }

        await nextTick();
        this.isLoading = false;
      }
    },
    renderHistogram() {
      if (this.columnStats && this.columnStats.histogram) {
        console.log(this.columnStats.histogram)
        if (this.chartInstance) {
          this.chartInstance.destroy();
        }
        const ctx = document.getElementById('histogram').getContext('2d');
        const labels = this.columnStats.histogram.bins;
        const data = this.columnStats.histogram.counts;

        this.chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Frequency',
              data: data,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: {
                  display: true,
                  text: this.isNumeric ? 'Range' : 'Category' // Update the x-axis label based on column type
                },
                grid: {
                  display: false // Remove grid lines
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Frequency'
                },
                grid: {
                  display: false // Remove grid lines
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const index = context.dataIndex;
                    if (this.isNumeric) {
                      const start = this.columnStats.histogram.bins[index].toFixed(2);
                      const end = this.columnStats.histogram.bins[index + 1].toFixed(2);
                      return `Range: ${start} - ${end}: ${context.raw}`;
                    } else {
                      return `Category: ${context.label}: ${context.raw}`;
                    }
                  }
                }
              }
            }
          }
        });
      }
    }
  }
};
</script>

<style scoped>
.data-table-container {
  margin-top: 20px;
  background-color: #031525;
  border-radius: 8px;
  width: 95%;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: all 0.3s ease;
  padding: 20px;
  color: #c3d1e1;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.25rem;
  background-color: #031525;
  padding: 10px;
  text-align: center;
  color: #007bff;
}

.table-wrapper {
  max-height: 400px;
  overflow-y: auto;
  border: 2px solid #455a72;
  border-radius: 8px;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #041727;
  color: #c3d1e1;
}

.data-table thead tr {
  background-color: #263c55;
  color: white;
}

.data-table th, .data-table td {
  padding: 10px;
  text-align: left;
}

.data-table th {
  border-bottom: 1px solid #455a72;
  position: sticky;
  top: 0;
  background-color: #263c55;
  z-index: 1;
}

.data-table td {
  border: none;
}

.pagination {
  margin-top: 10px;
  text-align: center;
}

.pagination button {
  margin: 0 5px;
  padding: 5px 10px;
  border: none;
  background-color: #263c55;
  color: white;
  cursor: pointer;
  border-radius: 4px;
}

.pagination button:disabled {
  background-color: #65788d;
  cursor: not-allowed;
}

.pagination span {
  margin: 0 10px;
  color: #c3d1e1;
}

.dropdown {
  margin-left: 10px;
}

.stats-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
}

.custom-dialog .p-dialog-content {
  background-color: #031525;
  color: #c3d1e1;
}

.custom-dialog .p-dialog-header {
  background-color: #031525;
  color: #c3d1e1;
}

.dialog-content {
  padding: 20px;
}

.stats-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.stats-details {
  flex: 1;
  padding-right: 20px;
}

.chart-container {
  flex: 2;
  height: 400px; /* Increased height for better readability */
}

.stats-chart {
  width: 100%;
  height: 100%;
}
</style>
