jQuery.sap.registerResourcePath('dagreD3', "https://cdnjs.cloudflare.com/ajax/libs/dagre-d3/0.4.17/dagre-d3.min");
sap.ui.define(
	["sap/ui/core/Control", "ppmflow/control/Task", "ppmflow/control/Milestone", "ppmflow/control/MainTask", "ppmflow/control/Legend", "sap/ui/thirdparty/d3",
		"dagreD3", "ppmflow/lib/Graph", "ppmflow/thirdparty/svg4everybody"
	],
	function(Control, Task, Milestone, MainTask, Legend, d3, dagreD3, graph) {
		return Control.extend("ppmflow.control.FlowChart", {
			_graph: null,
			metadata: {
				properties: {
					data: {
						type: "object"
					},
					isProjectFlow: {
						type: "boolean",
						defaultValue: false
					}
				},
				events: {
					"nodeDblClick": {},
					"contextMenu": {},
					"showTooltip": {},
					"hideTooltip": {}
				},
				aggregations: {
					_html: {
						type: "sap.ui.core.HTML",
						multiple: false,
						visibility: "hidden"
					},
					_icons: {
						type: "sap.ui.core.HTML",
						multiple: false,
						visibility: "hidden"
					}
				}
			},

			init: function() {
				svg4everybody();
				this._sContainerId = this.getId() + "--container";
				this.setAggregation("_html", new sap.ui.core.HTML({
					content: "<svg class='flowCanvas' width='100%' height='100%' id='" + this._sContainerId + "'></svg>"
				}));
				this.setAggregation("_icons", new sap.ui.core.HTML({
					content: "<svg style='display:none;'>" +
						"   <defs>" +
						"		<symbol id='icon-uniE1DA' viewBox='0 0 500 500'>" +
						"			<title>uniE1DA</title>" +
						"			<path d='M15 8v7h-7v2h7v7h2v-7h7v-2h-7v-7h-2zM28 2h-16v2h16v24h-24v-8h-2v8q0 0.813 0.563 1.406t1.438 0.594h24q0.813 0 1.406-0.594t0.594-1.406v-24q0-0.875-0.594-1.438t-1.406-0.563zM0.438 1.75q-0.75-0.688 0-1.438 0.313-0.313 0.688-0.313t0.688 0.313l5.75 6.188q0.563 0.625 0.563 1.438t-0.563 1.375l-5.75 6.313q-0.313 0.313-0.719 0.313t-0.719-0.313-0.313-0.719 0.313-0.719l5.438-5.938q0.375-0.313 0-0.688z'></path>" +
						"		</symbol>" +
						"		<symbol id='icon-uniE1D9' viewBox='0 0 500 500'>" +
						"			<title>uniE1D9</title>" +
						"			<path d='M8 17h16v-2h-16v2zM28 2h-8v2h8v24h-24v-16h-2v16q0 0.875 0.563 1.438t1.438 0.563h24q0.813 0 1.406-0.563t0.594-1.438v-24q0-0.813-0.594-1.406t-1.406-0.594zM14.188 2.375q0.688-0.75 1.438 0 0.313 0.313 0.313 0.688t-0.313 0.688l-6.188 5.75q-0.625 0.563-1.438 0.563t-1.375-0.563l-6.313-5.75q-0.313-0.313-0.313-0.719t0.313-0.719 0.719-0.313 0.719 0.313l5.938 5.438q0.313 0.375 0.688 0z'></path>" +
						"		</symbol>" +
						"	</defs>" +
						"</svg>"
				}));
			},

			renderer: function(oRm, oControl) {
				oRm.write("<div");
				oRm.writeControlData(oControl);
				oRm.addClass("ppmFlowChart");
				oRm.writeClasses();
				oRm.write(">");
				oRm.renderControl(oControl.getAggregation("_icons"));
				oRm.renderControl(oControl.getAggregation("_html"));
				oRm.write("</div>");
			},

			onAfterRendering: function() {

				var oModel = this.getData();

				if (!(oModel && oModel.tasks && oModel.relationships)) return;

				if (oModel.update && this._graph) {
					this._updateChart(oModel);
				} else {

					this.getAggregation("_html").findElements().forEach(function(element) {
						element.destroy();
					});

					this._createChart(oModel);
					this._setLayout(oModel);

					if (!this.getIsProjectFlow()) {
						if (oModel.editmode) {
							this._displayAnchors();
						}
					}
				}
			},

			exit: function() {

				var svg = d3.select("#" + this._sContainerId);

				// if (this._elements) {
				// 	this.elements.destroy();
				// 	delete this.elements;
				// }

				// if (this._html) {
				// 	this._html.destroy();
				// 	delete this._html;
				// }
				if (this._graph) {
					// this._graph.destroy();
					// var parentGraph = this._graph;

					// svg.selectAll('g.node').each(function(nodeId) {
					// 	// var graphNode = parentGraph.node(nodeId);
					// 	// graphNode.destroy();
					// 	// sap.ui.getCore().byId(nodeId).exit();
					// 	if(jQuery($("#"+nodeId)).control()[0].exit){
					// 	jQuery($("#"+nodeId)).control()[0].exit();
					// 	delete jQuery($("#"+nodeId)).control()[0];
					// 	}
					// 	parentGraph.removeNode(nodeId);
					// 	// this.remove();
					// });
					delete this._graph;
				}

				if (svg) {
					svg.selectAll("*").remove();
				}

			},

			getLayout: function() {

				var svg = d3.select("#" + this._sContainerId);

				var parentGraph = this._graph;
				var layout = {
					nodes: [],
					edges: [],
					viewposX: "0",
					viewposY: "0",
					scale: "0",
					nodeStates: []
				};

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
						if (oControl.getMetadata().getName() === "ppmflow.control.MainTask") {
							nodeLayout.subnodeslayout = oControl.getLayout();
						} else {
							nodeLayout.subnodeslayout = {
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
					}
				});

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
						edgeLayout.id = graphEdge.customId;
						edgeLayout.from = edgePath.v;
						edgeLayout.to = edgePath.w;
						edgeLayout.points = graphEdge.points;
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

				var state = this.getState();
				layout.viewposX = state.viewposX;
				layout.viewposY = state.viewposY;
				layout.scale = state.scale;
				layout.nodeStates = state.nodeStates;

				return layout;
			},
			
			showLegend: function(){
				var svg = d3.select("#" + this._sContainerId);
					
				this._legendContainer = svg.append("g")
					.attr("transform", "translate(10,10)");
					
				var legend = new Legend();
				legend.placeAt(this._legendContainer[0][0]);
			},

		
			
			hideLegend: function(){
				if(this._legendContainer){
					this._legendContainer.remove();
				}
			},

			_createChart: function(oModel) {

				var svg = d3.select("#" + this._sContainerId);
				var inner = svg.append("g").attr("transform", "translate(0,1)");

				// this._graph = this._initGraph();
				this._graph = graph.initGraph();

				var parentGraph = this._graph;
				var flowControl = this;
				var subCharts = [];

				var editmode = oModel.editmode;
				oModel.tasks.forEach(function(task) {
					if (task.isMainTask && task.isMainTask === "X") {
						// var subChart = flowControl._createSubChart(task);

						parentGraph.setNode(task.id, {
							shape: "flowMainTask",
							label: task.name,
							description: task.description,
							status: task.status,
							customId: task.id,
							height: 50,
							width: 150,
							task: task,
							rx: 10,
							ry: 10,
							borderSize: 1,
							editmode: editmode,
							flowControl: flowControl,
							isProjectFlow: flowControl.getIsProjectFlow(),
							color: task.color
						});
						// flowControl._flowChartRenderer()(subChart.inner, subChart.g);

						// subCharts.push(subChart);

					} else {
						parentGraph.setNode(task.id, {
							shape: "flowTask",
							label: task.name,
							description: task.description,
							status: task.status,
							customId: task.id,
							height: 50,
							width: 150,
							rx: 10,
							ry: 10,
							borderSize: 1,
							editmode: editmode,
							flowControl: flowControl,
							isProjectFlow: flowControl.getIsProjectFlow(),
							color: task.color
						});
					}
				});

				// oModel.tasks.forEach(function(task) {
				// 	if (!task.isMainTask) {
				// 		parentGraph.setNode(task.id, {
				// 			shape: "flowTask",
				// 			label: task.name,
				// 			customId: task.id,
				// 			height: 50,
				// 			width: 150,
				// 			rx: 10,
				// 			ry: 10,
				// 			borderSize: 1
				// 		});
				// 	}
				// });

				oModel.milestones.forEach(function(milestone) {
					parentGraph.setNode(milestone.id, {
						shape: "flowMilestone",
						label: milestone.name,
						description: milestone.description,
						status: milestone.status,
						customId: milestone.id,
						height: 70,
						width: 84,
						rx: 10,
						ry: 10,
						borderSize: 1,
						editmode: editmode,
						flowControl: flowControl,
						isProjectFlow: flowControl.getIsProjectFlow(),
						color: milestone.color
					});
				});

				oModel.relationships.forEach(function(relationship) {
					parentGraph.setEdge(relationship.from, relationship.to, {
						arrowhead: "normal",
						arrowheadStyle: "fill: #383838",
						//class: edgeclass,
						// lineInterpolate: 'bundle'
					});
				});

				parentGraph.edges().forEach(function(e) {
					var edge = parentGraph.edge(e.v, e.w);
					edge.customId = e.v + "-" + e.w;
					// edge.lineInterpolate = 'basis';
				});

				subCharts.forEach(function(subChart) {
					flowControl._flowChartRenderer()(subChart.inner, subChart.g);

				});

				var render = this._flowChartRenderer();
				render(inner, parentGraph);

				svg.select("#ppmflowTempGroup").remove();

				// this._customizeGraph(svg, inner, parentGraph, oModel.editmode);

				if (oModel.layout && oModel.layout[0].centerTask) {
					graph.customizeGraph(this, svg, inner, oModel.flowUpperContainerId, parentGraph, oModel.editmode, oModel.layout[0].taskInFocus,
						false);
				} else if (oModel.layout) {
					graph.customizeGraph(this, svg, inner, oModel.flowUpperContainerId, parentGraph, oModel.editmode, oModel.layout[0].taskInFocus,
						true, oModel.layout[0].viewposX,
						oModel.layout[0].viewposY, oModel.layout[0].scale);
				} else {
					graph.customizeGraph(this, svg, inner, oModel.flowUpperContainerId, parentGraph, oModel.editmode, null, true, 1, 0, 1);
				}

				// var containerHeight = svg[0][0].getBBox().height + svg[0][0].getBBox().y + 1;
				// var availableHeight = $(svg[0][0]).closest(".ppmFlowContainer")[0].clientHeight;

				// if (containerHeight < availableHeight) {
				// 	containerHeight = availableHeight;
				// }

				var containerHeight = 2000;

				$(svg[0][0]).parentsUntil(".ppmFlowContainer").css("height", containerHeight);
				$(svg[0][0]).parentsUntil(".ppmFlowContainer").css("width", "100%");
			},

			_setLayout: function(oModel) {
				var oControl = this;
				var parentGraph = this._graph;
				var svg = d3.select("#" + this._sContainerId);
				var inner = svg[0][0].firstChild;

				if (oModel.layout[0]) {
					if (oModel.layout[0].nodes) {
						oModel.layout[0].nodes.forEach(function(nodeLayout) {
							var node = parentGraph.node(nodeLayout.id);
							if (node) {
								node.x = +nodeLayout.x;
								node.y = +nodeLayout.y;
								$("#node" + nodeLayout.id).attr("transform", "translate(" + node.x + "," + node.y + ")");
								graph.recalculateEdgesForNode(oControl, svg, inner, parentGraph, nodeLayout.id);
								if (nodeLayout.subnodeslayout && node.task) {
									node.task.layout = nodeLayout.subnodeslayout;
								}
							}
						});
					}

					if (oModel.layout[0].edges) {
						oModel.layout[0].edges.forEach(function(edgeLayout) {
							var edge = parentGraph.edge(edgeLayout.from, edgeLayout.to);
							if (edge) {
								edge.points = edgeLayout.points;

								var path = "M" + edge.points[0].x + "," + edge.points[0].y;
								for (var i = 1; i < edge.points.length; i++) {
									path += "L" + edge.points[i].x + "," + edge.points[i].y;
								}

								$("#" + edgeLayout.id).attr("d", path);
							}
						});
					}

					if (oModel.layout[0].nodeStates) {
						oModel.layout[0].nodeStates.forEach(function(nodeState) {
							var node = parentGraph.node(nodeState.id);
							if (node) {
								if (nodeState.state && node.task) {
									node.task.state = nodeState.state;
								}
							}
						});
					}
				}
			},

			_updateChart: function(oModel) {

				var parentGraph = this._graph;
				var svg = d3.select("#" + this._sContainerId);

				if (oModel.tasks) {
					oModel.tasks.forEach(function(flowNode) {
						var node = parentGraph.node(flowNode.id);
						if (node) {

							var controlId;
							if (node.elem.childNodes[1] && node.elem.childNodes[1].firstChild) {
								controlId = node.elem.childNodes[1].firstChild.id;
							}

							if (controlId) {
								var oControl = sap.ui.getCore().byId(controlId);
								node.label = flowNode.name;
								node.color = flowNode.color;
								node.status = flowNode.status;
								oControl.setName(node.label);
								oControl.setColor(node.color);
								oControl.setStatus(node.status);
								// switch (oControl.getMetadata().getName()) {
								// 	case "ppmflow.control.MainTask":
								// 		oControl.setName(node.label);
								// 		break;
								// 	case "ppmflow.control.Task":
								// 		oControl.setName(node.label);
								// 		break;
								// 	default:

								// }
								if (node.task) {
									node.task = flowNode;
									oControl.setTask(flowNode);
								}
							}
						}
					});
				}

				if (oModel.milestones) {
					oModel.milestones.forEach(function(flowMilestone) {
						var node = parentGraph.node(flowMilestone.id);
						if (node) {

							var controlId;
							if (node.elem.childNodes[1] && node.elem.childNodes[1].firstChild) {
								controlId = node.elem.childNodes[1].firstChild.id;
							}

							if (controlId) {
								var oControl = sap.ui.getCore().byId(controlId);
								node.label = flowMilestone.name;
								node.color = flowMilestone.color;
								node.status = flowMilestone.status;
								oControl.setName(node.label);
								oControl.setColor(node.color);
								oControl.setStatus(node.status);
								// switch (oControl.getMetadata().getName()) {
								// 	case "ppmflow.control.Milestone":
								// 		oControl.setName(node.label);
								// 		break;
								// 	default:

								// }
								// if (node.task) {

								// }
							}
						}
					});
				}

				var containerHeight = 2000;

				$(svg[0][0]).parentsUntil(".ppmFlowContainer").css("height", containerHeight);
				$(svg[0][0]).parentsUntil(".ppmFlowContainer").css("width", "100%");
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
			// },

			getState: function() {

				var svg = d3.select("#" + this._sContainerId);
				var parentGraph = this._graph;
				var pan = d3.select("#" + this._sContainerId)[0][0].firstChild.transform;
				var state = {
					viewposX: "0",
					viewposY: "0",
					scale: "0",
					nodeStates: []
				};

				if (pan) {
					state.viewposX = pan.baseVal.getItem(0).matrix.e.toString();
					state.viewposY = pan.baseVal.getItem(0).matrix.f.toString();
					if (pan.baseVal.getItem(1)) {
						state.scale = pan.baseVal.getItem(1).matrix.a.toString();
					} else {
						state.scale = "1";
					}
				}

				svg.selectAll('g.node').each(function(nodeId) {
					var nodeState = {
						id: "",
						state: ""
					};
					var graphNode = parentGraph.node(nodeId);
					if (graphNode) {
						var oControl = sap.ui.getCore().byId(graphNode.elem.childNodes[1].firstChild.id);
						nodeState.id = nodeId;
						if (oControl.getMetadata().getName() === "ppmflow.control.MainTask") {
							nodeState.state = oControl.getState();
							state.nodeStates.push(nodeState);
						}
					}
				});

				if (state.nodeStates.length === 0) {
					state.nodeStates.push({
						id: "",
						state: ""
					});
				}

				return state;
			},

			contextMenuFromBackend: function(e) {
				var elem = e.srcElement;

				while (elem && elem.id.substr(0, 4) !== "node") {
					elem = elem.parentNode;
				}
				if (!elem) {
					return;
				}

				var parentGraph = this._graph;
				var graphNode = parentGraph.node(elem.id.substr(4));
				if (graphNode) {
					e.cancelBubble = true;
					this.nodeClick(graphNode, e);
				} else {
					// probably a subtask
					var mainTaskElem = elem.parentNode;
					while (mainTaskElem && mainTaskElem.id.substr(0, 4) !== "node") {
						mainTaskElem = mainTaskElem.parentNode;
					}
					if (!mainTaskElem) {
						return;
					}

					graphNode = parentGraph.node(mainTaskElem.id.substr(4));
					if (graphNode) {
						var oControl = sap.ui.getCore().byId(graphNode.elem.childNodes[1].firstChild.id);
						if (oControl.getMetadata().getName() === "ppmflow.control.MainTask") {
							var innerGraph = oControl.getGraph();
							var subtaskId = elem.id.substr(4);
							var graphSubNode = innerGraph.node(subtaskId);

							if (!graphSubNode) {
								return;
							}

							var taskData = graphNode.task.subtasks.filter(function(flowSubTask) {
								return flowSubTask.id === subtaskId;
							})[0];

							if (!taskData) {
								return;
							}

							e.cancelBubble = true;
							this.nodeClick(graphSubNode, e, taskData);
						}
					}
				}
			},

			nodeDblClick: function(task) {
				var param = {};
				param.task = task;
				param.state = this.getState();

				d3.event.stopPropagation();
				this.fireNodeDblClick(param);
			},

			nodeHoverOut: function(task) {
				this.highlightOff(task);
				this.fireHideTooltip();
			},

			nodeHover: function(task) {

				var browserEvent = d3.event;
				browserEvent.preventDefault();
				browserEvent.cancelBubble = true;
				this.highlightOn(task);

				var tooltipData = {};
				tooltipData.positionX = 0;
				tooltipData.positionY = 0;
				tooltipData.text = task.description;

				if (!tooltipData.text) {
					return;
				}

				var oMark = $("#" + task.elem.id);

				var param = {};
				param.tooltipData = tooltipData;
				param.openByElement = oMark;

				this.fireShowTooltip(param);
			},

			_getBorderShape: function(task) {
				var shapes;
				switch (task.shape) {
					case "flowMilestone":
						shapes = task.elem.getElementsByTagName("polygon");
						break;
					case "flowMainTask":
						shapes = task.elem.getElementsByTagName("rect");
						break;
					default:
						shapes = task.elem.getElementsByTagName("rect");
				}

				if (!(shapes && shapes[1])) {
					return null;
				} else {
					return shapes[1];
				}
			},

			_getRelatedEdgeElements: function(task) {
				var edges = [];
				var parentGraph = this._graph;
				var taskId = task.customId;

				if (task.mainControl) {
					parentGraph = task.mainControl.getGraph();
				}

				parentGraph.edges().forEach(function(e) {
					if (e.v === taskId || e.w === taskId) {
						var edge = parentGraph.edge(e.v, e.w);
						if (edge) {
							edges.push(edge);
						}
					}
				});

				return edges;
			},

			_getUnconnectedEdges: function(task) {
				var edges = [];
				var parentGraph = this._graph;
				var taskId = task.customId;

				if (task.mainControl) {
					parentGraph.edges().forEach(function(e) {
						var edge = parentGraph.edge(e.v, e.w);
						if (edge) {
							edges.push(edge);
						}
					});
					parentGraph = task.mainControl.getGraph();
				}

				parentGraph.edges().forEach(function(e) {
					if (e.v !== taskId && e.w !== taskId) {
						var edge = parentGraph.edge(e.v, e.w);
						if (edge) {
							edges.push(edge);
						}
					}
				});
				return edges;
			},

			_getConnectedNodeIds: function(task) {
				var nodeIds = [];
				var parentGraph = this._graph;
				var taskId = task.customId;

				if (task.mainControl) {
					parentGraph = task.mainControl.getGraph();
				}

				nodeIds.push(taskId);
				parentGraph.edges().forEach(function(e) {
					if (e.v === taskId) {
						nodeIds.push(e.w);
					}
					if (e.w === taskId) {
						nodeIds.push(e.v);
					}
				});

				return nodeIds;
			},

			_getUnconnectedNodes: function(task) {
				var nodes = [];
				var parentGraph = this._graph;
				var connectedNodeIds = this._getConnectedNodeIds(task);

				if (task.mainControl) {
					var mainTaskId = task.mainControl.getParentNode().customId;
					parentGraph.nodes().forEach(function(nodeId) {
						if (nodeId !== mainTaskId) {
							var node = parentGraph.node(nodeId);
							if (node) {
								nodes.push(node);
							}
						}
					});
					parentGraph = task.mainControl.getGraph();
				}

				parentGraph.nodes().forEach(function(nodeId) {
					if (connectedNodeIds.indexOf(nodeId) === -1) {
						var node = parentGraph.node(nodeId);
						if (node) {
							nodes.push(node);
						}
					}
				});
				return nodes;
			},

			highlightOff: function(task) {

				var borderShape = this._getBorderShape(task);
				if (borderShape) {
					borderShape.style.strokeWidth = "1";
				}

				var unconnectedNodes = this._getUnconnectedNodes(task);
				unconnectedNodes.forEach(function(node) {
					node.elem.style.opacity = "1";
				});

				var unconnectedEdges = this._getUnconnectedEdges(task);
				unconnectedEdges.forEach(function(edge) {
					edge.elem.style.opacity = "1";
				});
			},

			highlightOn: function(task) {

				var borderShape = this._getBorderShape(task);
				if (borderShape) {
					borderShape.style.strokeWidth = "2";
				}

				var unconnectedNodes = this._getUnconnectedNodes(task);
				unconnectedNodes.forEach(function(node) {
					node.elem.style.opacity = "0.1";
				});

				var unconnectedEdges = this._getUnconnectedEdges(task);
				unconnectedEdges.forEach(function(edge) {
					edge.elem.style.opacity = "0.1";
				});
			},

			onSubNodeHoverOut: function(event) {
				var subTask = event.getParameters();
				var flowControl = subTask.mainControl.getParentNode().flowControl;
				flowControl.nodeHoverOut(subTask);
			},

			onSubNodeHover: function(event) {
				var subTask = event.getParameters();
				var flowControl = subTask.mainControl.getParentNode().flowControl;
				flowControl.nodeHover(subTask);
			},

			nodeClick: function(task, e, taskData) {

				var browserEvent = e;
				if (!browserEvent) {
					browserEvent = d3.event;
				}
				browserEvent.preventDefault();
				browserEvent.cancelBubble = true;

				// var parentGraph = this._graph;
				// var graphNode = parentGraph.node(task.customId);
				var flowData = this.getData();

				// var point = task.elem.ownerSVGElement.createSVGPoint();
				// var point2 = task.elem.ownerSVGElement.createSVGPoint();
				var ctm = task.elem.getScreenCTM();

				var offsetX = browserEvent.x - (ctm.e + (task.width / 2) * ctm.a);
				var offsetY = browserEvent.y - ctm.f;

				if (!taskData) {
					switch (task.shape) {
						case "flowMilestone":
							taskData = flowData.milestones.filter(function(flowMilestone) {
								return flowMilestone.id === task.customId;
							})[0];
							break;
						case "flowMainTask":
							break;
						default:
							taskData = flowData.tasks.filter(function(flowTask) {
								return flowTask.id === task.customId;
							})[0];
					}
				}

				if (taskData && taskData.commands && taskData.commands.length > 0) {
					var contextMenuData = {};

					contextMenuData.commands = taskData.commands;
					contextMenuData.commands.forEach(function(command) {
						var description = flowData.commands.filter(function(commandDescription) {
							return commandDescription.name === command.name;
						})[0];

						if (description) {
							command.description = description.text;
						} else {
							command.description = command.name;
						}
					});
					contextMenuData.positionX = Math.round(offsetX);
					contextMenuData.positionY = Math.round(offsetY);

					var oMark = $("#" + task.elem.id);

					var param = {};
					param.contextMenuData = contextMenuData;
					param.openByElement = oMark;

					this.fireContextMenu(param);
				}
			},

			stopPropagation: function() {
				d3.event.stopPropagation();
			},

			onSubNodeDblClick: function(event) {
				var subTask = event.getParameters();
				var flowControl = subTask.mainControl.getParentNode().flowControl;
				var param = {};
				param.task = subTask;
				param.state = flowControl.getState();

				d3.event.stopPropagation();
				event.preventDefault();
				flowControl.fireNodeDblClick(param);
			},

			onSubNodeClick: function(event) {
				var subTask = event.getParameters();
				var flowControl = subTask.mainControl.getParentNode().flowControl;
				var mainTaskId = subTask.mainControl.getTask().id;
				var flowData = flowControl.getData();

				if (!mainTaskId) {
					return;
				}

				var mainTaskData = flowData.tasks.filter(function(flowTask) {
					return flowTask.id === mainTaskId;
				})[0];

				if (!mainTaskData) {
					return;
				}

				var taskData = mainTaskData.subtasks.filter(function(flowSubTask) {
					return flowSubTask.id === subTask.customId;
				})[0];

				if (!taskData) {
					return;
				}

				flowControl.nodeClick(subTask, d3.event, taskData);
				// var param = {};
				// param.task = subTask;
				// flowControl.fireContextMenu(param);
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

			_displayAnchors: function() {
				var g = this._graph;
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

			// _customizeGraph: function(svg, inner, g, editmode) {

			// 	var parentGraph = this._graph;
			// 	var graphSVG = svg;
			// 	var oControl = this;

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
			// 	// Set up zoom support
			// 	var zoom = d3.behavior.zoom().on("zoom", function() {
			// 		inner.attr("transform", "translate(" + d3.event.translate + ")" +
			// 			"scale(" + d3.event.scale + ")");
			// 	});
			// 	svg.call(zoom);

			// 	// Center the graph
			// 	var initialScale = 1.0;
			// 	zoom.translate([(svg[0][0].width.baseVal.valueInSpecifiedUnits * initialScale) / 2, 20])
			// 		.scale(initialScale)
			// 		.event(svg);

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

			// 	// svg.selectAll("g.edgePath")

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

			_flowChartRenderer: function() {
				var render = new dagreD3.render();
				render.shapes().flowTask = this._flowTaskRenderer;
				render.shapes().flowMainTask = this._flowMainTaskRenderer;
				render.shapes().flowMilestone = this._flowMilestoneRenderer;
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
					editmode: node.editmode,
					isProjectFlow: node.isProjectFlow,
					color: node.color,
					status: node.status,
					actions: [{
						id: "addpopop",
						text: "action1",
						description: "first action"
					}]
				});

				if (node.isProjectFlow) {
					parent.on("dblclick", node.flowControl.stopPropagation);
					parent.on("click", node.flowControl.stopPropagation);
					var cc = graph.clickcancel();
					parent.call(cc);
					cc.on("dblclick", function(oNode) {
						return function() {
							oNode.flowControl.nodeDblClick(oNode);
						};
					}(node));
					parent.on("contextmenu", function(oNode) {
						return function() {
							oNode.flowControl.nodeClick(oNode);
						};
					}(node));
				}
				parent.on("mouseover", function(oNode) {
					return function() {
						oNode.flowControl.nodeHover(oNode);
					};
				}(node));
				parent.on("mouseout", function(oNode) {
					return function() {
						oNode.flowControl.nodeHoverOut(oNode);
					};
				}(node));

				task.placeAt(customShape[0][0]);

				// keep same logic as standard rectangle shape
				node.intersect = function(point) {
					return dagreD3.intersect.rect(node, point);
				};

				return shapeSvg;
			},

			_flowMainTaskRenderer: function(parent, bbox, node) {

				var h = 50;
				var w = 150;
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
				var task = new MainTask({
					taskId: node.customId,
					taskGuid: node.customId,
					name: node.label,
					description: "First Task",
					rx: rx,
					ry: ry,
					borderSize: borderSize,
					editmode: node.editmode,
					isProjectFlow: node.isProjectFlow,
					nodeDblClick: node.flowControl.onSubNodeDblClick,
					nodeClick: node.flowControl.onSubNodeClick,
					showTooltip: node.flowControl.onSubNodeHover,
					hideTooltip: node.flowControl.onSubNodeHoverOut,
					color: node.color,
					status: node.status,
					actions: [{
						id: "addpopop",
						text: "action1",
						description: "first action"
					}],
					task: node.task,
					parentNode: node
				});

				// task.attachEvent("onNodeDblClick", node.flowControl.nodeDblClick);

				// if (node.isProjectFlow) {
				// 	parent.on("dblclick", node.flowControl.stopPropagation);
				// 	parent.on("click", node.flowControl.stopPropagation);
				// 	var cc = graph.clickcancel();
				// 	parent.call(cc);
				// 	cc.on("dblclick", function(oNode) {
				// 		return function() {
				// 			oNode.flowControl.nodeDblClick(oNode);
				// 		};
				// 	}(node));
				// 	cc.on("click", function(oNode) {
				// 		return function() {
				// 			oNode.flowControl.nodeClick(oNode);
				// 		};
				// 	}(node));
				// }

				task.placeAt(customShape[0][0]);

				// if (node.isProjectFlow) {
				parent.on("mouseover", function(oNode) {
					return function() {
						oNode.flowControl.nodeHover(oNode);
					};
				}(node));
				parent.on("mouseout", function(oNode) {
					return function() {
						oNode.flowControl.nodeHoverOut(oNode);
					};
				}(node));
				// }

				// h = task.getHeight();
				// w = task.getWidth();

				// shapeSvg
				// 	.attr("x", -(w / 2 - 2 + borderSize / 2))
				// 	.attr("y", -(h / 2 + borderSize))
				// 	.attr("width", w)
				// 	.attr("height", h);

				// customShape
				// 	.attr("width", w)
				// 	.attr("height", h)
				// 	.attr("transform", "translate(" + -(w / 2 - 2 + borderSize / 2) + "," + -(h / 2 + borderSize) + ")");

				// keep same logic as standard rectangle shape
				node.intersect = function(point) {
					return dagreD3.intersect.rect(node, point);
				};

				return shapeSvg;
			},

			_flowMilestoneRenderer: function(parent, bbox, node) {

				// var h = node.height;
				// var w = node.width;
				var rx = node.rx;
				var ry = node.ry;
				var borderSize = node.borderSize;

				// make sure element is empty
				parent.selectAll("*").remove();

				var w = node.width,
					h = node.height,
					points = [{
						x: 0,
						y: -h / 2
					}, {
						x: -w / 2,
						y: 0
					}, {
						x: 0,
						y: h / 2
					}, {
						x: w / 2,
						y: 0
					}],
					shapeSvg = parent.insert("polygon", ":first-child")
					.attr("points", points.map(function(p) {
						return p.x + "," + p.y;
					}).join(" "))
					.style("opacity", 0);

				// // insert standard rectangle shape and hide it
				// var shapeSvg = parent.insert("rect", ":first-child")
				// 	.attr("rx", rx)
				// 	.attr("ry", ry)
				// 	.attr("x", -(w / 2 - 2 + borderSize / 2))
				// 	.attr("y", -(h / 2 + borderSize))
				// 	.attr("width", w)
				// 	.attr("height", h)
				// 	.style("opacity", 0);

				// add custom shape container
				var customShape = parent.append("g")
					.attr("width", w)
					.attr("height", h)
					// .attr("transform", "translate(" + -(w / 2 - 2 + borderSize / 2) + "," + -(h / 2 + borderSize) + ")")
					.attr("transform", "translate(" + -(w / 2 - 2 + borderSize / 2) + "," + -(h / 2 + borderSize) + ")")
					// .append("g")
					// .attr("xmlns","http://www.w3.org/2000/svg")
					// .attr("width", w)
					// .attr("height", h)
				;

				// build custom shape and insert it in container
				var milestone = new Milestone({
					taskId: node.customId,
					taskGuid: node.customId,
					name: node.label,
					description: "First Task",
					height: h,
					width: w,
					rx: rx,
					ry: ry,
					borderSize: borderSize,
					editmode: node.editmode,
					isProjectFlow: node.isProjectFlow,
					color: node.color,
					status: node.status,
					actions: [{
						id: "addpopop",
						text: "action1",
						description: "first action"
					}]
				});

				if (node.isProjectFlow) {
					parent.on("dblclick", node.flowControl.stopPropagation);
					parent.on("click", node.flowControl.stopPropagation);
					var cc = graph.clickcancel();
					parent.call(cc);
					cc.on("dblclick", function(oNode) {
						return function() {
							oNode.flowControl.nodeDblClick(oNode);
						};
					}(node));
					cc.on("click", function(oNode) {
						return function() {
							oNode.flowControl.nodeClick(oNode);
						};
					}(node));
				}
				parent.on("mouseover", function(oNode) {
					return function() {
						oNode.flowControl.nodeHover(oNode);
					};
				}(node));
				parent.on("mouseout", function(oNode) {
					return function() {
						oNode.flowControl.nodeHoverOut(oNode);
					};
				}(node));

				milestone.placeAt(customShape[0][0]);

				node.intersect = function(p) {
					return dagreD3.intersect.polygon(node, points, p);
				};

				return shapeSvg;
			},

			draw: function(oModel) {

			}
		});
	}
);