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
        v-if="!uploadSuccess || file"
      >
        <p v-if="!file">{{ dropMessage }}</p>
        <p v-else>{{ file.name }}</p>
        <input
          type="file"
          class="visually-hidden"
          ref="fileInput"
          @change="handleFileChange"
          accept=".csv"
        >
      </div>

      <!-- Display CSV content -->
      <div v-if="uploadSuccess && csvData.length > 0" class="mt-3 text-center">
        <h2>Uploaded CSV Data (Top 50 rows, 5 at a time)</h2>
        <div class="table-container">
          <table class="table table-bordered table-striped">
            <thead>
              <tr>
                <th v-for="(header, index) in csvData[0]" :key="index">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in displayedRows" :key="rowIndex">
                <td v-for="(value, colIndex) in row" :key="colIndex">{{ value }}</td>
              </tr>
            </tbody>
          </table>
          <button v-if="totalRows > rowsPerPage" class="btn btn-primary mt-3" @click="loadMoreRows">Load More</button>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="uploadError" class="alert alert-danger mt-3 text-center">
        {{ uploadError }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FileUpload',
  data() {
    return {
      file: null,
      uploadSuccess: false,
      uploadError: '',
      csvData: [], // Array to hold CSV data
      displayedRows: [], // Rows to display (pagination)
      rowsPerPage: 5, // Number of rows per page
      currentPage: 1 // Current page of displayed rows
    };
  },
  computed: {
    dropMessage() {
      return this.file ? 'Drop file here or click to browse' : 'Drag & Drop a CSV file here';
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
      
      // Set initial displayed rows
      this.displayedRows = this.csvData.slice(1, this.rowsPerPage + 1);
      
      // Simulate successful upload (replace with actual upload logic)
      // For demonstration purposes
      setTimeout(() => {
        this.uploadSuccess = true;
        // Reset file input after successful upload (optional)
        this.$refs.fileInput.value = '';
      }, 1000); // Simulating upload delay of 1 second
    },
    loadMoreRows() {
      // Calculate the next set of rows to display
      const startIndex = this.currentPage * this.rowsPerPage + 1;
      const endIndex = startIndex + this.rowsPerPage;
      if (startIndex < this.csvData.length) {
        this.displayedRows.push(...this.csvData.slice(startIndex, endIndex));
        this.currentPage++;
      }
    }
  }
};
</script>

<!-- Import styles from external stylesheet -->
<style src="@/assets/styles.css" scoped></style>

<style scoped>
/* Additional styles specific to this component can go here if needed */
</style>
