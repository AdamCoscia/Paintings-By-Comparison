import europeJson from "./europe.json";
import * as d3 from "d3";
import { HEIGHT, WIDTH } from "./constants";

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

export class MapView {
  constructor(svg, allData) {
    this.allData = allData;
    this.mapG = svg.append("g").classed("map", true);

    this.mapG
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", WIDTH / 3)
      .attr("height", HEIGHT / 3)
      .attr("fill", "none")
      .attr("stroke", "black");

    const grouped = groupByCountry(allData);
    this.colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(Object.entries(grouped), x => x[1]))
      .range([d3.interpolateBlues(0.3), d3.interpolateBlues(1)]);
    this.mapTooltip = d3.select("body").append("div");
    const projection = d3
      .geoMercator()
      .center([2.6, 46])
      .translate([WIDTH / 6, HEIGHT / 5])
      .scale(300)
      .clipExtent([[0, 0], [WIDTH / 3, HEIGHT / 3]]);
    // .fitExtent([[0, 0], [200,]])

    this.pathGenerator = d3.geoPath(projection);
  }

  initialize(data, onCountry) {
    this.grouped = groupByCountry(data);

    const self = this;

    this.pathSelection = this.mapG
      .selectAll(".countryPath")
      .data(europeJson.features)
      .join("g")
      .classed("countryPath", true)
      .append("path");

    this.pathSelection
      .attr("pointer-events", "visibleFill")
      .attr("d", self.pathGenerator)
      .attr("stroke", "black")
      .on("mouseenter", function(_, d) {
        d3.select(this).attr("fill", "green");
        let base = d.properties.name;
        if (self.grouped[d.properties.name]) {
          base += ": " + self.grouped[d.properties.name].toString();
        }
        self.mapTooltip.text(base);
        onCountry(
          filteringData => d.properties.name == filteringData.creatorCountry
        );
      })
      .on("mousemove", function(e) {
        d3.select(this).attr("fill", "green");
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
        onCountry(null);
      });

    // then update color
    this.update(data);
  }

  color(d) {
    if (this.grouped[d.properties.name]) {
      return this.colorScale(this.grouped[d.properties.name]);
    }
    return "#eee";
  }

  update(data) {
    // for the hover elements
    this.grouped = groupByCountry(data);

    this.pathSelection.attr("fill", this.color.bind(this));
  }
}
