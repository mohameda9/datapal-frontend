<template>
  <div>
    <h1 class="text-center">DataPal - No Code ML</h1>

    <div class="container mt-5">
      <!-- Drop area for file upload -->
      <div
        class="file-drop-area text-center"
        @dragover.prevent
        @dragenter.prevent
        @drop="handleFileDrop"
        @click="$refs.fileInput.click()"
      >
      <p v-if="!parsing">{{ dropMessage }}</p>
        <div v-else class="spinner-border" role="status">
        </div>
        <input 
          type="file"
          class="visually-hidden"
          ref="fileInput"
          @change="handleFileChange"
          accept=".csv"
        >
      </div>

      <!-- Display instances of CSV data -->
      <div v-if="dataInstances.length > 0" class="mt-5">
        <div v-for="(instance, index) in dataInstances" :key="index" class="mt-3 instance-container">
          <h3 class="text-center">Name: {{ instance.name }}</h3>
          <div class="table-container">
            <table class="table table-bordered table-striped">
              <thead class="fixed-header">
                <tr>
                  <th v-for="(header, index) in instance.data[0]" :key="index">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in instance.displayedRows" :key="rowIndex">
                  <td v-for="(value, colIndex) in row" :key="colIndex">{{ value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="button-center-container">
            <CDropdown>
              <CDropdownToggle color="primary">Feature Engineering options</CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem href="#" @click="showonehot = true">One hot encoding</CDropdownItem>
                <CDropdownItem href="#">Another action</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>

            <Modal
              v-if="showonehot"
              @close="showonehot = false"
            >
              <template v-slot:header>
                <h2> One hot encoding </h2>
              </template>

              <template v-slot:body>
                <p2> Select a column from below</p2>
                <CFormSelect size="lg" class="mb-3" aria-label="Large select example" v-model="selectedItem">
                  <option disabled value="">Open this select menu</option>
                  <option v-for="(value, key) in instance.data[0]" :key="key" :value="value">
                    {{ value }}
                  </option>
                </CFormSelect>
              </template>

              <template v-slot:footer>
                <button @click="showonehot = false">Close</button>
              </template>
            </Modal>
            
            <button v-if="instance.totalRows > rowsPerPage" class="btn btn-primary mt-3 load-more-btn" @click="loadMoreRowsForInstance(index)">
              <span v-if="instance.loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span v-else>Load More</span>
            </button>

            <button class="btn btn-success mt-3" @click="ev => {
              instanceParent = instance.data;
              creatingInstance = true;
            }">
              <span v-if="creatingInstance" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span v-else>Create New Instance</span>
            </button>

            <button class="btn btn-danger mt-3" @click="deleteInstance(index)">
              <span>Delete Instance</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="uploadError" class="alert alert-danger mt-3 text-center">
        {{ uploadError }}
      </div>
    </div>
  </div>

  <Modal 
    v-if="creatingInstance" 
    @close="creatingInstance = false" 
    @submitName="(name) => createNewInstance(this.instanceParent, name)"
    :existingNames="dataInstances.map(instance => instance.name)"
  />
</template>

<script>
import Modal from './components/Modal.vue';

export default {
  name: 'FileUpload',
  data() {
    return {
      showonehot: false,
      availableMLmodels: ["Linear Regression","Logistic Regression"],
      typesofLinearRegressions:["Lasso", "L1", "L2"],
      typesofLogisticRegression:["a", "b"],
      file: null,
      uploadSuccess: false,
      uploadError: '',
      csvData: [], // Array to hold CSV data
      displayedRows: [], // Rows to display (pagination)
      rowsPerPage: 5, // Number of rows per page
      currentPage: 1, // Current page of displayed rows
      dataInstances: [], // Array to hold instances of CSV data
      loading: false, // Loading state for main CSV data
      creatingInstance: false, // Loading state for creating new instance
      instanceParent: [],
      instanceName: "",
      parsingData:false
    };
  },
  components: {
    Modal
  },
  computed: {
    dropMessage() {
      return 'Drag & Drop a CSV file here';
    },
    totalRows() {
      return this.csvData.length > 0 ? this.csvData.length - 1 : 0; // Exclude header row
    }
  },
  methods: {
    handleFileChange(event) {
      const selectedFile = event.target.files[0];
      this.handleFile(selectedFile);
    },
    handleFileDrop(event) {
      event.preventDefault();
      const droppedFile = event.dataTransfer.files[0];
      this.handleFile(droppedFile);
    },
    handleFile(file) {
      if (file && file.type === 'text/csv') {
        this.file = file;
        this.uploadError = ''; // Clear any previous errors
        this.parsing = true; // Set parsing state to true

        // Read the CSV file
        this.readCSV(file);

      } else {
        this.file = null;
        this.uploadError = 'Please choose a valid CSV file.';
      }

    },
    readCSV(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        this.parseCSV(csv);
      };
      reader.readAsText(file);
    },
    parseCSV(csv) {
      // Split CSV into rows
      const rows = csv.trim().split(/\r?\n/);
      // Extract headers (first row)
      const headers = rows[0].split(',');
      // Extract data rows
      const data = rows.slice(1).map(row => row.split(','));
      // Update csvData array
      this.csvData = [headers, ...data];
      this.dataInstances = []
      this.instanceParent = []
      this.createNewInstance(this.csvData, "original");
      
      // Set initial displayed rows
      this.displayedRows = this.csvData.slice(1, this.rowsPerPage + 1);
      
      // Simulate successful upload (replace with actual upload logic)
      // For demonstration purposes
      setTimeout(() => {
        this.uploadSuccess = true;
        this.parsing = false
        // Reset file input after successful upload (optional)
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
      }, 1); // Simulating upload delay of 1 second
    },
    loadMoreRows() {
      this.loading = true;
      // Simulate a delay for loading data
      setTimeout(() => {
        // Calculate the next set of rows to display
        const startIndex = this.currentPage * this.rowsPerPage + 1;
        const endIndex = startIndex + this.rowsPerPage;
        if (startIndex < this.csvData.length) {
          this.displayedRows.push(...this.csvData.slice(startIndex, endIndex));
          this.currentPage++;
        }
        this.loading = false;
      }, 1000); // Simulating delay of 1 second
    },
    loadMoreRowsForInstance(index) {
      this.dataInstances[index].loading = true;
      // Simulate a delay for loading data
      setTimeout(() => {
        const instance = this.dataInstances[index];
        // Calculate the next set of rows to display for this instance
        const startIndex = instance.currentPage * this.rowsPerPage + 1;
        const endIndex = startIndex + this.rowsPerPage;
        if (startIndex < instance.data.length) {
          instance.displayedRows.push(...instance.data.slice(startIndex, endIndex));
          instance.currentPage++;
        }
        instance.loading = false;
        console.log(10000)
        console.log(instance.data[0]);

      }, 1000); // Simulating delay of 1 second
    },
    createNewInstance(data, name) {
      console.log('aaaaaaaaa')
      console.log(name);
      // Simulate a delay for creating new instance
      setTimeout(() => {
        // Create a new instance of the data and add it to dataInstances
        this.dataInstances.push({
          data: JSON.parse(JSON.stringify(data)), // Deep copy to avoid reference issues
          displayedRows: JSON.parse(JSON.stringify(data.slice(1, this.rowsPerPage + 1))), // Initial rows to display
          currentPage: 1, // Current page of displayed rows
          totalRows: data.length - 1, // Total rows excluding header
          loading: false, // Loading state for the instance
          name: name
        });
        this.creatingInstance = false;
      }, 1000); // Simulating delay of 1 second
    },
    deleteInstance(index) {
      this.dataInstances.splice(index, 1);
    }
  },
};
</script>

<style src="@/assets/styles.css" scoped></style>
