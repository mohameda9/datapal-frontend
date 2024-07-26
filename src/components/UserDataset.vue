<template>
  <div class="data-table-container">
    <div class="table-header">Data Overview</div>
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
  </div>
</template>

<script>
import Dropdown from 'primevue/dropdown';

export default {
  name: 'UserDataset',
  components: {
    Dropdown,
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
  },
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
</style>
