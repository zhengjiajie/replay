sap.ui.define(
	["sap/ui/core/Control", "sap/ui/thirdparty/d3", "ppmflow/lib/Graph"],
	function(Control, d3, graph) {
		return Control.extend("ppmflow.control.Milestone", {
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
						type: "int"
					},
					width: {
						type: "int"
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
				},
				events: {
					"hover": {}
				}
			},

			// the hover event handler, it is called when the Button is hovered - no event registration required
			onmouseover: function(evt) {
				this.fireHover();
			},

			setName: function(name) {
				this.setProperty("name", name, true);
				if (this._textArea) {
					this._textArea.text(name);
				}
			},

			setStatus: function(status) {
				this.setProperty("status", status, true);
				if (this._taskGroup) {
					if (this.getStatus() === "S") {
						var outerW = this.getWidth() + 2 * this.getBorderSize();
						var padding = this.getBorderSize() + 2;

						if (!this._textAreaStatus) {
							this._textAreaStatus = this._taskGroup.append("image");
						}
						this._textAreaStatus
							.attr("href", graph.getSplitIconPath())
							.attr("width", "16")
							.attr("height", "14")
							.attr("x", -8)
							.attr("y", padding);

					} else {
						if (this._textAreaStatus) {
							this._textAreaStatus.remove();
						}
					}
				}
			},

			init: function() {
				this._sContainerId = this.getId() + "--container";
				this.setAggregation("_html", new sap.ui.core.HTML({
					content: "<svg id='" + this._sContainerId + "' width='100%' height='100%' overflow='visible'></svg>"
				}));
			},

			renderer: function(oRm, oControl) {
				oRm.write("<g width='100%' height='100%'");
				oRm.writeControlData(oControl);
				oRm.write(">");
				oRm.write("</g>");
				oRm.renderControl(oControl.getAggregation("_html"));
			},

			exit: function() {

				var svg = d3.select("#" + this._sContainerId);

				if (svg) {
					svg.selectAll("*").remove();
				}

				// if (this._html) {
				// 	this._html.destroy();
				// 	delete this._html;
				// }
				// if (this._graph) {
				// 	// this._graph.destroy();
				// 	delete this._graph;
				// }
			},

			onAfterRendering: function(oRm, oControl) {

				// var w = (this.getWidth() * Math.SQRT2) / 2,
				// 	h = (this.getHeight() * Math.SQRT2) / 2,
				var w = this.getWidth(),
					h = this.getHeight(),
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
					}];

				var outerW = this.getWidth() + 2 * this.getBorderSize();
				var outerH = this.getHeight() + 2 * this.getBorderSize();

				this._taskGroup = d3.select("#" + this._sContainerId)
					.attr("width", outerW)
					.attr("height", outerH)
					.attr("viewBox", (-outerW / 2) + " " + (-outerH / 2) + " " + outerW + " " + outerH);

				var diamond = this._taskGroup.insert("polygon", ":first-child")
					.attr("points", points.map(function(p) {
						return p.x + "," + p.y;
					}).join(" "))
					.attr("x", this.getBorderSize())
					.attr("y", this.getBorderSize())
					.attr('class', 'ppmFlowTaskArea')
					// .attr("rx", this.getRx())
					// .attr("ry", this.getRy())
					// .attr("width", this.getWidth())
					// .attr("height", this.getHeight())
					.style("stroke-width", this.getBorderSize())
					.style("fill", this.getColor());

				this._textArea = this._taskGroup.append("text")
					.attr('class', 'taskName')
					// .attr("x", "50%")
					// .attr("y", "50%")
					.text(this.getName())
					// .attr("y", (outerH - 16) / 2 - 1)
					.attr("width", "100%")
					.attr("height", "100%").attr("id", this.getId() + "taskidLabel")
					// .attr("transform","translate()")
					.attr("style", "text-anchor:middle;");

				this._textArea.attr("transform", "translate(0 " + (13 / 3) + ")");

				if (this.getStatus() === "S") {
					var padding = -outerH / 2 + this.getBorderSize() + 5;

					this._taskGroup.append("image")
						.attr("href", graph.getSplitIconPath())
						.attr("width", "16")
						.attr("height", "14")
						.attr("x", -8)
						.attr("y", padding);
				}

				// var labelG = taskGroup.append("foreignObject")
				// 	.attr("y", (outerH - 16) / 2 - 1)
				// 	.attr("width", "100%")
				// 	.attr("height", "100%").attr("id", this.getId() + "taskidLabel")
				// 	.attr("style",
				// 		"text-align:center");

				// oLabel.placeAt(labelG.attr("id"));
			}
		});
	}
);