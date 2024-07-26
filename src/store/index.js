import { createStore } from 'vuex';
import axios from '@/axios';
import createPersistedState from 'vuex-persistedstate';

const store = createStore({
  state: {
    user: null,
    isAuthenticated: false,
    activeProject: null,
    localDataInstances: []
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_AUTH(state, isAuthenticated) {
      state.isAuthenticated = isAuthenticated;
    },
    SET_PROJECT(state, project) {
      state.activeProject = project;
    },
    SET_DATA_INSTANCES(state, dataInstances) {
      state.dataInstances = dataInstances;
    },
    ADD_DATA_INSTANCE(state, dataInstance) {
      state.dataInstances.push(dataInstance);
    },
    DELETE_DATA_INSTANCE(state, instanceId) {
      state.dataInstances = state.dataInstances.filter(instance => instance.id !== instanceId);
    },
    SET_PROJECT(state, project) {
      state.activeProject = project;
    },
    SET_PROJECTS(state, projects) {
      state.projects = projects;
    },
    ADD_PROJECT(state, project) {
      state.projects.push(project);
    },
    REMOVE_PROJECT(state, projectName) {
      state.projects = state.projects.filter(project => project.name !== projectName);
    },
    clearUser(state) {
      state.user = null;
      state.projects = [];
    },
    logout({ commit }) {
      commit('clearUser');
    },
    setLocalDataInstances(state, instances) {
      state.localDataInstances = instances;
    },
  },
  actions: {
    async signup({ commit }, { email, password }) {
      try {
        const response = await axios.post('/signup', { email, password });
        commit('SET_USER', response.data.user);
        commit('SET_AUTH', true);
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Sign up failed');
      }
    },
    async login({ commit }, { email, password }) {
      try {
        const response = await axios.post('/login', { email, password });
        commit('SET_USER', response.data.user);
        commit('SET_AUTH', true);
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Invalid Credentials');
      }
    },
    async logout({ commit }) {
      try {
        await axios.post('/logout');
        commit('SET_USER', null);
        commit('SET_AUTH', false);
      } catch (error) {
        console.error('Error logging out:', error);
      }
    },
    setUser({ commit }, user) {
      commit('SET_USER', user);
    },
    setProject({ commit }, project) {
      commit('SET_PROJECT', project);
    },
    setLocalDataInstances(state, instances) {
      state.localDataInstances = instances;
    },

    async addProject({ commit, state }, projectName) {
      console.log("attempting add project")
      console.log(state.user.email)

      try {
        const response = await axios.post('/create_project', {
          name: projectName,
          user_id: state.user.email
        });
        commit('ADD_PROJECT', { name: projectName });
      } catch (error) {
        commit('setError', error.response.data.detail);
      }
    },
    async fetchProjects({ commit, state }) {
      console.log(state.user.email)

      try {
        const response = await axios.get(`/fetchfirebase/${state.user.email}`);
        commit('SET_PROJECTS', response.data.projects);
        console.log(response.data.projects)
      } catch (error) {
        commit('setError', error.response.data.detail);
      }
    },

    async loadProject({ commit, state }) {
      console.log(state.user.email, state.activeProject)
      try {
        const response = await axios.get(`/loadProject/${state.user.email}/${state.activeProject.name}`);
        commit('setLocalDataInstances', response.data);
      } catch (error) {
        commit('setLocalDataInstances', []);
      }
    },
    async saveLocalDataInstances({ state }) {
      console.log("ttttt")
      console.log(state.user)
      console.log(state.activeProject)
      try {
        await axios.delete(`/fetchfirebase/${state.user.email}/${state.activeProject.name}`);

        const dataToSave =  {
          instances: state.localDataInstances,
        }
        console.log(dataToSave)

        await axios.post(`/saveProject/${state.user.email}/${state.activeProject.name}`, 
          state.localDataInstances        );
      } catch (error) {
        throw new Error('Failed to save data instances');
      }
    },
    async deleteProject({ commit, state }, projectName) {
      try {
        await axios.delete(`/delete_project/${state.user.email}/${projectName}`);
        commit('REMOVE_PROJECT', projectName);
      } catch (error) {
        throw new Error('Failed to delete project');
      }
    }
  },
  getters: {
    getLocalDataInstances: (state) => state.localDataInstances,
    getUser: (state) => state.user,
    isAuthenticated: (state) => state.isAuthenticated,
    getProject: (state) => state.project,
    getProjects: (state) => state.projects,
    getCurrentProject: (state) => state.activeProject,

  },
  plugins: [createPersistedState({
    paths: ['user', 'isAuthenticated', 'activeProject', 'localDataInstances', 'projects'] // Specify the state you want to persist
  })]
});

export default store;
