/**
 * Created by shashank on 26/03/16.
 */
(function () {
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
            // model.init();
            // controller.currentDay = days[new Date().getDay()];
            // controller.sidebarKey = "votes";

            // FIXME Remove this, it should be called from callback
            view.init();
        },
        currentDayData: function () {
            return {
                mapData: model.productsByDay[controller.currentDay],
                sidebarData: model.getAverageData(controller.sidebarKey)
            };
        },
        dataLoadCallback: function () {
            view.init();
        },
        selectDay: function (day) {
            controller.currentDay = day;
            view.render();
        }
    };

    var view = {
        init: function () {
            view.initializeMap();
            view.initializeSidebar();
            // view.render();
            // view.changeDayListener();
        },
        render: function () {
            var data = controller.currentDayData();
            // this.renderMap(data.mapData);
            this.renderSidebar(data.sidebarData);

        },
        renderMap: function (mapData) {
            var votesRange = d3.extent(mapData, function (d) {
                return d.votes
            });

            var votesScale = d3.scaleLinear().range([2, 10]).domain(votesRange);

            var dayColors = {
                "Monday": "#1976D2",
                "Tuesday": "#2196F3",
                "Wednesday": "#BBDEFB",
                "Thursday": "#FFFFFF",
                "Friday": "#4CAF50",
                "Saturday": "#49d5a2",
                "Sunday": "#fa436b"
            };

            /* Initialize tooltip */
            var tip = d3.tip().attr('class', 'd3-tip').html(function (d) {
                return d.name + "<br>Votes: " + d.votes;
            });

            /* Invoke the tip in the context of your visualization */
            view.mapSvg.call(tip);

            view.mapSvg.append("g")
                .selectAll("circle")
                .data(mapData, function (d) {
                    return d.id;
                })
                .enter()
                .append("circle")
                .attr("cx", function (d) {

                    return view.projection([d.lng, d.lat])[0];
                })
                .attr("cy", function (d) {
                    return view.projection([d.lng, d.lat])[1];
                })
                .attr("r", function (d) {
                    return votesScale(d.votes)
                })
                .attr("fill", function (d) {
                    return dayColors[d.day]
                })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
        },
        renderSidebar: function (data) {
            // Scale the range of the data in the domains
            view.chartx.domain(data.map(function (d) {
                return d.day;
            }));
            view.charty.domain([0, d3.max(data, function (d) {
                return d.value;
            })]);

            // append the rectangles for the bar chart
            view.chartSvg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function (d) {
                    return view.chartx(d.day);
                })
                .attr("width", view.chartx.bandwidth())
                .attr("y", function (d) {
                    return view.charty(d.value);
                })
                .attr("height", function (d) {
                    return view.chartHeight - view.charty(d.value);
                });

            // add the x Axis
            view.chartSvg.append("g")
                .attr("transform", "translate(0," + view.chartHeight + ")")
                .call(d3.axisBottom(view.chartx));

            // add the y Axis
            view.chartSvg.append("g")
                .call(d3.axisLeft(view.charty));
        },
        initializeMap: function () {
            var width = document.querySelector("#mapView").clientWidth;
            var height = document.querySelector("#mapView").clientHeight;

            view.projection = d3.geoEquirectangular()
                .scale(height / Math.PI)
                .translate([width / 2, height / 2]);

            var path = d3.geoPath()
                .projection(view.projection);

            var graticule = d3.geoGraticule();

            view.mapSvg = d3.select("#mapView")
                .append("mapSvg")
                .attr("width", width)
                .attr("height", height);


            view.mapSvg.append("path")
                .datum(graticule)
                .attr("class", "graticule")
                .attr("d", path);

            d3.json("json/world-50m.json", function (error, world) {
                if (error) throw error;

                view.mapSvg.insert("path", ".graticule")
                    .datum(topojson.feature(world, world.objects.land))
                    .attr("class", "land")
                    .attr("d", path);
            })
        },

        initializeSidebar: function () {
            var margin = {top: 20, right: 20, bottom: 30, left: 40};
            // var chartCssSelector = "#dataView";
            var chartCssSelector = "body";
            var width = 960;
            var height = 500;

            // var width = document.querySelector(chartCssSelector).clientWidth;
            // var height = document.querySelector(chartCssSelector).clientHeight;
            view.chartWidth = width - margin.left - margin.right;
            view.chartHeight = height - margin.top - margin.bottom;

            // set the ranges
            view.chartx = d3.scaleBand()
                .range([0, view.chartWidth])
                .padding(0.1);
            view.charty = d3.scaleLinear()
                .range([view.chartHeight, 0]);

            view.chartSvg = d3.select(chartCssSelector).append("svg")
                .attr("width", view.chartWidth + margin.left + margin.right)
                .attr("height", view.chartHeight + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
        },

        changeDayListener: function () {
            $("#dayFilter li").click(function (e) {
                var selectedDay = e.target.textContent;
                controller.selectDay(selectedDay);
            })
        }
    };

    controller.init();
})();