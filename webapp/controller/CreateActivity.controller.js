sap.ui.define([
	"sap/support/fsc2/controller/BaseController",
	"sap/support/fsc2/model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/support/fsc2/model/models",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment"
], function (BaseController, formatter, JSONModel, Filter, ODataModel, models, MessageBox, Fragment) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.CreateActivity", {

		formatter: formatter,
		onInit: function () {
			this.setModel(new JSONModel({
				"CustomerNo": "",
				"CustomerName": "",
				"RequestDesc": "",
				"Description": "",
				"TransType": "ZS46",
				"Case_ID": "",
				"ActivityCat": "",
				"ActivityServiceTeam": ""
			}), "createActivity");

			var oCustSearchModel = models.createCustSearchModel();
			this.setModel(oCustSearchModel, "customerSearch");
			this.setModel(new JSONModel({}), "customerList");
			this.getRouter().getRoute("createThroughSpecialUrl").attachPatternMatched(this._specialUrlMatched, this);
			this.getRouter().getRoute("createThroughSpecialUrl1").attachPatternMatched(this._specialUrlMatched, this);
			this.getRouter().getRoute("createThroughSpecialUrl2").attachPatternMatched(this._specialUrlMatched, this);
			this.getRouter().getRoute("createThroughSpecialUrl3").attachPatternMatched(this._specialUrlMatched, this);
			this.getRouter().getRoute("createThroughSpecialUrl4").attachPatternMatched(this._specialUrlMatched, this);
			this.getRouter().getRoute("createThroughSpecialUrl5").attachPatternMatched(this._specialUrlMatched, this);
		},

		_specialUrlMatched: function (oEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			this.oArgs = oEvent.getParameter("arguments");
		
			var sCustomerNo;
			try{

				sCustomerNo = this.oArgs.erpcust.trim();
			} catch (e) {
				console.info("No customer provided in custom URL");
			}
			this.getModel("createActivity").setProperty("/CustomerNo", sCustomerNo || "");
			this.getModel("createActivity").setProperty("/Description", this.oArgs.title || "");
			this.getModel("createActivity").setProperty("/RequestDesc", decodeURIComponent(this.oArgs.desc || ""));
			this.getModel("createActivity").setProperty("/Case_ID", this.oArgs.caseid || "");
			this.getModel("createActivity").setProperty("/ActivityCat", this.oArgs.category || "");
			this.getModel("createActivity").setProperty("/ActivityServiceTeam", this.oArgs.serviceteam || "");

			if (sCustomerNo) {
				let oFilter = new Filter({
					filters: [
						new Filter("Accuracy", "EQ", "X"),
						new Filter("Customer_No", "EQ", sCustomerNo)
					],
					and: true
				});
				this.getView().setBusy(true);
				sap.support.fsc2.FSC2Model.read("/CustomerInfoSet", {
					filters: [oFilter],
					headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
					success: function (oData) {
						this.getView().setBusy(false);
						if (oData.results && oData.results[0]) {
							this.getModel("createActivity").setProperty("/CustomerName", oData.results[0].Customer_Name);
						}
					}.bind(this),
					error: function (oError) {
						this.getView().setBusy(false);
						this.showErrorMessage(oError);
					}.bind(this)
				});
			}
		},

		handleSubmit: function (oEvent) {
			var oViewData = this.getModel("createActivity").getData();
			if (oViewData.CustomerNo.length === 0 || oViewData.Description.length === 0 || oViewData.RequestDesc.length === 0) {
				return false;
			}
			this.getView().byId("submit_new").setEnabled(false);
			this.getView().setBusy(true);
			var oEntry = this.getModel("createActivity").getData();
			if (this.sSelectedCustomer) {
				oEntry.CustomerNo = this.sSelectedCustomer;
			}
			sap.support.fsc2.FSC2Model.create("/FSC2RequestSet", oEntry, {
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oResponceData) {
					this.getView().setBusy(false);
					this.getView().byId("submit_new").setEnabled(true);
					this.Create = {
						"ID": oResponceData.ID,
						"Type": oResponceData.TransType,
						"ResultText": oResponceData.ResultText,
						"CustomerNo": oResponceData.CustomerNo,
						"CustomerName": oResponceData.CustomerName,
						"Case_ID" : oResponceData.Case_ID
					};
					if (oResponceData.TransType === "ZS46") { //Activity
						this.eventUsage(false, "Create an Activity in MCC SOS app");
					}

					this.sSelectedCustomer = null;

					sap.ACreated = true
					this.onUploadComplete(this.Create.ID);

				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.getView().byId("submit_new").setEnabled(true);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		handleCancel: function () {
			this._handleMessageBoxOpen(this.getResourceBundle().getText("txt_createCancel1"), "warning", "back");
		},

		_handleMessageBoxOpen: function (sMessage, sMessageBoxType, sNav) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						if (sNav === "back") {
							this.onNavBack();
						} else {
							this.onNavToDashboard();
						}
					}
				}.bind(this)
			});
		},

		onUploadComplete: function (oEvent) {
			this.getView().setBusy(false);
			var sDisplayMsg = this.Create.ResultText;
			var sPriority = "";
			var sTransType = this.Create.Type;
			MessageBox.success(
				sDisplayMsg, {
					styleClass: "sapUiSizeCompact",
					onClose: function (oAction) {
						this.onNavToDetail();
					}.bind(this)
				}
			);
		},

		onNavToDetail: function (oEvent) {
			if (this.Create.Type && this.Create.Type !== "") {
				this.onNavToCriticalRequest(this.Create.Type, this.Create.ID, "", 2);
			} else {
				this.getRouter().navTo("OtherRequests", {
					layout: "OneColumn"
				});
			}
		},

		onInputHelp: function (oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("sap.support.fsc2.view.fragments.CustomerSearch", this);
				this.getView().addDependent(this._oDialog);
			}
			this._oDialog.open();
		},

		onSearch: function (oEvent) {
			var oSearchForm = this.getModel("customerSearch").getData();
			var sValue = oSearchForm.genericSearch;
			var that = this;
			this._oDialog.setBusy(true);
			this.searchCustomers(sValue).then(
				function (oData) {
					//success
					that.getModel("customerList").setData(oData);
					that._openSelectDialog();
				},
				function (error) {
					sap.m.MessageToast.show("CustomerInfoSet Service Unavailable!");
				}
			).finally(function () {
				that._oDialog.setBusy(false);
			});
		},

		onCloseDialog: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			if (oDialog.getProperty("title") === this.getResourceBundle().getText("customerSearch")) {
				this.getModel("customerSearch").setProperty("/CustomerNo", "");
				this.getModel("customerSearch").setProperty("/CustomerName", "");
				this.getModel("customerSearch").setProperty("/CustomerBPNo", "");
			}
			oDialog.close();
		},

		_openSelectDialog: function () {
			if (!this._oSelectDialog) {
				this._oSelectDialog = sap.ui.xmlfragment("idSelectFrag", "sap.support.fsc2.view.fragments.CustomerList", this);
				this.getView().addDependent(this._oSelectDialog);
			}
			this._oSelectDialog.open();
		},

		onConfirm: function (oEvent) {
			this.eventUsage(false, "Search customer through value help");
			var sCaseID = this.getModel("createActivity").getProperty("/CaseID");
			if (this.getModel("customerList").getData().length !== 0) {
				var oTable = sap.ui.core.Fragment.byId("idSelectFrag", "idCustListTab");
				if (oTable.getSelectedItem()) {
					this.sCustomerNo = oTable.getSelectedItem().getCustomData()[0].getValue();
					var sCustNo = oTable.getSelectedItem().getCells()[0].getText();
					var sCustName = oTable.getSelectedItem().getCells()[1].getText();
					this.bCustomerFound = true;
					this._oSelectDialog.close();
					this._oDialog.close();
					this.getModel("customerSearch").setProperty("/CustomerNo", "");
					this.getModel("customerSearch").setProperty("/CustomerName", "");
					this.getModel("customerSearch").setProperty("/CustomerBPNo", "");
					oTable.removeSelections();
					//----Add by I319741: When user select another customer by 'InputHelp' should re-Initial page---//
					/*	this.getModel("createCriticalSituation").setData({
							"CustomerNo": sCustNo + " - " + sCustName,
							"CustomerName": sCustName,
							"CustomerNoEdit": true,
							"BusinessImpact": {
								"Text": ""
							},
							"Description": "",
							"Title": "Request support for critical situation",
							"RequestReason": "",
							"AllSelected": [],
							"IncidentTitle": this.getResourceBundle().getText("incident") + "(0)",
							"CaseID": sCaseID
						});*/
					//keep the other properties intact
					/** the previous state of the create critical situation escalation form */
					var oCreateActivityModel = this.getModel("createActivity");
					oCreateActivityModel.setProperty("/CustomerNo", sCustNo + " - " + sCustName);
					this.sSelectedCustomer = sCustNo;
					oCreateActivityModel.setProperty("/CustomerName", sCustName);
					// oCreateActivityModel.setProperty("/IncidentTitle", this.getResourceBundle().getText("incident") + "(0)");
					// oCreateActivityModel.setProperty("/AllSelected", []);

				} else {
					sap.m.MessageToast.show("Please select one item before confirm");
				}
			}
		}

		// onSearchCustomerName: function () {
		// 	this.eventUsage(false, "Search customer based on customer no.");
		// 	var oCustomer = this.getView().byId("idCustNo");
		// 	oCustomer.setBusy(true);
		// 	/** old create critical situation model */
		// 	var oDataCreateSituation = this.getModel("createActivity").getData(); //getProperty("/CustomerNo");
		// 	var sCustomerNo = oDataCreateSituation.CustomerNo.trim();
		// 	var oFilter = new Filter({
		// 		filters: [
		// 			new Filter("Accuracy", "EQ", "X"),
		// 			new Filter("Customer_No", "EQ", sCustomerNo)
		// 		],
		// 		and: true
		// 	});
		// 	if (sCustomerNo !== "") {
		// 		sap.support.fsc2.FSC2Model.read("/CustomerInfoSet", {
		// 			filters: [oFilter],
		// 			success: function (oData) {
		// 				oCustomer.setBusy(false);
		// 				var sCustomerName = "";
		// 				if (oData.results && oData.results[0]) {
		// 					sCustomerName = oData.results[0].Customer_Name;
		// 					this.getView().byId("idCustNo").setValue(sCustomerNo + " - " + sCustomerName);
		// 					this.sCustomerNo = formatter.trimPreZeros(oData.results[0].Customer_No);
		// 					this.checkConsistCustomer_Case();
		// 					this.bCustomerFound = true;
		// 				} else {
		// 					this.sCustomerNo = "";
		// 					this.bCustomerFound = false;
		// 					sap.m.MessageBox.warning("Couldn't find customer.\nPlease search the exact customer number.", {
		// 						title: "Warning",
		// 						actions: [sap.m.MessageBox.Action.CLOSE]
		// 					});
		// 					sCustomerName = "";
		// 				}
		// 				this.getModel("createActivity").setData({
		// 					"CustomerNo": oData.results[0] ? (sCustomerNo + " - " + sCustomerName) : "",
		// 					"CustomerNoEdit": true,
		// 					"CustomerName": sCustomerName,
		// 					"BusinessImpact": {
		// 						"Text": ""
		// 					},
		// 					"Description": oDataCreateSituation.Description,
		// 					"Title": oDataCreateSituation.Title, //"Request support for critical situation",
		// 					"RequestReason": "",
		// 					"AllSelected": [],
		// 					"IncidentTitle": this.getResourceBundle().getText("incident") + "(0)",
		// 					"CaseID": this.sEnableCase ? oDataCreateSituation.CaseID : "",
		// 					"IsBusiDown": oDataCreateSituation.IsBusiDown,
		// 				});

		// 			}.bind(this),
		// 			error: function (oError) {
		// 				this.sCustomerNo = "";
		// 				oCustomer.setBusy(false);
		// 				this.showErrorMessage(oError);
		// 			}.bind(this)
		// 		});
		// 	} else {
		// 		oCustomer.setBusy(false);
		// 	}
		// }

	});

});