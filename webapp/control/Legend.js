sap.ui.define(
	["sap/ui/core/Control", "sap/ui/thirdparty/d3"],
	function(Control, d3) {
		return Control.extend("ppmflow.control.Task", {
			metadata: {
				aggregations: {
					_html: {
						type: "sap.ui.core.HTML",
						multiple: false,
						visibility: "hidden"
					}
				}
			},

			init: function() {
				this._sContainerId = this.getId() + "--legend";
				this.setAggregation("_html", new sap.ui.core.HTML({
					content: "<svg id='" + this._sContainerId + "'></svg>"
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
			},

			onAfterRendering: function(oRm, oControl) {
				this._legendOuterContainer = d3.select("#" + this._sContainerId);
				this._legendOuterContainer.insert("image", ":first-child")
					.attr("href", this._getLegendImagePath())
					.attr("width", "436")
					.attr("height", "189");
			},

			_getLegendImagePath: function() {
				var root = this._getRoot();
				if (root.substr(root.length - 1) === "/") {
					root = root.substr(0, root.length - 1);
				}
				return root + "/img/flowLegend.gif";
			},

			_getRoot: function() {
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

		});
	}
);