jQuery.sap.registerResourcePath('d3plus', "https://d3plus.org/js/d3plus");
sap.ui.define(
	["sap/ui/core/Control", "sap/ui/thirdparty/d3", "d3plus", "ppmflow/lib/Graph"],
	function(Control, d3, d3plus, graph) {
		return Control.extend("ppmflow.control.Task", {
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
						type: "Number"
					},
					width: {
						type: "Number"
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
					var outerW = this.getWidth() + 2 * this.getBorderSize();
					this._textArea.text(name);
					d3plus.textwrap()
						.container(this._textArea)
						.valign("middle")
						.align("middle")
						.padding(2)
						.width(outerW - 20)
						.draw();
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
							.attr("x", outerW - (16 + padding))
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

				// var oLabel = new sap.m.Label(this.getId() + "label");
				// oLabel.setText(this.getName());

				var outerW = this.getWidth() + 2 * this.getBorderSize();
				var outerH = this.getHeight() + 2 * this.getBorderSize();

				this._taskGroup = d3.select("#" + this._sContainerId)
					.attr("width", outerW)
					.attr("height", outerH);

				this._taskGroup.insert("rect", ":first-child")
					.attr("x", this.getBorderSize())
					.attr("y", this.getBorderSize())
					.attr("rx", this.getRx())
					.attr("ry", this.getRy())
					.attr("width", this.getWidth())
					.attr("height", this.getHeight())
					.attr('class', 'ppmFlowTaskArea')
					.style("stroke-width", this.getBorderSize())
					.style("fill", this.getColor());

				// var txt = taskGroup.append("text")
				// 	.attr("x", "50%")
				// 	.attr("y", "50%")
				// 	.text(this.getName())
				// 	// .attr("y", (outerH - 16) / 2 - 1)
				// 	.attr("width", "100%")
				// 	.attr("height", "100%").attr("id", this.getId() + "taskidLabel")
				// 	// .attr("transform","translate()")
				// 	.attr("class", "wrap")
				// 	.attr("style", "text-anchor:middle;");

				// txt.attr("transform", "translate(0 " + (txt[0][0].getBBox().height / 4) + ")");

				// var textContainer = taskGroup.append("svg")
				// 	.attr("id",this._sContainerId+"testetsetstestetse")
				// 	.attr("width", outerW-20)
				// 	.attr("height", outerH);

				this._textArea = this._taskGroup.append("text")
					.attr('class', 'taskName')
					.text(this.getName());
				d3plus.textwrap()
					.container(this._textArea)
					.valign("middle")
					.align("middle")
					.padding(2)
					.width(outerW - 20)
					// .config({
					// 	"width": outerW,
					// 	"height": outerH
					// 	// "resize": true
					// })
					.draw();

				if (this.getStatus() === "S") {
					var padding = this.getBorderSize() + 2;

					this._textAreaStatus = this._taskGroup.append("image")
						.attr("href", graph.getSplitIconPath())
						.attr("width", "16")
						.attr("height", "14")
						.attr("x", outerW - (16 + padding))
						.attr("y", padding);
				}

				// txt
				// .attr("x", "50%")
				// .attr("y", "50%")
				// // .text(this.getName())
				// // .attr("y", (outerH - 16) / 2 - 1)
				// .attr("width", "100%")
				// .attr("height", "100%").attr("id", this.getId() + "taskidLabel")
				// // .attr("transform","translate()")
				// .attr("class", "wrap")
				// .attr("style", "text-anchor:middle;");

				// txt.attr("transform", "translate(0 " + (txt[0][0].getBBox().height / 4) + ")");

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