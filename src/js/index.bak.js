/**
 * Created by shashank on 16/03/16.
 */
"use strict";


function draw(geo_data) {
    var width = window.innerWidth;
    var height = window.innerHeight;

    d3.select("body")
        .append("h2")
        .text("Product Hunt launches")
        .append("h3")
        .text("All Days");

    var svg = d3.select("body")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "container")
        .append("g")
        .attr("class", "map");


    var projection = d3.geo.mercator()
        .scale(200)
        .translate([width / 2, height / 1.5]);

    var path = d3.geo.path()
        .projection(projection);

    var map = mapSvg.selectAll('path')
        .data(geo_data.features)
        .enter()
        .append('path')
        .attr('d', path)
        .style('fill', 'white')
        .style('stroke', 'black')
        .style('stroke-width', 0.5);

    function products_type(d) {
        d["lat"] = +d["lat"];
        d["lng"] = +d["lng"];
        d["votes_count"] = +d["votes_count"];
        d["comments_count"] = +d["comments_count"];
        d['coords'] = projection([d.lng, d.lat]);

        var day_format = d3.time.format("%Y-%m-%d");
        d["date"] = day_format.parse(d["day"]);
        return d;
    }

    function plot_points(data) {

        var votes_extent = d3.extent(data, function (d) {
            return d["votes_count"]
        });

        var votes_scale = d3.scale.linear().range([2, 50]).domain(votes_extent);

        var day_colors = {
            "Monday": "#1976D2",
            "Tuesday": "#2196F3",
            "Wednesday": "#BBDEFB",
            "Thursday": "#FFFFFF",
            "Friday": "#4CAF50",
            "Saturday": "#212121",
            "Sunday": "#727272"
        };

        function update_map(weekday) {


            var filtered = data.filter(function(d) {
                return d.weekday === weekday;
            });

            d3.select("h3")
                .text(weekday + ": " + filtered.length + " products launched");

            var circles = mapSvg.selectAll("circle")
                .data(filtered, function(d) { return d.id; });

            circles.exit().remove();

            add_circles(circles.enter());
        }

        function add_circles(circles) {
            circles.append("circle")
                .attr("cx", function (d) { return d.coords[0]; })
                .attr("cy", function (d) { return d.coords[1]; })
                .attr("r", function(d) { return votes_scale(d.votes_count);})
                .attr("fill", function(d) {
                    return day_colors[d.weekday];
                });
        }

        var all_circles = mapSvg.append("g")
            .selectAll("circle")
            .data(data, function(d) { return d.id; })
            .enter();

        add_circles(all_circles);

        var days_of_week = Object.keys(day_colors);
        var day_index = 0;

        var day_interval = setInterval(function () {
            update_map(days_of_week[day_index]);
            day_index++;

            if (day_index >= days_of_week.length) {
                clearInterval(day_interval);
                //addDayButtons()
            }

        }, 1000);
    }

    d3.csv("data/ph_products.csv", products_type, plot_points);
}

//Execution Begins
d3.json("data/world_countries.json", draw);