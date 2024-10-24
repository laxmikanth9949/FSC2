/*global history*/
sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/support/fsc2/model/formatter',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models'
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, ODataModel, models) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.myActivity", {
		formatter: formatter,
		onInit: function () {
			//	this.getEventBus().subscribe("myActivity", "_onRouteMatched", this._onRouteMatched, this);
			var oModel = new JSONModel();
			oModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/model/CustDetailFilter.json"), {}, false);
			this.setModel(oModel, "filterOptionModel");
			this.getRouter().getRoute("assigned").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("mccDetail").attachPatternMatched(this._onRouteMatchedRefresh, this); //needed so data is my request loaded after reloading of page
			this.bInit = true;
		},
		_onRouteMatched: function () {
			//	this.getView().setBusy(true);
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			this.loadAssignedToMe();
			/*var aFilter = [];
			var statusFilter = this.getView().byId("ActivityFilter").getSelectedKey();
			if (statusFilter && statusFilter !== "all") {
				aFilter.push(new Filter("activity_sys_status", "EQ", statusFilter));
			}
			aFilter.push(new Filter("assignedtome", "EQ", "X"));
			aFilter.push(new Filter("activity_process_type", "EQ", "ZS46"));
			sap.support.fsc2.FSC2Model.read("/FSC2ActivitySet", {
				// urlParameters: {
				// 	$top: 5
				// },
				filters: aFilter,
				success: function (oData) {
					var iCount = 0;
					if (oData.results.length > 0) {
						iCount = oData.results.length;
						oData.results.forEach(function (x) {
							x.activity_change_date = formatter.formatTime2(x.activity_change_date, false);
						});
					}
					this.getModel("activitySet").setData(oData);
					this.getModel("homePageCount").setProperty("/myActivities", iCount);
					this.getView().setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					sap.m.MessageToast.show("FSC2ActivitySet Service Unavailable!");
				}.bind(this)
			});*/
		},
		_onRouteMatchedRefresh: function (oEvent) {
			if (this.bInit === true) {
				this.loadAssignedToMe();
				this.bInit = false;
			}
		},
		onActivityItemPress: function (oEvent) {
			//	this.getView().setBusy(true);
			/*	var oObject = oEvent.getSource().getBindingContext("activitySet").getObject();
				this.eventUsage("mccDetail \'view");
				this.getRouter().navTo("mccDetail", {
					layout: "TwoColumnsMidExpanded",
					activity_id: oObject.activity_id
				});*/
			var oObject = oEvent.getSource().getBindingContext("activitySet").getObject();
			oObject.ID = (oObject.activity_process_type === "sn_customerservice_escalation") ? oObject.SNowSysID : oObject.activity_id;
			this.onNavToCriticalRequest(oObject.activity_process_type, oObject.ID, oObject.activity_status_desc, 2);
		},
		onFilterTable: function (oEvent) {
			// add filter for search
			var aFilters = [];
			var filter = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				aFilters.push(new Filter("activity_id", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("activity_status_desc", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("account_name_F", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("activity_description", FilterOperator.Contains, sQuery));

				filter = new Filter({
					filters: aFilters,
					and: false
				});
			}
			// update list binding
			var oList = this.getView().byId("idMyToDosTable");
			var oBinding = oList.getBinding("items");
			oBinding.filter(filter);
		}
	});

});