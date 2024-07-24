<template>
    <div>
      <canvas ref="chartCanvas"></canvas>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, watch } from 'vue';
  import { Chart as ChartJS, registerables } from 'chart.js';
  
  ChartJS.register(...registerables);
  
  export default {
    name: 'LineChart',
    props: {
      histogramData: {
        type: Object,
        required: true
      },
      distributionData: {
        type: Object,
        required: true
      }
    },
    setup(props) {
      const chartCanvas = ref(null);
      let chartInstance = null;
  
      const createChart = () => {
        if (chartInstance) {
          chartInstance.destroy();
        }
  
        // Calculate bin centers
        const binCenters = props.histogramData.bin_edges.slice(0, -1).map((edge, index) => (edge + props.histogramData.bin_edges[index + 1]) / 2);
  
        // Log data for debugging
        console.log('Histogram Data:', props.histogramData);
        console.log('Distribution Data:', props.distributionData);
  
        chartInstance = new ChartJS(chartCanvas.value.getContext('2d'), {
          type: 'bar',
          data: {
            labels: binCenters,
            datasets: [
              {
                type: 'scatter',
                label: 'Fitted Distribution',
                data: props.distributionData.x.map((x, i) => ({ x, y: props.distributionData.y[i] })),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                showLine: true,
                fill: false,
                tension: 0.1,
                pointRadius: 3
              },
              {
                label: 'Histogram',
                data: props.histogramData.hist_values,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderWidth: 1,
                barPercentage: 1.0,
                categoryPercentage: 1.0,
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Value'
                },
                type: 'linear',
                position: 'bottom'
              },
              y: {
                title: {
                  display: true,
                  text: 'Density'
                }
              }
            }
          }
        });
      };
  
      onMounted(createChart);
      watch(() => props.histogramData, createChart);
      watch(() => props.distributionData, createChart);
  
      return {
        chartCanvas
      };
    }
  };
  </script>
  
  <style scoped>
  canvas {
    width: 100%;
    height: 400px;
  }
  </style>
  