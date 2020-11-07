import * as d3 from "d3";

/**
 * Word counter for depicts view.
 * Author: Vijay Marupudi
 */
export function aggregateWords(data) {
  const words = {};
  data.forEach((d) => {
    d.depicts.forEach((word) => {
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
      val,
    }))
    .filter((d) => d.val != 1);
  wordsArray.push({ word: "SPECIAL_ROOT_STRING", val: 0 });
  return wordsArray;
}

/**
 * Number of paintings by country.
 * Author: Vijay Marupudi
 */
export function groupByCountry(data) {
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
 * Wraps <text> within `width` pixels.
 * Call using `.call(wrap, px)`.
 * Modified slightly from the source by Adam Coscia.
 * Source: https://bl.ocks.org/mbostock/7555321.
 */
export function wrap(text, width) {
  text.each(function () {
    var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      x = text.attr("x"),
      y = text.attr("y"),
      tspan = text.text(null).append("tspan").attr("x", x).attr("y", y);
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", "1.1em")
          .text(word);
      }
    }
  });
}

/**
 * Checks if given string is blank, null or undefined.
 * Source: https://stackoverflow.com/a/3261380.
 */
export function isBlank(str) {
  return !str || /^\s*$/.test(str);
}

/**
 * Get metadata from url with image asynchronously.
 * Source: https://stackoverflow.com/a/51063852.
 */
export function getImgMeta(url) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = url;
  });
}

/**
 * Shallow compares two arrays (ordering matters!).
 * Source: https://stackoverflow.com/a/16436975.
 */
export function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Groups objects in an array.
 * Source: https://stackoverflow.com/a/34890276.
 */
export function groupBy(xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}

export default {
  aggregateWords,
  groupByCountry,
  wrap,
  isBlank,
  getImgMeta,
  arraysEqual,
  groupBy,
};
