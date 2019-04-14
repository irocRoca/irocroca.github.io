const dims = { width: 550, height: 400, radius: 150 };
const cirDims = { x: dims.width / 2, y: dims.height / 2 };
const recMargin = { top: 50, right: 25, bottom: 50, left: 50 };
const recWidth = dims.width - recMargin.left - recMargin.right;
const recHeight = dims.height - recMargin.top - recMargin.bottom;

const color = d3.scaleOrdinal(d3["schemeSet3"]); // or an array of colors
const barColor = d3.scaleOrdinal(["schemeCategory20"]);

// Circle Svg
const svg = d3
  .select("#canvas") // Create Svg
  .append("svg")
  .attr("width", dims.width)
  .attr("height", dims.height);
//.style("background-color", "#E0E0E2");

// Bar Svg
const recSvg = d3
  .select("#rect") // Create Svg
  .append("svg")
  .attr("width", dims.width)
  .attr("height", dims.height);
//.style("background-color", "#E0E0E2");

// Tooltip for Circle
const tip = d3
  .select("#canvas")
  .append("div")
  .attr("class", "hovertip")
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
  .attr("transform", `translate(${dims.width - 80}, 100)`);

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
  //barColor.domain(...newData.ataCorrelation.map(d => d.ata));
  const max = Math.max(...newData.ataCorrelation.map(item => item.total));

  yScale.domain([0, max]);
  xScale.domain(newData.ataCorrelation.map(item => item.ata));

  /// Rec info

  /// Join data to bars
  const rects = recGraph.selectAll("rect").data(newData.ataCorrelation);

  // Remove extra bars
  rects.exit().remove();

  //Rects currently in dom
  rects
    .attr("width", xScale.bandwidth)
    .attr("fill", "blue")
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

  recGraph.selectAll("rect").on("click", tableHead);

  /// Axis groups
  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);
};

// CREATE TABLE
const tableColumns = [
  "Campus",
  "Ata",
  "Mepn",
  "Station",
  "Ec",
  "Alloc",
  "Qoh",
  "Qit",
  "Oqas",
  "Iqas",
  "Qub",
  "Qri"
];

// const columns = Object.keys(d[0]);

const table = d3
  .select("#list")
  .append("table")
  .attr("class", "table table-striped mt-5")
  .style("display", "none");

const thead = table.append("thead");
const tbody = table.append("tbody");

thead
  .append("tr")
  .selectAll("th")
  .data(tableColumns)
  .enter()
  .append("th")
  .attr("class", "col")
  .text(d => d);

///////////////////////////////////////////////////////////////////////////////////////
// UPDATED TABLE
const tableHead = data => {
  console.log(data);
  let list = data.list;

  const columns = Object.keys(list[0]); // Dont need

  const table = d3
    .select("#list")
    .select("table")
    .style("display", "block");
  const thead = table.select("thead");
  const tbody = table.select("tbody");

  let rows = tbody.selectAll("tr").data(list);

  rows.exit().remove();

  rows
    .enter()
    .append("tr")
    .data(list);

  let cells = rows.selectAll("td").data(function(row) {
    return columns.map(function(column) {
      return { column: column, value: row[column] };
    });
  });

  cells.exit().remove();

  cells.html(function(d) {
    return d.value;
  });

  cells
    .enter()
    .append("td")
    .html(function(d) {
      return d.value;
    });
};

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

    let ata = [];
    let listData = [];
    ataCodes.map(code => {
      let sum = total.filter(listItem => listItem.ATA == code);
      let newSum = sum.map(asd => {
        return {
          campus: asd.Campus,
          ata: asd.ATA,
          mepn: asd.MEPN,
          station: asd.Station,
          ec: asd.EC,
          alloc: asd.CURR_ALLOC,
          qoh: asd.QOH,
          qit: asd.QIT,
          oqas: asd.OQAS,
          iqas: asd.IQAS,
          qub: asd.QUB,
          qri: asd.QRI
        };
      });
      let obj = { ata: code, total: sum.length, list: newSum };
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

  let backdrop = (document.getElementById("backdrop").style.display = "none");
  console.log(backdrop);

  updatePie(hub);
};

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
    .style("cursor", "pointer")
    .transition("hoverFill")
    .duration(200)
    .attr("fill", "#C1CAD6");
  tip.style("display", "block");
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

const handleClick = (d, i, n) => {
  updateRec(d);
};
