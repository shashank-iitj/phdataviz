'use strict';
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var dayColors = {
    "Monday": "#1976D2",
    "Tuesday": "#2196F3",
    "Wednesday": "#BBDEFB",
    "Thursday": "#FFFFFF",
    "Friday": "#4CAF50",
    "Saturday": "#49d5a2",
    "Sunday": "#fa436b"
};

var model = {
    init: function () {
        // load PH Data
        // Process and Transform Data like this
        this.productsByDay = {};
        this.productFrequency = {};
        for (var i = 0; i < days.length; i++) {
            var day = days[i];
            this.productsByDay[day] = [];
            this.productFrequency[day] = {
                products: 0,
                votes: 0,
                comments: 0
            };
        }

        Papa.parse("data/ph_products.csv", {
            download: true,
            dynamicTyping: true,
            complete: function (results) {
                var headers = ["", "id", "name", "category_id", "votes_count",
                    "comments_count", "date", "weekday", "created_at",
                    "country", "country_iso", "lat", "lng"];
                let dateSet = new Set();
                for (var i = 1; i < results.data.length; i++) {
                    var item = {};
                    var row = results.data[i];
                    for (var index = 1; index < headers.length; index++) {
                        item[headers[index]] = row[index];
                    }

                    var day = item["weekday"];
                    var name = item["name"];
                    model.productsByDay[day].push({
                        id: item["id"],
                        name: name,
                        lat: item["lat"],
                        lng: item["lng"],
                        votes: item["votes_count"],
                        day: item["weekday"]
                    });

                    model.productFrequency[day].products += 1;
                    model.productFrequency[day].votes += item["votes_count"];
                    model.productFrequency[day].comments += item["comments_count"];

                    dateSet.add(item['date'])
                }

                this.totalDays = dateSet.size - 1;
                // Average out the votes and comments count
                for (var i = 0; i < days.length; i++) {
                    var dayOfWeek = days[i];
                    model.productFrequency[dayOfWeek].votes = model.productFrequency[dayOfWeek].votes / this.totalDays;
                    model.productFrequency[dayOfWeek].comments = model.productFrequency[dayOfWeek].comments / this.totalDays;
                }

                controller.dataLoadCallback();
            }
        });
    },
    getAverageData: function (key) {
        var output = [];
        for (var i = 0; i < days.length; i++) {
            var day = days[i];

            output.push({
                day: day,
                value: model.productFrequency[day][key]
            })
        }
        return output;
    }
};

var controller = {
    init: function () {
        controller.currentDay = days[new Date().getDay()];
        controller.sidebarKey = "votes";

        model.init();
    },
    dataLoadCallback: function () {
        var mapData = model.productsByDay[controller.currentDay];
        var chartData = model.getAverageData(controller.sidebarKey);
        view.init(mapData, chartData);
    }
};

var view = {
    init: function (mapData, chartData) {
        view.map.init(".map", mapData);
        view.sidebar.init(".sidebar.right .chart", chartData);
    },
    sidebar: {
        init: function (selector, data) {
            this.render(selector, data);
        },
        render: function (selector, data) {
            // set the dimensions and margins of the graph
            var width = document.querySelector(selector).clientWidth;
            var height = document.querySelector(selector).clientHeight;
            var margin = {top: 20, right: 20, bottom: 30, left: 40},
                width = width - margin.left - margin.right,
                height = height - margin.top - margin.bottom;

            // set the ranges
            var x = d3.scaleBand()
                .range([0, width])
                .padding(0.1);
            var y = d3.scaleLinear()
                .range([height, 0]);


            var svg = d3.select(selector).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");


            // Scale the range of the data in the domains
            x.domain(data.map(function (d) {
                return d.day;
            }));
            y.domain([0, d3.max(data, function (d) {
                return d.value;
            })]);

            // append the rectangles for the bar chart
            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function (d) {
                    return x(d.day);
                })
                .attr("width", x.bandwidth())
                .attr("y", function (d) {
                    return y(d.value);
                })
                .attr("height", function (d) {
                    return height - y(d.value);
                });

            // add the x Axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            // add the y Axis
            svg.append("g")
                .call(d3.axisLeft(y));
        }
    },
    map: {
        init: function (selector, data) {
            // TODO: remove hardcoding
            var width = 950;
            var height = 500;

            this.projection = d3.geoEquirectangular()
                .scale(height / Math.PI)
                .translate([width / 2, height / 2]);

            var path = d3.geoPath()
                .projection(view.map.projection);

            var graticule = d3.geoGraticule();

            this.svg = d3.select(selector)
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            this.svg.append("path")
                .datum(graticule)
                .attr("class", "graticule")
                .attr("d", path);

            d3.json("json/world-50m.json", function (error, world) {
                if (error) throw error;

                view.map.svg.insert("path", ".graticule")
                    .datum(topojson.feature(world, world.objects.land))
                    .attr("class", "land")
                    .attr("d", path);
                view.map.render(data);
            })
        },
        render: function (data) {
            var votesRange = d3.extent(data, function (d) {
                return d.votes
            });
            var votesScale = d3.scaleLinear().range([2, 10]).domain(votesRange);

            /* Initialize tooltip */
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .html(function (d) {
                    return d.name + "<br>Votes: " + d.votes;
                });

            /* Invoke the tip in the context of your visualization */
            view.map.svg.call(tip);

            view.map.svg.append("g")
                .selectAll("circle")
                .data(data, function (d) {
                    return d.id;
                })
                .enter()
                .append("circle")
                .attr("cx", function (d) {
                    return view.map.projection([d.lng, d.lat])[0];
                })
                .attr("cy", function (d) {
                    return view.map.projection([d.lng, d.lat])[1];
                })
                .attr("r", function (d) {
                    return votesScale(d.votes)
                })
                .attr("fill", function (d) {
                    return dayColors[d.day]
                })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
        }
    }
};

controller.init();
