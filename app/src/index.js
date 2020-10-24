import * as d3 from "d3";
import { HEIGHT, WIDTH } from "./constants";
import { MapView } from "./map-view";
import { TimeView } from "./time-view";

async function main() {
  let data = await d3.csv("src/data-to-visualize.csv");
  data.forEach(d => {
    d.year = parseInt(d.year);
    d.depicts = d.depicts.split(";").map((x) => x.trim())
  });
  d3.select("body").attr("style", "margin: 0px;");

  const svg = d3
    .select("body")
    .append("svg")
    .attr("height", HEIGHT)
    .attr("width", WIDTH);

  const mapView = new MapView(svg, data);
  const timeView = new TimeView(svg, data);


  const views = {
    "map": mapView,
    "time": timeView
  }


  const filterState = {};


  function filterButKey(key) {
    let newData = data;

    for (const [filKey, val] of Object.entries(filterState)) {
      if (val && filKey != key) {
        newData = newData.filter(val);
      }
    }

    return newData
  }

  function refresh() {

    for (const key of Object.keys(views)) {
      views[key].update(filterButKey(key))
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


  const words = {}

  data.forEach(d => {
    d.depicts.forEach(word => {
      if (words[word]) {
        words[word] += 1
      } else {
        words[word] = 1
      }
    })
  })

  console.log(Array.from(Object.values(words)))

}

main();
