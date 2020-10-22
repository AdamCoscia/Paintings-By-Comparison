import * as d3 from "d3";
import europeJson from "./europe.json";
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

class MapView {
  constructor(svg, allData) {
    this.allData = allData;
    this.mapG = svg.append("g").classed("map", true);
    const grouped = groupByCountry(allData);
    this.colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(Object.entries(grouped), x => x[1]))
      .range([d3.interpolateBlues(0.3), d3.interpolateBlues(1)]);
    this.mapTooltip = d3.select("body").append("div");
    const projection = d3
      .geoMercator()
      .center([30.5, 31.5])
      .clipExtent([[0, 0], [500, 500]]);
    // .fitExtent([[0, 0], [200,]])
    // .scale(50)

    this.pathGenerator = d3.geoPath(projection);
  }

  initialize(data) {

    this.grouped = groupByCountry(data);

    const color = d => {
      if (this.grouped[d.properties.name]) {
        return this.colorScale(this.grouped[d.properties.name]);
      }
      return "#eee";
    };

    const self = this

    this.mapG
      .selectAll(".countryPath")
      .data(europeJson.features)
      .join("g")
      .classed("countryPath", true)
      .call(s => {
        s.append("path")
          .attr("pointer-events", "visibleFill")
          .attr("d", self.pathGenerator)
          .attr("stroke", "black")
          .attr("fill", color)
          .on("mouseenter", function(_, d) {
            d3.select(this).attr("fill", "green");
            let base = d.properties.name;

            if (self.grouped[d.properties.name]) {
              base += ": " + self.grouped[d.properties.name].toString();
            }
            self.mapTooltip.text(base);
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
            d3.select(this).attr("fill", color(d));
            console.log(color(d));
            self.mapTooltip.attr("style", "visibility: hidden;");
          });
      });
  }

  update(data) {
    // for the hover elements
    this.grouped = groupByCountry(data)

  }
}

async function main() {
  const data = await d3.csv("src/data-to-visualize.csv");
  d3.select("body").attr("style", "margin: 0px;");

  const svg = d3
    .select("body")
    .append("svg")
    .attr("height", HEIGHT)
    .attr("width", WIDTH);


  const mapView = new MapView(svg, data)

  mapView.initialize(data)
  

}

main();
