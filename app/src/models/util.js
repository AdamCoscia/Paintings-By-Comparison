import * as d3 from "d3";

/**
 * Word counter for an attribute in the dataset.
 * Filters out any attribute with only 1 count.
 * Author: Vijay Marupudi
 */
export function aggregateWords(data, attr) {
  const words = {};
  data.forEach((d) => {
    d[attr].forEach((word) => {
      words[word] ? (words[word] += 1) : (words[word] = 1);
    });
  });
  const wordsArray = Object.entries(words).map(([word, val]) => ({
    word,
    val,
  }));
  return wordsArray;
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
 * "Returns a function, that, as long as it continues to be invoked, will not
 *  be triggered. The function will be called after it stops being called for
 *  N milliseconds. If `immediate` is passed, trigger the function on the
 *  leading edge, instead of the trailing."
 * Source: https://davidwalsh.name/javascript-debounce-function
 */
export function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

export default {
  aggregateWords,
  wrap,
  isBlank,
  getImgMeta,
  arraysEqual,
  debounce,
};
