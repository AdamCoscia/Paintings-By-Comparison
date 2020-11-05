import * as d3 from "d3";
import { HEIGHT, WIDTH } from "./models/constants";
import { MapView } from "./views/map-view";
import { TimeView } from "./views/time-view";
import { DepictsView } from "./views/depicts-view";
import { PaintingView } from "./views/painting-view";

// force the window to reload on resize!
window.onresize = function () {
  location.reload();
};

async function main() {
  let data = await d3.csv("src/models/data-to-visualize.csv");
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
  depictsView.initialize(data);
  paintingView.initialize();
}

main();
