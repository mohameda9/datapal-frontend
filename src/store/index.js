import { createStore } from 'vuex';

export default createStore({
  state: {
    dataInstances: []
  },
  mutations: {
    SET_DATA_INSTANCES(state, instances) {
      state.dataInstances = instances;
    },
    ADD_DATA_INSTANCE(state, instance) {
      state.dataInstances.push(instance);
    },
    DELETE_DATA_INSTANCE(state, index) {
      state.dataInstances.splice(index, 1);
    },
    EDIT_DATA_INSTANCE(state, { index, newData }) {
      if (state.dataInstances[index]) {
        state.dataInstances[index] = { ...state.dataInstances[index], ...newData };
      }
    }
  },
  actions: {
    setDataInstances({ commit }, instances) {
      commit('SET_DATA_INSTANCES', instances);
    },
    addDataInstance({ commit }, instance) {
      commit('ADD_DATA_INSTANCE', instance);
    },
    deleteDataInstance({ commit }, index) {
      commit('DELETE_DATA_INSTANCE', index);
    },
    editDataInstance({ commit }, payload) {
      commit('EDIT_DATA_INSTANCE', payload);
    }
  },
  getters: {
    getDataInstances: (state) => state.dataInstances
  }
});
 