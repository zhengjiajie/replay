jQuery.sap.registerResourcePath('dagreD3', "https://cdnjs.cloudflare.com/ajax/libs/dagre-d3/0.4.17/dagre-d3.min");
sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("ppmflow.controller.projectFlow", {

		// onAfterRendering: function() {
		// 			this._oToolbar = sap.ui.xmlfragment("ppmflow.fragment.toolbar", this);
		// 			this.getView().addDependent(this._oToolbar);
		// 			var openByElement = $("#" + "__layout0");
		// 			jQuery.sap.delayedCall(0, this, function() {
		// 				if (this._oToolbar) {
		// 					this._oToolbar.openBy(openByElement);
		// 				}
		// 			});

		// },

		backend: null,

		handleContextMenuFiredByBackend: function(e) {
			var oGraph = this.byId('__flowChart0');
			oGraph.contextMenuFromBackend(e);
		},

		nodeDblClick: function(oEvent) {
			if (this.backend) {

				var param = {};
				param.id = oEvent.getParameters().task.customId;
				param.state = oEvent.getParameters().state;

				this.backend.nodeDblClick(param);
			}
		},

		queryState: function() {
			var oGraph = this.byId('__flowChart0');
			var flowState = oGraph.getState();
			if (this.backend) {
				this.backend.respondQueryState(flowState);
			}
		},

		deactivateToListType: function(deactivate) {
			if (deactivate) {
				return sap.m.ListType.Inactive;
			}
			return sap.m.ListType.Active;
		},

		toggleLegend: function(oEvent) {
			var oGraph = this.byId('__flowChart0');
			var showLegend = oEvent.getParameters().pressed;
			if (showLegend) {
				oGraph.showLegend();
			} else {
				oGraph.hideLegend();
			}
		},
		
		zoomin: function(oControl, svg, inner, upperContainerId, g, editmode, taskInFocus, setPostion, viewposX, viewposY, scale){
			// var oGraph = this.byId('__flowChart0');
			// oGraph.resizeBy("50%", "50%");
			// oGraph.resizeTo(30, 30);
					var parentGraph = g;
				var graphSVG = svg;
				
					// var zoom = d3.behavior.zoom().on("zoom", function() {
					// 	inner.attr("transform", "translate(" + d3.event.translate + ")" +
					// 		"scale(" + d3.event.scale + ")");
					// });
					// svg.call(zoom);

				// if (setPostion || taskInFocus) {
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
				// }	
			},	
		zoomout: function(oEvent){
			var svg = d3.select("body")
			  .append("svg")
			  .attr("width", "200%")
			  .attr("height", "200%")
			  .call(d3.behavior.zoom().on("zoom", function () {
			    // svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
			    svg.attr("transform", "translate(50)" + " scale(50)")
			  }))
			  .append("g")
			},	
		hideTooltip: function(oEvent) {
			if (this._oTooltip) {
				this._oTooltip.close();
				this._oTooltip = null;
			}
		},

		showTooltip: function(oEvent) {
			if (this._oContextMenu) {
				return;
			}
			var tooltipData = oEvent.getParameters().tooltipData;
			var openByElement = oEvent.getParameters().openByElement;

			if (tooltipData && openByElement) {
				// create tooltip
				if (!this._oTooltip) {
					this._oTooltip = sap.ui.xmlfragment("ppmflow.fragment.tooltip", this);
					this.getView().addDependent(this._oTooltip);

					this._oTooltip.setModel(new sap.ui.model.json.JSONModel(tooltipData));

					jQuery.sap.delayedCall(0, this, function() {
						if (this._oTooltip) {
							this._oTooltip.openBy(openByElement);
						}
					});
					// } else {
					// 	this._oTooltip.setOffsetX(tooltipData.positionX);
					// 	this._oTooltip.setOffsetY(tooltipData.positionY);
					// 	this._oTooltip.setModel(new sap.ui.model.json.JSONModel(tooltipData));
				}
			}
		},

		contextMenuClosed: function(oEvent) {
			if (this._oContextMenu) {
				this._oContextMenu = null;
			}
		},

		openContextMenu: function(oEvent) {
			var contextMenuData = oEvent.getParameters().contextMenuData;
			var openByElement = oEvent.getParameters().openByElement;

			if (contextMenuData && openByElement) {
				// create popover
				this._oContextMenu = sap.ui.xmlfragment("ppmflow.fragment.contextmenu", this);
				this.getView().addDependent(this._oContextMenu);

				this._oContextMenu.setModel(new sap.ui.model.json.JSONModel(contextMenuData));

				// this._oContextMenu.bindElement("/");
				// delay because addDependent will do a async rerendering and the actionSheet will immediately close without it.
				jQuery.sap.delayedCall(0, this, function() {
					this._oContextMenu.openBy(openByElement);
				});
			}
		}

	});

});