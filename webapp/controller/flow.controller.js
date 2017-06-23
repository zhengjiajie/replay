sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("ppmflow.controller.flow", {

		backend: null,

		saveLayout: function() {
			var oGraph = this.byId('__flowChart0');
			var flowLayout = oGraph.getLayout();
			if (this.backend) {
				this.backend.saveLayout(flowLayout);
			}
		}
	});
});