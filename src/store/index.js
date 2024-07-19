import axios from 'axios';
import { createStore } from 'vuex';

export default createStore({
  state: {
    localDataInstances: [],
  },
  mutations: {
    SET_LOCAL_DATA_INSTANCES(state, instances) {
      state.localDataInstances = instances;
    },
    ADD_LOCAL_DATA_INSTANCE(state, instance) {
      state.localDataInstances.push(instance);
    },
    DELETE_LOCAL_DATA_INSTANCE(state, index) {
      state.localDataInstances.splice(index, 1);
    },
    EDIT_LOCAL_DATA_INSTANCE(state, { index, newData }) {
      if (state.localDataInstances[index]) {
        state.localDataInstances[index] = { ...state.localDataInstances[index], ...newData };
      }
    },
  },
  actions: {
    async fetchLocalDataInstances({ commit }) {
      try {
        const response = await axios.get('http://localhost:8000/api/instances');
        commit('SET_LOCAL_DATA_INSTANCES', response.data);


      } catch (error) {
        console.error('Error fetching data instances:', error);
      }

    },
    async saveLocalDataInstances({ state }) {
      try {
        // Delete all instances first
        await axios.delete('http://localhost:8000/api/instances');

        // Add each instance one by one
        const promises = state.localDataInstances.map(instance => axios.post('http://localhost:8000/api/instances', instance));
        await Promise.all(promises);

        console.log('Data instances saved successfully');
      } catch (error) {
        console.error('Error saving data instances:', error);
      }
    },
    setLocalDataInstances({ commit }, instances) {
      commit('SET_LOCAL_DATA_INSTANCES', instances);
    },
    addLocalDataInstance({ commit }, instance) {
      commit('ADD_LOCAL_DATA_INSTANCE', instance);
    },
    deleteLocalDataInstance({ commit }, index) {
      commit('DELETE_LOCAL_DATA_INSTANCE', index);
    },
    editLocalDataInstance({ commit }, payload) {
      commit('EDIT_LOCAL_DATA_INSTANCE', payload);
    },
  },
  getters: {
    getLocalDataInstances: (state) => state.localDataInstances,
  },
});
