var ppmFlow = ppmFlow || {

	webDynproView: null,

	addCallback: function(callback) {
		this.webDynproView = callback;
		var oInterface = this;
		this.webDynproView.addEventListener('contextmenu', function(e) {
			e.cancelBubble = true;
			if (oInterface._flowView) {
				oInterface._flowView.getController().handleContextMenuFiredByBackend(e);
			}
		});
	},

	_flowUpperContainerId: null,

	_flowView: null,

	// initView: function() {

	// 	if (sap.ui.getCore().byId("ppmflowContainer")) sap.ui.getCore().byId("ppmflowContainer").destroy();

	// 	sap.ui.view({
	// 		id: "ppmflowContainer",
	// 		viewName: "ppmflow.view.flow",
	// 		type: sap.ui.core.mvc.ViewType.XML
	// 	}).placeAt("ppmflowContent");
	// },

	queryState: function() {
		this._flowView.getController().queryState();
	},

	initialize: function(placeAtEl) {
		if (sap.ui.getCore().byId("ppmflowContainer")) sap.ui.getCore().byId("ppmflowContainer").destroy();

		this._flowView = sap.ui.view({
			id: "ppmflowContainer",
			viewName: "ppmflow.view.flow",
			type: sap.ui.core.mvc.ViewType.XML
		});
		this._flowView.placeAt(placeAtEl);
		this._flowView.getController().backend = this;
		this._flowUpperContainerId = placeAtEl;

		sap.ui.getCore().applyTheme($("script[data-sap-ui-id='flow_bootstrap']").attr("data-sap-ui-theme"));

	},

	initializeProject: function(placeAtEl) {
		if (sap.ui.getCore().byId("ppmflowContainer")) sap.ui.getCore().byId("ppmflowContainer").destroy();

		this._flowView = sap.ui.view({
			id: "ppmflowContainer",
			viewName: "ppmflow.view.projectFlow",
			type: sap.ui.core.mvc.ViewType.XML
		});
		this._flowView.placeAt(placeAtEl);
		this._flowView.getController().backend = this;
		this._flowUpperContainerId = placeAtEl;

		sap.ui.getCore().applyTheme($("script[data-sap-ui-id='flow_bootstrap']").attr("data-sap-ui-theme"));

	},

	saveLayout: function(layout) {
		if (this.webDynproView) {
			this.webDynproView.fireEvent("saveLayout", JSON.stringify(layout));
		}
	},

	respondQueryState: function(state) {
		if (this.webDynproView) {
			this.webDynproView.fireEvent("responseToQueryState", JSON.stringify(state));
		}
	},

	nodeDblClick: function(node) {
		if (this.webDynproView) {
			this.webDynproView.fireEvent("nodeDoubleClicked", JSON.stringify(node));
		}
	},

	buildflow: function(modelData) {
		modelData[0].flowUpperContainerId = this._flowUpperContainerId;
		sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(modelData[0]));

		this.model = modelData[0];
		// sap.ui.getCore().getModel().setJson(modelData);
		// sap.ui.getCore().getModel().refresh(true);

		// 		sap.ui.getCore().byId("__chart0").setModel(modelData);
		// 		sap.ui.getCore().byId("__chart0").getModel().refresh();

		// 		var oModel = sap.ui.getCore().byId("__chart0").getBindingContext().getModel();
		// var oContext = oModel.getContext(sPath);
		// oList.setBindingContext(oContext);

		// var oModel = new sap.ui.model.json.JSONModel({data: modelData});
		// var oTable = sap.ui.getCore().byId("table");
		// oTable.setModel(oModel);

		// if (sap.ui.getCore().byId("ppmflowContainer")) sap.ui.getCore().byId("ppmflowContainer").destroy();

		// sap.ui.view({
		// 	id: "ppmflowContainer",
		// 	viewName: "ppmflow.view.flow",
		// 	type: sap.ui.core.mvc.ViewType.XML
		// }).placeAt(placeAtEl);

		// sap.ui.getCore().applyTheme($("script[data-sap-ui-id='flow_bootstrap']").attr("data-sap-ui-theme"));
	}
};