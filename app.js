const dims = { width: 550, height: 400, radius: 150 };
const cirDims = { x: dims.width / 2, y: dims.height / 2 };
const recMargin = { top: 50, right: 25, bottom: 50, left: 50 };
const recWidth = dims.width - recMargin.left - recMargin.right;
const recHeight = dims.height - recMargin.top - recMargin.bottom;

const color = d3.scaleOrdinal(d3["schemeSet3"]); // or an array of colors

// Circle Svg
const svg = d3
  .select("#canvas") // Create Svg
  .append("svg")
  .attr("width", dims.width + 100)
  .attr("height", dims.height)
  .style("background-color", "#E0E0E2");

// Bar Svg
const recSvg = d3
  .select("#canvas") // Create Svg
  .append("svg")
  .attr("width", dims.width)
  .attr("height", dims.height)
  .style("background-color", "#E0E0E2");

// Tooltip for Circle
const tip = d3
  .select("#canvas")
  .append("div")
  .attr("class", "toolTip")
  .style("display", "none");

// RecGroup
const recGraph = recSvg
  .append("g")
  .attr("width", recWidth)
  .attr("height", recHeight)
  .attr("transform", `translate(${recMargin.left}, ${recMargin.top})`);

//X and Y axis group
const xAxisGroup = recGraph
  .append("g")
  .attr("transform", `translate(0,${recHeight})`); // axis line to bottom instead of top
const yAxisGroup = recGraph.append("g");

// Text in X axis
xAxisGroup
  .selectAll("text")
  .attr("transform", "rotate(-40)")
  .attr("text-anchor", "end");

// Scale both x and y axis
const yScale = d3.scaleLinear().range([recHeight, 0]);
const xScale = d3
  .scaleBand()
  .range([0, recWidth]) // Change later
  .paddingInner(0.3)
  .paddingOuter(0.5);

const xAxis = d3.axisBottom(xScale);
const yAxis = d3
  .axisLeft(yScale)
  .ticks(8)
  .tickFormat(d => d + " Sum");

// Circle group
const graph = svg
  .append("g")
  .attr("transform", `translate(${cirDims.x}, ${cirDims.y})`);

// Circle Legend
const legendGroup = svg
  .append("g")
  .attr("transform", `translate(${dims.width - 60}, 100)`);

const legend = d3
  .legendColor()
  .shape("circle")
  .shapePadding(10)
  .scale(color);

const pieGen = d3
  .pie()
  .sort(null)
  .value(d => d.total);

const arcGen = d3
  .arc()
  .innerRadius(0)
  .outerRadius(dims.radius);

/////// Update Function ////////
const updatePie = data => {
  color.domain(data.map(d => d.campus));
  // Pie Info
  const paths = graph.selectAll("path").data(pieGen(data)); // call pieGen to pass in the begin and end angles

  // Remove extra Elements
  paths
    .exit()
    .transition()
    .duration(500)
    .attrTween("d", arcTweenExit)
    .remove();

  //Elements already in the DOM
  paths
    .attr("d", arcGen)
    .transition()
    .duration(500)
    .attrTween("d", arcTweenUpdate);

  //Elements entering DOM
  paths
    .enter()
    .append("path")
    // .attr("d", arcGen) Not required due to arcTween
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("fill", d => color(d.data.campus))
    .each(function(d) {
      this._current = d;
    })
    .transition()
    .duration(500)
    .attrTween("d", arcTweenEnter);

  //update and call legend
  legendGroup.call(legend);
  legendGroup.selectAll("text").attr("fill", "red");

  graph
    .selectAll("path")
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .on("mousemove", handleMouseMove)
    .on("click", handleClick);
};

const updateRec = data => {
  let newData = data.data;
  // Set domain for colors
  const max = Math.max(...newData.ataCorrelation.map(item => item.total));
  console.log(max);
  yScale.domain([0, max]);
  xScale.domain(newData.ataCorrelation.map(item => item.ata));

  /// Rec info

  /// Join data to bars
  const rects = recGraph.selectAll("rect").data(newData.ataCorrelation);
  console.log(rects);
  // Remove extra bars
  rects.exit().remove();

  //Rects currently in dom
  rects
    .attr("width", xScale.bandwidth)
    //.attr("fill", d => color(d.campus))
    .attr("x", d => xScale(d.ata));

  rects
    .enter()
    .append("rect")
    .attr("height", 0)
    .attr("fill", "blue")
    .attr("x", d => xScale(d.ata))
    .attr("y", d => recHeight)
    .merge(rects)
    .transition()
    .duration(700)
    .attrTween("width", widthTween)
    .attr("height", d => recHeight - yScale(d.total))
    .attr("y", d => yScale(d.total));

  recGraph.selectAll("rect").on("mouseover", handleBarHover);
  /// Axis groups
  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);
};

