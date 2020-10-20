MAX_WEEK = 6;
NUM_INJURIES = 4;

d3.csv('assets/data/injury_report_data.csv')
  .then(makeChart);

function makeChart(data) {
  const isPhone = window.matchMedia("(max-width: 768px)").matches;
  const isIpad = window.matchMedia("(max-width: 1024px)").matches;

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
  toKeep = allTypesList.sort((a, b) => Object.values(b)[0] - Object.values(a)[0]).slice(0, NUM_INJURIES).map(a => Object.keys(a)[0]);

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


  labels = Object.keys(chartData);

  chartColors = ["#5bc0eb", "#fde74c", "#9bc53d", "#e55934", "#fa7921", "#083d77", "#ebebd3", "#297373", "#d5d887", "#ef476f"];
  datasets = {};
  for (year in chartData) {
    for (type in chartData[year]) {
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

  data = Object.values(datasets);

  if (isPhone.matches && !isIpad.matches) {
    totals = {
      label: 'Total Injuries Reported',
      backgroundColor: "#5bc0eb",
      data: labels.map(i => 0)
    };
    for (item in datasets) {
      for (val in datasets[item].data) {
        totals.data[val] += datasets[item].data[val];
      }
    }
    data = [totals];
  }


  new Chart('injury-report-by-type', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: data
    },
    options: {
      title: {
        display: false,
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