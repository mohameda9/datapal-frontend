<template>
    <div class="data-table-container">
      <DataTable :value="tableData" paginator :rows="20" :scrollable="true" scrollHeight="600px">
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
    max-height: 800px;
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
    font-size: 5.25rem;
  }
  
  .data-table .p-datatable-tbody > tr > td {
    font-size: 1.25rem;
  }
  
  .data-table .p-datatable-tbody > tr:nth-child(even) {
    background: linear-gradient(135deg, #a385e0 25%, transparent 25%) -50px 0, linear-gradient(225deg, #f3f4f6 25%, transparent 25%) -50px 0, linear-gradient(315deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, #f3f4f6 25%, transparent 25%);
    background-size: 100px 100px;
    background-color: #8e57d9;
  }
  
  .data-table .p-datatable-tbody > tr:nth-child(odd) {
    background: linear-gradient(135deg, #e5e7eb 25%, transparent 25%) -50px 0, linear-gradient(225deg, #e5e7eb 25%, transparent 25%) -50px 0, linear-gradient(315deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, #e5e7eb 25%, transparent 25%);
    background-size: 100px 100px;
    background-color: #7c3ace;
  }
  
  .data-table .p-paginator {
    background-color: #5a26ab;
    color: white;
  }
  </style>
  