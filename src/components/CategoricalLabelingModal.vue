<template>
  <Dialog :visible="visible" :modal="true" header="Categorical Labeling" @hide="closeModal" @update:visible="updateVisible" :style="{ width: '70vw' }">
    <div class="categorical-labeling-modal">
      <Dropdown
        v-model="selectedColumn"
        :options="categoricalColumns"
        class="w-full"
        placeholder="Select Column"
        @change="handleColumnChange"
        :disabled="metadata && !metadata.executed"
      />
      <input type="text" v-model="newColumnName" placeholder="New Column Name" class="w-full mt-3" :disabled="metadata && !metadata.executed" />
      <div v-for="(pair, index) in categoryValuePairs" :key="index" class="category-value-pair">
        <MultiSelect
          v-model="pair.selectedCategories"
          :options="getFilteredCategories(index)"
          class="w-full"
          placeholder="Select Categories"
          display="chip"
          :disabled="metadata && !metadata.executed"
        />
        <input type="text" v-model="pair.value" placeholder="Value" :disabled="metadata && !metadata.executed" />
        <Button icon="pi pi-times" class="delete-button" @click="removePair(index)" :disabled="metadata && !metadata.executed" />
      </div>
      <Button label="Add Pair" icon="pi pi-plus" @click="addPair" :disabled="metadata && !metadata.executed" />
      <div class="default-value">
        <h3>Default Value for Remaining (optional)</h3>
        <input type="text" v-model="defaultValue" placeholder="Default Value" :disabled="metadata && !metadata.executed" />
      </div>
      <div class="modal-footer">
        <Button label="Submit" icon="pi pi-check" @click="submit" :disabled="!isFormValid || (metadata && !metadata.executed)" />
        <Button label="Cancel" icon="pi pi-times" class="p-button-secondary" @click="closeModal" />
      </div>
    </div>
  </Dialog>
</template>

<script>
import { ref, watch, computed } from 'vue';
import MultiSelect from 'primevue/multiselect';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

export default {
  name: 'CategoricalLabelingModal',
  components: {
    MultiSelect,
    Dropdown,
    Dialog,
    Button,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    categoricalColumns: {
      type: Array,
      required: true,
    },
    getColumnUniqueValues: {
      type: Function,
      required: true,
    },
    metadata: {
      type: Object,
      default: null,
    },
  },
  emits: ['close', 'submit', 'update:visible'],
  setup(props, { emit }) {
    const selectedColumn = ref(null);
    const newColumnName = ref('');
    const categoryValuePairs = ref([{ selectedCategories: [], value: '' }]);
    const defaultValue = ref('');
    const uniqueValues = ref([]);

    const addPair = () => {
      categoryValuePairs.value.push({ selectedCategories: [], value: '' });
    };

    const removePair = (index) => {
      categoryValuePairs.value.splice(index, 1);
    };

    const closeModal = () => {
      emit('close');
    };

    const submit = () => {
      if (isFormValid.value) {
        emit('submit', {
          selectedColumn: selectedColumn.value,
          newColumnName: newColumnName.value,
          categoryValuePairs: categoryValuePairs.value,
          defaultValue: defaultValue.value || null,
        });
        closeModal();
      }
    };

    const updateVisible = (value) => {
      emit('update:visible', value);
    };

    const handleColumnChange = async () => {
      if (selectedColumn.value) {
        uniqueValues.value = await props.getColumnUniqueValues(selectedColumn.value);
        categoryValuePairs.value = [{ selectedCategories: [], value: '' }];
        defaultValue.value = '';
      }
    };

    const getFilteredCategories = (index) => {
      const usedCategories = new Set(categoryValuePairs.value.flatMap((pair, i) => i !== index ? pair.selectedCategories : []));
      return uniqueValues.value.filter(category => !usedCategories.has(category));
    };

    const allCategoriesSelected = computed(() => {
      const selectedCategories = categoryValuePairs.value.flatMap(pair => pair.selectedCategories);
      return uniqueValues.value.length > 0 && selectedCategories.length === uniqueValues.value.length;
    });

    const isFormValid = computed(() => {
      return selectedColumn.value && newColumnName.value.trim() !== '' && categoryValuePairs.value.every(pair => pair.selectedCategories.length > 0 && pair.value.trim() !== '');
    });

    const resetForm = () => {
      selectedColumn.value = null;
      newColumnName.value = '';
      categoryValuePairs.value = [{ selectedCategories: [], value: '' }];
      defaultValue.value = '';
      uniqueValues.value = [];
    };

    watch(
      () => props.metadata,
      async (newVal) => {
        if (newVal) {
          selectedColumn.value = newVal.selectedColumn;
          newColumnName.value = newVal.newColumnName || '';
          categoryValuePairs.value = JSON.parse(JSON.stringify(newVal.categoryValuePairs || [{ selectedCategories: [], value: '' }]));
          defaultValue.value = newVal.defaultValue || '';
          if (newVal.selectedColumn) {
            uniqueValues.value = await props.getColumnUniqueValues(newVal.selectedColumn);
          }
        } else {
          resetForm();
        }
      },
      { immediate: true }
    );

    watch(
      () => props.visible,
      (newVal) => {
        if (!newVal) {
          resetForm();
        }
      }
    );

    return {
      selectedColumn,
      newColumnName,
      categoryValuePairs,
      defaultValue,
      uniqueValues,
      addPair,
      removePair,
      closeModal,
      submit,
      updateVisible,
      handleColumnChange,
      getFilteredCategories,
      allCategoriesSelected,
      isFormValid,
    };
  },
};
</script>

<style scoped>
.categorical-labeling-modal {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-value-pair {
  display: flex;
  align-items: center;
  gap: 10px;
}

.default-value {
  margin-top: 20px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.delete-button {
  background-color: #dc3545;
  border: none;
  border-radius: 50px;
  color: white;
}
</style>
