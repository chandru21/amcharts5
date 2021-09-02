import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
var root = am5.Root.new("chartdiv");

// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);

// Create chart
// https://www.amcharts.com/docs/v5/charts/xy-chart/
var chart = root.container.children.push(
  am5xy.XYChart.new(root, {
    panX: true,
    panY: true,
    wheelX: "panX",
    wheelY: "zoomX"
  })
);

chart.get("colors").set("step", 3);

var cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
cursor.lineY.set("visible", false);

var date = new Date();
date.setHours(0, 0, 0, 0);
var value = 100;

function generateData() {
  value = Math.round((Math.random() * 10 - 5) + value);
  am5.time.add(date, "day", 1);
  return { date: date.getTime(), value: value };
}

function generateDatas(count) {
  var data = [];
  for (var i = 0; i < count; ++i) {
    data.push(generateData());
  }
  return data;
}

// Create axes
// https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
var xAxis = chart.xAxes.push(
  am5xy.DateAxis.new(root, {
    maxDeviation: 0.3,
    baseInterval: { timeUnit: "day", count: 1 },
    renderer: am5xy.AxisRendererX.new(root, {}),
    tooltip: am5.Tooltip.new(root, { themeTags: ["axis"], animationDuration: 200 })
  })
);

var yAxis = chart.yAxes.push(
  am5xy.ValueAxis.new(root, {
    maxDeviation: 0.3,
    renderer: am5xy.AxisRendererY.new(root, {})
  })
);


var series = chart.series.push(am5xy.LineSeries.new(root, { name: "Series 1", xAxis: xAxis, yAxis: yAxis, valueYField: "value", valueXField: "date" }));
series.strokes.template.setAll({ strokeWidth: 2, strokeDasharray: [3, 3] });

// create animating bullet by adding two circles in a bullet container and animating radius and opacity of one of them.
series.bullets.push(function() {
  let container = am5.Container.new(root, { templateField: "bulletSettings" });
  let circle0 = container.children.push(am5.Circle.new(root, { radius: 5, fill: am5.color(0xff0000) }));
  let circle1 = container.children.push(am5.Circle.new(root, { radius: 5, fill: am5.color(0xff0000) }));

  circle1.animate({ key: "radius", to: 20, duration: 1000, easing: am5.ease.out(am5.ease.cubic), loops: Infinity });
  circle1.animate({ key: "opacity", to: 0, from:1, duration: 1000, easing: am5.ease.out(am5.ease.cubic), loops: Infinity });

  return am5.Bullet.new(root, { sprite: container })
})

var tooltip = series.set("tooltip", am5.Tooltip.new(root, {}));
tooltip.label.set("text", "{valueY}");

var data = [
  { date: new Date(2021, 5, 12).getTime(), value: 50, bulletSettings: { visible: false } },
  { date: new Date(2021, 5, 13).getTime(), value: 53, bulletSettings: { visible: false } },
  { date: new Date(2021, 5, 14).getTime(), value: 56, bulletSettings: { visible: false } },
  { date: new Date(2021, 5, 15).getTime(), value: 52, bulletSettings: { visible: false } },
  { date: new Date(2021, 5, 16).getTime(), value: 48, bulletSettings: { visible: false } },
  { date: new Date(2021, 5, 17).getTime(), value: 47, bulletSettings: { visible: false } },
  { date: new Date(2021, 5, 18).getTime(), value: 59, bulletSettings: { visible: true } }]

series.data.setAll(data);

// Make stuff animate on load
// https://www.amcharts.com/docs/v5/concepts/animations/
series.appear(1000);
chart.appear(1000, 100);