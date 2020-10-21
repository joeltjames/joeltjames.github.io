MAX_WEEK = 0;
NUM_INJURIES = 4;

let injuryReportData;
let injuredReserveData;
let combinedDrawn = false;


d3.csv('assets/data/nfl-injury/injury_report_data.csv')
  .then(makeInjuryReportChart);

d3.csv('assets/data/nfl-injury/injured_reserve_data.csv')
  .then(makeInjuredReserveChart);

function setMaxWeek(data) {
  if (MAX_WEEK == 0) {
    let filtered = _.filter(data, function(item) {return parseInt(item.year, 10) == 2020});
    filtered = filtered.map(i => parseInt(i.week ? i.week : i.week_num, 10))
    MAX_WEEK = Math.max(...filtered);
    document.getElementById("week-num").textContent = MAX_WEEK;
  }
}


function getDatasetsByInjuryType(chartData) {
  all_types = {};
  for (val in chartData) {
    byType = _.groupBy(chartData[val], 'injury_type');
    for (type in byType) {
      if (!all_types[type]) {
        all_types[type] = 0;
      }
      all_types[type] += byType[type].length;
    }
  }
  let allTypesList = [];
  for (type in all_types) {
    allTypesList.push({
      [type]: all_types[type]
    });
  }
  let toKeep = allTypesList.sort((a, b) => Object.values(b)[0] - Object.values(a)[0]).slice(0, NUM_INJURIES).map(a => Object.keys(a)[0]);

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




  let chartColors = ["#5bc0eb", "#fde74c", "#9bc53d", "#e55934", "#fa7921", "#083d77", "#ebebd3", "#297373", "#d5d887", "#ef476f"];
  let datasets = {};
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

  return datasets;
}

function makeInjuryReportChart(csvData) {
  setMaxWeek(csvData);
  csvData = _.filter(csvData, function(datum) {
    return datum.week <= MAX_WEEK
  });
  injuryReportData = csvData;
  let chartData = _.groupBy(csvData, 'year');

  labels = Object.keys(chartData);

  let data = [];

  const isMedium = window.matchMedia("(min-width: 461px)").matches;
  if (isMedium) {
    datasets = getDatasetsByInjuryType(chartData);
    data = Object.values(datasets);
  } else {
    data = [{
      label: 'Total Injuries Reported',
      backgroundColor: "#5bc0eb",
      data: Object.values(chartData).map(vals => vals.length)
    }];
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
        intersect: false,
        callbacks: {
          footer: function(tooltipItems) {
            if (tooltipItems.length > 1) {
              let total = 0;
              for (let i = 0; i < tooltipItems.length; i++) {
                total += parseInt(tooltipItems[i].yLabel, 10);
              }
              return 'Total: ' + total;
            }
          }
        }
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

  makeCombinedChart(injuryReportData, injuredReserveData);
}

function makeInjuredReserveChart(csvData) {
  setMaxWeek(csvData);
  csvData = _.filter(csvData, function(item) {
    return parseInt(item.week_num, 10) <= MAX_WEEK;
  });
  injuredReserveData = csvData;
  let data = _.groupBy(csvData, 'year');
  for (year in data) {
    data[year] = data[year].length;
  }
  const labels = Object.keys(data);
  const numIr = Object.values(data);
  const datasets = [{
    label: 'Players Placed on IR',
    backgroundColor: "#297373",
    data: numIr
  }];

  let avg = function(data) {
    return data.reduce(function(a, b) {
      return Number(a) + Number(b);
    }) / data.length;
  };

  let stdDev = function(data) {
    let m = avg(data);
    return Math.sqrt(data.reduce(function(sq, n) {
      return sq + Math.pow(n - m, 2);
    }, 0) / (data.length));
  };

  const avgIr = avg(numIr);
  const stdDevIr = stdDev(numIr);

  document.getElementById("avg-ir").textContent = avgIr.toFixed(2);
  document.getElementById("sd-ir").textContent = stdDevIr.toFixed(2);
  document.getElementById("pct-inc").textContent = `${(((data[2020] / avgIr)-1.00)*100).toFixed(2)}%`;

  new Chart('injured-reserve', {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
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
        yAxes: [{
          display: true,
          ticks: {
            beginAtZero: true // minimum value will be 0.
          }
        }]
      }
    }
  });

  makeCombinedChart(injuryReportData, injuredReserveData);
}

function makeCombinedChart(reportData, irData) {
  if (reportData && irData && !combinedDrawn) {
    combinedDrawn = true;
    let rd = _.groupBy(reportData, "year");
    for (year in rd) {
      rd[year] = rd[year].length;
    }

    let ir = _.groupBy(irData, "year");
    for (year in ir) {
      ir[year] = ir[year].length;
    }

    labels = Object.keys(rd);

    datasets = [{
      label: "Reported Injuries",
      backgroundColor: "#083d77",
      data: Object.values(rd)
    }, {
      label: "Placed on Injury Reserve",
      backgroundColor: "#9bc53d",
      data: Object.values(ir)
    }];

    new Chart('combined', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        title: {
          display: false,
        },
        tooltips: {
          mode: 'index',
          intersect: false,
          callbacks: {
            footer: function(tooltipItems) {
              if (tooltipItems.length > 1) {
                let total = 0;
                for (let i = 0; i < tooltipItems.length; i++) {
                  total += parseInt(tooltipItems[i].yLabel, 10);
                }
                return 'Total: ' + total;
              }
            }
          }
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
}