// ##############################
// // // javascript library for creating charts
// #############################
var Chartist = require("chartist");

// ##############################
// // // variables used to create animation on charts
// #############################
var delays = 80,
  durations = 500;

// ##############################
// // // labels and data handling
// #############################

const parseDataHumidity = function(sortedArray){
  var labels = [];
  var series = [];
  for(var i = 0; i < sortedArray.length; i++){
    labels.push(sortedArray[i][1]);
    series.push(parseInt(sortedArray[i][3]));
  }
  return {
    labels: labels,
    series: [series]
  }
}

const parseDataTemperature = function(sortedArray){
  var labels = [];
  var series = [];
  for(var i = 0; i < sortedArray.length; i++){
    labels.push(sortedArray[i][1]);
    series.push(parseInt(sortedArray[i][2]));
  }
  return {
    labels: labels,
    series: [series]
  }
}

const parseDataFill = function(sortedArray){
  var labels = [];
  var series = [];
  for(var i = 0; i < sortedArray.length; i++){
    labels.push(sortedArray[i][1]);
    series.push(parseInt(sortedArray[i][5]));
  }
  return {
    labels: labels,
    series: [series]
  }
}

// ##############################
// // // TEMPERATURE CHART
// #############################

const temperatureChart = {
  data: {
    labels: ["M", "T", "W", "T", "F", "S", "S"],
    series: [[12, 17, 7, 17, 23, 18, 38]]
  },
  options: {
    showPoint: false,
    showLabel: false,
    axisX: {
      showGrid: false,
      showLabel: false,
      offset: 0
    },
    axisY: {
      showGrid: true,
      showLabel: true,
    },
    lineSmooth: Chartist.Interpolation.cardinal({
      tension: 0.5
    }),
    low: 0,
    high: 50,
    chartPadding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  },
  // for animation
  animation: {
    draw: function(data) {
      if (data.type === "line" || data.type === "area") {
        data.element.animate({
          d: {
            begin: 600,
            dur: 700,
            from: data.path
              .clone()
              .scale(1, 0)
              .translate(0, data.chartRect.height())
              .stringify(),
            to: data.path.clone().stringify(),
            easing: Chartist.Svg.Easing.easeOutQuint
          }
        });
      } else if (data.type === "point") {
        data.element.animate({
          opacity: {
            begin: (data.index + 1) * delays,
            dur: durations,
            from: 0,
            to: 1,
            easing: "ease"
          }
        });
      }
    }
  }
};

// ##############################
// // // HUMIDITY CHART
// #############################

const humidityChart = {
  data: {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mai",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ],
    series: [[542, 443, 320, 780, 553, 453, 326, 434, 568, 610, 756, 895]]
  },
  options: {
    showPoint: false,
    lineSmooth: Chartist.Interpolation.cardinal({
      tension: 0.5
    }),
    showLabel: false,
    axisX: {
      showGrid: false,
      showLabel: false,
      offset: 0
    },
    axisY: {
      showGrid: true,
      showLabel: true,
    },
    low: 0,
    high: 101,
    chartPadding: {
      top: 0,
      right: 5,
      bottom: 0,
      left: 0
    }
  },
  responsiveOptions: [
    [
      "screen and (max-width: 640px)",
      {
        seriesBarDistance: 5,
        axisX: {
          labelInterpolationFnc: function(value) {
            return value[0];
          }
        }
      }
    ]
  ],
  animation: {
    draw: function(data) {
      if (data.type === "line" || data.type === "area") {
        data.element.animate({
          d: {
            begin: 600,
            dur: 700,
            from: data.path
              .clone()
              .scale(1, 0)
              .translate(0, data.chartRect.height())
              .stringify(),
            to: data.path.clone().stringify(),
            easing: Chartist.Svg.Easing.easeOutQuint
          }
        });
      } else if (data.type === "point") {
        data.element.animate({
          opacity: {
            begin: (data.index + 1) * delays,
            dur: durations,
            from: 0,
            to: 1,
            easing: "ease"
          }
        });
      }
    }
  }
};

// ##############################
// // // FILL LEVEL CHART
// #############################

const fillChart = {
  data: {
    labels: ["12am", "3pm", "6pm", "9pm", "12pm", "3am", "6am", "9am"],
    series: [[230, 750, 450, 300, 280, 240, 200, 190]]
  },
  options: {
    showLabel: false,
    axisX: {
      showGrid: false,
      showLabel: false,
      offset: 0
    },
    axisY: {
      showGrid: true,
      showLabel: true,
    },
    lineSmooth: Chartist.Interpolation.cardinal({
      tension: 0
    }),
    low: 0,
    high: 101, // creative tim: we recommend you to set the high sa the biggest value + something for a better look
    chartPadding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  },
  animation: {
    draw: function(data) {
      if (data.type === "line" || data.type === "area") {
        data.element.animate({
          d: {
            begin: 600,
            dur: 700,
            from: data.path
              .clone()
              .scale(1, 0)
              .translate(0, data.chartRect.height())
              .stringify(),
            to: data.path.clone().stringify(),
            easing: Chartist.Svg.Easing.easeOutQuint
          }
        });
      } else if (data.type === "point"  || data.type === "bar") {
        data.element.animate({
          opacity: {
            begin: (data.index + 1) * delays,
            dur: durations,
            from: 0,
            to: 1,
            easing: "ease"
          }
        });
      }
    }
  }
};

module.exports = {
  temperatureChart,
  humidityChart,
  fillChart,
  parseDataHumidity,
  parseDataTemperature,
  parseDataFill,
};
