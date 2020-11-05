import * as d3 from "d3";
import { HEIGHT, WIDTH } from "../models/constants";

/**
 * Word counter
 */
function aggregateWords(data) {
  const words = {};
  data.forEach(d => {
    d.depicts.forEach(word => {
      if (words[word]) {
        words[word] += 1;
      } else {
        words[word] = 1;
      }
    });
  });
  const wordsArray = Object.entries(words)
    .map(([word, val]) => ({
      word,
      val
    }))
    .filter(d => d.val != 1);
  wordsArray.push({ word: "SPECIAL_ROOT_STRING", val: 0 });
  return wordsArray;
}

/**
 * DepictsView object
 */
export class DepictsView {
  /**
   * Takes in SVG d3 object and data
   */
  constructor(svg, allData) {
    this.depictsG = svg
      .append("g")
      .classed("depicts", true)
      .attr("transform", `translate(0, ${(HEIGHT / 3) * 2})`);

    const allWords = aggregateWords(allData).map(d => d.word);

    this.wordColors = {};

    for (const word of allWords) {
      if (!this.wordColors[word]) {
        this.wordColors[word] = d3.interpolateRainbow(Math.random());
      }
    }

    this.depictsTooltip = d3.select("body").append("div");
  }

  /**
   * Takes in data object
   */
  initialize(data) {
    this.update(data);
  }

  /**
   * Takes in data object
   */
  update(data) {
    const wordsArray = aggregateWords(data);
    const root = d3
      .stratify()
      .id(d => d.word)
      .parentId(d =>
        d.word == "SPECIAL_ROOT_STRING" ? null : "SPECIAL_ROOT_STRING"
      )(wordsArray);

    root.sum(d => d.val).sort((a, b) => b.value - a.value);

    const treemap = d3.treemap().size([WIDTH / 4, HEIGHT / 3]);
    const tm = treemap(root);
    const self = this;

    const individualG = this.depictsG
      .selectAll(".depictsIndG")
      .data(tm)
      .join("g")
      .classed("depictsIndG", true)
      .attr("transform", (d) => `translate(${d.x0}, ${d.y0})`)

    individualG
      .on("mouseenter", function(_, d) {
        self.depictsTooltip.text(d.data.word);
      })
      .on("mousemove", function(e) {
        self.depictsTooltip.attr(
          "style",
          `position: absolute; top: ${e.clientY + 10}px; left: ${
            e.clientX
          }px; background-color: #fff;`
        );
      })
      .on("mouseleave", function() {
        self.depictsTooltip.attr("style", "visibility: hidden;");
      });

    individualG
      .selectAll("rect")
      .data(d => d)
      .join("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("stroke", "black")
      .attr("fill", d => self.wordColors[d.data.word])

    individualG
      .selectAll("text")
      .data((d) => d)
      .join("text")
      .attr('text-anchor', 'middle')
      .text((d) => {
        if ((d.x1 - d.x0) > 20) {
          return d.data.word.slice(0, (d.x1 - d.x0) / 5)
        }
        return null
      })
      .attr('x', (d) => (d.x1 - d.x0) / 2)
      .attr('y', (d) => (d.y1 - d.y0) / 2)
      .attr('font-size', 8)
      .attr('font-weight', 'bold')
      .attr('fill', '#FFF')
      // .attr('stroke', '#000')



  }
}
