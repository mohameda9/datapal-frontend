<template>
  <div class="model-info-container" role="dialog">
    <div class="model-info">
      <div class="header" @click="toggleCollapse">
        <h2>Let's analyze!</h2>
        <span :class="{ 'arrow-down': isCollapsed, 'arrow-up': !isCollapsed }"></span>

        <button @click="deleteComponent">
          <span> - </span>
        </button>
      </div>

      <div v-show="!isCollapsed">
        <!-- Model selection -->
        <div v-if="models.length > 0">
          <div class="info-section">
            <p>Start by selecting a model.</p>
            <div class="model-list">
              <button
                v-for="(model, idx) in models"
                :key="idx"
                @click="selectModel(model)"
                :class="{ selected: model === selectedModel }"
              >
                {{ model._name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Type selection -->
        <div v-if="selectedModel !== null && selectedModel._types.length > 0">
          <div class="info-section">
            <p>Great! Let's select a type.</p>
            <div class="type-list">
              <button
                v-for="(type, idx) in selectedModel._types"
                :key="idx"
                @click="selectType(type)"
                :class="{ selected: type === selectedModel._selectedType }"
              >
                {{ type }}
              </button>
            </div>
          </div>
        </div>

        <!-- Properties selection -->
        <div v-if="selectedModel?._selectedType != null">
          <div class="info-section">
            <p>Select properties:</p>
            <div class="property-list">
              <div v-for="(property, index) in selectedModel?._properties" :key="index" class="property-item">
                <div v-if="index === 0 || (index > 0 && (selectedModel?._properties[index-1]?.isValid))">
                  <div class="property-description">{{ property.desc }}</div>
                  <div v-if="property.expects === 'variables'" class="property-options">
                    <button
                      v-for="(variable, idx) in variables"
                      :key="idx"
                      @click="setProperty(index, variable)"
                      :class="{ selected: property.isArray ? property.value?.has(variable) : property.value === variable }"
                    >
                      {{ variable }}
                    </button>
                  </div>
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
                  <div v-if="property.expects === 'number'" class="property-options number-property">
                    <input
                      type="number"
                      v-model.number="property.value"
                      step="0.01"
                      min="0"
                      max="1"
                      @change="modelUpdated"
                      class="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit Model button -->
        <div v-if="canSubmitModel" class="centered-section">
          <button @click="submitModel" class="submit-button">Submit Model</button>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModelInfo',
  props: {
    models: {
      type: Array,
      required: true
    },
    variables: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedModel: null,
      isCollapsed: false,
      deleted: false
    };
  },
  computed: {
    canSubmitModel() {
      if (!this.selectedModel) return false;
      return this.selectedModel._properties.every(property => 
        property.isValid || this.isDefaultProperty(property)
      );
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
    },
    selectModel(model) {
      this.selectedModel = model;
      this.selectedModel._selectedType = null;
      this.modelUpdated();
    },
    selectType(type) {
      this.selectedModel._selectedType = type;
      this.modelUpdated();
    },
    setProperty(index, value) {
      this.selectedModel.updateProperty(index, value);
      this.modelUpdated();
    },
    toggleBooleanProperty(index) {
      this.selectedModel._properties[index].value = !this.selectedModel._properties[index].value;
      this.modelUpdated();
    },
    modelUpdated() {
      this.$emit('updateModel', this.selectedModel);
    },
    deleteComponent() {
      this.$emit('deleteModel');
    },
    submitModel() {
      const selectedValues = this.selectedModel._properties.reduce((acc, property) => {
        acc[property.name] = property.value;
        return acc;
      }, {});
      console.log(selectedValues);
      this.$emit('submittingModel', selectedValues);
    },
    isDefaultProperty(property) {
      // Check if the property is one of the default properties with pre-set values
      const defaultProperties = ['Train Size', 'Add Intercept'];
      return defaultProperties.includes(property.name);
    }
  }
};
</script>

<style scoped>
/* Add this to hide the v-data attribute */
[v-data] {
  outline: none !important;
  border: none !important;
}

/* Your existing styles */
.model-info-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: fit-content;
  background-color: #f5f7fa;
  padding: 20px;
}

.model-info {
  width: 100%;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.header h2 {
  font-size: 24px;
  color: #2c3e50;
}

.header .arrow-down,
.header .arrow-up {
  font-size: 20px;
  transition: transform 0.3s ease;
}

.header .arrow-up {
  transform: rotate(180deg);
}

.info-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.model-list,
.type-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.model-list button,
.type-list button,
.property-list button {
  cursor: pointer;
  padding: 8px 12px;
  margin: 5px;
  border: none;
  border-radius: 4px;
  background-color: lightsteelblue;
  color: #2c3e50;
  transition: background-color 0.3s ease, color 0.3s ease;
  font-size: 14px;
  flex: 1 1 auto;
  width: 100%;
  text-align: center;
}

.model-list button.selected,
.type-list button.selected,
.property-list button.selected {
  background-color: #3498db;
  color: #ffffff;
}

.model-list button:hover,
.type-list button:hover,
.property-list button:hover {
  background-color: #95a5a6;
}

.property-item {
  margin-bottom: 5%;
  width: 100%;
}

.property-description {
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.property-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 5px;
  justify-items: center;
  max-height: fit-content;
  width: 100%;
}

.boolean-property {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.number-property {
  display: flex;
  justify-content: center;
  width: 100%;
}

.property-list {
  display: flex;
  flex-direction: column;
  max-height: fit-content;
  margin-bottom: 0;
  width: 100%;
}

.model-info-container > .model-info {
  margin-bottom: 0;
}

/* New styles for input fields */
.centered-section {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 15px;
}

.input-label {
  font-weight: bold;
  margin-bottom: 5px;
  text-align: center;
}

.input-field {
  width: 50%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: center;
}

.checkbox-field {
  margin-bottom: 15px;
}

/* Toggle switch styles */
.switch {
  position: relative;
  display: inline-flex;
  width: 60px;
  height: 34px;
  margin-left: 10px;
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
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* Submit button styles */
.submit-button {
  cursor: pointer;
  padding: 10px 20px;
  margin-top: 20px;
  border: none;
  border-radius: 4px;
  background-color: #2ecc71;
  color: #ffffff;
  transition: background-color 0.3s ease;
  font-size: 16px;
  text-align: center;
}

.submit-button:hover {
  background-color: #27ae60;
}
</style>
