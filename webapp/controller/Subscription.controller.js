sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	// "sap/support/fsc2/hybrid/notify",
	"sap/ui/model/odata/v2/ODataModel"
], function (Controller, MessageToast, Filter, JSONModel, ODataModel) {
	"use strict";
	return Controller.extend("sap.support.fsc2.controller.Subscription", {
		aCustNotifity: [],
		aIcdNotifity: [],
		_varGlobalInstances: function () {
			var expandJson = new JSONModel({
				customerExpand: true,
				incidentExpand: false
			});
			this.getView().setModel(expandJson, "expandJson");
			this.setModel(new JSONModel(), "favoriteCustModel");
			this.setModel(new JSONModel(), "favoriteIcdModel");
			var notifiModel = new JSONModel();
			this.getView().setModel(notifiModel, "notifiModel");
			var checkBoxType = new JSONModel({
				VH: "1",
				H: "3",
				status: "chg_status",
				proOrg: "chg_pro_org",
				component: "chg_component"
			});
			this.getView().setModel(checkBoxType, "checkBoxType");
		},
		onInit: function () {
			this._varGlobalInstances();
			var oRouter = this.getRouter();
			oRouter.getRoute("subscription").attachMatched(this._onRouteMatched, this);
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
			this.getModel("favoriteCustModel").setData();
			this.getModel("favoriteIcdModel").setData();
			this._getFavoriteDatas();
		},
		onTabBarSelected: function (oEvent) {
			var key = oEvent.getSource().getProperty("selectedKey");
			if (key.indexOf("Customer") > 0) {
				this.getView().getModel("expandJson").getData().customerExpand = true;
				this.getView().getModel("expandJson").getData().incidentExpand = false;
			}
			if (key.indexOf("Incident") > 0) {
				this.getView().getModel("expandJson").getData().customerExpand = false;
				this.getView().getModel("expandJson").getData().incidentExpand = true;
			}
			this.getView().getModel("expandJson").refresh();
		},
		loadCustNotif: function () {
			var thisRef = this;
			// var sFavotiteData = thisRef.getModel("favorite").getProperty("/Customer");
			var oTabBar = this.getView().byId("idCustAndIcdTabBar");
			var aFavCust = this.getModel("favorite").getProperty("/Customer");
			if (!aFavCust.loadComplete) {
				setTimeout(function () {
					this.loadCustNotif();
				}.bind(this), 200);
				return;
			} else if (aFavCust.results.length === 0) {
				thisRef.getModel("favoriteCustModel").setData(aFavCust);
				return;
			}
			sap.support.fsc2.oDataIcdList.read("/customer_push_notfSet", {
				async: true,
				success: function (oDataCategory) {
					thisRef.loadCout++;
					thisRef.aCustNotifity = oDataCategory.results;
					thisRef.getModel("favoriteCustModel").setData(aFavCust);
					if (thisRef.loadCout === 2) {
						oTabBar.setBusy(false);
					}
				}.bind(this)
			});
		},
		loadIcdNotif: function () {
			var thisRef = this;
			// var sFavotiteData = thisRef.getModel("favorite").getProperty("/Incident");
			var oTabBar = this.getView().byId("idCustAndIcdTabBar");
			var aFavIncd = this.getModel("favorite").getProperty("/BCIncident");
			if (!aFavIncd.loadComplete) {
				setTimeout(function () {
					this.loadIcdNotif();
				}.bind(this), 200);
				return;
			} else if (aFavIncd.results.length === 0) {
				thisRef.getModel("favoriteIcdModel").setData(aFavIncd);
				oTabBar.setBusy(false);
				return;
			}
			sap.support.fsc2.oDataIcdList.read("/incd_pushnotf_settingSet", {
				async: true,
				success: function (oDataCategory) {
					thisRef.loadCout++;
					thisRef.aIcdNotifity = oDataCategory.results;
					thisRef.getModel("favoriteIcdModel").setData(aFavIncd);
					if (thisRef.loadCout === 2) {
						oTabBar.setBusy(false);
					}
				}.bind(this)
			});
		},
		enableNotifCheckbox: function(){
			this.getView().byId("notifCheckbox").setBusy(false);
			this.getView().byId("notifCheckbox").setEnabled(true);
			var sPushNotifs = this.getView().getModel("notifiModel").getProperty("/Value");
			if (sPushNotifs === "YES"){
				sap.m.MessageToast.show("You choose to use push  notification");
			}
			else{
				sap.m.MessageToast.show("You choose to use email for notification");
			}
		},

		_getFavoriteDatas: function () {
			var oTabBar = this.getView().byId("idCustAndIcdTabBar");
			var thisRef = this;
			this.loadCout = 0;
			oTabBar.setBusy(true);
			this.aIcdNotifity = [];
			this.aIcdNotifity = [];
			this.loadCustNotif();
			this.loadIcdNotif();
			thisRef.getView().byId("idNotiHBox").setBusy(true);
			var oModel = sap.support.fsc2.UserProfileModel;
			oModel.read("/Entries", {
				filters: [new sap.ui.model.Filter("Attribute", "EQ", "NEED_PUSHNOTIFICATION")],
				success: function (oData) {
					if (oData && oData.results && oData.results[0]) {
						this.getView().getModel("notifiModel").setData(oData.results[0]);
						this.enableNotifCheckbox();
					}
					this.getView().byId("idNotiHBox").setBusy(false);
				}.bind(this),
				error: function () {
					this.getView().byId("idNotiHBox").setBusy(false);
					sap.m.MessageToast.show("Errors happen");
					this.enableNotifCheckbox();
				}.bind(this)
			});
		},
		_refreshFavData: function () {
			this.getView().getModel("favoriteCustModel").setData();
			this.getView().getModel("favoriteIcdModel").setData();
			// this.getModel("favoriteIncidents").setData();
			// this.getModel("favorite").setData({
			// 	"Customer": {
			// 		"count": "0",
			// 		"expanded": false,
			// 		"loadComplete":false,
			// 		"results": []
			// 	},
			// 	"Situation": {
			// 		"count": "0",
			// 		"expanded": false,
			// 		"loadComplete":false,
			// 		"results": []
			// 	},
			// 	"Incident": {
			// 		"count": "0",
			// 		"expanded": false,
			// 		"loadComplete":false,
			// 		"results": []
			// 	}
			// });
			// this.refreshFavoriteIncidentsModel();
			// this.loadFavCustData();
			// this.loadFavIncidentData();
			this._getFavoriteDatas();
		},
		setCheckBoxCust: function (custNum, type) {
			for (var i = 0; i < this.aCustNotifity.length; i++) {
				if (custNum === this.aCustNotifity[i].customer && this.aCustNotifity[i].priority === type) {
					if (this.aCustNotifity[i].chg_status === "X") {
						return true;

					}
				}
			}
			return false;
		},
		setCheckBoxCIM: function (icdNum, property) {
			for (var i = 0; i < this.aIcdNotifity.length; i++) {
				if (icdNum === this.aIcdNotifity[i].incident_no) {
					if (this.aIcdNotifity[i][property] === "X") {
						return true;

					}
				}
			}
			return false;
		},
		selectCheckBoxCust: function (oEvent) {
			var thisRef = this;
			var notificationModel = sap.support.fsc2.oDataIcdListPut;
			var customeDatas = oEvent.getSource().getCustomData();
			var custNum, priority;
			var oSelect = oEvent.getSource();
			for (var i = 0; i < customeDatas.length; i++) {
				if (customeDatas[i].getKey() === "customerNum") {
					custNum = customeDatas[i].getValue();
				}
				if (customeDatas[i].getKey() === "priority") {
					priority = customeDatas[i].getValue();
				}
			}
			var select = oSelect.getSelected();
			oSelect.setBusy(true);
			if (select) {
				// var notificationModel = thisRef.getOwnerComponent().oDataIcdListPut;

				notificationModel.update("/customer_push_notfSet(customer='" + custNum + "')", {
					"customer": custNum,
					"priority": priority
				}, {
					success: function (oSuccess) {
						oSelect.setBusy(false);
						sap.m.MessageToast.show("Changed successfully.");
					},
					error: function (oError) {
						sap.m.MessageToast.show("An error occurred.");
						oSelect.setBusy(false);
						thisRef._refreshFavData();
					}
				});
			} else {
				notificationModel.update("/customer_push_notfSet(customer='" + custNum + "')", {
					"customer": custNum,
					"priority": priority,
					"tobe_delete": "X"
				}, {
					success: function (oSuccess) {
						oSelect.setBusy(false);
						sap.m.MessageToast.show("Changed successfully.");
					},
					error: function (oError) {
						sap.m.MessageToast.show("An error occurred.");
						oSelect.setBusy(false);
						thisRef._refreshFavData();
					}
				});
			}
		},
		selectCheckBoxCIM: function (oEvent) {
			var thisRef = this;
			var notificationModel = sap.support.fsc2.oDataIcdListPut;
			var customeDatas = oEvent.getSource().getCustomData();
			var icdNum, property;
			var oSelect = oEvent.getSource();
			for (var i = 0; i < customeDatas.length; i++) {
				if (customeDatas[i].getKey() === "icdNum") {
					icdNum = customeDatas[i].getValue();
				}
				if (customeDatas[i].getKey() === "property") {
					property = customeDatas[i].getValue();
				}
			}
			var select = oSelect.getSelected();
			oSelect.setBusy(true);
			var oData = {
				"incident_no": icdNum
			};
			oData[property] = "X";
			if (select) {
				notificationModel.update("/incd_pushnotf_settingSet(incident_no='" + icdNum + "')", oData, {
					success: function (oSuccess) {
						oSelect.setBusy(false);
						sap.m.MessageToast.show("Changed successfully.");
					},
					error: function (oError) {
						sap.m.MessageToast.show("An error occurred.");
						oSelect.setBusy(false);
						thisRef._refreshFavData();
					}
				});
			} else {
				oData["tobe_delete"] = "X";
				notificationModel.update("/incd_pushnotf_settingSet(incident_no='" + icdNum + "')", oData, {
					success: function (oSuccess) {
						oSelect.setBusy(false);
						sap.m.MessageToast.show("Changed successfully.");
					},
					error: function (oError) {
						sap.m.MessageToast.show("An error occurred.");
						oSelect.setBusy(false);
						thisRef._refreshFavData();
					}
				});
			}
		},
		handlePushNotiCheckBoxSelect: function (oEvent) {
			this.eventUsage(false, "Push notification option changed");
			var thisRef = this;
			var sCtrl = oEvent.getSource();
			//sCtrl.preventDefault();
			sCtrl.setEnabled(false);
			sCtrl.setBusy(true);
			if (!oEvent.getSource().getSelected()) {
				sap.support.fsc2.UserProfileModel.update("/Entries(Username='',Attribute='NEED_PUSHNOTIFICATION',Field='')", {
					Value: "NO"
				}, {
					success: function (data) {
						thisRef._getFavoriteDatas();
						//sap.m.MessageToast.show("You choose to use email for notification");
					},
					error: function () {
						sap.m.MessageToast.show("Error when adding the favorite customer");
					}
				});
			} else {
				sap.support.fsc2.UserProfileModel.update("/Entries(Username='',Attribute='NEED_PUSHNOTIFICATION',Field='')", {
					Value: "YES"
				}, {
					success: function (data) {
						thisRef._getFavoriteDatas();
						//sap.m.MessageToast.show("You choose to use push  notification");
					},
					error: function () {
						sap.m.MessageToast.show("Error when adding the favorite customer");

					}
				});
			}

		},
		setNotiSelected: function (p) {
			if (p === "YES") {
				return true;
			} else {
				return false; 
				//return true;
			}
		},
		// handleRefresh: function () {
		// 	var thisRef = this;
		// 	setTimeout(function () {
		// 		thisRef._refreshFavData();
		// 	}, 100);
		// }

	});
});