<template>
  <div class="scatter-plot">
    <canvas ref="scatterCanvas" width="800" height="600"></canvas>
  </div>
</template>

<script>
import { Chart } from 'chart.js';

export default {
  name: 'ScatterPlot',
  props: {
    pcaData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      chart: null,
      isMounted: false,
    };
  },
  mounted() {
    this.isMounted = true;
    this.createChart();
  },
  watch: {
    pcaData() {
      this.createChart();
    },
  },
  methods: {
    createChart() {
      if (this.chart) {
        this.chart.destroy();
      }

      if (!this.isMounted) return;

      const canvas = this.$refs.scatterCanvas;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const datasets = this.getDatasets();
      this.chart = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: datasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              enabled: false, // Disable tooltips
            },
          },
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              title: {
                display: true,
                text: 'PCA Component 1',
              },
            },
            y: {
              title: {
                display: true,
                text: 'PCA Component 2',
              },
            },
          },
        },
      });
    },
    getDatasets() {
      const { PCA1, PCA2, Cluster } = this.pcaData;
      const clusters = [...new Set(Cluster)];
      const colors = [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(255, 159, 64, 0.5)',
      ];

      return clusters.map((cluster, index) => {
        const clusterData = PCA1
          .map((value, i) => {
            if (Cluster[i] === cluster) {
              return { x: PCA1[i], y: PCA2[i] };
            }
            return null;
          })
          .filter((point) => point !== null);

        return {
          label: `Cluster ${cluster}`,
          data: clusterData,
          backgroundColor: colors[index % colors.length],
        };
      });
    },
  },
  beforeDestroy() {
    this.isMounted = false;
    if (this.chart) {
      this.chart.destroy();
    }
  },
};
</script>

<style scoped>
.scatter-plot {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

canvas {
  max-width: 100%;
  max-height: 100%;
}
</style>
