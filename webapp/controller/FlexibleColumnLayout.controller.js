sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	'sap/support/fsc2/controller/BaseController',
	"sap/support/fsc2/model/models"
], function (JSONModel, Controller, BaseController, models) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.FlexibleColumnLayout", {
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRouteMatched(this.onRouteMatched, this);
			this.oRouter.attachBeforeRouteMatched(this.onBeforeRouteMatched, this);
			this.setModel(new sap.ui.model.json.JSONModel({
				"expertMode": false,
				"enableNotification": false,
				"enableDefaultCase": false,
				"enableSaM": false,
				"defaultCase": "",
				"defaultCustNo": "",
				"defaultCustName": "",
				"createType": ""
			}), "homePageConfig");
			this.setModel(new sap.ui.model.json.JSONModel({
				"myRequests": 0,
				"myFavorites": 0,
				"myActivities": 0,
				"myRequestsChanged": 0,
				"myActivitiesChanged": 0
			}), "homePageCount");
			this.setModel(new sap.ui.model.json.JSONModel({
				bEnable: true
			}), "EnableSnowCase");
			// var sEnableSnowCase = this.getModel("EnableSnowCase").getProperty("/bEnable");
			this.setModel(new sap.ui.model.json.JSONModel(), "subscribeSetting");
			this.setModel(new sap.ui.model.json.JSONModel(), "CurrentUserInfo");
			var oFavModel = models.createFavoriteModel();
			this.setModel(oFavModel, "favorite");
			this.setModel(new JSONModel(), "notification");
			var oSortModel = models.createSortPropertiesModel();
			this.setModel(oSortModel, "sortProperties");
			this.refreshFavoriteIncidentsModel();
			this.loadSettingData();
			this.loadFavCustData();
			this.loadCurrentTimeZone();
			this.getUserInfo();
			this.setModel(new JSONModel(), "requestSet");
			this.setModel(new JSONModel(), "activitySet");
			//setting case value help
			this.setModel(new JSONModel({
				"case_id": "",
				"customer_r3_no": "",
				"customer_bp_id": "",
				"customer_name": "",
				"free_text": ""
			}), "caseSearch");
			this.setModel(new JSONModel({}), "ActivityCaseList");
			this.onCloseInputSuggest();

			//catch some old URLs redirected from other apps
			if (this.oRouter.getHashChanger().hash.indexOf("incident/id=") > -1 && this.oRouter.getHashChanger().hash.indexOf(
					"&flag=false&sam=false") > -1) {
				this.oRouter.navTo("incident", {
					layout: "MidColumnFullScreen",
					id: this.oRouter.getHashChanger().hash.substring(this.oRouter.getHashChanger().hash.indexOf("=") + 1, this.oRouter.getHashChanger()
						.hash.indexOf("&")),
					flag: false,
					sam: false
				});
			} else if (this.oRouter.getHashChanger().hash.indexOf("requestDetail/id=") > -1 && this.oRouter.getHashChanger().hash.indexOf(
					"&transType=sn_customerservice_escalation") > -1) {
				this.oRouter.navTo("requestDetailRequestSearch", {
					layout: "TwoColumnsMidExpanded",
					id: this.oRouter.getHashChanger().hash.substring(this.oRouter.getHashChanger().hash.indexOf("=") + 1, this.oRouter.getHashChanger()
						.hash.indexOf("&")),
					transType: "sn_customerservice_escalation"
				});
			} else if (this.oRouter.getHashChanger().hash.indexOf("escalationRequestDetail/activityid=") > -1 && this.oRouter.getHashChanger().hash
				.indexOf("&editable=false") > -1) {
				this.oRouter.navTo("escalationRequestDetailSearch", {
					layout: "TwoColumnsMidExpanded",
					activityid: this.oRouter.getHashChanger().hash.substring(this.oRouter.getHashChanger().hash.indexOf("=") + 1, this.oRouter.getHashChanger()
						.hash.indexOf("&")),
					editable: false
				});
			} 
			/**
			 * Catch Escalation Request URL used in SAP Portal #240
			 */
			else if (this.oRouter.getHashChanger().hash.indexOf("escalationRequestStart/false") > -1) { // only works from launchpad
				this.oRouter.navTo("escalationRequestStart", {
					layout: "OneColumn",
					custnum: false
				});
			}
				/**
			 * #241
			 * 	https://fiorilaunchpad.sap.com/sites#mccsos-Display&/mccDetail/activity_id=63761467
				It should be redirected to:
				https://fiorilaunchpad-sapitcloud.dispatcher.hana.ondemand.com/sites#mccsos-Display&/mccDetailRequestSearch/TwoColumnsMidExpanded/activity_id=63761467
			 */
			//this.oRouter.getHashChanger().hash
			//document.URL
			else if (this.oRouter.getHashChanger().hash.indexOf("mccDetail/activity_id=") > -1) {
				var fullUrl = this.oRouter.getHashChanger().hash;
				/**
				 * the full url confuses the URLSearchParams
				 */
				var shortenedUrl = fullUrl.substring(fullUrl.indexOf("activity_id"), fullUrl.length);		
				this.oRouter.navTo("mccDetailRequestSearch", {
					layout: "TwoColumnsMidExpanded",
					activity_id: new URLSearchParams(shortenedUrl).get("activity_id")
				});
			}
		},

		onBeforeRouteMatched: function (oEvent) {

			var oModel = this.getOwnerComponent().getModel();
			var sLayout = oEvent.getParameters().arguments.layout;

			// If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
			if (!sLayout) {
				//	var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(0);
				sLayout = "OneColumn";
			}

			// Update the layout of the FlexibleColumnLayout
			if (sLayout) {
				oModel.setProperty("/layout", sLayout);
			}
		},

		onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name"),
				oArguments = oEvent.getParameter("arguments");

			this._updateUIElements();

			// Save the current route name
			this.currentRouteName = sRouteName;
			/*		this.currentProduct = oArguments.product;
					this.currentSupplier = oArguments.supplier;*/
		},

		onStateChanged: function (oEvent) {
			var bIsNavigationArrow = oEvent.getParameter("isNavigationArrow"),
				sLayout = oEvent.getParameter("layout");

			this._updateUIElements();

			// Replace the URL with the new layout if a navigation arrow was used
			/*		if (bIsNavigationArrow) {
						this.oRouter.navTo(this.currentRouteName, {
							layout: sLayout,
							product: this.currentProduct,
							supplier: this.currentSupplier
						}, true);
					}*/
		},

		// Update the close/fullscreen buttons visibility
		_updateUIElements: function () {
			var oModel = this.getOwnerComponent().getModel();
			var oUIState = this.getOwnerComponent().getHelper().getCurrentUIState();
			oModel.setData(oUIState);
		},

		onExit: function () {
			this.oRouter.detachRouteMatched(this.onRouteMatched, this);
			this.oRouter.detachBeforeRouteMatched(this.onBeforeRouteMatched, this);
		}
	});
});