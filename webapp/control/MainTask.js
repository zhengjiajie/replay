jQuery.sap.registerResourcePath('d3plus', "https://d3plus.org/js/d3plus");
jQuery.sap.registerResourcePath('dagreD3', "https://cdnjs.cloudflare.com/ajax/libs/dagre-d3/0.4.17/dagre-d3.min");
sap.ui.define(
	["sap/ui/core/Control", "ppmflow/control/Task", "sap/ui/thirdparty/d3", "d3plus", "dagreD3", "ppmflow/lib/Graph"],
	function(Control, Task, d3, d3plus, dagreD3, graph) {
		return Control.extend("ppmflow.control.MainTask", {
			_graph: {},
			_textArea: null,
			metadata: {
				properties: {
					taskId: {
						type: "string"
					},
					taskGuid: {
						type: "string"
					},
					name: {
						type: "string"
					},
					description: {
						type: "string"
					},
					status: {
						type: "string"
					},
					height: {
						type: "Number",
						defaultValue: 50
					},
					width: {
						type: "Number",
						defaultValue: 150
					},
					rx: {
						type: "int"
					},
					ry: {
						type: "int"
					},
					borderSize: {
						type: "int"
					},
					task: {
						type: "object"
					},
					parentNode: {
						type: "object"
					},
					state: {
						type: "string",
						defaultValue: "collapsed"
					},
					editmode: {
						type: "boolean"
					},
					isProjectFlow: {
						type: "boolean",
						defaultValue: false
					},
					color: {
						type: "string",
						defaultValue: "#FFFFFF"
					}
				},
				events: {
					"nodeDblClick": {
						preventDefault: true
					},
					"nodeClick": {
						preventDefault: true
					},
					"showTooltip": {
						preventDefault: true
					},
					"hideTooltip": {
						preventDefault: true
					}
				},
				aggregations: {
					// actions: {
					// 	type: {
					// 		id: "string",
					// 		text: "string",
					// 		description: "string"
					// 	}
					actions: {
						type: "sap.ui.base.ManagedObject",
						multiple: true
					},
					_html: {
						type: "sap.ui.core.HTML",
						multiple: false,
						visibility: "hidden"
					}
				}
			},

			getGraph: function() {
				if (this._graph) {
					return this._graph.g;
				} else {
					return null;
				}
			},

			setName: function(name) {
				this.setProperty("name", name, true);
				if (this._textArea) {
					var outerW = this.getWidth() + 2 * this.getBorderSize();
					this._textArea.text(name);

					var textWidth = outerW;
					if (this.getState() !== "expanded") {
						textWidth = outerW - 20;
					}

					d3plus.textwrap()
						.container(this._textArea)
						.valign("middle")
						.align("middle")
						.width(textWidth)
						.height(35)
						.padding(2)
						.draw();

				}
			},

			setStatus: function(status) {
				this.setProperty("status", status, true);
				if (this._taskGroup) {
					if (this.getStatus() === "S") {
						var outerW = this.getWidth() + 2 * this.getBorderSize();
						var padding = this.getBorderSize() + 2;

						if (!this._mainStatus) {
							this._mainStatus = this._taskGroup.append("image");
						}

						this._mainStatus
							.attr("href", graph.getSplitIconPath())
							.attr("width", "16")
							.attr("height", "14")
							.attr("x", outerW - (16 + padding))
							.attr("y", padding);
					} else {
						if (this._mainStatus) {
							this._mainStatus.remove();
						}
					}

				}
			},

			setTask: function(task) {
				this.setProperty("task", task, true);
				var parentGraph = this._graph.g;

				if (parentGraph) {
					task.subtasks.forEach(function(subtask) {

						var node = parentGraph.node(subtask.id);
						if (node) {

							var controlId;
							if (node.elem.childNodes[1] && node.elem.childNodes[1].firstChild) {
								controlId = node.elem.childNodes[1].firstChild.id;
							}

							if (controlId) {
								var oControl = sap.ui.getCore().byId(controlId);
								node.label = subtask.name;
								oControl.setName(subtask.name);
							}
						}

					});
				}
			},

			init: function() {
				this._sContainerId = this.getId();
				// this._sContainerId = this.getId() + "--container";
				// this.setAggregation("_html", new sap.ui.core.HTML({
				// 	content: "<svg id='" + this._sContainerId + "' width='100%' height='100%'></svg>"
				// }));
			},

			renderer: function(oRm, oControl) {
				oRm.write("<svg width='100%' height='100%' overflow='visible'");
				oRm.writeControlData(oControl);
				oRm.write(">");
				// oRm.renderControl(oControl.getAggregation("_html"));
				oRm.write("</svg>");
			},

			exit: function() {
				this._removeContent();
			},

			_removeContent: function() {
				// var svg = d3.select("#" + this._sContainerId);
				// if (svg) {
				// 	svg.selectAll("*").remove();
				// }
			},

			getLayout: function() {

				var svg = this._graph.svg;

				var parentGraph = this._graph.g;
				var layout = {
					nodes: [],
					edges: []
				};

				if (!svg) {
					return {
						nodes: [{
							id: "",
							name: "",
							x: "",
							y: ""
						}],
						edges: [{
							id: "",
							from: "",
							to: "",
							points: [{
								x: "",
								y: ""
							}]
						}]
					};
				}

				svg.selectAll('g.node').each(function(nodeId) {
					var nodeLayout = {
						id: "",
						name: "",
						x: 0,
						y: 0
					};
					var graphNode = parentGraph.node(nodeId);
					if (graphNode) {
						var oControl = sap.ui.getCore().byId(graphNode.elem.childNodes[1].firstChild.id);
						nodeLayout.id = nodeId;
						nodeLayout.name = oControl.getName();
						nodeLayout.x = graphNode.x;
						nodeLayout.y = graphNode.y;
						layout.nodes.push(nodeLayout);
					}
				});

				var duringRendering = false;
				svg.selectAll('g.edgePath').each(function(edgePath) {
					var edgeLayout = {
						id: "",
						from: "",
						to: "",
						points: [{
							x: "",
							y: ""
						}]
					};
					var graphEdge = parentGraph.edge(edgePath);
					if (graphEdge) {
						if (!$("#" + graphEdge.customId).attr("d")) {
							duringRendering = true;
						}
						edgeLayout.id = graphEdge.customId;
						edgeLayout.from = edgePath.v;
						edgeLayout.to = edgePath.w;
						edgeLayout.points = graphEdge.points;
						// edgeLayout.path = $("#" + graphEdge.customId).attr("d");
						layout.edges.push(edgeLayout);
					}
				});
				if (layout.edges.length === 0) {
					layout.edges.push({
						id: "",
						from: "",
						to: "",
						points: [{
							x: "",
							y: ""
						}]
					});
				}

				if (duringRendering === true) {
					if (this.getState() === "collapsed") {
						return this._currentLayout;
					} else {
						return null;
					}
				}

				return layout;
			},

			_setLayout: function(oLayout) {
				var oControl = this;
				var parentGraph = this._graph.g;
				var svg = this._graph.svg;
				var inner = this._graph.inner;
				if (oLayout) {
					if (oLayout.nodes) {
						oLayout.nodes.forEach(function(nodeLayout) {
							var node = parentGraph.node(nodeLayout.id);
							if (node) {
								node.x = +nodeLayout.x;
								node.y = +nodeLayout.y;
								$("#node" + nodeLayout.id).attr("transform", "translate(" + node.x + "," + node.y + ")");
								graph.recalculateEdgesForNode(oControl, svg, inner, parentGraph, nodeLayout.id);
							}
						});
					}

					if (oLayout.edges) {
						oLayout.edges.forEach(function(edgeLayout) {
							var edge = parentGraph.edge(edgeLayout.from, edgeLayout.to);
							if (edge && edgeLayout.points.length > 0) {
								edge.points = edgeLayout.points;

								var path = "M" + edge.points[0].x + "," + edge.points[0].y;
								for (var i = 1; i < edge.points.length; i++) {
									path += "L" + edge.points[i].x + "," + edge.points[i].y;
								}

								$("#" + edgeLayout.id).attr("d", path);
							}
						});
					}
					this._currentLayout = oLayout;
				}
			},

			nodeDblClick: function(task) {
				d3.event.stopPropagation();
				this.fireNodeDblClick(task);
			},

			nodeClick: function(task) {
				this.fireNodeClick(task);
			},

			nodeHover: function(task) {
				var browserEvent = d3.event;
				browserEvent.preventDefault();
				browserEvent.cancelBubble = true;
				this.fireShowTooltip(task);
			},

			nodeHoverOut: function(task) {
				var browserEvent = d3.event;
				browserEvent.preventDefault();
				browserEvent.cancelBubble = true;
				this.fireHideTooltip(task);
			},

			stopPropagation: function() {
				d3.event.stopPropagation();
			},

			_expandTask: function() {
				this.setWidth(150);
				this.setHeight(50);
				this._setNewDimension();
			},

			_collapseTask: function() {
				this.setWidth(150);
				this.setHeight(50);
				this._setNewDimension();
			},

			_toggleState: function() {

				if (this._graph.g) {
					var graphLayout = this.getLayout();
				}
				if (graphLayout) {
					this._setLayout(graphLayout);
				}

				if (this.getState() === "expanded") {
					this._expandTask();
					this.setState("collapsed");
				} else {
					this._collapseTask();
					this.setState("expanded");
				}
				// d3.event
			},

			_appendToggleIcon: function(elem) {
				if (this.getState() === "expanded") {
					return this._appendExpandIcon(elem);
				} else {
					return this._appendCollapseIcon(elem);
				}
			},

			_appendExpandIcon: function(elem) {
				elem.append("svg")
					.attr("viewBox", "0 0 500 500")
					.append("path")
					.attr("d",
						"M8 17h16v-2h-16v2zM28 2h-8v2h8v24h-24v-16h-2v16q0 0.875 0.563 1.438t1.438 0.563h24q0.813 0 1.406-0.563t0.594-1.438v-24q0-0.813-0.594-1.406t-1.406-0.594zM14.188 2.375q0.688-0.75 1.438 0 0.313 0.313 0.313 0.688t-0.313 0.688l-6.188 5.75q-0.625 0.563-1.438 0.563t-1.375-0.563l-6.313-5.75q-0.313-0.313-0.313-0.719t0.313-0.719 0.719-0.313 0.719 0.313l5.938 5.438q0.313 0.375 0.688 0z"
					);

			},

			_appendCollapseIcon: function(elem) {

				elem.append("svg")
					.attr("viewBox", "0 0 500 500")
					.append("path")
					.attr("d",
						"M15 8v7h-7v2h7v7h2v-7h7v-2h-7v-7h-2zM28 2h-16v2h16v24h-24v-8h-2v8q0 0.813 0.563 1.406t1.438 0.594h24q0.813 0 1.406-0.594t0.594-1.406v-24q0-0.875-0.594-1.438t-1.406-0.563zM0.438 1.75q-0.75-0.688 0-1.438 0.313-0.313 0.688-0.313t0.688 0.313l5.75 6.188q0.563 0.625 0.563 1.438t-0.563 1.375l-5.75 6.313q-0.313 0.313-0.719 0.313t-0.719-0.313-0.313-0.719 0.313-0.719l5.438-5.938q0.375-0.313 0-0.688z"
					);

				// var innerHTML = "<svg xmlns:'http://www.w3.org/2000/svg' viewBox='0 0 500 500'>" +
				// 				"	<title>uniE1DA</title>" +
				// 				"	<path d='M15 8v7h-7v2h7v7h2v-7h7v-2h-7v-7h-2zM28 2h-16v2h16v24h-24v-8h-2v8q0 0.813 0.563 1.406t1.438 0.594h24q0.813 0 1.406-0.594t0.594-1.406v-24q0-0.875-0.594-1.438t-1.406-0.563zM0.438 1.75q-0.75-0.688 0-1.438 0.313-0.313 0.688-0.313t0.688 0.313l5.75 6.188q0.563 0.625 0.563 1.438t-0.563 1.375l-5.75 6.313q-0.313 0.313-0.719 0.313t-0.719-0.313-0.313-0.719 0.313-0.719l5.438-5.938q0.375-0.313 0-0.688z'></path>" +
				// 				"</svg>";

				// return innerHTML;
			},

			onAfterRendering: function(oRm, oControl) {

				if (this._graph.g) {
					var graphLayout = this._currentLayout;
				} else if (this.getTask().layout) {
					var graphLayout = this.getTask().layout[0];
				}

				if (!this._initialState && this.getTask().state) {
					this._initialState = this.getTask().state;
					this.setState(this._initialState);
				}

				d3.selection.prototype.moveToFront = function() {
					return this.each(function() {
						this.parentNode.appendChild(this);
					});
				};
				d3.selection.prototype.moveToBack = function() {
					return this.each(function() {
						var firstChild = this.parentNode.firstChild;
						if (firstChild) {
							this.parentNode.insertBefore(this, firstChild);
						}
					});
				};
				// this._removeContent();

				// this.getAggregation("_html").findElements().forEach(function(element) {
				// 	element.destroy();
				// });

				var outerW = this.getWidth() + 2 * this.getBorderSize();
				var outerH = this.getHeight() + 2 * this.getBorderSize();

				this._taskGroup = d3.select("#" + this._sContainerId)
					.attr("width", outerW)
					.attr("height", outerH);

				this._rect = this._taskGroup.insert("rect", ":first-child")
					.attr("x", this.getBorderSize())
					.attr("y", this.getBorderSize())
					.attr("rx", this.getRx())
					.attr("ry", this.getRy())
					.attr("width", this.getWidth())
					.attr("height", this.getHeight())
					.attr('class', 'ppmFlowTaskArea')
					.style("stroke-width", this.getBorderSize())
					.style("fill", this.getColor());

				this._textArea = this._taskGroup.append("text")
					.attr('class', 'taskName')
					.text(this.getName());

				var textWidth = outerW;
				if (this.getState() !== "expanded") {
					textWidth = outerW - 20;
				}

				d3plus.textwrap()
					.container(this._textArea)
					.valign("middle")
					.align("middle")
					.width(textWidth)
					.height(35)
					.padding(2)
					.draw();

				if (this.getStatus() === "S") {
					var padding = this.getBorderSize() + 2;

					this._mainStatus = this._taskGroup.append("image")
						.attr("href", graph.getSplitIconPath())
						.attr("width", "16")
						.attr("height", "14")
						.attr("x", outerW - (16 + padding))
						.attr("y", padding);
				}

				var myControl = this;
				this._toggleStateButton = this._taskGroup.append("svg");
				this._appendToggleIcon(this._toggleStateButton.append("g"));
				var rectArea = this._toggleStateButton.select("path")[0][0].getBBox();
				d3.select(this._toggleStateButton.select("path")[0][0].parentNode).append("rect")
					.attr("width", rectArea.width)
					.attr("height", rectArea.height)
					.style("opacity", 0);
				// .attr("viewBox","0 0 500 500")
				// .html(this._getToggleIcon());
				// .attr("href", this._getToggleIcon());
				this._toggleStateButton
					// .style("pointer-events", "bounding-box")
					.on("click", function(myControl) {
						return function() {
							myControl._toggleState();
						};
					}(myControl));

				if (this.getState() === "expanded") {

					var subChart = this._createSubChart(this.getTask(), this._taskGroup, 13.5, this._textArea[0][0].getBBox().height + this._textArea[
							0][0].getBBox()
						.y + 15 + 15);
					var newHeight = subChart.svg[0][0].getBBox().height + this._textArea[0][0].getBBox().height + this._textArea[0][0].getBBox()
						.y;
					var newWidth = subChart.svg[0][0].getBBox().width;

					newHeight += 40;
					newWidth += 30;

					this.setHeight(newHeight);
					this.setWidth(newWidth);

					this._setNewDimension();

					// this._customizeGraph(subChart.svg, subChart.inner, subChart.g);
					graph.customizeGraph(this, subChart.svg, subChart.inner, null, subChart.g, this.getEditmode());

					if (graphLayout) {
						this._setLayout(graphLayout);
					}

					if (!this.getIsProjectFlow()) {
						if (this.getEditmode()) {
							this._displayAnchors(subChart.g);
						}
					}

					d3.select(this.getParentNode().elem).moveToFront();
				} else {
					this._setNewDimension();

				}

			},

			_setNewDimension: function() {

				var newHeight = this.getHeight();
				var newWidth = this.getWidth();

				this.getParentNode().height = newHeight;
				this.getParentNode().width = newWidth;
				d3.select(this.getParentNode().elem.childNodes[0]).attr("height", newHeight);
				d3.select(this.getParentNode().elem.childNodes[0]).attr("width", newWidth);
				d3.select(this.getParentNode().elem.childNodes[0]).attr("x", -(newWidth / 2 - 2 + this.getBorderSize() / 2));
				d3.select(this.getParentNode().elem.childNodes[0]).attr("y", -(newHeight / 2 + this.getBorderSize()));

				d3.select(this.getParentNode().elem.childNodes[1]).attr("transform", "translate(" + -(newWidth / 2 - 2 + this.getBorderSize() / 2) +
					"," + -(newHeight / 2 + this.getBorderSize()) + ")");

				var outerW = this.getWidth() + 2 * this.getBorderSize();
				var outerH = this.getHeight() + 2 * this.getBorderSize();

				// var minLine = outerH;
				// if (minLine > outerW) {
				// 	minLine = outerW;
				// }

				this._toggleStateButton
					.attr("width", 210)
					.attr("height", 210)
					.attr("x", (outerW - 210) / 2 - 6.325)
					.attr("y", 10);

				// d3.select(this._toggleStateButton[0][0].childNodes[0])
				// 	.attr("transform", "translate(" + (newWidth / 2 - 2 + this.getBorderSize() / 2 - 6.325) +
				// 		"," + 25 + ")");

				d3.select(this._toggleStateButton[0][0].childNodes[0])
					.attr("transform", "translate(105,25)");

				this._taskGroup
					.attr("width", outerW)
					.attr("height", outerH);

				this._rect
					.attr("width", this.getWidth())
					.attr("height", this.getHeight());

				this._textArea.text(this.getName());

				var textWidth = outerW;
				if (this.getState() !== "expanded") {
					textWidth = outerW - 20;
				}

				d3plus.textwrap()
					.container(this._textArea)
					.valign("middle")
					.align("middle")
					.width(textWidth)
					.height(35)
					.padding(2)
					.draw();

				if (this.getStatus() === "S") {
					var padding = this.getBorderSize() + 2;

					if (!this._mainStatus) {
						this._mainStatus = this._taskGroup.append("image");
					}

					this._mainStatus
						.attr("href", graph.getSplitIconPath())
						.attr("width", "16")
						.attr("height", "14")
						.attr("x", outerW - (16 + padding))
						.attr("y", padding);
				} else {
					if (this._mainStatus) {
						this._mainStatus.remove();
					}
				}
				// this.getParentNode().fireNodeDrag();
			},

			_subChartRenderer: function() {
				var render = new dagreD3.render();
				render.shapes().flowTask = this._flowTaskRenderer;
				return render;
			},

			_flowTaskRenderer: function(parent, bbox, node) {

				var h = node.height;
				var w = node.width;
				var rx = node.rx;
				var ry = node.ry;
				var borderSize = node.borderSize;

				// make sure element is empty
				parent.selectAll("*").remove();

				// insert standard rectangle shape and hide it
				var shapeSvg = parent.insert("rect", ":first-child")
					.attr("rx", rx)
					.attr("ry", ry)
					.attr("x", -(w / 2 - 2 + borderSize / 2))
					.attr("y", -(h / 2 + borderSize))
					.attr("width", w)
					.attr("height", h)
					.style("opacity", 0);

				// add custom shape container
				var customShape = parent.append("g")
					.attr("width", w)
					.attr("height", h)
					.attr("transform", "translate(" + -(w / 2 - 2 + borderSize / 2) + "," + -(h / 2 + borderSize) + ")")
					// .append("g")
					// .attr("xmlns","http://www.w3.org/2000/svg")
					// .attr("width", w)
					// .attr("height", h)
				;

				// build custom shape and insert it in container
				var task = new Task({
					taskId: node.customId,
					taskGuid: node.customId,
					name: node.label,
					description: "First Task",
					height: h,
					width: w,
					rx: rx,
					ry: ry,
					borderSize: borderSize,
					color: node.color,
					status: node.status,
					actions: [{
						id: "addpopop",
						text: "action1",
						description: "first action"
					}]
				});

				if (node.mainControl.getIsProjectFlow()) {

					parent.on("dblclick", node.mainControl.stopPropagation);
					parent.on("click", node.mainControl.stopPropagation);
					var cc = graph.clickcancel();
					parent.call(cc);
					cc.on("dblclick", function(oNode) {
						return function() {
							oNode.mainControl.nodeDblClick(oNode);
						};
					}(node));

					parent.on("contextmenu", function(oNode) {
						return function() {
							oNode.mainControl.nodeClick(oNode);
						};
					}(node));
				}
				parent.on("mouseover", function(oNode) {
					return function() {
						oNode.mainControl.nodeHover(oNode);
					};
				}(node));
				parent.on("mouseout", function(oNode) {
					return function() {
						oNode.mainControl.nodeHoverOut(oNode);
					};
				}(node));

				// if (node.isProjectFlow) {
				// 	$(parent)[0][0].addEventListener('dblclick', function(oNode) {
				// 		return function() {
				// 			oNode.mainControl.nodeDblClick(oNode);
				// 		};
				// 	}(node));
				// }

				task.placeAt(customShape[0][0]);

				// keep same logic as standard rectangle shape
				node.intersect = function(point) {
					return dagreD3.intersect.rect(node, point);
				};

				return shapeSvg;
			},

			_anchorDblClick: function(edge, anchor) {

				d3.event.stopPropagation();
				var pointsArray = edge.points;
				var clickedPoint;
				var clickedPointIndex;
				for (var i = 1; i < pointsArray.length - 1; i++) {
					if (clickedPoint) continue;
					var point = pointsArray[i];
					if ((anchor.id.x - point.x) * (anchor.id.x - point.x) + (anchor.id.y - point.y) * (anchor.id.y - anchor.id.y) <= 25) {
						clickedPoint = point;
						clickedPointIndex = i;
					}
				}

				if (clickedPoint) {
					edge.points.splice(clickedPointIndex, 1);
					var path = "M" + edge.points[0].x + "," + edge.points[0].y;
					for (var i = 1; i < edge.points.length; i++) {
						path += "L" + edge.points[i].x + "," + edge.points[i].y;
					}

					$('#' + edge.customId).attr('d', path);
					anchor.circle.remove();
				}

			},

			_displayAnchors: function(g) {
				var oControl = this;
				g.edges().forEach(function(e) {
					var edge = g.edge(e.v, e.w);
					edge.anchors = [];

					// var path = g.path;
					// var points = path.split(/(?=[LMC])/);

					// var pointsArray = points.map(function(d) {
					// 	var pointsArray = d.slice(1, d.length).split(',');
					// 	var pairsArray = {};
					// 	pairsArray.x = pointsArray[0];
					// 	pairsArray.y = pointsArray[1];
					// 	return pairsArray;
					// });

					var pointsArray = edge.points;

					for (var i = 1; i < pointsArray.length - 1; i++) {
						var point = pointsArray[i];
						var anchor = {};
						anchor.circle = d3.select(edge.elem.parentNode).append("circle")
							.attr('class', 'edgeAnchor')
							.attr("cx", point.x)
							.attr("cy", point.y)
							.attr("r", 5);
						anchor.id = point;
						anchor.circle.on("dblclick", function(edge, anchor) {
							return function() {
								oControl._anchorDblClick(edge, anchor);
							};
						}(edge, anchor));
						edge.anchors.push(anchor);
					}

					edge.startAnchor = {};
					edge.startAnchor.circle = d3.select(edge.elem.parentNode).append("circle")
						.attr('class', 'startAnchor')
						.attr("cx", pointsArray[0].x)
						.attr("cy", pointsArray[0].y)
						.attr("r", 5);
					edge.startAnchor.id = pointsArray[0];

					function dragstarted(d) {
						d3.event.sourceEvent.stopPropagation();
						// d3.select(this).raise().classed("active", true);
					}

					function dragged(edge, anchor, index) {
						anchor.circle
							.attr("cx", d3.event.dx + d3.event.x)
							.attr("cy", d3.event.dy + d3.event.y);
						edge.points[index].x = d3.event.dx + d3.event.x;
						edge.points[index].y = d3.event.dy + d3.event.y;
						var path = "M" + edge.points[0].x + "," + edge.points[0].y;
						for (var i = 1; i < edge.points.length; i++) {
							path += "L" + edge.points[i].x + "," + edge.points[i].y;
						}

						$('#' + edge.customId).attr('d', path);

					}

					function dragended(d) {
						// d3.select(this).classed("active", false);
					}

					var startAnchorDrag = d3.behavior.drag()
						.on("dragstart", dragstarted)
						.on("drag", function(edge, anchor, index) {
							return function() {
								dragged(edge, anchor, index);
							};
						}(edge, edge.startAnchor, 0))
						.on("dragend", dragended);

					edge.endAnchor = {};
					edge.endAnchor.circle = d3.select(edge.elem.parentNode).append("circle")
						.attr('class', 'endAnchor')
						.attr("cx", pointsArray[pointsArray.length - 1].x)
						.attr("cy", pointsArray[pointsArray.length - 1].y)
						.attr("r", 5);
					edge.endAnchor.id = pointsArray[pointsArray.length - 1];

					var endAnchorDrag = d3.behavior.drag()
						.on("dragstart", dragstarted)
						.on("drag", function(edge, anchor, index) {
							return function() {
								dragged(edge, anchor, index);
							};
						}(edge, edge.endAnchor, pointsArray.length - 1))
						.on("dragend", dragended);

					startAnchorDrag.call(edge.startAnchor.circle);
					endAnchorDrag.call(edge.endAnchor.circle);

				});
			},

			// _customizeGraph: function(svg, inner, g) {

			// 	var parentGraph = g;
			// 	var graphSVG = svg;
			// 	var oControl = this;

			// 	var editmode = this.getEditmode();

			// 	//give IDs to each of the nodes so that they can be accessed
			// 	svg.selectAll("g.node rect")
			// 		.attr("id", function(d) {
			// 			return "rect" + d;
			// 		});
			// 	svg.selectAll("g.node")
			// 		.attr("id", function(d) {
			// 			return "node" + d;
			// 		});
			// 	svg.selectAll("g.edgePath > path")
			// 		.attr("id", function(e) {
			// 			return e.v + "-" + e.w;
			// 		})
			// 		// .style("marker-end", "url(#arrowhead15)")
			// 		// .style("stroke", "none")
			// 		.attr("marker-end", function(e) {
			// 			var markerUrl = graphSVG.select("#" + e.v + "-" + e.w).attr("marker-end");
			// 			markerUrl = markerUrl.replace(/["']/g, "");
			// 			var offset = markerUrl.search("#arrowhead");
			// 			var newMarkerUrl = "url(" + markerUrl.substr(offset);
			// 			// newMarkerUrl = '#arrowhead15';
			// 			// return "";
			// 			// return newMarkerUrl;
			// 			return encodeURI(newMarkerUrl);
			// 		});
			// 	//            svg.selectAll("g.edgeLabel g")
			// 	//                .attr("id", function (e) {
			// 	//                    return 'label_' + e.v + "-" + e.w;
			// 	//                });

			// 	svg.selectAll("g.cluster")
			// 		.attr("id", function(d) {
			// 			return "cluster" + d;
			// 		});
			// 	// // Set up zoom support
			// 	// var zoom = d3.behavior.zoom().on("zoom", function() {
			// 	// 	inner.attr("transform", "translate(" + d3.event.translate + ")" +
			// 	// 		"scale(" + d3.event.scale + ")");
			// 	// });
			// 	// svg.call(zoom);

			// 	// // Center the graph
			// 	// var initialScale = 1.0;
			// 	// zoom.translate([(svg[0][0].width.baseVal.valueInSpecifiedUnits * initialScale) / 2, 20])
			// 	// 	.scale(initialScale)
			// 	// 	.event(svg);

			// 	//code for drag

			// 	function translateEdge(e, dx, dy) {
			// 		// e.points.forEach(function(p) {
			// 		// 	p.x = p.x + dx;
			// 		// 	p.y = p.y + dy;
			// 		// });
			// 	}

			// 	//taken from dagre-d3 source code (not the exact same)
			// 	function calcPoints(e) {

			// 		// return;
			// 		var edge = g.edge(e.v, e.w),
			// 			tail = g.node(e.v),
			// 			head = g.node(e.w);
			// 		var points = edge.points.slice(0, edge.points.length - 1);
			// 		var afterslice = edge.points.slice(0, edge.points.length - 1);

			// 		// switch (tail.shape) {
			// 		// 	case "flowTask":
			// 		// 		points.unshift(dagreD3.intersect.rect(tail, points[0]));
			// 		// 		break;
			// 		// 	case "flowMainTask":
			// 		// 		points.unshift(dagreD3.intersect.rect(tail, points[0]));
			// 		// 		break;
			// 		// 	case "flowMilestone":
			// 		// 		var tailPoints = [{
			// 		// 			x: 0,
			// 		// 			y: -tail.height / 2
			// 		// 		}, {
			// 		// 			x: -tail.width / 2,
			// 		// 			y: 0
			// 		// 		}, {
			// 		// 			x: 0,
			// 		// 			y: tail.height / 2
			// 		// 		}, {
			// 		// 			x: tail.width / 2,
			// 		// 			y: 0
			// 		// 		}];
			// 		// 		points.unshift(dagreD3.intersect.polygon(tail, tailPoints, points[0]));
			// 		// 		break;
			// 		// 	default:
			// 		// points.unshift(dagreD3.intersect.rect(tail, points[0]));
			// 		// }

			// 		switch (head.shape) {
			// 			case "flowTask":
			// 				points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
			// 				break;
			// 			case "flowMainTask":
			// 				points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
			// 				break;
			// 			case "flowMilestone":
			// 				var headPoints = [{
			// 					x: 0,
			// 					y: -head.height / 2
			// 				}, {
			// 					x: -head.width / 2,
			// 					y: 0
			// 				}, {
			// 					x: 0,
			// 					y: head.height / 2
			// 				}, {
			// 					x: head.width / 2,
			// 					y: 0
			// 				}];
			// 				points.push(dagreD3.intersect.polygon(head, headPoints, points[points.length - 1]));
			// 				break;
			// 			default:
			// 				points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
			// 		}

			// 		edge.points = points;
			// 		return d3.svg.line()
			// 			.x(function(d) {
			// 				return d.x;
			// 			})
			// 			.y(function(d) {
			// 				return d.y;
			// 			})
			// 			// .interpolate("basis")
			// 			(points);
			// 	}

			// 	function calcPointsTail(e) {

			// 		var edge = g.edge(e.v, e.w),
			// 			tail = g.node(e.v),
			// 			head = g.node(e.w);
			// 		var points = edge.points.slice(1, edge.points.length);
			// 		var afterslice = edge.points.slice(1, edge.points.length);

			// 		switch (tail.shape) {
			// 			case "flowTask":
			// 				points.unshift(dagreD3.intersect.rect(tail, points[0]));
			// 				break;
			// 			case "flowMainTask":
			// 				points.unshift(dagreD3.intersect.rect(tail, points[0]));
			// 				break;
			// 			case "flowMilestone":
			// 				var tailPoints = [{
			// 					x: 0,
			// 					y: -tail.height / 2
			// 				}, {
			// 					x: -tail.width / 2,
			// 					y: 0
			// 				}, {
			// 					x: 0,
			// 					y: tail.height / 2
			// 				}, {
			// 					x: tail.width / 2,
			// 					y: 0
			// 				}];
			// 				points.unshift(dagreD3.intersect.polygon(tail, tailPoints, points[0]));
			// 				break;
			// 			default:
			// 				points.unshift(dagreD3.intersect.rect(tail, points[0]));
			// 		}

			// 		edge.points = points;
			// 		return d3.svg.line()
			// 			.x(function(d) {
			// 				return d.x;
			// 			})
			// 			.y(function(d) {
			// 				return d.y;
			// 			})
			// 			(points);
			// 	}

			// 	function calcPointsHead(e) {

			// 		var edge = g.edge(e.v, e.w),
			// 			tail = g.node(e.v),
			// 			head = g.node(e.w);
			// 		var points = edge.points.slice(0, edge.points.length - 1);
			// 		var afterslice = edge.points.slice(0, edge.points.length - 1);

			// 		switch (head.shape) {
			// 			case "flowTask":
			// 				points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
			// 				break;
			// 			case "flowMainTask":
			// 				points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
			// 				break;
			// 			case "flowMilestone":
			// 				var headPoints = [{
			// 					x: 0,
			// 					y: -head.height / 2
			// 				}, {
			// 					x: -head.width / 2,
			// 					y: 0
			// 				}, {
			// 					x: 0,
			// 					y: head.height / 2
			// 				}, {
			// 					x: head.width / 2,
			// 					y: 0
			// 				}];
			// 				points.push(dagreD3.intersect.polygon(head, headPoints, points[points.length - 1]));
			// 				break;
			// 			default:
			// 				points.push(dagreD3.intersect.rect(head, points[points.length - 1]));
			// 		}

			// 		edge.points = points;
			// 		return d3.svg.line()
			// 			.x(function(d) {
			// 				return d.x;
			// 			})
			// 			.y(function(d) {
			// 				return d.y;
			// 			})
			// 			(points);
			// 	}

			// 	function dragstart(d) {
			// 		d3.event.sourceEvent.stopPropagation();
			// 	}

			// 	function dragmove(d) {
			// 		if (oControl.getIsProjectFlow()) {
			// 			return;
			// 		}
			// 		if (!editmode) {
			// 			return;
			// 		}

			// 		var node = d3.select(this),
			// 			selectedNode = g.node(d);
			// 		var prevX = selectedNode.x,
			// 			prevY = selectedNode.y;

			// 		if (sap.ui.getCore().byId(node[0][0].childNodes[1].firstChild.id).getState && sap.ui.getCore().byId(node[0][0].childNodes[1].firstChild
			// 				.id).getState() === "expanded") {
			// 			return;
			// 		}

			// 		selectedNode.x = +selectedNode.x + +d3.event.dx;
			// 		selectedNode.y = +selectedNode.y + +d3.event.dy;
			// 		node.attr('transform', 'translate(' + selectedNode.x + ',' + selectedNode.y + ')');

			// 		var dx = selectedNode.x - prevX,
			// 			dy = selectedNode.y - prevY;

			// 		g.edges().forEach(function(e) {
			// 			if (e.v == d || e.w == d) {
			// 				var edge = g.edge(e.v, e.w);
			// 				// translateEdge(g.edge(e.v, e.w), dx, dy);
			// 				var newPath;
			// 				if (e.v == d) {

			// 					if (edge.startAnchor) {
			// 						edge.startAnchor.circle
			// 							.attr("cx", edge.points[0].x)
			// 							.attr("cy", edge.points[0].y);
			// 					}

			// 					newPath = calcPointsTail(e);
			// 				} else {

			// 					if (edge.endAnchor) {
			// 						edge.endAnchor.circle
			// 							.attr("cx", edge.points[edge.points.length - 1].x)
			// 							.attr("cy", edge.points[edge.points.length - 1].y);
			// 					}

			// 					newPath = calcPointsHead(e);
			// 				}
			// 				$('#' + edge.customId).attr('d', newPath);
			// 				// $('#' + edge.customId).attr('d', calcPoints(e));
			// 				//                label = $('#label_' + edge.customId);
			// 				//                var xforms = label.attr('transform');
			// 				//                if (xforms != "") {
			// 				//                    var parts = /translate\(\s*([^\s,)]+)[ ,]?([^\s,)]+)?/.exec(xforms);
			// 				//                    var X = parseInt(parts[1]) + dx,
			// 				//                        Y = parseInt(parts[2]) + dy;
			// 				//                    console.log(X, Y);
			// 				//                    if (isNaN(Y)) {
			// 				//                        Y = dy;
			// 				//                    }
			// 				//                    label.attr('transform', 'translate(' + X + ',' + Y + ')');
			// 				//                }
			// 			}
			// 		});
			// 	}

			// 	var dragPoint;
			// 	var dragPointIndex;
			// 	var nodeDrag = d3.behavior.drag()
			// 		.on("dragstart", dragstart)
			// 		.on("drag", dragmove);

			// 	var edgeDrag = d3.behavior.drag()
			// 		.on("dragstart", function(d) {
			// 			dragstart(d);
			// 		})
			// 		.on("dragend", function(d) {
			// 			dragPoint = null;
			// 		})
			// 		.on('drag', function(d) {
			// 			if (oControl.getIsProjectFlow()) {
			// 				return;
			// 			}
			// 			if (!editmode) {
			// 				return;
			// 			}
			// 			var edge = g.edge(d.v, d.w);
			// 			var oldPoint = {};
			// 			oldPoint.x = d3.event.x;
			// 			oldPoint.y = d3.event.y;
			// 			var newPoint = {};
			// 			newPoint.x = d3.event.x + d3.event.dx;
			// 			newPoint.y = d3.event.y + d3.event.dy;
			// 			var pointsArray = edge.points;

			// 			if (!dragPoint) {
			// 				for (var i = 1; i < pointsArray.length - 1; i++) {
			// 					if (dragPoint) continue;
			// 					var point = pointsArray[i];
			// 					if ((newPoint.x - point.x) * (newPoint.x - point.x) + (newPoint.y - point.y) * (newPoint.y - point.y) <= 25) {
			// 						dragPoint = point;
			// 						dragPointIndex = i;
			// 					}
			// 				}
			// 			}

			// 			if (!dragPoint) {

			// 				var minDistance;
			// 				var insertPointBeforeIndex;
			// 				for (var i = 1; i < pointsArray.length; i++) {
			// 					var indexA = i - 1;
			// 					var indexB = i;
			// 					var pointA = pointsArray[indexA];
			// 					var pointB = pointsArray[indexB];

			// 					function dist2(v, w) {
			// 						return (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
			// 					}

			// 					function distToSegmentSquared(p, v, w) {
			// 						var l2 = dist2(v, w);

			// 						if (l2 == 0) return dist2(p, v);

			// 						var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;

			// 						if (t < 0) return dist2(p, v);
			// 						if (t > 1) return dist2(p, w);

			// 						return dist2(p, {
			// 							x: v.x + t * (w.x - v.x),
			// 							y: v.y + t * (w.y - v.y)
			// 						});
			// 					}

			// 					function distToSegment(p, v, w) {
			// 						return Math.sqrt(distToSegmentSquared(p, v, w));
			// 					}

			// 					var distanceToSegment = distToSegment(newPoint, pointA, pointB);

			// 					if (!minDistance) {
			// 						minDistance = distanceToSegment;
			// 						insertPointBeforeIndex = indexB;
			// 					} else {
			// 						if (minDistance > distanceToSegment) {
			// 							minDistance = distanceToSegment;
			// 							insertPointBeforeIndex = indexB;
			// 						}
			// 					}
			// 					// var distance = Math.sqrt((pointA.x - pointB.x) * (
			// 					// 	pointA.x - pointB.x) + (pointA.y - pointB.y) * (pointA.y - pointB.y));

			// 					// if (!minDistance) {
			// 					// 	minDistance = distance;
			// 					// 	dragInsertPointAfterIndex = indexA;
			// 					// } else {
			// 					// 	if (minDistance > distance) {
			// 					// 		minDistance = distance;
			// 					// 		dragInsertPointAfterIndex = indexA;
			// 					// 	}
			// 					// }
			// 				}

			// 				edge.points.splice(insertPointBeforeIndex, 0, newPoint);
			// 				dragPoint = newPoint;
			// 				dragPointIndex = insertPointBeforeIndex;

			// 				var anchor = {};
			// 				anchor.circle = d3.select(edge.elem.parentNode).append("circle")
			// 					.attr('class', 'edgeAnchor')
			// 					.attr("cx", dragPoint.x)
			// 					.attr("cy", dragPoint.y)
			// 					.attr("r", 5);
			// 				anchor.id = dragPoint;
			// 				anchor.circle.on("dblclick", function(edge, anchor) {
			// 					return function() {
			// 						oControl._anchorDblClick(edge, anchor);
			// 					};
			// 				}(edge, anchor));
			// 				edge.anchors.push(anchor);

			// 			} else {
			// 				var oldAnchor = edge.anchors.filter(function(a) {
			// 					if (a.id.x == dragPoint.x && a.id.y == dragPoint.y) {
			// 						return true;
			// 					}
			// 					// if ((dragPoint.x - a.attr("cx")) * (dragPoint.x - a.attr("cx")) + (dragPoint.y - a.attr("cy")) * (dragPoint.y - a.attr("cy")) <=
			// 					// 	9) {
			// 					// 	return true;
			// 					// }
			// 				})[0];

			// 				dragPoint = newPoint;
			// 				if (oldAnchor) {
			// 					oldAnchor.circle.attr("cx", dragPoint.x);
			// 					oldAnchor.circle.attr("cy", dragPoint.y);
			// 					oldAnchor.id = dragPoint;
			// 				}
			// 				edge.points.splice(dragPointIndex, 1, dragPoint);
			// 			}
			// 			var path = "M" + edge.points[0].x + "," + edge.points[0].y;
			// 			for (var i = 1; i < edge.points.length; i++) {
			// 				path += "L" + edge.points[i].x + "," + edge.points[i].y;
			// 			}

			// 			$('#' + g.edge(d.v, d.w).customId).attr('d', path);

			// 			return;
			// 			translateEdge(g.edge(d.v, d.w), d3.event.dx, d3.event.dy);
			// 			$('#' + g.edge(d.v, d.w).customId).attr('d', calcPoints(d));
			// 		});

			// 	nodeDrag.call(svg.selectAll("g.node"));
			// 	nodeDrag.call(svg.selectAll("g.cluster"));
			// 	edgeDrag.call(svg.selectAll("g.edgePath"));

			// 	svg.selectAll('g.node').each(function(nodeId) {
			// 		var graphNode = parentGraph.node(nodeId);
			// 		graphNode.elem._dragmove = dragmove;
			// 		graphNode.fireNodeDrag = function() {
			// 			// nodeDrag.call(d3.select(graphNode).enter());
			// 			// nodeDrag.call(d3.select(graphNode)[0]);
			// 			// dragstart(nodeId);
			// 			d3.event = {
			// 				dx: 0,
			// 				dy: 0
			// 			};
			// 			graphNode.elem._dragmove(nodeId);

			// 			// $(d3.select(graphNode)[0][0].elem).trigger("drag");
			// 			// $("#nodeT3").trigger("drag");
			// 			// nodeDrag.call($(d3.select(graphNode)[0][0].elem));
			// 		};
			// 	});

			// 	function click(d) {
			// 		if (d.children) {
			// 			d._children = d.children;
			// 			d.children = null;
			// 		} else {
			// 			d.children = d._children;
			// 			d._children = null;
			// 		}
			// 	}

			// 	svg.selectAll("g.cluster").on("click", click);

			// },

			_createSubChart: function(task, taskGroup, translateX, translateY) {

				var chartSvg = taskGroup.append("svg");
				var mainControl = this;

				var inner = chartSvg.append("g").attr("transform", "translate(" + translateX + "," + translateY + ")");
				// var subGraph = this._initGraph();
				var subGraph = graph.initGraph();

				task.subtasks.forEach(function(subtask) {
					subGraph.setNode(subtask.id, {
						shape: "flowTask",
						label: subtask.name,
						customId: subtask.id,
						description: subtask.description,
						status: subtask.status,
						color: subtask.color,
						mainControl: mainControl,
						height: 50,
						width: 150,
						rx: 10,
						ry: 10,
						borderSize: 1,
						x: 11,
						y: 70
					});
				});

				task.innerRelationships.forEach(function(relationship) {
					subGraph.setEdge(relationship.from, relationship.to, {
						arrowhead: "normal",
						arrowheadStyle: "fill: #383838",
						//class: edgeclass,
						// lineInterpolate: 'bundle'
					});
				});

				subGraph.edges().forEach(function(e) {
					var edge = subGraph.edge(e.v, e.w);
					edge.customId = e.v + "-" + e.w;
					// edge.lineInterpolate = 'basis';
				});

				var render = this._subChartRenderer();
				render(inner, subGraph);
				// new dagreD3.render()(inner, subGraph);

				// var translateY = chartSvg[0][0].getBBox().height + chartSvg[0][0].getBBox().y;

				this._graph = {
					svg: chartSvg,
					inner: inner,
					g: subGraph
				};

				return this._graph;
			},

			// _initGraph: function() {
			// 	var graph = new dagreD3.graphlib.Graph({
			// 			compound: true
			// 		}).setGraph({})
			// 		.setDefaultEdgeLabel(function() {
			// 			return {};
			// 		});

			// 	graph.graph().rankdir = "LR";

			// 	return graph;
			// }
		});
	}
);