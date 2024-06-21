<template>
   <div class="model-info-container" role="dialog">
     <div class="model-info">
       <div class="header" @click="toggleCollapse">
         <h2 class="text-center">Model Zone!</h2>
         <span :class="{ 'arrow-down': isCollapsed, 'arrow-up': !isCollapsed }"></span>
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
                  </div>
               </div>
             </div>
           </div>
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
       isCollapsed: true
     };
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
     modelUpdated() {
       this.$emit('updateModel', this.selectedModel);
     }
   }
 };
 </script>
 
 <style scoped>
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
 }
 
 .info-section p {
   font-size: 16px;
   margin-bottom: 10px;
   color: #34495e;
 }
 
 .model-list,
 .type-list {
   display: flex;
   flex-wrap: wrap;
   justify-content: center;
 }
 
 .model-list button,
 .type-list button,
 .property-list button {
   cursor: pointer;
   padding: 8px 12px;
   margin: 5px;
   border: none;
   border-radius: 4px;
   background-color: #bdc3c7;
   color: #2c3e50;
   transition: background-color 0.3s ease, color 0.3s ease;
   font-size: 14px;
   flex: 1 1 auto;
   max-width: 100px;
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
   margin-bottom: 10px;
 }
 
 .property-description {
   font-weight: bold;
 }
 
 .property-options {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
   gap: 5px;
   justify-items: center;
 }
 
 .property-list {
   display: flex;
   flex-direction: column;
   flex-wrap: wrap;
 }
 </style>
 