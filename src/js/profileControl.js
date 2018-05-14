var Chart = require('chart.js');

Chart.defaults.global.legend.display = false;

var ElevationProfileControl = L.Control.extend({
    /**
     * options. accepts standard leaflet control options, plus has properties
     * for chartJS configuration options and, optionally, chart data
     */
    options: {
        position: 'bottomleft',
        width: 640,
        height: 200,
        controlClass: "panel panel-default",
        chartjsOptions: {
            responsive: true,
            title: {
                display: false,
            },
            tooltips: {
                mode: 'index',
                intersect: true,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    id: 'distance-axis',
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Distance (ft)'
                    }
                }],
                yAxes: [{
                    id: 'elevation-axis',
                    stacked: true,
                    display: true,
                    type: 'linear',
                    scaleLabel: {
                        display: true,
                        labelString: 'Elevation (ft)'
                    }
                }]
            },
            legend: {
                display: false
            },
            elements: {
                point: {
                    backgroundColor: "#2baae2",
                    borderColor: "#2baae2"
                },
                line: {
                    tension: 0, // disables bezier curves
                    // backgroundColor: "#2D8421",
                    borderColor: "#2baae2",
                    // borderWidth: 1.5
                }
            }
        },
        data: null,
    },
    /**
     * refence to chartjs object
     */
    _chart: null,
    /**
     * for working with addTo(map) function
     */
    onAdd: function (map) {

        // create the container for the chart canvas
        this._map = map;
        var container = L.DomUtil.create("div", this.options.controlClass);
        container.style.width = this.options.width + "px";
        container.style.height = this.options.height + "px";
        container.id = "elevation-profile-container";
        // create the canvas in the container
        var canvas = L.DomUtil.create("canvas", "elevation-profile-chart", container)
        canvas.style.width = (this.options.width * 0.95) + "px";
        canvas.style.height = (this.options.height * 0.90) + "px";
        canvas.id = "elevation-profile-chart";

        // figure out what data we have to work with
        var dataForChartjs, labelsForChartjs;
        // if data has been passed in via options, use that
        if (this.options.data) {
            dataForChartjs = this.options.data
            labelsForChartjs = dataForChartjs.map(i => i.x.toFixed(2));
            // otherwise chartjs needs data, so we give it an empty thing
        } else {
            labelsForChartjs: [0]
            dataForChartjs = [{
                x: 0,
                y: 0
            }]
        }

        // make a new chart!
        this._chart = new Chart(L.DomUtil.get(canvas), {
            type: 'line',
            options: this.options.chartjsOptions,
            data: {
                labels: labelsForChartjs,
                datasets: [{
                    yAxisID: 'elevation-axis',
                    xAxisID: 'distance-axis',
                    data: dataForChartjs,
                    fill: 'origin',
                    label: 'Elevation (ft.)'
                }]
            }
        });
        return container;
    },
    /** 
     * for initial data add (when no chart already exists)
     * and update of chart (when chart exists)
     */
    addData: function (data) {
        console.log("building elevation profile");
        var labels = data.map(i => i.x.toFixed(2));
        this._chart.data.labels = labels;
        // this._chart.data.datasets[0] == data;
        this._chart.data.datasets.forEach((dataset) => {
            dataset.data = data;
        });
        this._chart.update();
        // console.log(this._chart.data);
    },
    /**
     * for working with remove() function
     */
    onRemove: function (map) {
        this._container = null;
        this._chart.destroy()
    }
})

var elevationProfileControl = function (options) {
    return new ElevationProfileControl(options);
};

exports.elevationProfileControl = elevationProfileControl;
exports.ElevationProfileControl = ElevationProfileControl;