/*global history*/
sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/formatter',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/ui/model/Filter'
], function (BaseController, formatter, JSONModel, ODataModel, models, Filter) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.myFavorites", {
		formatter: formatter,
		onInit: function () {
			//	this.getEventBus().subscribe("Favorites", "_onRouteMatched", this._onRouteMatched, this);
			this.getRouter().getRoute("favorites").attachPatternMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function (sChanel, oEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			/******comment:
			 These flags are uesd to check if the data has been loaded completed.
			 ******/
			this.iCount = 0;
			this.getView().setBusy(true);
			var oTabBar = this.getView().byId("idFavTab");
			oTabBar.setSelectedKey(0);
			this.checkDataLoadComplete();
			this.loadFavCustData();
			// this.loadFavIncidentData();
			// this.loadTableData();
			// this.loadIncidentData();
		},
		checkDataLoadComplete: function () {
			var that = this;
			var sFavModel = this.getModel("favorite");
			var sComplete_cust = sFavModel.getProperty("/Customer").loadComplete;
			var sComplete_incd = sFavModel.getProperty("/BCIncident").loadComplete;
			var sComplete_snowCase = sFavModel.getProperty("/SnowCase").loadComplete;
			if (sComplete_cust && sComplete_incd && sComplete_snowCase) {
				var iCount = sFavModel.getProperty("/Customer").count + sFavModel.getProperty("/Situation").count + sFavModel.getProperty(
					"/Incident").count;
				this.getModel("homePageCount").setProperty("/myFavorites", iCount);
				var oBCIncident = sFavModel.getProperty("/BCIncident");
				var oSnowCase = sFavModel.getProperty("/SnowCase");
				var object = {
					"count": oBCIncident.count + oSnowCase.count,
					"expanded": false,
					"loadComplete": true,
					"results": oBCIncident.results.concat(oSnowCase.results)
				};
				this.getModel("favorite").setProperty("/Incident", object);
				this.getView().setBusy(false);
			} else {
				setTimeout(function () {
					that.checkDataLoadComplete();
				}, 200);
			}
		},
		loadTableData: function () {
			sap.support.fsc2.FSC2Model.read("/FavoriteObjectSet", {
				success: function (oData) {
					this.bFlag1 = true; /******comment: Data load completed******/
					var aData = oData.results;
					var aCustomer = [],
						aSituation = [],
						aIncident = [];
					for (var i = 0, len = aData.length; i < len; i++) {
						aData[i].Action = "X";
						if (aData[i].FavoriteType === "FAVORITE_CUSTOMERS") {
							aData[i].Type = "FAVORITE_CUSTOMERS";
							aCustomer.push(aData[i]);
						} else {
							aData[i].Type = this.formatter.formatCriticalTansType(aData[i].TransType);
							aSituation.push(aData[i]);
						}
					}
					this.getModel("favorite").setProperty("/Customer", {
						"count": aCustomer.length,
						"expanded": aCustomer.length ? true : false,
						"results": aCustomer
					});
					this.getModel("favorite").setProperty("/Situation", {
						"count": aSituation.length,
						"expanded": aSituation.length ? true : false,
						"results": aSituation
					});
					this.iCount += aCustomer.length + aSituation.length;
					/******comment: if close the busy state and show my favorites number or not ******/
					if (this.bFlag1 && this.bFlag2) {
						this.getView().setBusy(false);
						this.getModel("homePageCount").setProperty("/myFavorites", this.iCount);
					}
				}.bind(this),
				error: function (err) {
					this.bFlag1 = true;
					if (this.bFlag1 && this.bFlag2) {
						this.getView().setBusy(false);
					}
					sap.m.MessageToast.show("Service Unavailable!");
				}.bind(this)
			});
		},
		loadIncidentData: function () {
			var aFavEntries = this.getModel("favoriteIncidents").getData() || [];
			if (!aFavEntries || !aFavEntries.results) {
				setTimeout(function () {
					this.loadIncidentData();
				}.bind(this), 200);
				return;
			}
			var sGroup = "myIncident";
			sap.support.fsc2.IncidentModel.setUseBatch(true);
			sap.support.fsc2.IncidentModel.setDeferredGroups([sGroup]);
			for (var i = 0; i < aFavEntries.results.length; i++) {
				if (aFavEntries.results[i].Value !== "") {
					var aFilter = [new Filter("CssObjectID", "EQ", aFavEntries.results[i].Value)];
					sap.support.fsc2.IncidentModel.read("/IncidentList", {
						groupId: sGroup,
						filters: aFilter
					});
				}
			}
			if (aFavEntries.results.length === 0) {
				this.getModel("favorite").setProperty("/Incident", {
					"count": 0,
					"expanded": false,
					"results": []
				});
				this.bFlag2 = true;
				sap.support.fsc2.IncidentModel.setUseBatch(false);
			} else {
				sap.support.fsc2.IncidentModel.submitChanges({
					groupId: sGroup,
					success: function (oData) {
						this.bFlag2 = true; /******comment: Data load completed******/
						var aFavEtyValue = [];
						for (var j = 0; j < aFavEntries.results.length; j++) {
							aFavEtyValue.push(aFavEntries.results[j].Value);
						}
						var aResponses = oData.__batchResponses;
						var aResults = [];
						if (aResponses) {
							for (var k = 0; k < aResponses.length; k++) {
								var aData = aResponses[k].data.results;
								for (var i = 0; i < aData.length; i++) {
									var iInd = aFavEtyValue.indexOf(aData[i].CssObjectID);
									if (iInd !== -1) {
										// aData[i].Escalation = "X"; //for test
										aResults.push({
											"ID": aData[i].CssObjectID,
											"ShortID": aData[i].ObjectID + "/" + aData[i].MessageYear,
											"Name": aData[i].CustomerName,
											"ComponentName": aData[i].ComponentName,
											"Description": aData[i].Description + " " + aData[i].ComponentName,
											"Priority": aData[i].PriorityTxt,
											"PriorityID": aData[i].Priority,
											"Status": aData[i].StatusTxt,
											"Action": "X",
											"Field": aFavEntries.results[iInd].Field,
											"Type": "FAVORITE_INCIDENTS",
											"Escalation": aData[i].Escalation === "X" ? true : false
										});
									}
								}
							}
						}
						this.getModel("favorite").setProperty("/Incident", {
							"count": aResults.length,
							"expanded": aResults.length ? true : false,
							"results": aResults
						});
						this.iCount += aResults.length;
						/******comment: if close the busy state and show my favorites number or not ******/
						if (this.bFlag1 && this.bFlag2) {
							this.getView().setBusy(false);
							this.getModel("homePageCount").setProperty("/myFavorites", this.iCount);
						}
						sap.support.fsc2.IncidentModel.setUseBatch(false);
					}.bind(this),
					error: function () {
						this.bFlag2 = true;
						if (this.bFlag1 && this.bFlag2) {
							this.getView().setBusy(false);
						}
						sap.m.MessageToast.show("IncidentList Service Unavailable!");
						sap.support.fsc2.IncidentModel.setUseBatch(false);
					}.bind(this)
				});
			}
			// sap.support.fsc2.IncidentModel.setUseBatch(false);
		},
		onFavoriteItemPress: function (oEvent) {
				// Determine where we are right now
				this.getView().setBusy(true);
				var oBindingObject = oEvent.getSource().getBindingContext("favorite");
				var sPath = oBindingObject.getPath();
				var oObject = oBindingObject.getObject();
				var aPath = sPath.split("/");
				if (aPath[1] === "Customer") {
					this.getRouter().navTo("customer", {
						layout: "MidColumnFullScreen",
						custnum: oObject.CustomerNo,
						custname: encodeURIComponent(oObject.CustomerName),
						favorite: true
					});
				} else if (aPath[1] === "Situation") {
					this.onNavToCriticalRequest(oObject.TransType, oObject.Sys_ID, 2);
				} else {
					this.eventUsage("incident\' view");
					var sID = oObject.SNow_number ? oObject.SNow_number : oObject.ID;
					this.getRouter().navTo("incident", {
						layout: "TwoColumnsMidExpanded",
						id: sID,
						flag: false,
						sam: false
					});
				}
			}
			// ,
			// onFavoritePress: function(oEvent) {
			// 	this.onFavoriteAction(oEvent, "favorite");
			// }

	});
});