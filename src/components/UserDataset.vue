<template>
  <div class="data-table-container">
    <DataTable :value="tableData" paginator :rows="6" :scrollable="true" scrollHeight="600px">
      <template #header>
        <div class="table-header">Data Overview</div>
      </template>
      <Column v-for="(header, colIndex) in dataHeaders" :key="colIndex" :field="header" :header="header" sortable></Column>
    </DataTable>
  </div>
</template>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

export default {
  name: 'UserDataset',
  components: {
    DataTable,
    Column,
  },
  props: {
    data: {
      type: Array,
      required: true,
    },
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
  },
};
</script>

<style scoped>
.data-table-container {
  margin-top: 20px;
  background-color: #f3f4f6;
  border-radius: 20px;
  width: 95%;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  overflow: auto;
  transition: all 0.3s ease;
  max-height: 500px;
  overflow-y: auto;
}

.data-table-container:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  transform: translateY(-5px);
}

.table-header{
  font-size: 3rem;
  background-color: #c7d2fe;
  
}



.data-table .p-datatable {
  border-radius: 0 0 15px 15px;
  background-color: #e5e7eb;
}

.data-table .p-datatable-thead > tr > th {
  background-color: #6b47dc;
  color: white;
  font-weight: bold;
  font-size: 0.25rem;
}

.data-table .p-datatable-tbody > tr > td {
  font-size: 0.0005rem;
}

.table-header{
font-size: 1.25rem;


}

</style>
