sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/formatter',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/m/MessageBox'
], function (BaseController, formatter, JSONModel, Filter, ODataModel, models, MessageBox) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.EscalationRequestStart", {
		onInit: function () {
			this.setModel(new JSONModel({
				"results": []
			}), "EscalationDraft");
			this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/model/EscalationRequestStart.json")), "FormattedText");
			this.getRouter().getRoute("escalationRequestStart").attachPatternMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function (oEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			var oArgs = oEvent.getParameter("arguments");
			this.sCustNum = oArgs.custnum;
			this.getDraftRequests();
		},
		getDraftRequests: function () {
			// console.log("Get all Escalation Activity (ZS31) in status draft for User");
			this.getView().setBusy(true);
			var sCurrentUser = this.getModel("CurrentUserInfo").getProperty("/UserID");
			var getDraftsURL = sap.support.fsc2.CXCSSModelUrl + "/" +
				"ActivityPartiesList?$filter=partner_fct%20eq%20%2700000014%27%20and%20partner_no%20eq%20'" + sCurrentUser + "'";

			jQuery.ajax({
				async: true,
				url: getDraftsURL,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				type: "GET",
				dataType: "json",
				success: function (oData) {
					var drafts = oData.d.results;
					this.getModel("EscalationDraft").setProperty("/results", drafts);
					this.getView().setBusy(false);
				}.bind(this),
				error: function () {
					sap.m.MessageToast.show("Error getting draft Escalation Requests.");
					this.getView().setBusy(false);
				}.bind(this)
			});
		},
		onCreateRequest: function () {
			this.getRouter().navTo("escalationRequestCreate", {
				layout: "MidColumnFullScreen",
				"custnum": this.sCustNum //either cust num for esc req form pre pop or false for no customer info
			});
		},
		onNavtoDraftDetail: function (oEvent) {
			var sActivityId = oEvent.getSource().getText();
			this.getRouter().navTo("escalationRequestDetail", {
				layout: "MidColumnFullScreen",
				"activityid": sActivityId,
				"editable": "true"
			});
		}
	});

});