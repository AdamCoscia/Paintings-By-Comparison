import * as d3 from "d3";
import { HEIGHT, WIDTH } from "./constants";
import { MapView } from "./map-view";
import { TimeView } from "./time-view";
import { DepictsView } from "./depicts-view";
import { PaintingView } from "./painting-view";

async function main() {
  let data = await d3.csv("src/data-to-visualize.csv");
  data.forEach((d) => {
    d.year = parseInt(d.year);
    d.depicts = d.depicts.split(";").map((x) => x.trim());
  });
  d3.select("body").attr("style", "margin: 0px;");

  let svg = d3
    .select("body")
    .append("svg")
    .attr("height", HEIGHT)
    .attr("width", WIDTH);

  const mapView = new MapView(svg, data);
  const timeView = new TimeView(svg, data);
  const depictsView = new DepictsView(svg, data);
  const paintingView = new PaintingView(svg, data);

  const views = {
    map: mapView,
    time: timeView,
    depicts: depictsView,
    painting: paintingView,
  };

  const filterState = {};

  function filterByKey(key) {
    let newData = data;
    for (const [filKey, val] of Object.entries(filterState)) {
      if (val && filKey != key) {
        newData = newData.filter(val);
      }
    }
    return newData;
  }

  function refresh() {
    for (const key of Object.keys(views)) {
      views[key].update(filterByKey(key));
    }
  }

  function makeUpdater(key) {
    return function update(filterFunc) {
      // filterFunc is null if there is no filter
      filterState[key] = filterFunc;
      refresh();
    };
  }

  mapView.initialize(data, makeUpdater("map"));
  timeView.initialize(data, makeUpdater("time"));
  depictsView.initialize(data, makeUpdater("depicts"));
  paintingView.initialize(data, makeUpdater("painting"));

}

main();
