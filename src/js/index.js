'use strict';
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var dayColors = {
    "Monday": "#1976D2",
    "Tuesday": "#2196F3",
    "Wednesday": "#BBDEFB",
    "Thursday": "#FAA613",
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

        // Initializing models with empty array for every day of the week
        for (var i = 0; i < days.length; i++) {
            var day = days[i];
            this.individualProductsByDay[day] = [];
            this.productsLaunchedPerDayBreakdown[day] = [];
        }

        // A CSV parsing library to load and process the csv files and create models for rendering views later
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

        // Initializing dataSet to store the unique number of dates in the dataset
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

        // Agreggating the products launched on each day of the week together
        for (var it = dateSet.values(), date = null; date = it.next().value;) {
            var productsLaunchedOnDate = productsPerDate[date];
            var dayOftheDate = dateDayDict[date];
            model.productsLaunchedPerDayBreakdown[dayOftheDate].push(productsLaunchedOnDate)
        }

        // Median Data
        for (var i = 0; i < days.length; i++) {
            var dayOfWeek = days[i];
            // Median number of products launched on each day of the week
            model.medianData.numberOfProducts.push({
                day: dayOfWeek,
                value: d3.median(model.productsLaunchedPerDayBreakdown[dayOfWeek])
            });

            // Median votes received on each day of the week
            var mediaVotesOnDay = d3.median(model.individualProductsByDay[dayOfWeek], function (d) {
                return d.votes
            });

            model.medianData.votes.push({
                day: dayOfWeek,
                value: mediaVotesOnDay
            });

            // Median comments received on each day of the week
            var mediaCommentsOnDay = d3.median(model.individualProductsByDay[dayOfWeek], function (d) {

                return d.comments
            });

            model.medianData.comments.push({
                day: dayOfWeek,
                value: mediaCommentsOnDay
            });
        }

        controller.dataLoad();
    }
};

// This is the piece of the code which acts as the bridge between data aka models and the view
var controller = {
    init: function () {
        // We initialize the graph with sensible defaults like the current day of the week and metric in sidebar
        // set as number of Products
        controller.currentDay = days[new Date().getDay()];
        controller.sidebarKey = "numberOfProducts";
        model.init();
    },
    dataLoad: function () {
        // This function is called after the data set is successfully loaded and process. This function now
        // prepares the data necessary for the view and initializes the view

        // mapData is the data needed for the circular points on map to load
        var mapData = model.individualProductsByDay[controller.currentDay];

        // chartData reprets the bar graphs rendered in the side.
        var medianDataByDay = {
            votes: model.medianData['votes'],
            comments: model.medianData['comments'],
            numberOfProducts: model.medianData['numberOfProducts']
        };
        var chartData = medianDataByDay[controller.sidebarKey];

        // contentData represents the small crumbs of numberical information rendered below the bar charts
        var dayIndex = days.indexOf(controller.currentDay);
        var contentData = {
            numberOfProducts: medianDataByDay.numberOfProducts[dayIndex].value,
            votes: medianDataByDay.votes[dayIndex].value,
            comments: medianDataByDay.comments[dayIndex].value
        };
        view.init(controller.currentDay, controller.sidebarKey, mapData, chartData, contentData);
    },
    render: function () {
        // This function is called when a user changes parameters on view and we need to render the visualisation again
        // The mapData, chartData and contentData and refreshed and the visualisation is refreshed.
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
        view.render(controller.currentDay, mapData, chartData, contentData);
    },
    update: {
        // The view calls this function to toggel and update the chart
        dayOfWeek: function (dayOfWeek) {
            controller.currentDay = dayOfWeek;
            controller.render();
        },
        metric: function (metric) {
            controller.sidebarKey = metric;
            controller.render();
        }
    }
};

