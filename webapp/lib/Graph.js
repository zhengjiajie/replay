jQuery.sap.registerResourcePath('dagreD3', "https://cdnjs.cloudflare.com/ajax/libs/dagre-d3/0.4.17/dagre-d3.min");
sap.ui.define(
	["sap/ui/thirdparty/d3",
		"dagreD3"
	],
	function(d3, dagreD3) {
		return {
			clickcancel: function() {
				var event = d3.dispatch('click', 'dblclick');

				function cc(selection) {
					var
					// down,
					// 	tolerance = 2,
						wait = null;
					// // euclidean distance
					// function dist(a, b) {
					// 	return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
					// }
					// selection.on('mousedown', function() {
					// 	down = d3.mouse(document.body);
					// });
					selection.on('click', function() {
						// if (dist(down, d3.mouse(document.body)) > tolerance) {
						// 	return;
						// } else {
						if (wait) {
							window.clearTimeout(wait);
							wait = null;
							event.dblclick(d3.event);
						} else {
							wait = window.setTimeout((function(e) {
								return function() {
									event.click(e);
									wait = null;
								};
							})(d3.event), 300);
						}
						// }
					});
				}
				return d3.rebind(cc, event, 'on');
			},

			getSplitIconPath: function() {
				var root = this.getRoot();
				if (root.substr(root.length - 1) === "/") {
					root = root.substr(0, root.length - 1);
				}
				return root + "/img/s_statov.gif";
			},

			getRoot: function() {
				var bootstrap = $("script[data-sap-ui-id='flow_bootstrap']");
				if (bootstrap) {
					var roots = bootstrap.attr("data-sap-ui-resourceroots");
					if (roots) {
						var oRoots = JSON.parse($("script[data-sap-ui-id='flow_bootstrap']").attr("data-sap-ui-resourceroots"));
						if (oRoots) {
							return oRoots.ppmflow;
						}
					}
				}
			},

			recalculateEdgesForNode: function(oControl, svg, inner, g, nodeId) {

				//taken from dagre-d3 source code (not the exact same)
				function calcPoints(e) {
					// return;
					var edge = g.edge(e.v, e.w),
						tail = g.node(e.v),
						head = g.node(e.w);

					var points = [];
					points.push(edge.points[0]);
					points.push(edge.points[edge.points.length - 1]);

					var afterslice = edge.points.slice(0, edge.points.length - 1);

					switch (head.shape) {
						case "flowTask":
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
							break;
						case "flowMainTask":
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
							break;
						case "flowMilestone":
							var headPoints = [{
								x: 0,
								y: -head.height / 2
							}, {
								x: -head.width / 2,
								y: 0
							}, {
								x: 0,
								y: head.height / 2
							}, {
								x: head.width / 2,
								y: 0
							}];
							points.push(dagreD3.intersect.polygon(head, headPoints, points[points.length - 1]));
							break;
						default:
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
					}

					edge.points = points;
					return d3.svg.line()
						.x(function(d) {
							return d.x;
						})
						.y(function(d) {
							return d.y;
						})
						(points);
				}

				function calcPointsTail(e) {

					var edge = g.edge(e.v, e.w),
						tail = g.node(e.v),
						head = g.node(e.w);
					// var points = edge.points.slice(1, edge.points.length);
					// var afterslice = edge.points.slice(1, edge.points.length);
					// );

					var points = [];
					points.push(edge.points[edge.points.length - 1]);

					switch (tail.shape) {
						case "flowTask":
							points.unshift(dagreD3.intersect.rect(tail, points[0]));
							break;
						case "flowMainTask":
							points.unshift(dagreD3.intersect.rect(tail, points[0]));
							break;
						case "flowMilestone":
							var tailPoints = [{
								x: 0,
								y: -tail.height / 2
							}, {
								x: -tail.width / 2,
								y: 0
							}, {
								x: 0,
								y: tail.height / 2
							}, {
								x: tail.width / 2,
								y: 0
							}];
							points.unshift(dagreD3.intersect.polygon(tail, tailPoints, points[0]));
							break;
						default:
							points.unshift(dagreD3.intersect.rect(tail, points[0]));
					}

					edge.points = points;
					return d3.svg.line()
						.x(function(d) {
							return d.x;
						})
						.y(function(d) {
							return d.y;
						})
						(points);
				}

				function calcPointsHead(e) {

					var edge = g.edge(e.v, e.w),
						tail = g.node(e.v),
						head = g.node(e.w);
					// var points = edge.points.slice(0, 1);
					// var afterslice = edge.points.slice(0, edge.points.length - 1);

					var points = [];
					points.push(edge.points[0]);

					switch (head.shape) {
						case "flowTask":
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
							break;
						case "flowMainTask":
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
							break;
						case "flowMilestone":
							var headPoints = [{
								x: 0,
								y: -head.height / 2
							}, {
								x: -head.width / 2,
								y: 0
							}, {
								x: 0,
								y: head.height / 2
							}, {
								x: head.width / 2,
								y: 0
							}];
							points.push(dagreD3.intersect.polygon(head, headPoints, points[points.length - 1]));
							break;
						default:
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
					}

					edge.points = points;
					return d3.svg.line()
						.x(function(d) {
							return d.x;
						})
						.y(function(d) {
							return d.y;
						})
						(points);
				}

				g.edges().forEach(function(e) {
					if (e.v == nodeId || e.w == nodeId) {
						var edge = g.edge(e.v, e.w);
						var newPath;
						if (e.v == nodeId) {

							if (edge.startAnchor) {
								edge.startAnchor.circle
									.attr("cx", edge.points[0].x)
									.attr("cy", edge.points[0].y);
							}

							newPath = calcPointsTail(e);
						} else {

							if (edge.endAnchor) {
								edge.endAnchor.circle
									.attr("cx", edge.points[edge.points.length - 1].x)
									.attr("cy", edge.points[edge.points.length - 1].y);
							}

							newPath = calcPointsHead(e);
						}
						$('#' + edge.customId).attr('d', newPath);
					}
				});
			},

			customizeGraph: function(oControl, svg, inner, upperContainerId, g, editmode, taskInFocus, setPostion, viewposX, viewposY, scale) {

				var parentGraph = g;
				var graphSVG = svg;

				//give IDs to each of the nodes so that they can be accessed
				svg.selectAll("g.node rect")
					.attr("id", function(d) {
						return "rect" + d;
					});
				svg.selectAll("g.node")
					.attr("id", function(d) {
						return "node" + d;
					});
				svg.selectAll("g.edgePath > path")
					.attr("id", function(e) {
						return e.v + "-" + e.w;
					})
					// .style("marker-end", "url(#arrowhead15)")
					// .style("stroke", "none")
					.attr("marker-end", function(e) {
						// return null;
						var markerUrl = graphSVG.select("#" + e.v + "-" + e.w).attr("marker-end");
						markerUrl = markerUrl.replace(/["']/g, "");
						var offset = markerUrl.search("#arrowhead");
						var newMarkerUrl = "url(" + markerUrl.substr(offset);
						// newMarkerUrl = '#arrowhead15';
						// return "";
						// return newMarkerUrl;
						return encodeURI(newMarkerUrl);
					});
				//            svg.selectAll("g.edgeLabel g")
				//                .attr("id", function (e) {
				//                    return 'label_' + e.v + "-" + e.w;
				//                });

				svg.selectAll("g.cluster")
					.attr("id", function(d) {
						return "cluster" + d;
					});

				if (setPostion || taskInFocus) {
					// Set up zoom support
					var zoom = d3.behavior.zoom().on("zoom", function() {
						inner.attr("transform", "translate(" + d3.event.translate + ")" +
							"scale(" + d3.event.scale + ")");
					});
					svg.call(zoom);

					if (setPostion) {
						if (!viewposX) {
							viewposX = 1;
						}
						if (!viewposY) {
							viewposY = 0;
						}
						if (!scale) {
							scale = 1;
						}
						zoom.translate([viewposX, viewposY]).scale(scale).event(svg);
					} else {
						var centerNode = parentGraph.node(taskInFocus);
						if (centerNode) {
							// var tranX = -(+centerNode.x + +centerNode.width / 2) + +$("#" + upperContainerId).width() / 2;
							// var tranY = -(+centerNode.y + +centerNode.height / 2) + +$("#" + upperContainerId).height() / 2;

							// var tranX = -(+centerNode.x) + +centerNode.width / 2 + 800;
							// var tranY = -(+centerNode.y) + +centerNode.height / 2 + 300;
							var tranX = -(+centerNode.x) + 800;
							var tranY = -(+centerNode.y) + 300;
							zoom.translate([tranX, tranY]).scale(1).event(svg);
						} else {
							zoom.translate([1, 0]).scale(1).event(svg);
						}
					}
				}

				// if (centerGraph) {
				// 	// Center the graph
				// 	var initialScale = 1.0;
				// 	zoom.translate([(svg[0][0].width.baseVal.valueInSpecifiedUnits * initialScale) / 2, 20])
				// 		.scale(initialScale)
				// 		.event(svg);
				// }

				//code for drag

				function translateEdge(e, dx, dy) {
					// e.points.forEach(function(p) {
					// 	p.x = p.x + dx;
					// 	p.y = p.y + dy;
					// });
				}

				//taken from dagre-d3 source code (not the exact same)
				function calcPoints(e) {

					// return;
					var edge = g.edge(e.v, e.w),
						tail = g.node(e.v),
						head = g.node(e.w);
					var points = edge.points.slice(0, edge.points.length - 1);
					var afterslice = edge.points.slice(0, edge.points.length - 1);

					// switch (tail.shape) {
					// 	case "flowTask":
					// 		points.unshift(dagreD3.intersect.rect(tail, points[0]));
					// 		break;
					// 	case "flowMainTask":
					// 		points.unshift(dagreD3.intersect.rect(tail, points[0]));
					// 		break;
					// 	case "flowMilestone":
					// 		var tailPoints = [{
					// 			x: 0,
					// 			y: -tail.height / 2
					// 		}, {
					// 			x: -tail.width / 2,
					// 			y: 0
					// 		}, {
					// 			x: 0,
					// 			y: tail.height / 2
					// 		}, {
					// 			x: tail.width / 2,
					// 			y: 0
					// 		}];
					// 		points.unshift(dagreD3.intersect.polygon(tail, tailPoints, points[0]));
					// 		break;
					// 	default:
					// points.unshift(dagreD3.intersect.rect(tail, points[0]));
					// }

					switch (head.shape) {
						case "flowTask":
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
							break;
						case "flowMainTask":
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
							break;
						case "flowMilestone":
							var headPoints = [{
								x: 0,
								y: -head.height / 2
							}, {
								x: -head.width / 2,
								y: 0
							}, {
								x: 0,
								y: head.height / 2
							}, {
								x: head.width / 2,
								y: 0
							}];
							points.push(dagreD3.intersect.polygon(head, headPoints, points[points.length - 1]));
							break;
						default:
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
					}

					edge.points = points;
					return d3.svg.line()
						.x(function(d) {
							return d.x;
						})
						.y(function(d) {
							return d.y;
						})
						// .interpolate("basis")
						(points);
				}

				function calcPointsTail(e) {

					var edge = g.edge(e.v, e.w),
						tail = g.node(e.v),
						head = g.node(e.w);
					var points = edge.points.slice(1, edge.points.length);
					var afterslice = edge.points.slice(1, edge.points.length);

					switch (tail.shape) {
						case "flowTask":
							points.unshift(dagreD3.intersect.rect(tail, points[0]));
							break;
						case "flowMainTask":
							points.unshift(dagreD3.intersect.rect(tail, points[0]));
							break;
						case "flowMilestone":
							var tailPoints = [{
								x: 0,
								y: -tail.height / 2
							}, {
								x: -tail.width / 2,
								y: 0
							}, {
								x: 0,
								y: tail.height / 2
							}, {
								x: tail.width / 2,
								y: 0
							}];
							points.unshift(dagreD3.intersect.polygon(tail, tailPoints, points[0]));
							break;
						default:
							points.unshift(dagreD3.intersect.rect(tail, points[0]));
					}

					edge.points = points;
					return d3.svg.line()
						.x(function(d) {
							return d.x;
						})
						.y(function(d) {
							return d.y;
						})
						(points);
				}

				function calcPointsHead(e) {

					var edge = g.edge(e.v, e.w),
						tail = g.node(e.v),
						head = g.node(e.w);
					var points = edge.points.slice(0, edge.points.length - 1);
					var afterslice = edge.points.slice(0, edge.points.length - 1);

					switch (head.shape) {
						case "flowTask":
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
							break;
						case "flowMainTask":
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
							break;
						case "flowMilestone":
							var headPoints = [{
								x: 0,
								y: -head.height / 2
							}, {
								x: -head.width / 2,
								y: 0
							}, {
								x: 0,
								y: head.height / 2
							}, {
								x: head.width / 2,
								y: 0
							}];
							points.push(dagreD3.intersect.polygon(head, headPoints, points[points.length - 1]));
							break;
						default:
							points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
					}

					edge.points = points;
					return d3.svg.line()
						.x(function(d) {
							return d.x;
						})
						.y(function(d) {
							return d.y;
						})
						(points);
				}

				function dragstart(d) {
					d3.event.sourceEvent.stopPropagation();
				}

				function dragmove(d) {
					if (oControl.getIsProjectFlow()) {
						return;
					}
					if (!editmode) {
						return;
					}
					var node = d3.select(this),
						selectedNode = g.node(d);
					var prevX = selectedNode.x,
						prevY = selectedNode.y;

					if (sap.ui.getCore().byId(node[0][0].childNodes[1].firstChild.id).getState && sap.ui.getCore().byId(node[0][0].childNodes[1].firstChild
							.id).getState() === "expanded") {
						return;
					}

					selectedNode.x = +selectedNode.x + +d3.event.dx;
					selectedNode.y = +selectedNode.y + +d3.event.dy;
					node.attr('transform', 'translate(' + selectedNode.x + ',' + selectedNode.y + ')');

					var dx = selectedNode.x - prevX,
						dy = selectedNode.y - prevY;

					g.edges().forEach(function(e) {
						if (e.v == d || e.w == d) {
							var edge = g.edge(e.v, e.w);
							// translateEdge(g.edge(e.v, e.w), dx, dy);
							var newPath;
							if (e.v == d) {

								if (edge.startAnchor) {
									edge.startAnchor.circle
										.attr("cx", edge.points[0].x)
										.attr("cy", edge.points[0].y);
								}

								newPath = calcPointsTail(e);
							} else {

								if (edge.endAnchor) {
									edge.endAnchor.circle
										.attr("cx", edge.points[edge.points.length - 1].x)
										.attr("cy", edge.points[edge.points.length - 1].y);
								}

								newPath = calcPointsHead(e);
							}
							$('#' + edge.customId).attr('d', newPath);
							// $('#' + edge.customId).attr('d', calcPoints(e));
							//                label = $('#label_' + edge.customId);
							//                var xforms = label.attr('transform');
							//                if (xforms != "") {
							//                    var parts = /translate\(\s*([^\s,)]+)[ ,]?([^\s,)]+)?/.exec(xforms);
							//                    var X = parseInt(parts[1]) + dx,
							//                        Y = parseInt(parts[2]) + dy;
							//                    console.log(X, Y);
							//                    if (isNaN(Y)) {
							//                        Y = dy;
							//                    }
							//                    label.attr('transform', 'translate(' + X + ',' + Y + ')');
							//                }
						}
					});
				}

				var dragPoint;
				var dragPointIndex;
				var nodeDrag = d3.behavior.drag()
					.on("dragstart", dragstart)
					.on("drag", dragmove);

				var edgeDrag = d3.behavior.drag()
					.on("dragstart", function(d) {
						dragstart(d);
					})
					.on("dragend", function(d) {
						dragPoint = null;
					})
					.on('drag', function(d) {
						if (oControl.getIsProjectFlow()) {
							return;
						}
						if (!editmode) {
							return;
						}
						var edge = g.edge(d.v, d.w);
						var oldPoint = {};
						oldPoint.x = d3.event.x;
						oldPoint.y = d3.event.y;
						var newPoint = {};
						newPoint.x = d3.event.x + d3.event.dx;
						newPoint.y = d3.event.y + d3.event.dy;
						var pointsArray = edge.points;

						if (!dragPoint) {
							for (var i = 1; i < pointsArray.length - 1; i++) {
								if (dragPoint) continue;
								var point = pointsArray[i];
								if ((newPoint.x - point.x) * (newPoint.x - point.x) + (newPoint.y - point.y) * (newPoint.y - point.y) <= 25) {
									dragPoint = point;
									dragPointIndex = i;
								}
							}
						}

						if (!dragPoint) {

							var minDistance;
							var insertPointBeforeIndex;
							for (var i = 1; i < pointsArray.length; i++) {
								var indexA = i - 1;
								var indexB = i;
								var pointA = pointsArray[indexA];
								var pointB = pointsArray[indexB];

								function dist2(v, w) {
									return (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
								}

								function distToSegmentSquared(p, v, w) {
									var l2 = dist2(v, w);

									if (l2 == 0) return dist2(p, v);

									var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

									if (t < 0) return dist2(p, v);
									if (t > 1) return dist2(p, w);

									return dist2(p, {
										x: +v.x + +t * +(w.x - v.x),
										y: +v.y + +t * +(w.y - v.y)
									});
								}

								function distToSegment(p, v, w) {
									return Math.sqrt(distToSegmentSquared(p, v, w));
								}

								var distanceToSegment = distToSegment(newPoint, pointA, pointB);

								if (!minDistance) {
									minDistance = distanceToSegment;
									insertPointBeforeIndex = indexB;
								} else {
									if (minDistance > distanceToSegment) {
										minDistance = distanceToSegment;
										insertPointBeforeIndex = indexB;
									}
								}
								// var distance = Math.sqrt((pointA.x - pointB.x) * (
								// 	pointA.x - pointB.x) + (pointA.y - pointB.y) * (pointA.y - pointB.y));

								// if (!minDistance) {
								// 	minDistance = distance;
								// 	dragInsertPointAfterIndex = indexA;
								// } else {
								// 	if (minDistance > distance) {
								// 		minDistance = distance;
								// 		dragInsertPointAfterIndex = indexA;
								// 	}
								// }
							}

							edge.points.splice(insertPointBeforeIndex, 0, newPoint);
							dragPoint = newPoint;
							dragPointIndex = insertPointBeforeIndex;

							var anchor = {};
							anchor.circle = d3.select(edge.elem.parentNode).append("circle")
								.attr('class', 'edgeAnchor')
								.attr("cx", dragPoint.x)
								.attr("cy", dragPoint.y)
								.attr("r", 5);
							anchor.id = dragPoint;
							anchor.circle.on("dblclick", function(edge, anchor) {
								return function() {
									oControl._anchorDblClick(edge, anchor);
								};
							}(edge, anchor));
							edge.anchors.push(anchor);

						} else {
							var oldAnchor = edge.anchors.filter(function(a) {
								if (a.id.x == dragPoint.x && a.id.y == dragPoint.y) {
									return true;
								}
								// if ((dragPoint.x - a.attr("cx")) * (dragPoint.x - a.attr("cx")) + (dragPoint.y - a.attr("cy")) * (dragPoint.y - a.attr("cy")) <=
								// 	9) {
								// 	return true;
								// }
							})[0];

							dragPoint = newPoint;
							if (oldAnchor) {
								oldAnchor.circle.attr("cx", dragPoint.x);
								oldAnchor.circle.attr("cy", dragPoint.y);
								oldAnchor.id = dragPoint;
							}
							edge.points.splice(dragPointIndex, 1, dragPoint);
						}
						var path = "M" + edge.points[0].x + "," + edge.points[0].y;
						for (var i = 1; i < edge.points.length; i++) {
							path += "L" + edge.points[i].x + "," + edge.points[i].y;
						}

						$('#' + g.edge(d.v, d.w).customId).attr('d', path);

						return;
						translateEdge(g.edge(d.v, d.w), d3.event.dx, d3.event.dy);
						$('#' + g.edge(d.v, d.w).customId).attr('d', calcPoints(d));
					});

				nodeDrag.call(svg.selectAll("g.node"));
				nodeDrag.call(svg.selectAll("g.cluster"));
				edgeDrag.call(svg.selectAll("g.edgePath"));

				// svg.selectAll("g.edgePath")

				svg.selectAll('g.node').each(function(nodeId) {
					var graphNode = parentGraph.node(nodeId);
					graphNode.elem._dragmove = dragmove;
					graphNode.fireNodeDrag = function() {
						// nodeDrag.call(d3.select(graphNode).enter());
						// nodeDrag.call(d3.select(graphNode)[0]);
						// dragstart(nodeId);
						d3.event = {
							dx: 0,
							dy: 0
						};
						graphNode.elem._dragmove(nodeId);

						// $(d3.select(graphNode)[0][0].elem).trigger("drag");
						// $("#nodeT3").trigger("drag");
						// nodeDrag.call($(d3.select(graphNode)[0][0].elem));
					};
				});

				function click(d) {
					if (d.children) {
						d._children = d.children;
						d.children = null;
					} else {
						d.children = d._children;
						d._children = null;
					}
				}

				svg.selectAll("g.cluster").on("click", click);

			},

			initGraph: function() {
				var graph = new dagreD3.graphlib.Graph({
						compound: true
					}).setGraph({})
					.setDefaultEdgeLabel(function() {
						return {};
					});

				graph.graph().rankdir = "LR";

				return graph;
			}

		};
	});