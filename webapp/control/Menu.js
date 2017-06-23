sap.ui.define(
	["sap/m/Popover"],
	function(Popover) {
		return Popover.extend("ppmflow.control.Menu", {
			metadata: {
				aggregations: {
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

			init: function() {
				this._sContainerId = this.getId() + "--container";
				this.setAggregation("_html", new sap.ui.core.HTML({
					content: "<http://www.w3.org/2000/svg:g id='" + this._sContainerId + "'></http://www.w3.org/2000/svg:g>"
				}));
			},
			renderer: {},
			onAfterRendering: function(oRm, oControl) {
			}
		});
	}
);