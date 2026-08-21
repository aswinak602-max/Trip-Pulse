import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export const ExpenseCategoryDoughnut = ({ categories = {} }) => {
  const labels = Object.keys(categories);
  const dataValues = Object.values(categories);

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'
  ];

  if (labels.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        No expenses recorded yet.
      </div>
    );
  }

  const data = {
    labels: labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#111827',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Plus Jakarta Sans', size: 11 },
          padding: 12
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ₹${context.raw.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: '220px', width: '100%' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
};

export const EstimatedVsActualBar = ({ estimated = 0, actual = 0, budget = 0 }) => {
  const data = {
    labels: ['User Budget', 'ML Predicted', 'Actual Spent'],
    datasets: [
      {
        label: 'Trip Budget Analysis (₹)',
        data: [budget, estimated, actual],
        backgroundColor: ['#6366f1', '#3b82f6', actual > budget ? '#ef4444' : '#10b981'],
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ₹${context.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: {
          color: '#94a3b8',
          callback: function (val) {
            return '₹' + val / 1000 + 'k';
          },
        },
      },
    },
  };

  return (
    <div style={{ height: '220px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
};
