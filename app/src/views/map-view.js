import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";
import europeJson from "../models/europe.json";

/**
 * Number of paintings by country
 */
function groupByCountry(data) {
  const ret = {};
  for (const row of data) {
    if (ret[row.creatorCountry]) {
      ret[row.creatorCountry] += 1;
    } else {
      ret[row.creatorCountry] = 1;
    }
  }
  return ret;
}

/**
 * MapView object
 */
export class MapView {
  /**
   * Takes in SVG object and data object
   */
  constructor(svg, allData) {
    this.allData = allData;
    this.viewWidth = WIDTH / 4;
    this.viewHeight = HEIGHT / 3;

    // Create the map group and tooltip divs
    this.mapG = svg.append("g").classed("map", true);
    this.mapTooltip = d3.select("body").append("div");

    // Set the clipping region
    this.mapG
      .append("clipPath")
      .attr("id", "rect-clip")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.viewWidth)
      .attr("height", this.viewHeight);

    // Give the clipping region a border
    this.mapG
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.viewWidth)
      .attr("height", this.viewHeight)
      .attr("fill", "none")
      .attr("stroke", "black");

    // Create a color scale from the countries
    const grouped = groupByCountry(allData);
    this.colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(Object.entries(grouped), x => x[1]))
      .range([d3.interpolateBlues(0.3), d3.interpolateBlues(1)]);

    this.selectedColorScale = d3
      .scaleSequential(d3.interpolateGreens)
      .domain(d3.extent(Object.entries(grouped), x => x[1]))
      .range([d3.interpolateGreens(0.3), d3.interpolateGreens(1)]);

    // Create the map projection
    const projection = d3
      .geoMercator()
      .center([2.6, 46]) // [LAT, LON]
      .scale(0.1 * WIDTH + 90) // zoom in/out, default 150
      .translate([0.1 * WIDTH, 0.24 * HEIGHT]); // translate center to [x, y]
    this.pathGenerator = d3.geoPath(projection);

    this.countriesToFilter = [];
  }

  updateFilters(onCountry) {
    console.log(this.countriesToFilter);
    if (this.countriesToFilter.length == 0) {
      onCountry(null);
      return;
    }

    onCountry(d => {
      return this.countriesToFilter.includes(d.creatorCountry);
    });
  }

  toggle(country) {
    if (this.countriesToFilter.includes(country)) {
      this.countriesToFilter = this.countriesToFilter.filter(x => x != country);
    } else {
      this.countriesToFilter.push(country);
    }
  }

  /**
   * Takes in data and filter function
   */
  initialize(data, onCountry) {
    const self = this;

    this.grouped = groupByCountry(data);

    this.pathSelection = this.mapG
      .selectAll(".countryPath")
      .data(europeJson.features)
      .join("g")
      .classed("countryPath", true)
      .append("path");

    this.pathSelection
      .attr("clip-path", "url(#rect-clip)") // clip the drawing
      .attr("pointer-events", "visibleFill")
      .attr("cursor", "pointer")
      .attr("d", self.pathGenerator)
      .attr("stroke", "black")
      .on("mouseenter", function(_, d) {
        d3.select(this).attr("fill", "yellow");
        let base = d.properties.name;
        if (self.grouped[d.properties.name]) {
          base += ": " + self.grouped[d.properties.name].toString();
          // show the display for the paintings
          // d3.select(".display-info").style("display", "block");
        } else {
          // hide the display for the paintings
          // d3.select(".display-info").style("display", "none");
        }
        self.mapTooltip.text(base);
      })
      .on("mousemove", function(e) {
        d3.select(this).attr("fill", "yellow");
        self.mapTooltip.attr(
          "style",
          `position: absolute; top: ${e.clientY + 10}px; left: ${
            e.clientX
          }px; background-color: #fff;`
        );
      })
      .on("mouseleave", function(_, d) {
        d3.select(this).attr("fill", self.color(d));
        self.mapTooltip.attr("style", "visibility: hidden;");
        // d3.select(".display-info").style("display", "block");
      })
      .on("click", (_, d) => {
        self.toggle(d.properties.name);
        self.updateFilters(onCountry);
      });

    // then update color
    this.update(data);
  }

  /**
   * Returns color of the country
   */
  color(d) {
    const country = d.properties.name;

    if (this.countriesToFilter.includes(country)) {
      return this.selectedColorScale(this.grouped[country] || 0);
    }

    if (this.grouped[country]) {
      return this.colorScale(this.grouped[country]);
    }
    return "#eee";
  }

  /**
   *
   */
  update(data) {
    // for the hover elements
    this.grouped = groupByCountry(data);
    this.pathSelection.attr("fill", this.color.bind(this));
  }
}