var view = {
    init: function (currentDay, metric, mapData, chartData, contentData) {
        // Initialises the various components of the chart
        view.map.init(".map", mapData);
        view.sidebar.init(currentDay, ".sidebar.right .chart", chartData);
        view.content.init(currentDay, contentData);
        view.filter.init(currentDay);
        view.metric.init(metric);
    },
    render: function (currentDay, mapData, chartData, contentData) {
        view.map.render(mapData);
        view.content.render(currentDay, contentData);
        view.sidebar.render(currentDay, ".sidebar.right .chart", chartData);
        view.filter.update(currentDay);
        view.sidebar.update(currentDay);
    },
    sidebar: {
        // Intitialises and loads the sidebar which contains the bar chart
        init: function (day, selector, data) {
            view.sidebar.width = document.querySelector(selector).clientWidth;
            view.sidebar.height = document.querySelector(selector).clientHeight;
            this.render(day, selector, data);
        },
        render: function (currentDay, selector, data) {
            // set the dimensions and margins of the graph
            var margin = {top: 20, right: 50, bottom: 30, left: 40},
                width = view.sidebar.width - margin.left - margin.right,
                height = view.sidebar.height - margin.top - margin.bottom;

            // set the ranges
            var x = d3.scaleBand()
                .range([0, width])
                .padding(0.1);
            var y = d3.scaleLinear()
                .range([height, 0]);

            document.querySelector(selector).innerHTML = '';

            // creates and svg element which houses the bar chart with apt margins
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

            // append the rectangles for the bar chart and render them with apt height
            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("data-day", function (d) {
                    return d.day
                })
                .attr("x", function (d) {
                    return x(d.day);
                })
                .attr("width", x.bandwidth())
                .attr("y", function (d) {
                    return y(d.value);
                })
                .attr("height", function (d) {
                    return height - y(d.value);
                })
                .attr("fill", function (d) {
                    // Highlight the current day with selected color and other with grey to bring focus to the current day
                    if (d.day == currentDay) {
                        console.log(currentDay);
                        return dayColors[currentDay];
                    }
                    return "#ccc";
                })
                .on('mouseover', function (d) {
                    controller.update.dayOfWeek(d.day);
                    view.sidebar.update(d.day);
                });

            // add the x Axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            // add the y Axis
            svg.append("g")
                .call(d3.axisLeft(y));
        },
        update: function (day) {
            $(`.bar[data-day!=${day}]`).css({
                fill: '#ccc'
            });

            $(`.bar[data-day=${day}]`).css({
                fill: dayColors[day]
            })
        }
    },
    map: {
        init: function (selector, data) {
            // This initialized the plain map which will be later used for plotting the products on the map
            // TODO: remove hardcoding, it can be made responsive by considering remaining space and maintaining aspect ratio
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
            // The products are plotted on the map with radius proportional to the number of votes received
            var votesRange = d3.extent(data, function (d) {
                return d.votes
            });
            var votesScale = d3.scaleLinear().range([2, 10]).domain(votesRange);

            // Initialize tooltip
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .html(function (d) {
                    return d.name + "<br>Votes: " + d.votes;
                });

            // Invoke the tip in the context of your visualization
            view.map.svg.call(tip);

            var circles = view.map.svg
                .selectAll("circle")
                .data(data, function (d) {
                    return d.id;
                });

            circles.exit().remove();
            // The circles are plotted at correct location corresponding to their lat and long
            circles.enter().append("circle")
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
                    // The circles which represents products are colored with respective to day of the week
                    return dayColors[d.day]
                })
                .attr("fill-opacity", "0.2")
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .exit()
                .remove();
        }
    },
    content: {
        // This updates the day and the corresponding numerical data
        init: function (currentDay, data) {
            this.render(currentDay, data);
        },
        render: function (currentDay, data) {
            document.querySelector("#products").innerHTML = data.numberOfProducts;
            document.querySelector("#votes").innerHTML = data.votes;
            document.querySelector("#comments").innerHTML = data.comments;
            document.querySelector("#dayOfWeek").innerHTML = currentDay;

            $("#dayOfWeek").css({
                "color": dayColors[currentDay]
            })
        }
    },
    filter: {
        // Event listener for day select and metric select
        init: function (currentDay) {
            for(var i=0; i < days.length; i++) {
                var dayOfWeek = days[i];
                $(".sidebar.left ul").append($(`<li data-day="${dayOfWeek}"><i class="fa fa-circle-o daycheck"></i>${dayOfWeek}</li>`))
            }
            $(".sidebar.left li").click(function (e) {
                var dayOfWeekSelected = e.target.textContent;
                controller.update.dayOfWeek(dayOfWeekSelected);
                view.filter.update(dayOfWeekSelected);
            });
            view.filter.update(currentDay);
        },
        update: function (dayOfWeek) {
            // Updates the css to highlight the selected ay with corresponding color and leave others in normal state
            $(".sidebar.left li").css({
                'background-color': '#ffffff'
            });
            $(`[data-day=${dayOfWeek}]`).css({
                'background-color': dayColors[dayOfWeek]
            });
        }
    },
    metric: {
        // Event listener for toggling between various metrics like Number of Products, Votes and comments
        init: function (metric) {
            $(".key").click(function (e) {
                view.metric.render(e.target.dataset.key);
            });
            view.metric.style(metric);
        },
        render: function (metric) {
            controller.update.metric(metric);
            view.metric.style(metric);
        },
        style: function (metric) {
            $(`.key[data-key!=${metric}]`).css({
                "background-color": "#fff",
                "color": "#000"
            });

            $(`.key[data-key=${metric}]`).css({
                "background-color": "#FC375E",
                "color": "#fff"
            });

            $('.metricKey').text(metric);
        }
    }
};

controller.init();
