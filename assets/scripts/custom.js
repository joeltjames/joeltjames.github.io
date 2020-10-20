console.log('hi');

MAX_WEEK = 6;

d3.csv('assets/data/injury_report_data.csv')
  .then(makeChart);

function makeChart(data) {
  chartData = _.filter(data, function(datum) {
    return datum.week <= MAX_WEEK
  });
  chartData = _.groupBy(chartData, 'year');
  all_types = {}
  for (val in chartData) {
    byType = _.groupBy(chartData[val], 'injury_type');
    for (type in byType) {
      if (!all_types[type]) {
        all_types[type] = 0;
      }
      all_types[type] += byType[type].length;
    }
  }
  allTypesList = [];
  for (type in all_types) {
    allTypesList.push({
      [type]: all_types[type]
    });
  }
  toKeep = allTypesList.sort((a, b) => Object.values(b)[0] - Object.values(a)[0]).slice(0, 10).map(a => Object.keys(a)[0]);

  for (val in chartData) {
    byType = _.groupBy(chartData[val], 'injury_type');
    updated = {
      'Misc': 0
    };
    for (type in byType) {
      if (toKeep.includes(type)) {
        updated[type] = byType[type].length;
      } else {
        updated['Misc'] += byType[type].length;
      }
    }
    chartData[val] = updated
  }

  console.log(chartData);

  labels = Object.keys(chartData);

  chartColors = [
    'rgb(255, 99, 132)',
    'rgb(255, 159, 64)',
    'rgb(255, 205, 86)',
    'rgb(75, 192, 192)',
    'rgb(54, 162, 235)',
    'rgb(153, 102, 255)',
    'rgb(201, 203, 207)',
    'rgb(75, 192, 192)',
    'rgb(201, 203, 207)',
    'rgb(75, 192, 192)',
  ];
  datasets = {};
  for (year in chartData) {
      for (type in chartData[year]) {
          console.log(type);
          if (!datasets[type]) {
              datasets[type] = {
                  label: type,
                  backgroundColor: chartColors.pop(),
                  data: []
              };
          }
          datasets[type].data.push(chartData[year][type]);
      }
  }

  console.log(datasets);



  new Chart('injury-report-by-type', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: Object.values(datasets)
    },
    options: {
      title: {
        display: true,
        text: 'Chart.js Bar Chart - Stacked'
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
        }],
        yAxes: [{
          stacked: true
        }]
      }
    }
  });
}