sap.ui.define([
	"sap/support/fsc2/controller/BaseController",
	"sap/support/fsc2/model/models",
	"sap/support/fsc2/model/formatter"
], function (BaseController, models, formatter) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.OtherMCCReq", {
		formatter: formatter,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.getRouter().getRoute("OtherRequests").attachPatternMatched(this._onRouteMatched, this);
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

			this.loadMyRequests();
		},

		onMyRequestsPress: function () {
			this.oRouter.navTo("request", {
				layout: "OneColumn"
			});
		},

		onCreateCCV: function () {
			//createThroughSpecialUrl
			this.getRouter().navTo("createThroughSpecialUrl", {
				layout: "OneColumn",
				erpcust: "0000000",
				title: "Customer Visit Request",
				caseid: "1",
				category: "ZVM",
				serviceteam: "20672944",
				desc: encodeURIComponent("Company name: \r\n\r\n" +
					"Customer sector/industry: \r\n\r\n" +
					"Company country: \r\n\r\n" +
					"First SAP MCC visit? ( ) Yes ( ) No \r\n\r\n" +
					"SAP MCC Location: \r\n\r\n" +
					"Proposed visit date, time, duration: \r\n\r\n" +
					"Customer ID (GUI or ERP only): \r\n\r\n" +
					"Requestor (Name, User ID): \r\n\r\n" +
					"Number customer attendees: \r\n\r\n" +
					"Number SAP attendees*:\r\n\r\n")
			});
		},

		onCreateCPC: function () {
			//createThroughSpecialUrl
			this.getRouter().navTo("createThroughSpecialUrl", {
				layout: "OneColumn",
				erpcust: "0000000",
				title: "Critical Period Coverage Request",
				caseid: "1",
				category: "ZZM",
				serviceteam: "20672944",
				desc: encodeURIComponent("1. List the solutions and or products related to the request:\r\n\r\n" +
					"2. Enter the affected Installation Numbers and SIDs (S4 only): \r\n\r\n" +
					"3. Private Cloud ( ), Public Cloud ( ), On Premise ( ) : \r\n\r\n" +
					"4. Requested time frame (DD-MM-YYYY to DD-MM-YYYY 10 week days): \r\n\r\n" +
					"5. Front office contact in general & available during CPC (Enter name and role): \r\n\r\n" +
					"6. Briefly describe your need for CPC:\r\n" +
					"( ) Go-live \r\n" +
					"( ) Upgrade\r\n" +
					"( ) Period end closing (MEC, YEC)\r\n" +
					"( ) Other\r\n" +
					"Enter details:\r\n\r\n" +
					"7. Go-live / Event date:  \r\n\r\n" +
					"8. #users per solution or product:  \r\n\r\n" +
					"9. Enter details about the customer background, project, situation:\r\n\r\n" +
					"10. Are there other SAP teams or support offerings involved for the requested CPC period?: \r\n\r\n")
			});
		},
		//move to base controller
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

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

		onSupportEnablementPress: function (oEvent) {
			this.eventUsage(false, "Support Enablement Link Triggered");
			// sap.m.URLHelper.redirect("https://sap.sharepoint.com/sites/200109/SitePages/SAP-Support-Enablement-for-Front-Roles.aspx", true);// open in new tab
			window.open("https://sap.sharepoint.com/sites/200109/SitePages/SAP-Support-Enablement-for-Front-Roles.aspx", "", "width=" + screen.availWidth +
				",height=" + screen.availHeight); // open in new window as full screen
		},

		onCreateIssue: function (oEvent) {
			this.getRouter().navTo("escalationRequestStart", {
				layout: "OneColumn",
				custnum: false
			});
		}

	});
});