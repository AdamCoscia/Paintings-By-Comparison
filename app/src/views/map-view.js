import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";
import { groupByCountry } from "../models/util";
import europeJson from "../models/europe.json";

/**
 * MapView object
 */
export class MapView {
  /**
   * Takes in SVG object and all data
   */
  constructor(svg, allData) {
    this.allData = allData;
    this.viewWidth = WIDTH / 4;
    this.viewHeight = HEIGHT / 3;
    this.countriesToFilter = [];
    this.hoverCountry = null;
    this.mapG = svg.append("g").classed("map", true);
    this.mapTooltip = d3.select("body").append("div");
    this.pathSelection = this.mapG
      .selectAll(".countryPath")
      .data(europeJson.features)
      .join("g")
      .classed("countryPath", true)
      .append("path");

    // Create color scales from the country groupings
    const grouped = groupByCountry(allData);
    this.colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(Object.entries(grouped), (x) => x[1]))
      .range([d3.interpolateBlues(0.3), d3.interpolateBlues(1)]);
    this.selectedColorScale = d3
      .scaleSequential(d3.interpolateGreens)
      .domain(d3.extent(Object.entries(grouped), (x) => x[1]))
      .range([d3.interpolateGreens(0.3), d3.interpolateGreens(1)]);

    // Create the map projection path generator
    const projection = d3
      .geoMercator()
      .center([2.6, 46]) // [LAT, LON]
      .scale(0.1 * WIDTH + 90) // zoom in/out, default 150
      .translate([0.1 * WIDTH, 0.24 * HEIGHT]); // translate center to [x, y]
    this.pathGenerator = d3.geoPath(projection);
  }

  /**
   * Updates onCountry filter when countries are clicked
   */
  updateFilters(onCountry) {
    if (this.countriesToFilter.length == 0 && !this.hoverCountry) {
      onCountry(null);
    } else {
      onCountry((d) => {
        let countries = this.countriesToFilter;
        if (this.hoverCountry) {
          countries = [this.hoverCountry, ...countries];
        }
        return countries.includes(d.creatorCountry);
      });
    }
  }

  /**
   * Updates countries filtered list for onCountry filter
   */
  toggle(country) {
    if (this.countriesToFilter.includes(country)) {
      this.countriesToFilter = this.countriesToFilter.filter(
        (x) => x != country
      );
    } else {
      this.countriesToFilter.push(country);
    }
  }

  /**
   * Returns color of the country
   */
  color(d) {
    let countryColor = "#eee"; // default
    const country = d.properties.name;
    const selected =
      this.countriesToFilter.includes(country) || this.hoverCountry == country;
    if (selected) {
      countryColor = this.selectedColorScale(this.grouped[country] || 0);
    } else if (this.grouped[country]) {
      countryColor = this.colorScale(this.grouped[country]);
    }
    return countryColor;
  }

  /**
   * Takes in filtered data and filter function
   */
  initialize(data, onCountry) {
    const self = this;

    // re-group countries
    this.grouped = groupByCountry(data);

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

    // draw the map
    this.pathSelection
      .attr("clip-path", "url(#rect-clip)") // clip the drawing
      .attr("pointer-events", "visibleFill")
      .attr("cursor", "pointer")
      .attr("d", self.pathGenerator)
      .attr("stroke", "black")
      .on("mouseenter", function (_, d) {
        d3.select(this).attr("fill", "yellow");
        let base = d.properties.name;
        if (self.grouped[d.properties.name]) {
          base += ": " + self.grouped[d.properties.name].toString();
        }
        self.mapTooltip.text(base);
        self.hoverCountry = d.properties.name;
        self.updateFilters(onCountry);
      })
      .on("mousemove", function (e, d) {
        d3.select(this).attr("fill", "yellow");
        self.mapTooltip.attr(
          "style",
          `position: absolute; top: ${e.clientY + 10}px; left: ${
            e.clientX
          }px; background-color: #fff;`
        );
        self.hoverCountry = d.properties.name;
        self.updateFilters(onCountry);
      })
      .on("mouseleave", function (_, d) {
        d3.select(this).attr("fill", self.color(d));
        self.mapTooltip.attr("style", "visibility: hidden;");
        if (self.hoverCountry === d.properties.name) {
          self.hoverCountry = null;
        }
        self.updateFilters(onCountry);
      })
      .on("click", (_, d) => {
        self.toggle(d.properties.name);
        self.updateFilters(onCountry);
      });

    // update map color
    this.update(data);
  }

  /**
   * Updates view with filtered data
   */
  update(data) {
    this.grouped = groupByCountry(data); // for the hover elements
    this.pathSelection.attr("fill", this.color.bind(this));
  }
}
