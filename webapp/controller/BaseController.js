/*global history*/

sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/core/routing/History',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/support/fsc2/model/formatter',
	'sap/ui/Device',
	'sapit/controls/EmployeePopover',
	'sapit/controls/EmployeeSearchDialog'
], function (Controller, History, JSONModel, Filter, formatter, Device, EmployeePopover, EmployeeSearchDialog) {
	"use strict";

	return Controller.extend("sap.support.fsc2.controller.BaseController", {
		/**
		 * Convenience method for accessing the event bus.
		 * @public
		 * @returns {sap.ui.core.EventBus} the event bus for this component
		 */
		getEventBus: function () {
			return this.getOwnerComponent().getEventBus();
		},

		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getOwnerComponent().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getOwnerComponent().setModel(oModel, sName);
		},
		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to a route passed to this function.
		 *
		 * @public
		 * @param {string} sRoute the name of the route if there is no history entry
		 * @param {object} mData the parameters of the route, if the route does not need parameters, it may be omitted.
		 */
		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				//	var bReplace = true;
				this.getRouter().navTo("dashboard", {
					layout: "OneColumn"
				});
			}
		},
		onNavHome: function () {
			this.getRouter().navTo("homepage", {}, true);
		},
		onNavToDashboard: function () {
			this.getRouter().navTo("dashboard", {
				layout: "OneColumn"
			});
		},

		/******comment: reset 'createCriticalSituation' model which used in the CreateCriticalSituationN.controller.js******/
		onGiveUpCreateCritical: function () {
			var sCriSitModel = this.getOwnerComponent().getModel("createCriticalSituation");
			var sIncidentModel = this.getOwnerComponent().getModel("incidentList");
			var selectedIncidentList = this.getOwnerComponent().getModel("selectedIncidentList");
			if (sCriSitModel) {
				sCriSitModel.setData({
					"CustomerNo": "",
					"CustomerNoEdit": true,
					"CustomerName": "",
					"BusinessImpact": {
						"Text": ""
					},
					"CaseID": "",
					"Description": this.getModel("i18n").getResourceBundle().getText("requestHint"),
					"Description1": this.getModel("i18n").getResourceBundle().getText("requestHint1"),
					"Description2": "",
					"Description3": "",
					"Description4": "",
					"Description5": "",
					"Description6": "",
					"Title": "Request Support for Critical Situation",
					"RequestReason": "",
					"AllSelected": [],
					"IncidentTitle": this.getResourceBundle().getText("incidentTitle") + "(0)"
				});
				sIncidentModel.setData({
					"results": []
				});
				selectedIncidentList.setData({});
			}
		},

		onNavToCriticalRequest: function (transType, activityId, sStatus, level) {
			if (level === 2) {
				if (transType === "sn_customerservice_escalation") { // snow escalation
					this.eventUsage("servicenow escalation \'view");
					this.getRouter().navTo("requestDetails", {
						layout: "TwoColumnsMidExpanded",
						id: activityId,
						transType: transType
					});
				} else if (transType === "ZS31") { // global escalation request   
					this.eventUsage("\'escalation request\'");
					this.getRouter().navTo("escalationRequest", {
						layout: "TwoColumnsMidExpanded",
						activityid: activityId,
						editable: sStatus === "Draft" ? true : false
					});
				} else if (transType === "ZS46") {
					this.eventUsage("mccDetail \'view");
					this.getRouter().navTo("mccDetailRequest", {
						layout: "TwoColumnsMidExpanded",
						activity_id: activityId
					});
				}
			} else if (level === 3) {
				if (transType === "sn_customerservice_escalation") {
					this.eventUsage("cimrequest \'view");
					this.getRouter().navTo("requestDetailEnd", {
						layout: "EndColumnFullScreen",
						id: activityId,
						transType: transType
					});
				} else if (transType === "ZS31") { // global escalation request   
					this.eventUsage("\'escalation request\'");
					this.getRouter().navTo("escalationRequestDetailEnd", {
						layout: "EndColumnFullScreen",
						activityid: activityId,
						editable: sStatus === "Draft" ? true : false
					});
				} else if (transType === "ZS46") {
					this.eventUsage("mccDetail \'view");
					this.getRouter().navTo("mccDetailEnd", {
						layout: "EndColumnFullScreen",
						activity_id: activityId
					});
				}
			}
		},

		/*onError2MessageBoxPress: function () {
			MessageBox.error("Product A does not exist.", {
				actions: ["Manage Products", MessageBox.Action.CLOSE],
				emphasizedAction: "Manage Products",
				onClose: function (sAction) {
					MessageToast.show("Action selected: " + sAction);
				}
			});
		},*/

		showErrorMessage: function (oError) {
			var sMessage = (oError.message === undefined) ? 'Http Request failed' : oError.message; //NOW service doesnt provide .message
			var sJsonResponse;
			if (oError.status === 504) { // for GW timeout
				sJsonResponse = oError.responseText.replace(/<[^>]+>/g, ''); //remove html
			} else {
				sJsonResponse = JSON.parse(oError.responseText);
			}
			if (sJsonResponse.error && sJsonResponse.error.detail) {
				if (sJsonResponse.error.detail.includes(
						"Operation against file 'sn_customerservice_escalation' was aborted by Business Rule 'SAP - Link existing or dummy case record")) {
					sJsonResponse.error.detail =
						"Time out error occurred. Please wait 1 minute and check for the customer message if the creation of the escalation record was successful";
				}
			}

			sap.m.MessageBox.show(sMessage, {
				icon: sap.m.MessageBox.Icon.ERROR,
				title: sMessage,
				actions: ["More info in KBA", sap.m.MessageBox.Action.CLOSE],
				emphasizedAction: sap.m.MessageBox.Action.CLOSE,
				details: sJsonResponse /*JSON.parse(oError.responseText)*/ ,
				styleClass: "sapUiSizeCompact",
				onClose: function (sAction) {
					//MessageToast.show("Action selected: " + sAction);
					if (sAction === "More info in KBA") {
						var sUrlEnd = "//launchpad.support.sap.com/#/notes/3020524";
						window.open("https:" + sUrlEnd);
					}
				}
			});
		},
		onOpenExpertDialog: function () {
			if (!this._oExpertDialog) {
				var oRadioGroup = new sap.m.RadioButtonGroup();
				// oRadioGroup.addButton(new sap.m.RadioButton({
				// 	text: "CIM Request"
				// }));
				// oRadioGroup.addButton(new sap.m.RadioButton({
				// 	text: "MCC Activity"
				// }));
				oRadioGroup.addButton(new sap.m.RadioButton({
					text: "Critical Case / Incident / Customer Situation Escalation Request"
				}));
				oRadioGroup.addButton(new sap.m.RadioButton({
					text: "Global Escalation Request"
				}));
				this._oExpertDialog = new sap.m.Dialog({
					title: "Expert mode - Please select which request you want to create", //"Select"
					content: [oRadioGroup],
					contentWidth: "40%",
					stretch: "{device>/isPhone}",
					beginButton: new sap.m.Button({
						text: "Confirm",
						press: function () {
							this.onConfirmRequestSelect(oRadioGroup);
						}.bind(this)
					}),
					endButton: new sap.m.Button({
						text: "Cancel",
						press: function () {
							this._oExpertDialog.close();
						}.bind(this)
					})
				});
				this.getView().addDependent(this._oExpertDialog);
			}
			this._oExpertDialog.open();
		},
		onConfirmRequestSelect: function (oRadioGroup) {
			var oSelectedIndex = oRadioGroup.getSelectedIndex();
			/*
			var sHost = location.host,
				sSystem0,
				sSystem1,
				sSystem2;
			var sCreateRUL = "";
			var sHttps = "Https://";
			if (sHost.indexOf("br339jmc4c") !== -1) { //Dev or Dev fiorilaunchpad
				sSystem0 = "dgq5qdz5dm.dispatcher.int.sap.eu2"; //CIm request
				sSystem1 = "br339jmc4c.dispatcher.int.sap.eu2"; //MCC activity
				sSystem2 = "pgdmain"; //Escalation
			} else if (sHost.indexOf("sapitcloudt") !== -1) { //Demo or Test or Test fiorilaunchpad
				sSystem0 = "tnxd3nxr8c.dispatcher.int.sap.eu2";
				sSystem1 = "sapitcloudt.dispatcher";
				sSystem2 = "pgtmain";
			} else { //P or P fiorilaunchpad
				sSystem0 = "supportportal.dispatcher";
				sSystem1 = "sapitcloud.dispatcher";
				sSystem2 = "pgpmain";
			}
			if (oSelectedIndex === 0) {
				this.eventUsage("\'CIM Request\' App");
				sCreateRUL = "cimrequest-" + sSystem0 + ".hana.ondemand.com/#/createCIMReq"; //".dispatcher.int.sap.hana.ondemand.com/#/createCIMReq";
				window.open(sHttps + sCreateRUL);
			} else if (oSelectedIndex === 1) {
				this.eventUsage("\'MCC Activities\' App");
				sCreateRUL = "mccactivity-" + sSystem1 + ".hana.ondemand.com/#/create";
				window.open(sHttps + sCreateRUL);
			} else {
				this.eventUsage("\'Escalation Request\' App");
				this.getRouter().navTo("escalationRequestStart");
				// sCreateRUL = sSystem2 + ".wdf.sap.corp/sap/bc/ui5_ui5/sap/zs_dashboard/EscalationRequest.html";
			} */
			// window.open(sHttps + sCreateRUL);
			if (oSelectedIndex === 0) {
				this.eventUsage("create\' view");
				this.getRouter().navTo("createByDefault", {
					layout: "OneColumn"
				});
			} else {
				this.eventUsage("\'Escalation Request\' App");
				this.getRouter().navTo("escalationRequestStart", {
					layout: "OneColumn",
					custnum: false
				});
			}
			this._oExpertDialog.close();
		},
		onCustomerName: function () {
			var customerNo = (Array(10).join("0") + this.CustomerNo).slice(-10);
			this.getRouter().navTo("customer", {
				custnum: customerNo,
				custname: encodeURIComponent(this.CustomerName),
				favorite: false,
				layout: "MidColumnFullScreen"
			});
		},

		eventUsage: function (oRoute, sEventName) {
			if (oRoute) {
				sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), "Navigate to \'" + oRoute);
			} else {
				sap.git.usage.Reporting.addEvent(this.getOwnerComponent(), sEventName);
			}
		},
		getMonthDesc: function (sMonth) { //switch Month 1 to "Jun"
			var oMonth;
			switch (sMonth) {
			case 1:
				oMonth = "Jan";
				break;
			case 2:
				oMonth = "Feb";
				break;
			case 3:
				oMonth = "Mar";
				break;
			case 4:
				oMonth = "Apr";
				break;
			case 5:
				oMonth = "May";
				break;
			case 6:
				oMonth = "June";
				break;
			case 7:
				oMonth = "July";
				break;
			case 8:
				oMonth = "Aug";
				break;
			case 9:
				oMonth = "Sept";
				break;
			case 10:
				oMonth = "Oct";
				break;
			case 11:
				oMonth = "Nov";
				break;
			case 12:
				oMonth = "Dec";
				break;
			}
			return oMonth;
		},
		loadSettingData: function () {
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "NEED_FSC2_PUSHNOTIFICATION")
				],
				success: function (oData) {
					if (oData.results[0].Value === "YES") {
						this.getModel("homePageConfig").setProperty("/enableNotification", true);
					} else {
						this.getModel("homePageConfig").setProperty("/enableNotification", false);
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("UserProfile Service Unavailable!");
				}
			});
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "APP_FSC2_EXPERT_MODE")
				],
				success: function (oData) {
					if (oData.results[0].Value === "YES") {
						this.getModel("homePageConfig").setProperty("/expertMode", true);
					} else {
						this.getModel("homePageConfig").setProperty("/expertMode", false);
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("UserProfile Service Unavailable!");
				}
			});
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "APP_FSC2_USE_ENG_CASE")
				],
				success: function (oData) {
					if (oData.results[0].Value === "YES") {
						this.getModel("homePageConfig").setProperty("/enableDefaultCase", true);
					} else {
						this.getModel("homePageConfig").setProperty("/enableDefaultCase", false);
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("UserProfile Service Unavailable!");
				}
			});
			//load default case for current user
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "APP_MCC_ACTIVITIES_DEFAULT_CASE")
				],
				success: function (oData) {
					if (oData.results && oData.results[0]) {
						this.getModel("homePageConfig").setProperty("/defaultCase", oData.results[0].Value);
						this.loadCustomerNoByCase();
					} else {
						this.getModel("homePageConfig").setProperty("/defaultCase", "");
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("UserProfile Service Unavailable!");
				}
			});
			//load SaM enablement for current user
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "APP_FSC2_USE_SAM")
				],
				success: function (oData) {
					if (oData.results && oData.results[0] && oData.results[0].Value === "NO") {
						this.getModel("homePageConfig").setProperty("/enableSaM", false);
					} else if (oData.results && oData.results[0] && oData.results[0].Value === "YES") {
						this.getModel("homePageConfig").setProperty("/enableSaM", true);
					} else {
						this.getModel("homePageConfig").setProperty("/enableSaM", true);
						var oSaMEntry = {
							"Attribute": "APP_FSC2_USE_SAM",
							"Value": "YES"
						};
						sap.support.fsc2.UserProfileModel.create("/Entries", oSaMEntry);
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("UserProfile Service Unavailable!");
				}
			});
		},
		loadCustomerNoByCase: function () {
			var sCaseID = this.getModel("homePageConfig").getProperty("/defaultCase");
			if (!sCaseID) {
				this.getModel("homePageConfig").setProperty("/defaultCustNo", "");
				return;
			}
			sap.support.fsc2.FSC2Model.read("/CasesSet", {
				filters: [
					new Filter("case_id", "EQ", sCaseID),
					new Filter("case_type", "EQ", "ZS02"),
					new Filter("status", "EQ", "71"),
					new Filter("status", "EQ", "80"),
					new Filter("status", "EQ", "81"),
					new Filter("status", "EQ", "99")
				],
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					if (oData.results && oData.results.length > 0) {
						var sCustNo = oData.results[0].customer_r3_no;
						sCustNo = formatter.trimPreZeros(sCustNo);
						this.getModel("homePageConfig").setProperty("/defaultCustNo", sCustNo);
						this.getModel("homePageConfig").setProperty("/defaultCustName", oData.results[0].customer_name);
					}
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		onCloseInputSuggest: function () {
			var that = this;
			var aInputs = $('input');
			if (aInputs && aInputs[0]) {
				for (var i = 0; i < aInputs.length; i++) {
					aInputs[i].autocomplete = "off";
				}
			} else {
				setTimeout(function () {
					that.onCloseInputSuggest();
				}, 500);
			}
		},
		refreshFavoriteIncidentsModel: function () {
			this.getModel("favorite").setProperty("/BCIncident", {
				"count": 0,
				"expanded": false,
				"loadComplete": false,
				"results": []
			});
			this.getModel("favorite").setProperty("/SnowCase", {
				"count": 0,
				"expanded": false,
				"loadComplete": false,
				"results": []
			});
			this.getModel("favorite").setProperty("/Incident", {
				"count": 0,
				"expanded": false,
				"loadComplete": false,
				"results": []
			});
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "FAVORITE_INCIDENTS"),
					new Filter("Attribute", "EQ", "FAVORITE_ESCALATION_RECORDS")
				],
				success: function (oData) {
					var aIncidents = [],
						aSNOW = [],
						aEscalations = [];
					oData.results.forEach(function (x) {
						if (x.Attribute === "FAVORITE_ESCALATION_RECORDS") {
							x.Value = JSON.parse(x.Value).sys_id;
							aEscalations.push(x);
						}
						if (x.Value && x.Value.substr(0, 2) === "CS") {
							aSNOW.push(x);
						} else {
							aIncidents.push(x);
						}
					});
					var sData = {
						"favIncidents": aIncidents,
						"favSNOWCases": aSNOW,
						"results": aIncidents.concat(aSNOW).concat(aEscalations)
					};
					this.getModel("favoriteIncidents").setData(sData);
					this.loadFavIncidentData();
					//		this.loadFavSNOWCaseData();
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("UserProfile Service Unavailable!");
				}
			});
		},
		loadFavSnowEscalationData: function () {
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "FAVORITE_ESCALATION_RECORDS")
				],
				success: function (oData) {
					var aData = oData.results;
					var aSituation = [];
					for (var i = 0, len = aData.length; i < len; i++) {

						aData[i].Action = "X";
						var oEscaObj = JSON.parse(aData[i].Value);
						aData[i].CustomerName = oEscaObj.customerName;
						aData[i].Description = oEscaObj.desc;
						aData[i].ID = oEscaObj.escaNum;
						aData[i].SysID = oEscaObj.sys_id;
						aData[i].TransType = "sn_customerservice_escalation";
						aSituation.push(aData[i]);
					}
					var count = this.getModel("favorite").getProperty("/Situation/count");
					var newCount = count + aSituation.length;
					this.getModel("favorite").setProperty("/Situation", {
						"count": newCount, //i338673 fix
						"expanded": newCount.length ? true : false,
						"loadComplete": true,
						/******comment: Data load completed******/
						"results": this.getModel("favorite").getProperty("/Situation/results").concat(aSituation)
					});
				}.bind(this),
				error: function (err) {
					sap.m.MessageToast.show("Service Unavailable!");
				}.bind(this)
			});
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

		loadFavCustData: function () {
			this.getModel("favorite").setProperty("/Customer", {
				"count": 0,
				"expanded": false,
				"loadComplete": false,
				"results": []
			});
			this.getModel("favorite").setProperty("/Situation", {
				"count": 0,
				"expanded": false,
				"loadComplete": false,
				"results": []
			});
			sap.support.fsc2.FSC2Model.read("/FavoriteObjectSet", {
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					var aData = oData.results;
					var aCustomer = [],
						aSituation = [];
					for (var i = 0, len = aData.length; i < len; i++) {
						aData[i].Action = "X";
						if (aData[i].FavoriteType === "FAVORITE_CUSTOMERS") {
							aData[i].Type = "FAVORITE_CUSTOMERS";
							aData[i].Picture = sap.support.fsc2.FSC2ModelUrl + "/CustomerInfoSet(%27" + aData[i].CustomerNo + "%27)/$value";
							aCustomer.push(aData[i]);
						} else {
							aData[i].Type = formatter.formatCriticalTansType(aData[i].TransType);
							aSituation.push(aData[i]);
						}
					}
					this.getModel("favorite").setProperty("/Customer", {
						"count": aCustomer.length,
						"expanded": aCustomer.length ? true : false,
						"loadComplete": true,
						"results": aCustomer
					});
					this.getModel("favorite").setProperty("/Situation", {
						"count": aSituation.length,
						"expanded": aSituation.length ? true : false,
						//"loadComplete": true, its not complete yet
						/******comment: Data load completed******/
						"results": aSituation
					});
					this.loadFavSnowEscalationData();

				}.bind(this),
				error: function (err) {
					sap.m.MessageToast.show("Service Unavailable!");
				}.bind(this)
			});
		},
		loadFavIncidentData: function () {
			var aFavEntries = this.getModel("favoriteIncidents").getData() || [];
			var sGroup = "myIncident";
			sap.support.fsc2.IncidentModel.setUseBatch(true);
			sap.support.fsc2.IncidentModel.setDeferredGroups([sGroup]);
			//for (var i = 0; i < aFavEntries.favIncidents.length; i++) {
			var favIncidents = aFavEntries.favIncidents || [];
			for (var i = 0; i < favIncidents.length; i++) {
				if (aFavEntries.favIncidents[i].Value !== "") {
					var aFilter = [new Filter("CssObjectID", "EQ", aFavEntries.favIncidents[i].Value)];
					sap.support.fsc2.IncidentModel.read("/IncidentList", {
						groupId: sGroup,
						filters: aFilter,
						headers: {
							"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
						},
					});
				}
			}
			var favSNOWCases = aFavEntries.favSNOWCases || []; // there is a better way to fix this
			if (favSNOWCases.length === 0) {
				this.getModel("favorite").setProperty("/SnowCase", {
					"count": 0,
					"expanded": false,
					"loadComplete": false,
					"results": []
				});
				sap.support.fsc2.IncidentModel.setUseBatch(false);
				this.loadIncidentComplete();
				//return; the code should fall through 
			}
			if (aFavEntries.favIncidents.length === 0) {
				this.getModel("favorite").setProperty("/SnowCase/loadComplete", true);
				this.getModel("favorite").setProperty("/BCIncident", {
					"count": 0,
					"expanded": false,
					"loadComplete": true,
					"results": []
				});
				sap.support.fsc2.IncidentModel.setUseBatch(false);
				this.loadIncidentComplete();
				return; //pointless but doesnt hurt
			} else {
				sap.support.fsc2.IncidentModel.setUseBatch(true); // otherwise success, error callbacks wont execute
				sap.support.fsc2.IncidentModel.submitChanges({
					groupId: sGroup,
					headers: {
						"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
					},
					success: function (oData) {
						var aFavEtyValue = [];
						var aFavNotFound = [];
						for (var j = 0; j < aFavEntries.favIncidents.length; j++) {
							aFavEtyValue.push(aFavEntries.favIncidents[j].Value);
						}
						var aResponses = oData.__batchResponses;
						var aResults = [];
						if (aResponses) {
							for (var k = 0; k < aResponses.length; k++) {
								var aData = aResponses[k].data.results;
								for (var i = 0; i < aData.length; i++) {
									var iInd = aFavEtyValue.indexOf(aData[i].CssObjectID);
									if (iInd !== -1) {
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
											"Field": aFavEntries.favIncidents[iInd].Field,
											"Type": "FAVORITE_INCIDENTS",
											"Escalation": aData[i].Escalation === "X" ? true : false,
											"Active": aData[i].ActiveSystem === "" ? true : false
										});
									}
								}
							}
						}
						//objects that were not found/loaded from IncidentList --> try SNOW
						aFavEtyValue.forEach(function (item) {
							var bFound = false;
							aResults.forEach(function (x) {
								if (x.ID === item) {
									bFound = true;
								}
							});
							if (bFound === false) {
								aFavNotFound.push(item);
							}
						});
						this.getModel("favorite").setProperty("/BCIncident", {
							"count": aResults.length,
							"expanded": aResults.length ? true : false,
							"loadComplete": true,
							/******comment: Data load completed******/
							"results": aResults
						});

						sap.support.fsc2.IncidentModel.setUseBatch(false);
						//	this.loadIncidentComplete();
						//this.loadFavSNOWCaseData(aFavNotFound);
						if (aFavNotFound.join("").length > 0) {
							this.loadFavSNOWCaseData(aFavNotFound);
						} else {
							this.getModel("favorite").setProperty("/SnowCase/loadComplete", true);
						}
					}.bind(this),
					error: function () {
						sap.m.MessageToast.show("IncidentList Service Unavailable!");
						sap.support.fsc2.IncidentModel.setUseBatch(false);
					}.bind(this)
				});
			}
		},
		loadFavSNOWCaseData: function (aID) {
			var aFavSNOWCase = this.getModel("favoriteIncidents").getProperty("/favSNOWCases");
			var sEnableSnowCase = this.getModel("EnableSnowCase").getProperty("/bEnable");
			if (!sEnableSnowCase || (aFavSNOWCase.length === 0 && aID.length === 0)) {
				this.getModel("favorite").setProperty("/SnowCase", {
					"count": 0,
					"expanded": false,
					"loadComplete": true,
					"results": []
				});
				this.loadIncidentComplete();
				return;
			} else {
				var aNumberFilter = "";
				var aIDFilter = "";
				aFavSNOWCase.forEach(function (x, index) {
					if (index === 0) {
						aNumberFilter = x.Value;
					} else {
						aNumberFilter = aNumberFilter + "," + x.Value;
					}
				});
				aID.forEach(function (x, index) {
					if (index === 0) {
						aIDFilter = encodeURIComponent(x);
					} else {
						aIDFilter = aIDFilter + "," + encodeURIComponent(x);
					}
				});
				var oDataService = {
					"number": aNumberFilter === "" ? "" : "numberIN" + aNumberFilter,
					"id": aIDFilter === "" ? "" : "correlation_idIN" + aIDFilter,
					"seperator": aIDFilter !== "" && aNumberFilter !== "" ? "^OR" : "",
					"sysparm_fields": "number,correlation_display,sys_updated_by,sys_updated_on,escalation,sys_id,short_description,correlation_id,u_case_number,priority,state,account.number,account.name,account.country,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,u_app_component.u_short_description,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,u_deployed_item.u_environment,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,resolution_code,resolved_by,resolved_at,close_notes,u_deployed_item.u_data_center_region,u_deployed_item.u_data_center,u_last_user_updated_by,opened_at,closed_at,u_sold_item.u_sold_item_name,u_escalation_type,u_escalation_reason,active_escalation.opened_at"

				};
				var sUrl = sap.support.fsc2.servicenowUrl + "?sysparm_query=" + oDataService.number + oDataService.seperator + oDataService.id +
					"&sysparm_fields=" + oDataService.sysparm_fields;
				$.ajax({
					method: "GET",
					// data: oDataService,
					contentType: "application/json",
					headers: {
						'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO", //API Management: ID for MCC SOS App
					},
					url: sUrl,
					// url: sap.support.fsc2.servicenowUrl,
					success: function (oData) {
						var sData = [];
						oData.result.forEach(function (x) {
							sData.push({
								"ID": x.correlation_id,
								"SNow_number": x.number,
								"ShortID": x.correlation_display,
								"Name": x["account.name"],
								"ComponentName": x["u_app_component.u_name"],
								"Description": x.short_description,
								"Priority": formatter.SnowCasePriorityTxt(x.priority),
								"PriorityID": x.priority,
								"Status": formatter.SnowCaseStatusTxt(x.state),
								"Action": "X",
								"Field": "",
								"Type": "FAVORITE_INCIDENTS",
								"Escalation": x.escalation === "1" ? true : false,
								"Active": x.u_responsible_party === "sno" ? "true" : false
							});
						});
						this.getModel("favorite").setProperty("/SnowCase", {
							"count": sData.length,
							"expanded": false,
							"loadComplete": true,
							"results": sData
						});
						this.loadIncidentComplete();
					}.bind(this),
					error: function (a, b, c) {
						sap.m.MessageToast.show("Service now API Unavailable");
					}
				});
			}
		},
		loadIncidentComplete: function () {
			var that = this;
			var oBCINcidents = this.getModel("favorite").getProperty("/BCIncident");
			var oSNOWCases = this.getModel("favorite").getProperty("/SnowCase");
			if (oBCINcidents.loadComplete && oSNOWCases.loadComplete) {
				var obj = {
					"count": oBCINcidents.count + oSNOWCases.count,
					"expanded": false,
					"loadComplete": true,
					"results": oBCINcidents.results.concat(oSNOWCases.results)
				};
				this.getModel("favorite").setProperty("/Incident", obj);
			} else {
				setTimeout(function () {
					that.loadIncidentComplete();
				}, 200);
			}
		},

		loadAssignedToMe: function () {
			var aFilter = [];
			var sUserId = this.getModel("CurrentUserInfo").getProperty("/UserID");
			if (this.getView().byId("ActivityFilter")) {
				var statusFilter = this.getView().byId("ActivityFilter").getSelectedKey();
			}
			if (statusFilter && statusFilter !== "all") {
				aFilter.push(new Filter("activity_sys_status", "EQ", statusFilter));
			} else {
				aFilter.push(new Filter("activity_sys_status", "EQ", "01_NOT_COMP"));
			}
			aFilter.push(new Filter("assignedtome", "EQ", "X"));
			aFilter.push(new Filter("activity_process_type", "EQ", "ZS46"));
			/*aFilter.push(new Filter({
				filters: [
					new Filter("activity_status", "NE", "E0013"),
					new Filter("activity_status", "NE", "E0014"),
					new Filter("activity_status", "NE", "E0026")
				],
				and: true
			}));*/

			sap.support.fsc2.FSC2Model.read("/FSC2ActivitySet", {
				filters: aFilter,
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					var iCount = 0;
					var iCountChanged = 0;
					if (oData.results.length > 0) {
						iCount = oData.results.length;
						oData.results.forEach(function (x) {
							/*	if (this.getModel("notification").getProperty("/results")) {
									this.getModel("notification").getProperty("/results").forEach(function (item) {
										if (item.object_id.indexOf(x.activity_id) > -1) {
											iCountChanged += 1;
										}
									});
								}*/
							var hours = Math.abs(new Date() - new Date(x.activity_change_date)) / 36e5;
							if (hours < 48) {
								iCountChanged += 1;
								x.Highlight = "Warning";
							} else {
								x.Highlight = "None";
							}
							x.activity_change_date_not_formatted = new Date(x.activity_change_date);
							x.activity_change_date = formatter.formatTime2(x.activity_change_date, false);
							x.StatusSort = formatter.formatStatusSort(x.activity_status);
						}.bind(this));
					}
					oData.results = oData.results.sort(function (a, b) {
						return b.activity_change_date_not_formatted - a.activity_change_date_not_formatted;
					});
					this.getModel("activitySet").setData(oData);
					this.getModel("homePageCount").setProperty("/myActivities", iCount);
					this.getModel("homePageCount").setProperty("/myActivitiesChanged", iCountChanged);
					this.loadAssignedToMeSNOW();
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					sap.m.MessageToast.show("FSC2ActivitySet Service Unavailable!");
				}.bind(this)
			});
		},
		loadAssignedToMeSNOW: function () {
			var sUserId = this.getModel("CurrentUserInfo").getProperty("/UserID");

			var oDataService = {
				"sysparm_order": "sys_updated_on",
				"u_escalation_type": 3,
				"sysparm_fields": "source_record.account.name,active,number,correlation_display,sys_updated_by,sys_id,short_description,state,sys_updated_on,sys_class_name,approval,needs_attention"
			};

			var sUrl =
				sap.support.fsc2.servicenowEscalationUrl + "?sysparm_query=requested_by.employee_number=" + sUserId + "%5Eu_escalation_type=" +
				oDataService.u_escalation_type + "%5Eapproval=more_info_required%5Eneeds_attention=false" + "&sysparm_fields=" + oDataService.sysparm_fields;

			$.ajax({
				method: "GET",
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sUrl,
				success: function (oData) {
					var aData = [];
					var iCountChanged = 0;
					oData.result.forEach(function (x) {
						x.sys_updated_on = x.sys_updated_on.replace(/-/g, "/"); // iOS does not allow '-' --> replace by /
						var hours = Math.abs(new Date() - new Date(x.sys_updated_on)) / 36e5;
						if (hours < 48) {
							iCountChanged += 1;
							var highlight = "Warning";
						} else {
							var highlight = "None";
						}
						aData.push({
							"SNowSysID": x.sys_id,
							"activity_id": x.number,
							"activity_description": x.short_description,
							"account_name_F": x["source_record.account.name"],
							"activity_change_date": new Date(x.sys_updated_on),
							"activity_process_type": x.sys_class_name,
							"activity_status_desc": formatter.SnowEscalationStatusTxt(x.state),
							"Highlight": highlight,
							"activity_change_date_not_formatted": new Date(x.sys_updated_on),
							"StatusSort": formatter.formatStatusSort(x.state)
						});

					});
					//slice to protect original array which contains all snow escs which is essential for counting and show more
					/*	var aSortedEscs = aData.sort(function (a, b) {
							return b.activity_change_date_not_formatted - a.activity_change_date_not_formatted;
						});*/
					var allData = this.getModel("activitySet").getProperty("/results").concat(aData);
					var aSortedEscs = allData.sort(function (a, b) {
						return b.activity_change_date_not_formatted - a.activity_change_date_not_formatted;
					});

					this.getModel("activitySet").setProperty("/results", aSortedEscs);
					this.getModel("homePageCount").setProperty("/myActivities", this.getModel("homePageCount").getProperty("/myActivities") +
						aData.length);
					this.getModel("homePageCount").setProperty("/myActivitiesChanged", this.getModel("homePageCount").getProperty(
						"/myActivitiesChanged") + iCountChanged);
					this.getModel("activitySet").setProperty("/loadComplete", true);
					this.getView().setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		loadMyRequests: function () {
			// filter user for Action myrequest
			// filter for Status !== E0013 Confirmed, E0014 Completed and E0026 Restricted and TransType ZS46
			//filter for Status !== E0016 Obsolete, E0012 accepted, E0013 rejected and TransType ZS31
			//AT THE MOMENT filter on trans type is not possible from odata side
			var filterUser = new Filter("Action", "EQ", "myrequest");
			/*var filterStatusZS46 = new Filter({
				filters: [
					new Filter("Status", "NE", "E0013"),
					new Filter("Status", "NE", "E0014"),
					new Filter("Status", "NE", "E0026")
				],
				and: false
			});
			var filterZS46 = new Filter({
				filters: [new Filter("TransType", "EQ", "ZS46"),
					filterUser, filterStatusZS46
				],
				and: true
			});
			var filterStatusZS31 = new Filter({
				filters: [
					new Filter("Status", "NE", "E0012"),
					new Filter("Status", "NE", "E0013"),
					new Filter("Status", "NE", "E0016")
				],
				and: false
			});
			var filterZS31 = new Filter({
				filters: [new Filter("TransType", "EQ", "ZS31"),
					filterUser, // filterStatusZS31
				],
				and: true
			});*/
			this.oAll = {
				"count": 0,
				"countChanged": 0,
				"results": []
			};
			sap.support.fsc2.FSC2Model.read("/FSC2RequestSet", {
				filters: [filterUser],
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					var iCount = 0;
					var iCountChanged = 0;
					var filteredData = [];

					for (var i = 0; i < oData.results.length; i++) {
						//	oData.results[i].ChangedAt = oData.results[i].ChangedAt.replace(/-/g, "/");// iOS does not allow '-' --> replace by /
						if (oData.results[i].TransType === "ZS46" && oData.results[i].Status !== "E0013" && oData.results[i].Status !== "E0014" &&
							oData.results[i].Status !== "E0026") {
							filteredData.push(oData.results[i]);
						} else if (oData.results[i].TransType === "ZS46" && ((oData.results[i].Status === "E0013" || oData.results[i].Status ===
									"E0014" || oData.results[i].Status === "E0026") && ((new Date() - new Date(oData.results[i].ChangedAt)) / (1000 * 3600 *
									24)) <
								60)) {
							filteredData.push(oData.results[i]); // only show activities for 2 months after reaching status
						} else if (oData.results[i].TransType === "ZS31" && oData.results[i].Status !== "E0013" && oData.results[i].Status !==
							"E0012" && oData.results[i].Status !== "E0016") {
							filteredData.push(oData.results[i]);
						} else if (oData.results[i].TransType === "ZS31" && ((oData.results[i].Status === "E0013" || oData.results[i].Status ===
									"E0012" || oData.results[i].Status === "E0016") && ((new Date() - new Date(oData.results[i].ChangedAt)) / (1000 * 3600 *
									24)) <
								60)) {
							filteredData.push(oData.results[i]); // only show activities for 2 months after reaching status
						}
					}
					iCount = filteredData.length;
					filteredData.forEach(function (item) {
						/*	if (this.getModel("notification").getProperty("/results")) {
								this.getModel("notification").getProperty("/results").forEach(function (item2) {
									if (item2.object_id === item.ID) {
										iCountChanged += 1;
									}
								});
							}*/
						var hours = Math.abs(new Date() - new Date(item.ChangedAt)) / 36e5;
						if (hours < 48) {
							iCountChanged += 1;
							item.Highlight = "Warning";
						} else {
							item.Highlight = "None";
						}
						item.ChangedAtNotFormatted = new Date(item.ChangedAt);
						item.ChangedAt = formatter.formatTime4(item.ChangedAt);
						item.StatusSort = formatter.formatStatusSort(item.Status);
					}.bind(this));
					filteredData = filteredData.sort(function (a, b) {
						return b.ChangedAtNotFormatted - a.ChangedAtNotFormatted;
					});
					this.oAll = {
						"count": iCount,
						"countChanged": iCountChanged,
						"results": filteredData
					};
					this.getModel("requestSet").setProperty("/results", filteredData);
					this.getModel("homePageCount").setProperty("/myRequests", iCount);
					this.getModel("homePageCount").setProperty("/myRequestsChanged", iCountChanged);
					this.getEventBus().publish("Favorites", "_onRouteMatched");
					this.loadSnowEscalationData();
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
					this.loadSnowEscalationData();
				}.bind(this)
			});
		},
		loadSnowEscalationData: function () {
			var sUserId = this.getModel("CurrentUserInfo").getProperty("/UserID");

			var oDataService = {
				"sysparm_order": "sys_updated_on",
				"u_escalation_type": 3,
				"sysparm_fields": "source_record.account.name,active,number,correlation_display,sys_updated_by,sys_id,short_description,state,sys_updated_on,sys_class_name"
			};

			var sUrl =
				sap.support.fsc2.servicenowEscalationUrl + "?sysparm_query=requested_by.employee_number=" + sUserId + "%5Eu_escalation_type=" +
				oDataService.u_escalation_type /*+ "%5state=18"*/ + "&sysparm_fields=" + oDataService.sysparm_fields;

			$.ajax({
				method: "GET",
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sUrl,
				success: function (oData) {
					var aData = [];
					var iCountChanged = 0;
					oData.result.forEach(function (x) {
						x.sys_updated_on = x.sys_updated_on.replace(/-/g, "/"); // iOS does not allow '-' --> replace by /
						if (((x.state === "102" || x.state === "103") && ((new Date() - new Date(x.sys_updated_on)) / (1000 * 3600 * 24)) < 60) ||
							(x.state !== "102" && x.state !== "103")) { // only show until 2 months after reaching status 102 or 103 
							var hours = Math.abs(new Date() - new Date(x.sys_updated_on)) / 36e5;
							if (hours < 48) {
								iCountChanged += 1;
								var highlight = "Warning";
							} else {
								var highlight = "None";
							}
							aData.push({
								"ID": x.number,
								"SNowSysID": x.sys_id, // needed?
								"Description": x.short_description,
								"CustomerName": x["source_record.account.name"],
								"ChangedAt": new Date(x.sys_updated_on),
								"TransType": x.sys_class_name,
								"StatusTxt": formatter.SnowEscalationStatusTxt(x.state),
								"Highlight": highlight,
								"ChangedAtNotFormatted": new Date(x.sys_updated_on),
								"StatusSort": formatter.formatStatusSort(x.state)
									//TYPE: escalation record ADD FOR FAVS i338673
							});
						}
					});
					//store all the snow escalation in model, will be displayed via show more functionality
					this.getModel("requestSet").setProperty("/SnowEscalation", {
						"count": aData.length,
						"expanded": false,
						"loadComplete": true, //remove I338673
						"results": aData
					});
					//slice to protect original array which contains all snow escs which is essential for counting and show more
					/*	var aSortedEscs = aData.sort(function (a, b) { //slice by 3 here too?
							return b.ChangedAtNotFormatted - a.ChangedAtNotFormatted;
						});*/

					//	var aFirstEscs = aSortedEscs.slice(0, 3);
					var sorted = this.oAll.results.concat(aData);
					sorted = sorted.sort(function (a, b) {
						return b.ChangedAtNotFormatted - a.ChangedAtNotFormatted;
					});
					this.oAll = {
						"count": this.oAll.count + aData.length, //aData is all snow records
						"countChanged": this.oAll.countChanged + iCountChanged,
						"results": sorted //aFirstEscs is just the first 3 records (display) SORTED?? I338673
					};
					this.getModel("requestSet").setProperty("/results", this.oAll.results);
					this.getModel("homePageCount").setProperty("/myRequests", this.oAll.count);
					this.getModel("homePageCount").setProperty("/myRequestsChanged", this.oAll.countChanged);
					this.getModel("homePageCount").setProperty("/loadComplete", true);
					this.getView().setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		loadCurrentTimeZone: function () {
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "TIME_ZONE")
				],
				success: function (oData) {
					if (!oData.results[0].Value) {
						this.getModel("homePageConfig").setProperty("/TimeZone", "CET");
					} else {
						this.getModel("homePageConfig").setProperty("/TimeZone", oData.results[0].Value);
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("UserProfile Service Unavailable!");
				}
			});
		},

		loadNotificationData: function (callBack) {
			this.getView().setBusy(true);
			return new Promise(function (resolve, reject) {
				sap.support.fsc2.FSC2Model.read("/PushnotfmsgSet", {
					headers: {
						"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
					},
					success: function (oData) {
						this.getView().setBusy(false);
						// if (oData.results && oData.results[0]) {
						this.getModel("notification").setData(oData);
						// }
						if (callBack && Object.prototype.toString.call(callBack) === "[object Function]") {
							callBack(this.getOwnerComponent());
						}
						resolve();
					}.bind(this),
					error: function (oError) {
						this.getView().setBusy(false);
						this.showErrorMessage(oError);
						resolve();
					}.bind(this)
				});
			}.bind(this));
		},
		//get Current User ID--used in escalation request start page
		getUserInfo: function () {
			// var url_user_information = this.sICDest + "/sap/ZS_AGS_DASHBOARDS_SRV/SettingList?%24filter=key%20eq%20%27uname%27&sap-language=en";
			var url_user_information = sap.support.fsc2.CXCSSModelUrl + "/SettingList?%24filter=key%20eq%20%27uname%27&sap-language=en";
			jQuery.ajax({
				async: false,
				url: url_user_information,
				type: "get",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				dataType: "json",
				success: function (oData) {
					this.getModel("CurrentUserInfo").setData({
						"UserID": oData.d.results[0].value1,
						"UserName": oData.d.results[0].value2,
						"Initials": oData.d.results[0].value2.split(" ").length > 1 ? oData.d.results[0].value2.split(" ")[0].substring(0, 1) +
							oData.d.results[0].value2.split(
								" ")[1].substring(0, 1) : "",
						"userIconURL": sap.support.fsc2.AppUrl + "sap/ui5/1/resources/sapit/sapitapi/user-info/" + oData.d.results[0].value1 +
							"/profile-picture?size=ORIGINAL"
					});
					// this.getPI({
					// 	"parties_user_id": oData.d.results[0].value1
					// });
				}.bind(this),
				error: function () {
					var oDialogInfo = {
						title: "User Information",
						text: "Error loading User Information \n Please retry again in a few minutes. If the problem persists please check the information provided in: \n",
						link: {
							text: "KBA 3082451 - MCC Tool Suite - Business Continuity Information",
							href: "https://launchpad.support.sap.com/#/notes/3082451"
						}
					}

					var oDialog = new sap.m.Dialog({
						title: oDialogInfo.title,
						type: 'Message',
						state: "Error",
						content: new sap.ui.layout.VerticalLayout({
							content: [new sap.m.Text({
								text: oDialogInfo.text
							}), new sap.m.Link({
								text: oDialogInfo.link.text,
								href: oDialogInfo.link.href
							})],
						}),

						endButton: new sap.m.Button({
							text: 'Ok',
							press: function () {
								oDialog.close();
							}
						}),
						afterClose: function () {
							oDialog.destroy();
						}
					});

					oDialog.open();

				}.bind(this)
			});
		},
		handleSortButtonPressed: function (oEvent, type) {
			this.sortTable = oEvent.getSource().getParent().getParent().getParent();
			if (!this.sortDialog) {
				this.sortDialog = new sap.ui.xmlfragment("sap.support.fsc2.view.fragments.SortDialog", this);
				this.getView().addDependent(this.sortDialog);
			}
			this.sortDialog.getBinding("sortItems").filter(new sap.ui.model.Filter("type", sap.ui.model.FilterOperator.EQ, type));
			this.sortDialog.open();
		},
		handleSortDialogConfirm: function (oEvent) {
			var mParams = oEvent.getParameters(),
				oBinding = this.sortTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},

		addInitialFeedItems: function (items, requestor, creator, sControlId) {
			this.getView().byId(sControlId ? sControlId : "chatList").destroyItems();
			items.forEach(function (item) {
				var style = item.userId === this.getModel("CurrentUserInfo").getProperty("/UserID") ? "bkUserInput" : "bkRobotInput";
				if ((requestor !== undefined && item.userId === requestor) || (creator !== undefined && item.userId === creator)) {
					style = "bkUserInput";
				}
				/*	var userIcon = item.userId === this.getView().getModel("CurrentUserInfo").getProperty("/UserID") || item.userId === requestor ||
						item.userId === creator ?
						"sap-icon://person-placeholder" :
						"sap-icon://group";*/
				var oFeedListItem = new sap.m.FeedListItem({
					showIcon: true,
					icon: /*"/sap/fiori/mccsos"*/ sap.support.fsc2.AppUrl + "sap/ui5/1/resources/sapit/sapitapi/user-info/" + item.userId +
						"/profile-picture?size=ORIGINAL",
					iconInitials: item.name.split(" ").length > 1 ? item.name.split(" ")[0].substring(0, 1) + item.name.split(" ")[1].substring(0,
						1) : "",
					iconActive: false,
					iconSize: "XS",
					text: item.text,
					senderPress: this.onPressName.bind(this),
					sender: item.name,
					maxCharacters: 700,
					timestamp: {
						value: item.time,
						formatter: formatter.formatTimelineDate
					},
					tooltip: item.userId
				}).addStyleClass(style);
				this.getView().byId(sControlId ? sControlId : "chatList").insertItem(oFeedListItem, 0);
			}.bind(this));
		},

		onPressName: function (oEvent) {
			var oPopover = new EmployeePopover({
				employeeId: oEvent.getSource().getTooltip()
			});

			oPopover.openBy(oEvent.getSource());
		},
		openEmployeeSearch: function (oEvent) {
			this.emplSearchSource = oEvent.getSource();
			var dialog = new EmployeeSearchDialog({
				noDataText: "No Data ...",
				liveSearch: false,
				confirm: function (oEvt) {
					this.emplSearchSource.setValue(oEvt.getParameter("value").id);
				}.bind(this)
			});
			dialog.open();
		},
		removeFavoriteCase: function (sId) {
			this.eventUsage(false, "Set \'Incident\' unfavorite");
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "FAVORITE_INCIDENTS")
				],
				success: function (oData) {
					for (var i = 0; i < oData.results.length; i++) {
						if (oData.results[i].Value === sId) {
							sap.support.fsc2.UserProfileModel.remove("/Entries(Username='',Attribute='FAVORITE_INCIDENTS',Field='" + oData.results[i]
								.Field +
								"')", {
									success: function () {
										try {
											this.getOwnerComponent().getModel("incidentDetailPage").setProperty("/ShowFavorite", false);
										} finally {
											this.refreshFavoriteIncidentsModel();
											this.getEventBus().publish("Favorites", "_onRouteMatched");
										}

									}.bind(this)
								});
							break;
						}
					}
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
					// sap.m.MessageToast.show("UserProfile Service Unavailable!");
				}.bind(this)
			});
		},

		collectData: function (uData) { //Qualtrics 
			//var uData = this.getOwnerComponent().getModel("CurrentUserInfo").getData()
			//uData = getuserdatamodeldata
			var oData = this.getOwnerComponent().getModel("MCCDetail").getData();
			var qdata = {};
			qdata = this.getOwnerComponent().getModel("QualtricsData").getData();

			qdata.creator_firstname = uData.firstName;
			qdata.creator_lastname = uData.lastName;
			qdata.creator_email = uData.email;

			qdata.activity_activity_partner = oData.activity_activity_partner; //qdata.oData
			qdata.activity_business_partner = oData.activity_business_partner;
			qdata.activity_created_by = oData.activity_created_by;
			qdata.activity_customer = oData.activity_customer;
			qdata.activity_id = oData.activity_id;
			qdata.activity_status_desc = oData.activity_status_desc;
			qdata.activity_priority_desc = oData.activity_priority_desc;
			qdata.activity_process_type_description = oData.activity_process_type_description;
			qdata.customer_id = oData.activity_customer;
			qdata.customer_name = oData.account_name_F;
			var sources = new Map([
				['t', 'test'],
				['d', 'dev'],
				['p', 'prod']
			]);
			qdata.source_system = sources.get(sap.support.fsc2.Landscape)
			qdata.activity_cat = oData.activity_cat;
			qdata.activity_service_team = oData.activity_service_team;
			var oCountry = uData.company.address.country;
			var oReagionInfo = this.getModel("reagionHelpModel").getData().find(country => country.COUNTRYCODE === oCountry);
			qdata.region = oReagionInfo.MCCREGION;
			//qdata.region = uData.company.address.region; //this.getOwnerComponent().getModel("UserProfile").getData().APP_MCC_ACTIVITIES_REGION.Value;
			// if (uData.company.address.region === "AMER") {
			// 	var country = uData.company.address.country;
			// 	if (country === "US" || country === "CA") {
			// 		qdata.region = "NA";
			// 	} else {
			// 		qdata.region = "LAC";
			// 	}
			// }

			if (oData.FSC2Activity_Parties !== undefined) {
				if (oData.FSC2Activity_Parties.results[0] !== undefined) qdata.p1_parties_function = oData.FSC2Activity_Parties.results[0].parties_function;
				if (oData.FSC2Activity_Parties.results[0] !== undefined) qdata.p1_BpNumber = oData.FSC2Activity_Parties.results[0].BpNumber;
				if (oData.FSC2Activity_Parties.results[0] !== undefined) qdata.p1_BpName = oData.FSC2Activity_Parties.results[0].BpName;

				if (oData.FSC2Activity_Parties.results[1] !== undefined) qdata.p2_parties_function = oData.FSC2Activity_Parties.results[1].parties_function;
				if (oData.FSC2Activity_Parties.results[1] !== undefined) qdata.p2_BpNumber = oData.FSC2Activity_Parties.results[1].BpNumber;
				if (oData.FSC2Activity_Parties.results[1] !== undefined) qdata.p2_BpName = oData.FSC2Activity_Parties.results[1].BpName;

				if (oData.FSC2Activity_Parties.results[2] !== undefined) qdata.p3_parties_function = oData.FSC2Activity_Parties.results[2].parties_function;
				if (oData.FSC2Activity_Parties.results[2] !== undefined) qdata.p3_BpNumber = oData.FSC2Activity_Parties.results[2].BpNumber;
				if (oData.FSC2Activity_Parties.results[2] !== undefined) qdata.p3_BpName = oData.FSC2Activity_Parties.results[2].BpName;

				if (oData.FSC2Activity_Parties.results[3] !== undefined) qdata.p4_parties_function = oData.FSC2Activity_Parties.results[3].parties_function;
				if (oData.FSC2Activity_Parties.results[3] !== undefined) qdata.p4_BpNumber = oData.FSC2Activity_Parties.results[3].BpNumber;
				if (oData.FSC2Activity_Parties.results[3] !== undefined) qdata.p4_BpName = oData.FSC2Activity_Parties.results[3].BpName;

				if (oData.FSC2Activity_Parties.results[4] !== undefined) qdata.p5_parties_function = oData.FSC2Activity_Parties.results[4].parties_function;
				if (oData.FSC2Activity_Parties.results[4] !== undefined) qdata.p5_BpNumber = oData.FSC2Activity_Parties.results[4].BpNumber;
				if (oData.FSC2Activity_Parties.results[4] !== undefined) qdata.p5_BpName = oData.FSC2Activity_Parties.results[4].BpName;

				if (oData.FSC2Activity_Parties.results[5] !== undefined) qdata.p6_parties_function = oData.FSC2Activity_Parties.results[5].parties_function;
				if (oData.FSC2Activity_Parties.results[5] !== undefined) qdata.p6_BpNumber = oData.FSC2Activity_Parties.results[5].BpNumber;
				if (oData.FSC2Activity_Parties.results[5] !== undefined) qdata.p6_BpName = oData.FSC2Activity_Parties.results[5].BpName;

				if (oData.FSC2Activity_Parties.results[6] !== undefined) qdata.p7_parties_function = oData.FSC2Activity_Parties.results[6].parties_function;
				if (oData.FSC2Activity_Parties.results[6] !== undefined) qdata.p7_BpNumber = oData.FSC2Activity_Parties.results[6].BpNumber;
				if (oData.FSC2Activity_Parties.results[6] !== undefined) qdata.p7_BpName = oData.FSC2Activity_Parties.results[6].BpName;

				if (oData.FSC2Activity_Parties.results[7] !== undefined) qdata.p8_parties_function = oData.FSC2Activity_Parties.results[7].parties_function;
				if (oData.FSC2Activity_Parties.results[7] !== undefined) qdata.p8_BpNumber = oData.FSC2Activity_Parties.results[7].BpNumber;
				if (oData.FSC2Activity_Parties.results[7] !== undefined) qdata.p8_BpName = oData.FSC2Activity_Parties.results[7].BpName;

				if (oData.FSC2Activity_Parties.results[8] !== undefined) qdata.p9_parties_function = oData.FSC2Activity_Parties.results[8].parties_function;
				if (oData.FSC2Activity_Parties.results[8] !== undefined) qdata.p9_BpNumber = oData.FSC2Activity_Parties.results[8].BpNumber;
				if (oData.FSC2Activity_Parties.results[8] !== undefined) qdata.p9_BpName = oData.FSC2Activity_Parties.results[8].BpName;

			}

			var qModel = this.getOwnerComponent().getModel("QualtricsData");
			qModel.setData(qdata);

			sap.qualtricsData = qdata;
			QSI.API.unload();
			QSI.API.load().then(QSI.API.run());
			/*if ((this.getOwnerComponent()._QualtricsTriggerFromCreate && !this.getOwnerComponent()._QualtricsTriggerIsOnBehalf) || this
											.getOwnerComponent()._QualtricsTriggerClose) { 
											
											QSI.API.unload(); //Qualtrics
											QSI.API.load().then(QSI.API.run()); //Qualtrics
			
											//clear triggers
											this.getOwnerComponent()._QualtricsTriggerIsOnBehalf = "";
											this.getOwnerComponent()._QualtricsTriggerFromCreate = "";
											this.getOwnerComponent()._QualtricsTriggerClose = "";*/
		}, //Qualtrics
		fillEmbeddedData: function (oData) { //Qualtrics >> activity odata
			this.lqdata = oData;
			var that = this;

			var promise = new Promise(function (resolve, reject) {
				var oUser = that.getOwnerComponent().getModel("CurrentUserInfo").getData()
				var oUserModel = new sap.ui.model.json.JSONModel();

				// load external JSON file
				oUserModel.loadData(sap.support.fsc2.AppUrl + "sap/ui5/1/resources/sapit/sapitapi/user-info/" + oUser.UserID);
				oUserModel.attachRequestCompleted(function () {
					resolve(oUserModel.getData());
				});
			});
			promise.then(function (uData) {
				that.collectData(uData);
				//console.log(uData, " the user data came back")
			});

		},
		searchCustomers: function (sValue) {
			var promises = [];
			var that = this;
			var filters = [
				new Filter("Customer_BP", "EQ", sValue),
				new Filter("Customer_No", "EQ", sValue),
				new Filter("Customer_Name", "EQ", sValue),
			]
			filters.forEach(function (filter) {
				var oCustomerFilter = new Filter({
					filters: [
						new Filter("Accuracy", "EQ", "X"),
						filter
					],
					and: true
				});
				var promise = new Promise(function (resolve, reject) {
					sap.support.fsc2.FSC2Model.read("/CustomerInfoSet", {
						filters: [oCustomerFilter],
						headers: {
							"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
						},
						success: function (oData) {
							var aResults = that._sortCustomerData(oData);
							resolve(aResults);
						}.bind(this),
						error: function (err) {
							reject(err);
						}
					});
				}.bind(this))
				promises.push(promise);
			})
			return Promise.all(promises).then(function (values) {
				var results = Array.prototype.concat(...values);
				// console.log(results, "customer search results")
				return results;
			});
			/*
				var oCustomerFilter = new Filter("Search_Content", "EQ", sValue);
			var oCustomerFilter = new Filter({
							filters: [
								new Filter("Accuracy", "EQ", "X"),
								new Filter("Customer_No", "EQ", oForm.CustomerNo),
								new Filter("Customer_Name", "EQ", oForm.CustomerName),
								new Filter("Customer_BP", "EQ", oForm.CustomerBPNo)
							],
							and: true
						});*/
		},

		_sortCustomerData: function (oData) {
			var iacValues = ["1", "8", "9", "G", "V", "I"];
			var aData = [...new Map(oData.results.map(item => [item["Customer_No"], item])).values()];
			var aResults = [];
			for (var i = 0; i < aData.length; i++) {
				var IsGlobalUltimate = aData[i].Customer_No === aData[i].Global_Ultimate_No
				aResults.push({
					//"ID": aData[i].Customer_No,
					"CustomerNo": aData[i].Customer_No, //ErpCustNo,
					"CustomerName": aData[i].Customer_Name,
					"Gu": aData[i].Gu,
					"Partner": aData[i].Customer_BP,
					"IsGlobalUltimate": IsGlobalUltimate,
					//	"Iac": aData[i].IAC,
					Iac: iacValues.indexOf(aData[i].IAC) > -1 ? aData[i].IAC : "ZZZZZ",
					"filterProp": IsGlobalUltimate ? "Global Ultimate" : "Customer",
					"description": "(BP: " + aData[i].Customer_BP + ", ERP: " + aData[i].Customer_No + ") - " + aData[i].Country_Name,
					"Action": aData[i].Is_Favorite,
					"Logo": {
						"MimeType": aData[i].customer_logo.MimeType,
						"Value": aData[i].customer_logo.Value
					},
					"Country_code": aData[i].Country_Code,
					"Global_Ultimate_No": aData[i].Global_Ultimate_No
						//region: use map to include region
						//"Field": aData[i].Favorite_Field,
						//"Type": "FAVORITE_CUSTOMERS"
				});
			}
			iacValues.push("ZZZZZ");
			aResults = aResults.sort(function (a, b) { //replace with aResults adata
				if (iacValues.indexOf(a.Iac) < iacValues.indexOf(b.Iac)) {
					return -1;
				} else if (iacValues.indexOf(a.Iac) > iacValues.indexOf(b.Iac)) {
					return 1;
				} else if (b.filterProp < a.filterProp) {
					return -1;
				} else if (b.filterProp > a.filterProp) {
					return 1;
				} else if (b.CustomerName > a.CustomerName) {
					return -1;
				} else if (b.CustomerName < a.CustomerName) {
					return 1;
				} else if (b.description > a.description) {
					return -1;
				} else if (b.description < a.description) {
					return 1;
				}
				return 0;
			}.bind(this));
			for (var i = 0; i < aResults.length; i++) {
				if (i === 0) {
					aResults[i].isTopMatch = true;
				} else if ((i === 1 || i === 2) && aResults[i].iac !== "ZZZZZ") {
					aResults[i].isTopMatch = true;
				} else if (i > 2 && i < 5 && aResults[i].iac !== "ZZZZZ" && aResults[i].iac === aResults[(i - 1)].iac) {
					aResults[i].isTopMatch = true;
				} else {
					aResults[i].isTopMatch = false;
				}
			}
			return aResults;
		},

		getCookieValue: function (a) {
			const b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
			return b ? decodeURIComponent(b.pop()) : '';
		},
		setCookieValue: function (name, value, seconds) {
			var expires = "";
			if (seconds) {
				var date = new Date();
				date.setTime(date.getTime() + (seconds * 1000));
				expires = "; expires=" + date.toUTCString();
			}
			document.cookie = name + "=" + (value || "") + expires + "; path=/";
		},

		fetchIocRequest: function (dedupkey) {
			var tries = 5
			return new Promise(function cb(resolve, reject) {
				console.log(tries + ' remaining');
				$.ajax({
					method: "GET",
					// data: oDataService,
					contentType: "application/json",
					headers: {
						'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
					},
					url: "/ext_pd_api/incidents/?incident_key=" + dedupkey,
					// url: sap.support.fsc2.servicenowUrl,
					success: function (oData) {
						if (oData.incidents[0]) {
							resolve(oData)
						} else {
							if (--tries > 0) {
								setTimeout(function () {
									cb(resolve, reject);
								}, 500);
							} else {
								reject('Failure');
							}
						}
					}.bind(this),
					error: function (a, b, c) {
						reject('Failure');
					}
				});

			});
		},
		formatIcdDesc: function (desc, SNow_number) {
			var sValue = desc;
			if (SNow_number) {
				sValue = desc + " (" + SNow_number + ")";
			}
			return sValue;
		},

		onQueueButtonPress: function (sNotifType, sMsgType, oCustomer, oServiceTeam, sActivityId, oEscalation) {
			// this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/model/ReagionHelp.json")),
			// 	"reagionHelpModel");

			if (oCustomer && JSON.stringify(oCustomer).length !== 0 && JSON.stringify(oCustomer) !== "{}") {
				var notificationData = {
					notification_timestamp: new Date().toLocaleDateString('en-us', {
						weekday: "long",
						year: "numeric",
						month: "short",
						day: "numeric"
					}),
					notification_is_delayed: false
				}

				if (oServiceTeam) {
					notificationData.notification_service_team_id = oServiceTeam.serviceTeamId;
					notificationData.notification_service_team = oServiceTeam.solutionArea;
				}

				switch (sNotifType) {
				case "CIM":
					notificationData.notification_type = "SOSCreateCIM";
					notificationData.notification_object_id = oEscalation.Id;
					notificationData.notification_object_type = "Escalation Record";
					notificationData.notification_message = oEscalation.ExpectedAction;
					notificationData.notification_event_name = "CIM Escalation Request";
					notificationData.notification_url = formatter.formatEnvironmentURL() + "requestDetails/MidColumnFullScreen/id=" + oEscalation.Sys_id +
						"&transType=" + oEscalation.Table;
					notificationData.notification_customer_name = oCustomer.CustomerName;
					notificationData.notification_customer_id = oCustomer.CustomerNo;
					notificationData.notification_global_ultimate_id = oCustomer.Global_Ultimate_No;
					var oReagionInfo = this.getModel("reagionHelpModel").getData().find(country => country.COUNTRYCODE === oCustomer.Country_code);
					notificationData.notification_region = oReagionInfo.MCCREGION;

					break;
				case "ACTIVITY":
					notificationData.notification_type = "SOSCreateActivity";
					notificationData.notification_object_id = sActivityId;
					notificationData.notification_object_type = "Activity";
					notificationData.notification_message = "Request for Critical Situation";
					notificationData.notification_event_name = "Customer Support Request";
					notificationData.notification_url = formatter.formatEnvironmentURL() + "mccDetailRequest/MidColumnFullScreen/activity_id=" +
						sActivityId;
					notificationData.notification_customer_name = oCustomer.CustomerName;
					notificationData.notification_customer_id = oCustomer.CustomerNo;
					notificationData.notification_global_ultimate_id = oCustomer.Global_Ultimate_No;
					var oReagionInfo = this.getModel("reagionHelpModel").getData().find(country => country.COUNTRYCODE === oCustomer.Country_code);
					notificationData.notification_region = oReagionInfo.MCCREGION;
					if (sMsgType) {
						switch (sMsgType) {
						case "CPC":
							notificationData.notificationData.notification_message = "Critical Period Coverage";
							break;
						case "CV":
							notificationData.notificationData.notification_message = "Customer Visit";
							break;
						default:
							break;
						}
					}

					break;
				case "ESCALATION":
					notificationData.notification_type = "SOSCreateGlobalEscalationRequest";
					notificationData.notification_object_id = sActivityId;
					notificationData.notification_object_type = "Activity";
					notificationData.notification_message = "Global Escalation Request";
					notificationData.notification_event_name = "Global Escalation Request";
					notificationData.notification_url = formatter.formatEnvironmentURL() + "escalationRequestDetail/MidColumnFullScreen/activityid=" +
						sActivityId + "&editable=false";
					notificationData.notification_customer_name = oCustomer.customer_name;
					notificationData.notification_customer_id = oCustomer.customer_r3_no;
					notificationData.notification_global_ultimate_id = oCustomer.global_ultimate_no;
					var oReagionInfo = this.getModel("reagionHelpModel").getData().find(country => country.COUNTRYCODE === oCustomer.country);
					notificationData.notification_region = oReagionInfo.MCCREGION;
					break;
				}

				var notificationStringData = JSON.stringify(notificationData);

				jQuery.ajax({
						type: "POST",
						accepts: {
							json: "application/json"
						},
						url: "/apimcf/mcc-eventmesh/messagingrest/v1/queues/default%2Fcom.sap.mcc.toolsuite%2F1%2Fgeneral/messages",
						headers: {
							"Content-Type": "application/json; charset=utf-8",
							"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO",
						},
						contentType: "application/json",
						async: true,
						data: notificationStringData,
						success: function (oData) {
							console.log(oData);

						}.bind(this),
						error: function (oError) {
							console.log(oError);

						}.bind(this)
					})
					.done(function (sData) {
						console.log(sData);

					})
					.fail(function (jqXHR, exception, exx) {

					}).always(function () {
						//console.warn("ajax call completed");
					});
			}
		}
	});

});