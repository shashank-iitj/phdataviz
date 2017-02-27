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
        // Dictionary | Key: Day of the week, Value: Array of products launched by day of the week
        this.individualProductsByDay = {};
        // Dictionary | Key: Day of the week, Value: Array to total number of products launched on a particular date on that day of the Week
        this.productsLaunchedPerDayBreakdown = {};
        // Dictionary | Key: Metric, Value: Array of Median number of metric on each day of week
        this.medianData = {
            votes: [],
            comments: [],
            numberOfProducts: []
        };

        for (var i = 0; i < days.length; i++) {
            var day = days[i];
            this.individualProductsByDay[day] = [];
            this.productsLaunchedPerDayBreakdown[day] = [];
        }

        Papa.parse("data/ph_products.csv", {
            download: true,
            dynamicTyping: true,
            complete: model.processCsv
        });
    },
    processCsv: function (results) {
        var headers = ["", "id", "name", "category_id", "votes_count",
            "comments_count", "date", "weekday", "created_at",
            "country", "country_iso", "lat", "lng"];

        // Dictionary | Key: Date, Value: Day of the week
        var dateDayDict = {};
        // Dictionary | Key: Date, Value: Total products on that date
        var productsPerDate = {};

        let dateSet = new Set();
        for (var i = 1; i < results.data.length; i++) {
            var item = {};
            var row = results.data[i];
            for (var index = 1; index < headers.length; index++) {
                item[headers[index]] = row[index];
            }

            var day = item["weekday"];
            var name = item["name"];
            var date = item['date'];

            model.individualProductsByDay[day].push({
                id: item["id"],
                name: name,
                lat: item["lat"],
                lng: item["lng"],
                votes: item["votes_count"],
                comments: item["comments_count"],
                day: item["weekday"]
            });

            // Add Date to the Set
            dateSet.add(date);
            // DateDayDict
            dateDayDict[date] = item['weekday'];

            // Increment the number of product launched on that day
            if (!productsPerDate.hasOwnProperty(date)) {
                productsPerDate[date] = 0;
            }
            productsPerDate[date] += 1;
        }

        for (var it = dateSet.values(), date = null; date = it.next().value;) {
            var productsLaunchedOnDate = productsPerDate[date];
            var dayOftheDate = dateDayDict[date];
            model.productsLaunchedPerDayBreakdown[dayOftheDate].push(productsLaunchedOnDate)
        }

        // Median Data
        for (var i = 0; i < days.length; i++) {
            var dayOfWeek = days[i];
            model.medianData.numberOfProducts.push({
                day: dayOfWeek,
                value: d3.median(model.productsLaunchedPerDayBreakdown[dayOfWeek])
            });

            var mediaVotesOnDay = d3.median(model.individualProductsByDay[dayOfWeek], function (d) {
                return d.votes
            });

            model.medianData.votes.push({
                day: dayOfWeek,
                value: mediaVotesOnDay
            });

            var mediaCommentsOnDay = d3.median(model.individualProductsByDay[dayOfWeek], function (d) {

                return d.comments
            });

            model.medianData.comments.push({
                day: dayOfWeek,
                value: mediaCommentsOnDay
            });
        }

        this.totalDays = dateSet.size - 1;

        controller.dataLoad();
    }
};

var controller = {
    init: function () {
        controller.currentDay = days[new Date().getDay()];
        controller.sidebarKey = "votes";
        model.init();
    },
    dataLoad: function () {
        var mapData = model.individualProductsByDay[controller.currentDay];
        var medianDataByDay = {
            votes: model.medianData['votes'],
            comments: model.medianData['comments'],
            numberOfProducts: model.medianData['numberOfProducts']
        };
        var chartData = medianDataByDay[controller.sidebarKey];

        var dayIndex = days.indexOf(controller.currentDay);
        var contentData = {
            numberOfProducts: medianDataByDay.numberOfProducts[dayIndex].value,
            votes: medianDataByDay.votes[dayIndex].value,
            comments: medianDataByDay.comments[dayIndex].value
        };
        view.init(mapData, chartData, contentData);
    },
    render: function () {
        var mapData = model.individualProductsByDay[controller.currentDay];
        var medianDataByDay = {
            votes: model.medianData['votes'],
            comments: model.medianData['comments'],
            numberOfProducts: model.medianData['numberOfProducts']
        };

        var dayIndex = days.indexOf(controller.currentDay);
        var contentData = {
            numberOfProducts: medianDataByDay.numberOfProducts[dayIndex].value,
            votes: medianDataByDay.votes[dayIndex].value,
            comments: medianDataByDay.comments[dayIndex].value
        };
        view.render(mapData, contentData);
    },
    update: {
        dayOfWeek: function (dayOfWeek) {
            controller.currentDay = dayOfWeek;
            controller.render();
        }
    }
};

var view = {
    init: function (mapData, chartData, contentData) {
        view.map.init(".map", mapData);
        view.sidebar.init(".sidebar.right .chart", chartData);
        view.content.init(contentData);
        view.filter.init();
    },
    render: function (mapData, contentData) {
        view.map.render(mapData);
        view.content.render(contentData);
    },
    sidebar: {
        init: function (selector, data) {
            this.render(selector, data);
        },
        render: function (selector, data) {
            // set the dimensions and margins of the graph
            var width = document.querySelector(selector).clientWidth;
            var height = document.querySelector(selector).clientHeight;
            var margin = {top: 20, right: 50, bottom: 30, left: 40},
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
                .exit()
                .remove();
        }
    },
    content: {
        init: function (data) {
            this.render(data);
        },
        render: function (data) {
            document.querySelector("#products").innerHTML = data.numberOfProducts;
            document.querySelector("#votes").innerHTML = data.votes;
            document.querySelector("#comments").innerHTML = data.comments;
        }
    },
    // Event listener for day select and metric select
    filter: {
        init: function () {
            $(".sidebar.left li").click(function (e) {
               var dayOfWeekSelected = e.target.textContent;
               controller.update.dayOfWeek(dayOfWeekSelected);
            });
        }
    }
};

controller.init();
