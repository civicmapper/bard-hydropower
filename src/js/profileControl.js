var Chart = require('chart.js');

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
                intersect: false,
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    // scaleLabel: {
                    //     display: true,
                    //     labelString: ""
                    // }
                }],
                yAxes: [{
                    stacked: true,
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Elevation'
                    }
                }]
            },
            legend: {
                display: false
            },
            elements: {
                line: {
                    //tension: 0.1, // disables bezier curves
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
        canvas.style.height = (this.options.height * 0.95) + "px";
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
            options: this.options,
            data: {
                labels: labelsForChartjs,
                datasets: [{
                    data: dataForChartjs
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