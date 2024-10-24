sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/support/fsc2/controller/BaseController",
	"sap/support/fsc2/model/models",
	'sap/support/fsc2/model/formatter'
], function (JSONModel, Controller, BaseController, models, formatter) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.DashBoard", {
		formatter: formatter,
		onInit: function () {
			/*		$.ajax({
				method: "GET",
				// data: oDataService,
				contentType: "application/json",
				url: "/ext_pd_api/incidents",
				// url: sap.support.fsc2.servicenowUrl,
				success: function (oData) {
					sap.m.MessageToast.show(oData);
				}.bind(this),
				error: function (a, b, c) {
					sap.m.MessageToast.show("pduty API Unavailable");
				}
			});

			var statusMessage = {
				"message": "marios special message 3"
			};
			$.ajax({
				method: "POST",
				data: JSON.stringify(statusMessage),
				contentType: "application/json",
				url: "/ext_pd_api/incidents/Q3PAZOORII994N/status_updates", //= sys_id
				success: function (data) {
					sap.m.MessageToast.show(JSON.stringify(data));
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("pagerduty post status message to incidents failed");
				}.bind(this)
			});

			var body = {
				"payload": {
					"summary": "marios random request on wednesday 10",
					"severity": "critical",
					"source": "Red Phone",
					"custom_details": {
						"Caller": "Mario Mik",
						"technical Bridgecall": "dont know",
						"LoBs": "some other lob",
						"Details": "a test incident",
						"Separate IOC SWAT judgement call needed?": "false",
						"LoB\GCS representatives to invite to IOC SWAT judgement call ": "someonesEmail",
						"Number of impacted customers": "2",
						"Business impact": "impact description",
						"key1": "group2"
					}
				},
				"routing_key": "",
				"event_action": "trigger"
			};
			$.ajax({
				method: "POST",
				data: JSON.stringify(body),
				contentType: "application/json",
				url: "/ext_pd_events/v2/enqueue", //= sys_id
				headers: {
				"Host": "mcc.prod.apimanagement.eu10.hana.ondemand.com",
				"Content-Length": "574"

				},
				success: function (data) {
					sap.m.MessageToast.show(JSON.stringify(data));
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("pagerduty post failed");
				}.bind(this)
			});
*/
			this.oRouter = this.getOwnerComponent().getRouter();
			/*	var oExitButton = this.getView().byId("exitFullScreenBtn"),
					oEnterButton = this.getView().byId("enterFullScreenBtn");

				this.oRouter = this.getOwnerComponent().getRouter();
				this.oModel = this.getOwnerComponent().getModel();

				this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);
				this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onProductMatched, this);

				[oExitButton, oEnterButton].forEach(function (oButton) {
					oButton.addEventDelegate({
						onAfterRendering: function () {
							if (this.bFocusFullScreenButton) {
								this.bFocusFullScreenButton = false;
								oButton.focus();
							}
						}.bind(this)
					});
				}, this);*/

			this.getRouter().getRoute("dashboard").attachPatternMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function () {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}

			//	var loadData = this.loadNotificationData(this._syncBadgeNumber);
			//	loadData.then(function () {
			this.loadMyRequests();
			this.loadAssignedToMe();
			//	}.bind(this));
			this.checkDataLoadComplete();
			this.loadFavCustData();
			//	this.loadFavSnowEscalationData();
			this.loadFavIncidentData();
			//		this.loadFavSNOWCaseData();
		},

		onIocRequestPress: function () {
			console.log("ioc tile pressed");
			this.oRouter.navTo("ioc", {
				layout: "OneColumn"
			});
			console.log("i shouldnt be here");
		},

		onMyRequestsPress: function () {
			this.oRouter.navTo("request", {
				layout: "OneColumn"
			});
		},
		onAssignedPress: function () {
			this.oRouter.navTo("assigned", {
				layout: "OneColumn"
			});
		},
		onSearchPress: function () {
			this.oRouter.navTo("search", {
				layout: "OneColumn"
			});
		},
		onCustomerSearchPress: function () {
			this.oRouter.navTo("customerSearch", {
				layout: "OneColumn"
			});
		},
		onRequestSearchPress: function () {
			this.oRouter.navTo("requestSearch", {
				layout: "OneColumn"
			});
		},
		onIncidentSearchPress: function () {
			this.oRouter.navTo("searchIncident", {
				layout: "OneColumn"
			});
		},
		onMyFavoritesPress: function () {
			this.oRouter.navTo("favorites", {
				layout: "OneColumn"
			});
		},
		onNavToNotification: function () {
			this.getRouter().navTo("notification", {
				layout: "MidColumnFullScreen"
			});
		},
		onOpenHelpJAM: function () {
			this.getRouter().navTo("help", {
				layout: "MidColumnFullScreen"
			});
		},
		
		onOtherMCCReqPress: function(oEvent) {
			this.getRouter().navTo("otherMCCRequest",{
				layout: "OneColumn"
			});
		},
		
		onSettingPress: function () {
			var oData = this.getModel("homePageConfig").getData();
			this.oInitSettingData = JSON.parse(JSON.stringify(oData));
			if (!this._oSettingDialog) {
				this._oSettingDialog = new sap.ui.xmlfragment("SettingFragId", "sap.support.fsc2.view.fragments.Settings", this);
			}
			this.getView().addDependent(this._oSettingDialog);
			this._oSettingDialog.setModel(this.getModel("homePageConfig"), "homePageConfig");
			this._oSettingDialog.open();
			// this._updateSetting();
		},

		//	},

		onConfirmSetting: function () {
			this.eventUsage(false, "Confirm configure setting");
			var oState = this.getModel("homePageConfig").getProperty("/expertMode");
			var oExpertEntry = {
				"Attribute": "APP_FSC2_EXPERT_MODE",
				"Value": oState ? "YES" : "NO"
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", oExpertEntry);

			var oNotiState = this.getModel("homePageConfig").getProperty("/enableNotification");
			var oNofiEntry = {
				"Attribute": "NEED_FSC2_PUSHNOTIFICATION",
				"Value": oNotiState ? "YES" : "NO"
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", oNofiEntry);

			var oSaMState = this.getModel("homePageConfig").getProperty("/enableSaM");
			var oSaMEntry = {
				"Attribute": "APP_FSC2_USE_SAM",
				"Value": oSaMState ? "YES" : "NO"
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", oSaMEntry);

			var sEnableDefaultCase = this.getModel("homePageConfig").getProperty("/enableDefaultCase");
			var sEnableCaseEntity = {
				"Attribute": "APP_FSC2_USE_ENG_CASE ",
				"Value": sEnableDefaultCase ? "YES" : "NO"
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", sEnableCaseEntity);

			var sDefaultCase = this.getModel("homePageConfig").getProperty("/defaultCase");
			var sCaseEntity = {
				"Attribute": "APP_MCC_ACTIVITIES_DEFAULT_CASE",
				"Value": sDefaultCase
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", sCaseEntity);
			this._oSettingDialog.close();
		},
		onCancelSetting: function () {
			this.getModel("homePageConfig").setData(this.oInitSettingData);
			this._oSettingDialog.close();
		},
		onNavToSubscription: function () {
			this.getRouter().navTo("subscription", {
				layout: "MidColumnFullScreen"
			});
			this._oSettingDialog.close();
		},
		onCreateIssue: function () {
			var oState = this.getModel("homePageConfig").getProperty("/expertMode");
			if (oState) {
				this.onOpenExpertDialog();
			} else {
				this.eventUsage("create\' view");
				// var sDefaultCase = this.getModel("homePageConfig").getProperty("/defaultCase");
				// var sDefaultCustNo = this.getModel("homePageConfig").getProperty("/defaultCustNo").replace(/\b(0+)/gi, "");
				// var sDefaultCustName = this.getModel("homePageConfig").getProperty("/defaultCustName");
				this.getRouter().navTo("createByDefault", {
					layout: "OneColumn"
				});
			}
		},
		//move to base controller
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		/*	handleItemPress: function (oEvent) {
				var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(2),
					supplierPath = oEvent.getSource().getBindingContext("products").getPath(),
					supplier = supplierPath.split("/").slice(-1).pop();

				this.oRouter.navTo("detailDetail", {
					layout: oNextUIState.layout,
					product: this._product,
					supplier: supplier
				});
			},*/
		handleFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.oRouter.navTo("detail", {
				layout: sNextLayout,
				product: this._product
			});
		},
		handleExitFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("detail", {
				layout: sNextLayout,
				product: this._product
			});
		},
		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.oRouter.navTo("master", {
				layout: sNextLayout
			});
		},

		//case search event handlers
		//code repeats find a way to recycle
		getCaseFilter: function () {
			var aFilter = [];
			var oCaseSearchData = this.getModel("caseSearch").getData();
			if (oCaseSearchData.case_id !== "") {
				aFilter.push(new sap.ui.model.Filter("case_id", "EQ", oCaseSearchData.case_id));
			}
			if (oCaseSearchData.customer_r3_no !== "") {
				aFilter.push(new sap.ui.model.Filter("customer_r3_no", "EQ", oCaseSearchData.customer_r3_no));
			}
			if (oCaseSearchData.customer_bp_id !== "") {
				aFilter.push(new sap.ui.model.Filter("customer_bp_id", "EQ", oCaseSearchData.customer_bp_id));
			}
			if (oCaseSearchData.customer_name !== "") {
				aFilter.push(new sap.ui.model.Filter("customer_name", "EQ", oCaseSearchData.customer_name));
			}
			if (oCaseSearchData.free_text !== "") {
				aFilter.push(new sap.ui.model.Filter("free_text", "EQ", oCaseSearchData.free_text));
			}
			//case_type ZS02 Engagement Cases
			aFilter.push(new sap.ui.model.Filter("case_type", "EQ", "ZS02"));
			//status without 90 Closed, 98 Restricts
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "71"));
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "80"));
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "81"));
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "99"));

			return aFilter;
		},

		onPressCaseSearch: function (oEvent) {
			var that = this;
			var sTable = sap.ui.core.Fragment.byId("DefaultCaseFragId", "iResultsList");
			sTable.setBusy(true);
			sap.support.fsc2.FSC2Model.read("/CasesSet", {
				filters: that.getCaseFilter(),
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					that.getModel("ActivityCaseList").setData(oData);
					sTable.setBusy(false);
				},
				error: function () {
					sTable.setBusy(false);
				}
			});
		},
		onCloseCaseDialog: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			this.getModel("caseSearch").setData({
				"case_id": "",
				"customer_r3_no": "",
				"customer_bp_id": "",
				"customer_name": "",
				"free_text": ""
			});
			this.getModel("caseSearch").refresh();
			this.getModel("ActivityCaseList").setData();
			this.getModel("ActivityCaseList").refresh();
			oDialog.close();
			this._oCaseDialog.destroy();
		},

		onConfirmCaseSecect: function (oEvent) {
			var selestecItem = sap.ui.core.Fragment.byId("DefaultCaseFragId", "iResultsList").getSelectedItem();
			if (!selestecItem) {
				sap.m.MessageBox.warning("Please select one case first");
				return;
			} else {
				var sObject = selestecItem.getBindingContext("ActivityCaseList").getObject();
				sap.ui.core.Fragment.byId("SettingFragId", "idDefaultCase").setValue(sObject.case_id);
				this.getModel("homePageConfig").setProperty("/defaultCase", sObject.case_id);
				this.getModel("homePageConfig").setProperty("/defaultCustNo", sObject.customer_r3_no);
				this.getModel("homePageConfig").setProperty("/defaultCustName", sObject.customer_name);
			}
			this.onCloseCaseDialog(oEvent);
		},
		
		onCaseHelp: function () {
			this._oCaseDialog = new sap.ui.xmlfragment("DefaultCaseFragId", "sap.support.fsc2.view.fragments.CaseSearch", this);
			this.getView().addDependent(this._oCaseDialog);
			this.getModel("ActivityCaseList").setData();
			this._oCaseDialog.open();
		},
		
		onSupportEnablementPress: function(oEvet) {
			this.eventUsage(false, "Support Enablement Link Triggered");
			// sap.m.URLHelper.redirect("https://sap.sharepoint.com/sites/200109/SitePages/SAP-Support-Enablement-for-Front-Roles.aspx", true);// open in new tab
			window.open("https://sap.sharepoint.com/sites/200109/SitePages/SAP-Support-Enablement-for-Front-Roles.aspx","", "width="+screen.availWidth+",height="+screen.availHeight);// open in new window as full screen
		}
		
		
			/*	_onProductMatched: function (oEvent) {
					this._product = oEvent.getParameter("arguments").product || this._product || "0";
					this.getView().bindElement({
						path: "/ProductCollection/" + this._product,
						model: "products"
					});
				}*/
	});
});