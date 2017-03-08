# ProducthuntDataViz
Demo: https://producthunt-data-viz.firebaseapp.com

## Getting Started

I have added a small javascript library Papa Parse which to help parse the data which was stored in the csv file.


## Summary

####Launching your product on Producthunt, a popular site for startups to showcase their product on weekend makes more sense.

This visualization is based on collecting data from Producthunt API from last year. The primary idea is to showcase the 
subtle difference which happens if you launch a product on weekend vs weekdays. Seeing the graph you would notice that 
on weekends there are fewer products launched compared to weekdays but they receive more median votes.
 

## Design

I am using bar chart to showcase the difference in launches on different days. Also, to delight 
the user I have plotted the products launched from different geographies on a map.

For geographical plot, I chose to draw circles with 0.2 transparency and the radius proportional 
to the number of votes received. The size of the circle encoded the number of votes received, and 
its really helpful when you are trying to figure most upvoted product from a geography.

Also the different days of the week have been represented by different colors, so when you choose
a particular day from left sidebar, the map is updated with corresponding color.

In order to give a summary of metrics of a particular day, I have computed and displayed medians 
of 3 metrics viz. # of products launches, votes and comments.

The map updates as a user hovers over various days on the graph. One can toggle between the number of Products
launched and votes metric to clearing visualise the benefits on launching on weekend.


## Feedback
Initially, I had just plotted the products on a geographical map and my friend Mayank pointed out,
that we would love to see the name of the product and also a link to the product.
Given the constraints of time, I took a part of his feedback and implemented tooltip on each of the 
product circle.

The idea of choosing different colors came from my friend Vlad, who is a UX designer. I have implemented that as well.
He also suggested a better layout to display the components.


Mehul, a frontend developer suggested me to try flex layout to layout various components on the page easily and
also suggested me to use icons for the metric which you see below the graph. He also suggested 
to load the dates in left sidebar dynamically. You can see an older version index1.html using hardcoded dates.


Morever my previous reviewer suggested to add title in charts. I have updated it in this review.
Hope it counts as a feedback too :)

#### Old index.html files are in "old/" directory of repo.


## Data Files
Data File is in src/data directory name "ph_products.csv"


## Resources
http://papaparse.com/
https://github.com/Caged/d3-tip
https://bl.ocks.org/mbostock/raw/4090846/world-50m.json
http://bl.ocks.org/lokesh005/7640d9b562bf59b561d6
https://bl.ocks.org/d3noob/bdf28027e0ce70bd132edc64f1dd7ea4
https://bl.ocks.org/d3noob/bdf28027e0ce70bd132edc64f1dd7ea4
