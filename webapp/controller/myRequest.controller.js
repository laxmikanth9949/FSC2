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

	return BaseController.extend("sap.support.fsc2.controller.myRequest", {
		formatter: formatter,
		onInit: function () {
			this.getEventBus().subscribe("Request", "_onRouteMatched", this._onRouteMatched, this);
			//		this.getEventBus().subscribe("Request", "tbUnvisible", this.tbUnvisible, this);
			this.getRouter().getRoute("request").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("mccDetailRequest").attachPatternMatched(this._onRouteMatched, this); //needed so data is my request loaded after reloading of page. why _onRouteMatchedRefresh?
			this.bInit = true;
		},
		_onRouteMatched: function (sChanel, sEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			this.loadMyRequests();

			//	this.getView().byId("tbShowMore").setVisible(true);
			//	this.getView().setBusy(true);

			/*	sap.support.fsc2.FSC2Model.read("/FSC2RequestSet", {
					urlParameters: {
						$top: 3
					},
					filters: [new Filter("Action", "EQ", "myrequest")],
					success: function (oData) {
						var iCount = 0;
						//var aData;
						this.getView().setBusy(false);
						if (oData.results.length > 0) {
							iCount = oData.results[0].ResultNumber;
						}
						for (var i = 0; i < oData.results.length; i++) {
							oData.results[i].ChangedAt = formatter.formatTime4(oData.results[i].ChangedAt);
						}
						this.oAll = {
							"count": iCount,
							"results": oData
						};
						this.getModel("requestSet").setData(oData);
						this.getModel("homePageCount").setProperty("/myRequests", iCount); // chnage tp have same model as results
						this.getEventBus().publish("Favorites", "_onRouteMatched");
						this.loadSnowEscalationData();
					}.bind(this),
					error: function (oError) {
						this.getView().setBusy(false);
						this.showErrorMessage(oError);
					}.bind(this)
				});*/
		},
		_onRouteMatchedRefresh: function (oEvent) {
			if (this.bInit === true) {
				this.loadMyRequests();
				this.bInit = false;
			}
		},
		onRequestItemPress: function (oEvent) {
			// var sExpertMode = this.getModel("homePageConfig").getProperty("/expertMode");
			var oObject = oEvent.getSource().getBindingContext("requestSet").getObject();
			oObject.ID = (oObject.TransType === "sn_customerservice_escalation") ? oObject.SNowSysID : oObject.ID;
			/*	if (oObject.TransType !== "ZS31") {
					this.getView().setBusy(true);
				}*/
			this.onNavToCriticalRequest(oObject.TransType, oObject.ID, oObject.StatusTxt, 2);
		},
		onFilterTable: function (oEvent) {
				// add filter for search
				var aFilters = [];
				var filter = [];
				var sQuery = oEvent.getSource().getValue();
				if (sQuery && sQuery.length > 0) {
					aFilters.push(new Filter("ID", FilterOperator.Contains, sQuery));
					aFilters.push(new Filter("StatusTxt", FilterOperator.Contains, sQuery));
					aFilters.push(new Filter("CustomerName", FilterOperator.Contains, sQuery));
					aFilters.push(new Filter("Description", FilterOperator.Contains, sQuery));

					filter = new Filter({
						filters: aFilters,
						and: false
					});
				}
				// update list binding
				var oList = this.getView().byId("idMyRequestsTable");
				var oBinding = oList.getBinding("items");
				oBinding.filter(filter);
			}
			/*	loadSnowEscalationData: function () {
					var sUserId = this.getModel("CurrentUserInfo").getProperty("/UserID");

				var oDataService = {
					"sysparm_order": "sys_updated_on",
					"u_escalation_type": 3,
					"sysparm_fields": "u_task_record.ref_sn_customerservice_case.account.name,number,sys_id,short_description,state,sys_updated_on,sys_class_name"
				};

					var sUrl =
						sap.support.fsc2.servicenowEscalationUrl + "?sysparm_query=requested_by.employee_number=" + sUserId + "%5Eu_escalation_type=" +
						oDataService.u_escalation_type +
						" &sysparm_fields=" + oDataService.sysparm_fields;

				$.ajax({
					method: "GET",
					contentType: "application/json",
					url: sUrl,
					success: function (oData) {
						var aData = [];
						oData.result.forEach(function (x) {
							aData.push({
								"ID": x.number,
								"SNowSysID": x.sys_id, // needed?
								"Description": x.short_description,
								"CustomerName": x["u_task_record.ref_sn_customerservice_case.account.name"],
								"ChangedAt": new Date(x.sys_updated_on),
								"TransType": x.sys_class_name,
								"StatusTxt": formatter.SnowEscalationStatusTxt(x.state)
							});
							//store all the snow escalation in model, will be displayed via show more functionality
							this.getModel("requestSet").setProperty("/SnowEscalation", {
								"count": aData.length,
								"expanded": false,
								"loadComplete": true, //remove I338673
								"results": aData
							});
							//slice to protect original array which contains all snow escs which is essential for counting and show more
							var aSortedEscs = aData.slice().sort(function (a, b) { //slice by 3 here too?
								return b.ChangedAt - a.ChangedAt;
							});

							var aFirstEscs = aSortedEscs.slice(0, 3);
							this.oAll = {
								"count": this.oAll.count + aData.length, //aData is all snow records
								"results": this.oAll.results.results.concat(aFirstEscs) //aFirstEscs is just the first 3 records (display) SORTED?? I338673
							};
							this.getModel("requestSet").setProperty("/results", this.oAll.results);
							this.getModel("homePageCount").setProperty("/myRequests", this.oAll.count);
						}.bind(this),
						error: function (oError) {
							this.getView().setBusy(false);
							this.showErrorMessage(oError);
						}.bind(this)
					});
				},*/

		/*onShowMore: function (oEvent) {
			oEvent.getSource().getParent().setVisible(false);
			this.getView().setBusy(true);
			sap.support.fsc2.FSC2Model.read("/FSC2RequestSet", {
				filters: [new Filter("Action", "EQ", "myrequest")],
				success: function (oData) {
					for (var i = 0; i < oData.results.length; i++) {
						oData.results[i].ChangedAt = formatter.formatTime4(oData.results[i].ChangedAt);
					}
					var aAllSnowEscalations = this.getModel("requestSet").getProperty("/SnowEscalation");
					this.getModel("requestSet").setProperty("/results", oData.results.concat(aAllSnowEscalations.results));
					this.getView().setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		tbUnvisible: function () {
			this.getView().byId("tbShowMore").setVisible(false);
		}*/
	});

});