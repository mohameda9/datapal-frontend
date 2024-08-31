<template>
    <div class="algorithm-params">
      <div class="header">
        <span>{{ modelName }}</span>
        <button @click="$emit('remove-algorithm', index)" class="remove-button">Remove</button>
      </div>
      <div class="parameters-grid">
        <div class="parameter-field" v-for="(param, name) in params" :key="name">
          <label :for="name">{{ name }}</label>
          <template v-if="param.type === 'text'">
            <Dropdown
              :id="name"
              v-model="parameterValues[name]"
              :options="dropdownOptions[name]"
              optionLabel="label"
              optionValue="value"
              class="parameter-input"
              placeholder="Select an option"
            />
          </template>
          <template v-else>
            <input
              :id="name"
              :type="param.type"
              v-model="parameterValues[name]"
              :min="param.min"
              :max="param.max"
              class="parameter-input"
              @blur="enforceMinMax(param.min, param.max, name)"
            />
          </template>
          <span v-if="warnings[name]" class="warning">{{ warnings[name] }}</span>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import Dropdown from 'primevue/dropdown';
  
  export default {
    name: 'AlgorithmParams',
    components: {
      Dropdown
    },
    props: {
      index: {
        type: Number,
        required: true
      },
      algorithm: {
        type: String,
        required: true
      },
      params: {
        type: Object,
        required: true
      },
      parameterValues: {
        type: Object,
        required: true
      },
      modelName: {
        type: String,
        required: true
      },
      dropdownOptions: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        warnings: {}
      };
    },
    methods: {
      enforceMinMax(min, max, name) {
        if (this.parameterValues[name] < min) {
          this.parameterValues[name] = min;
          this.showWarning(name, `Value cannot be less than ${min}`);
        } else if (this.parameterValues[name] > max) {
          this.parameterValues[name] = max;
          this.showWarning(name, `Value cannot be greater than ${max}`);
        } else {
          this.clearWarning(name);
        }
      },
      showWarning(name, message) {
        this.warnings = { ...this.warnings, [name]: message };
        setTimeout(() => {
          this.clearWarning(name);
        }, 3000);
      },
      clearWarning(name) {
        const { [name]: _, ...rest } = this.warnings;
        this.warnings = rest;
      }
    }
  };
  </script>
  
  <style scoped>
  .algorithm-params {
    border: 1px solid #007bff;
    padding: 20px;
    border-radius: 10px;
    background-color: #ffffff;
    color: #333;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    background-color: #007bff;
    padding: 10px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    font-size: 1.2em;
  }
  
  .remove-button {
    background-color: #ff4d4d;
    color: white;
    border: none;
    border-radius: 5px;
    padding: 5px 10px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .remove-button:hover {
    background-color: #ff1a1a;
  }
  
  .parameters-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .parameter-field {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1 1 calc(50% - 15px); /* Two items per row with 15px gap */
    min-width: 200px; /* Adjust this value as needed */
  }
  
  .parameter-field label {
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .parameter-input {
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    transition: border-color 0.3s ease;
    display: flex;
    align-items: center;
  }
  
  .parameter-input:focus {
    border-color: #007bff;
    outline: none;
  }
  
  .warning {
    color: #ff4d4d;
    font-size: 0.8em;
    margin-top: 5px;
  }
  </style>
  