// create Table
const tableHead = d3
  .select("#canvas")
  .append("table")
  .attr("class", "ui very basic table")
  .append("thred")
  .append("tr");
tableHead.append("th").text("State");
tableHead
  .append("th")
  .text("Rec")
  .append("tbody");

///////////////////////////////////////////////////

const file = document.getElementById("file");

function handleFiles(e) {
  let parseFile = e[0];

  Papa.parse(parseFile, {
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      fileComplete(results);
    }
  });
}

const fileComplete = data => {
  const hub = [
    { campus: "DEN" },
    { campus: "EWR" },
    { campus: "IAD" },
    { campus: "IAH" },
    { campus: "LAX" },
    { campus: "LINE" },
    { campus: "ORD" },
    { campus: "SFO" }
  ];

  hub.map(item => {
    let total = data.data.filter(csvList => {
      return csvList.Campus == item.campus;
    });
    let ataCodes = [...new Set(total.map(item => item.ATA))];
    // ataNum = ataTotal then find all ataNum in array
    // and find length
    // {ataNum: total of ata nums}
    // {ataTotal:  }

    let ata = [];
    ataCodes.map(code => {
      let sum = total.filter(listItem => listItem.ATA == code);
      let obj = { ata: code, total: sum.length };
      ata.push(obj);
    });

    // Get all the different ata codes
    let ataNums = [];
    ataNums.push(ataCodes);

    // Assign to object
    item.ataColumn = ataCodes.length;
    item.ataNum = ataNums;
    item.total = total.length;
    item.ataCorrelation = ata;
  });

  console.log(hub);
  updatePie(hub);
};

// let data = [];
// /// Get data from database
// db.collection("hub").onSnapshot(res => {
//   res.docChanges().forEach(change => {
//     console.log(change);
//     const doc = { ...change.doc.data(), id: change.doc.id };

//     switch (change.type) {
//       case "added":
//         data.push(doc);
//         break;
//       case "modified":
//         const index = data.findIndex(item => item.id === doc.id);
//         data[index] = doc;
//         break;
//       case "removed":
//         data = data.filter(item => item.id !== doc.id);
//         break;
//       default:
//         break;
//     }
//   });

//   update(data);
// });

const widthTween = d => {
  let i = d3.interpolate(0, xScale.bandwidth());
  return t => i(t);
};

const arcTweenEnter = d => {
  let i = d3.interpolate(d.endAngle, d.startAngle);
  return t => {
    d.startAngle = i(t);
    return arcGen(d);
  };
};

const arcTweenExit = d => {
  let i = d3.interpolate(d.startAngle, d.endAngle);
  return t => {
    d.startAngle = i(t);
    return arcGen(d);
  };
};

function arcTweenUpdate(d) {
  let i = d3.interpolate(this._current, d);
  this._current = d;
  return function(t) {
    return arcGen(i(t));
  };
}

const handleMouseOver = (d, i, n) => {
  d3.select(n[i])
    .transition("hoverFill")
    .duration(200)
    .attr("fill", "#C1CAD6");
  tip.style("display", "block");
  updateRec(d);
};

const handleMouseOut = (d, i, n) => {
  d3.select(n[i])
    .transition("hoverArc")
    .duration(200)
    .attr("fill", color(d.data.campus));
  tip.style("display", "none");
};

function handleMouseMove(d, i, n) {
  tip
    .html(`<p>State: ${d.data.campus}</p><p>Total: ${d.data.total}</p>`)
    .style("left", d3.event.pageX + 10 + "px")
    .style("top", d3.event.pageY + 10 + "px");
}

const handleBarHover = d => {};

const handleClick = (d, i, n) => {
  updateRec(d);
};
