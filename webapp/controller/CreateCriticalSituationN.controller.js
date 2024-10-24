sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/formatter',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/m/MessageBox',
	'sap/ui/core/Fragment',
], function (BaseController, formatter, JSONModel, Filter, ODataModel, models, MessageBox, Fragment) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.CreateCriticalSituationN", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.support.fsc2.view.CreateCriticalSituationN
		 **/
		formatter: formatter,
		onInit: function () {
			/******comment: This flag is used for test. When it is false the app will load business impact of incident from local template.*******/
			this.Offline = false;
			this.setModel(new JSONModel({
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
				"Title": "Request support for critical situation",
				"RequestReason": "",
				"AllSelected": [],
				"IncidentTitle": this.getResourceBundle().getText("incidentTitle") + "(0)",
				"isRISE": false
			}), "createCriticalSituation");
			this.setModel(new JSONModel({
				"RadioBtnIncidentEnabled": false,
				"RadioBtnIncidentVisible": false,
				"enableBDM_cb": true,
				"enable_3_cb": true
			}), "UIconfig");
			this.setModel(new JSONModel(), "CreateEntity");
			this.setModel(new JSONModel(), "FieldVisible");
			this.setModel(new JSONModel(), "SelectIncident");
			var oCustSearchModel = models.createCustSearchModel();
			this.setModel(oCustSearchModel, "customerSearch");
			this.setModel(new JSONModel({}), "customerList");
			this.setModel(new JSONModel({}), "SelectedCustomer");
			this.setModel(new JSONModel({}), "SelectedServiceTeam");
			this.setModel(new JSONModel({
				"case_id": "",
				"customer_r3_no": "",
				"customer_bp_id": "",
				"customer_name": "",
				"free_text": ""
			}), "caseSearch");
			// this.getView().byId("idUploadCollection")._bDragDropEnabled=false;//removeDragDropConfig();
			this.setModel(new JSONModel({}), "ActivityCaseList");
			this.setModel(new JSONModel(), "keyWords");
			this.getRouter().getRoute("createByDefault").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("createByCustomer").attachPatternMatched(this._onRouteMatchedCustomer, this);
			this.getRouter().getRoute("createByCustomerEnd").attachPatternMatched(this._onRouteMatchedCustomer, this);
			this.getRouter().getRoute("createByIncident").attachPatternMatched(this._onRouteMatchedIncident, this);
			this.getRouter().getRoute("createByIncidentEnd").attachPatternMatched(this._onRouteMatchedIncident, this);
			this.getRouter().getRoute("createByIncidentOptions").attachPatternMatched(this._onRouteMatchedIncidentOptions, this);
			//&title={title}&desc={desc}&prio={prio}&category={category}&serviceteam={serviceteam}&caseid={caseid}",
			// this.getRouter().getRoute("createThroughSpecialUrl").attachPatternMatched(this._specialUrlMatched, this);
			this.getRouter().getRoute("bdmOnlyEscalations").attachPatternMatched(this._bdmOnlyEscalations, this);

			this.setModel(new JSONModel(), "incidentList");
			this.setModel(new JSONModel(), "selectedIncidentList");
			this.oFileModel = new sap.ui.model.odata.v2.ODataModel(this.getOwnerComponent().sICDest + "/sap/ZS_AGS_FSC2_SRV", {
				useBatch: true
			});
			this.selectedKeyWordsID = [];
			this.selectedKeyWords = [];
			this.sSelectList = "";
			this.getEventBus().subscribe("Create", "loadInicidentLongText", this.loadInicidentLongText, this);
			this.getEventBus().subscribe("Create", "_updateBusinessImpact", this._updateBusinessImpact, this);
			this.sCustomerNo = "";
			this.sDefaultCase = "";
			this.selectedP1Incident = false;
			var snowEscCategoryModel = models.createSnowEscCategoryModel();
			this.setModel(snowEscCategoryModel, "snowEscCategoryJson"); //expected action model for NOW escalation
			this.getModel("CreateEntity").setProperty("/TransType", "ZS90");
			this.getModel("CreateEntity").setProperty("/bEscLongRunner", false);
			if (sap.support.fsc2.Landscape === "p") {
				this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/model/ActivitiesByServTeam.json")),
					"serviceTeamListModel");
			} else {
				this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/model/ActivitiesByServTeamTest.json")),
					"serviceTeamListModel");
			}
			this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/model/ReagionHelp.json")),
				"reagionHelpModel");
		},
		_bdmOnlyEscalations: function (oEvent) {
			//special url for Vadim
			var InumberList = ["D030890", "D038784", "D022785", "I522131", "I831353", "I079796"];
			var current_user = this.getModel("CurrentUserInfo").getProperty("/UserID");

			this.getModel("CreateEntity").setData({
				"TransType": "ZS90"
			});

			if (!InumberList.includes(current_user)) {
				this.getRouter().navTo("createByDefault", {
					layout: "OneColumn"
				});
			}
			if (!this.sCustomerNo) {
				this.getModel("createCriticalSituation").setProperty("/CustomerNo", "1208936");
				this.onSearchCustomerName();
			}
			this.getView().byId("idSwitch").setEnabled(false);

			var bExpertMode = this.getModel("homePageConfig").getProperty("/expertMode");
			this.getModel("UIconfig").setProperty("/RadioBtnIncidentVisible", bExpertMode);
			this.getModel("UIconfig").setProperty("/RadioBtnIncidentEnabled", false);
			this.getView().byId("rbg3").setSelectedIndex(1);
			var iSelectedIncidents = this.getModel("selectedIncidentList").getProperty("/results").length;
			this.getModel("UIconfig").setProperty("/RadioBtnIncidentEnabled", iSelectedIncidents === 1);
			this.getView().byId("rbg3").setSelectedIndex(iSelectedIncidents === 1 ? 0 : 1); //fix to set based on iSelectedIncidents

		},
		_specialUrlMatched: function (oEvent) {
			this.oArgs = oEvent.getParameter("arguments");
			console.log("the special url has matched", this.oArgs)
			var sURLCustomerNo = this.oArgs.erpcust;
			var sTitle = this.oArgs.title;
			var sDesc = this.oArgs.desc;
			var sCaseId = this.oArgs.caseid;
			this.getModel("createCriticalSituation").setProperty("/CustomerNo", sURLCustomerNo);
			this.getModel("createCriticalSituation").setProperty("/Title", sTitle);
			this.getModel("createCriticalSituation").setProperty("/Description", sDesc);
			this.sEnableCase = true;
			this.getModel("createCriticalSituation").setProperty("/CaseID", sCaseId);
			console.log(sCaseId, " its the case id")
			this.onSearchCustomerName();
		},
		/******comment: This method is called by "Request Supprot For Critical Situation" button in HomepageN page and CustomerDetailN page.******/
		_onRouteMatched: function (oEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			this.getModel("CreateEntity").setData({
				"TransType": "ZS90"
			});
			var that = this;
			if (oEvent) { // run setDefault or clear all without oEvent
				this.oArgs = oEvent.getParameter("arguments");
			}
			var sURLCustomerName;
			var sDeafultData = this.getModel("homePageConfig").getData();
			this.sDefaultCase = sDeafultData.defaultCase;
			this.sDeafultCustNo = sDeafultData.defaultCustNo;
			sURLCustomerName = decodeURIComponent(sDeafultData.defaultCustName);
			this.sEnableCase = sDeafultData.enableDefaultCase;
			this.getView().byId("idBusinessDown").setSelected(false);
			this.getView().byId("idSwitch").setEnabled(true);
			var aHistory = sap.ui.core.routing.History.getInstance().aHistory;
			var sPrevRoute = aHistory[aHistory.length - 1];

			var bExpertMode = this.getModel("homePageConfig").getProperty("/expertMode");
			this.getModel("UIconfig").setProperty("/RadioBtnIncidentVisible", bExpertMode);
			this.getModel("UIconfig").setProperty("/RadioBtnIncidentEnabled", false);
			this.getView().byId("rbg3").setSelectedIndex(1);

			this._updateChekBoxSelections(false, false);

			//nav back from incident detail or incidentlist or from escalation detail
			if ((sPrevRoute.indexOf("incident") === -1 && sPrevRoute.indexOf("sn_customerservice_escalation") === -1) || !oEvent) {
				this.bCustomerFound = false;
				this.onGiveUpCreateCritical();
				this._onInitCreate();
				this.getModel("FieldVisible").setData({
					"RequestReason": false,
					"BusinessImpact": false,
					"CaseID": this.sEnableCase, //true,
					"CustomerNo": true,
					"CustomerName": false,
					"AddIncBtn": true
				});

				this.getModel("createCriticalSituation").setProperty("/RequestReason", "");
				this.getModel("createCriticalSituation").setProperty("/BusinessImpact/Text", "");
				if (this.sEnableCase && this.sDefaultCase !== "" && this.sDeafultCustNo && this.sDeafultCustNo !== "") { //normal case
					this.bCustomerFound = true;
					this.getModel("createCriticalSituation").setProperty("/CaseID", this.sDefaultCase);
					this.getView().byId("setDefaultBtn").setVisible(true);
					this.sCustomerNo = this.sDeafultCustNo;
					this.getModel("createCriticalSituation").setProperty("/CustomerNo", this.sDeafultCustNo.replace(/\b(0+)/gi, "") + " - " +
						sURLCustomerName);
					this.getModel("createCriticalSituation").setProperty("/CustomerName", sURLCustomerName);
				} else if (this.sEnableCase && this.sDefaultCase !== "" && (!this.sDeafultCustNo || this.sDeafultCustNo === "")) { //closed case
					this.getModel("createCriticalSituation").setProperty("/CaseID", this.sDefaultCase);
					this.getView().byId("setDefaultBtn").setVisible(true);
					this.sCustomerNo = "";
					this.getModel("createCriticalSituation").setProperty("/CustomerNo", "");
					this.getModel("createCriticalSituation").setProperty("/CustomerName", "");
					if (!this.ClearAll) {
						MessageBox.error("The default Case in setting has been closed. Please check.", {
							onClose: function () {
								that.getModel("createCriticalSituation").setProperty("/CaseID", "");
								that.getView().byId("setDefaultBtn").setVisible(false);
							}
						});
					}
				} else {
					this.sCustomerNo = "";
					this.sDefaultCase = "";
					this.getView().byId("setDefaultBtn").setVisible(false);
				}
				this._loadKeyWords();
				this.getView().setBusy(false);
			} else if (bExpertMode) { // when nagiating back from incident list we check the num of incidents selsected
				var iSelectedIncidents = this.getModel("selectedIncidentList").getProperty("/results").length;
				this.getModel("UIconfig").setProperty("/RadioBtnIncidentEnabled", iSelectedIncidents === 1);
				this.getView().byId("rbg3").setSelectedIndex(iSelectedIncidents === 1 ? 0 : 1); //fix to set based on iSelectedIncidents
			}
		},
		/******comment: This method is called by "Create Request" button in CustomerDetail page.******/
		_onRouteMatchedCustomer: function (oEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			this.getModel("CreateEntity").setData({
				"TransType": "ZS90"
			});
			if (oEvent) {
				this.oArgs = oEvent.getParameter("arguments");
			}
			var sDeafultData = this.getModel("homePageConfig").getData();
			this.sEnableCase = sDeafultData.enableDefaultCase;
			if (sDeafultData.enableDefaultCase && sDeafultData.defaultCase !== "") {
				this.getView().byId("setDefaultBtn").setVisible(true);
			} else {
				this.getView().byId("setDefaultBtn").setVisible(false);
			}
			var sURLCustomerName = decodeURIComponent(this.oArgs.custname);
			this.bCustomerFound = true;
			var aHistory = sap.ui.core.routing.History.getInstance().aHistory;
			var sPrevRoute = aHistory[aHistory.length - 1];
			this._updateChekBoxSelections(false, false);
			if (sPrevRoute.indexOf("incident") === -1 || !oEvent) { // first open
				this.onGiveUpCreateCritical();
				this._onInitCreate();
				this.getModel("createCriticalSituation").setProperty("/CustomerNo", this.oArgs.custnum.replace(/\b(0+)/gi, "") + " - " +
					sURLCustomerName);
				this.sCustomerNo = formatter.trimPreZeros(this.oArgs.custnum);
				this.getModel("createCriticalSituation").setProperty("/CustomerNoEdit", false);
				this.getModel("createCriticalSituation").setProperty("/CustomerName", sURLCustomerName);
				var bExpertMode = this.getModel("homePageConfig").getProperty("/expertMode");
				this.getModel("UIconfig").setProperty("/RadioBtnIncidentVisible", bExpertMode);
				this.getModel("UIconfig").setProperty("/RadioBtnIncidentEnabled", false);
				this.getView().byId("rbg3").setSelectedIndex(1);
				this.getModel("FieldVisible").setData({
					"RequestReason": false,
					"BusinessImpact": false,
					"CaseID": sDeafultData.enableDefaultCase, //true,
					"CustomerNo": true,
					"CustomerName": false,
					"AddIncBtn": true
				});
				this.getModel("createCriticalSituation").setProperty("/RequestReason", "");
				this.getModel("createCriticalSituation").setProperty("/BusinessImpact/Text", "");
				this.getView().byId("idSwitch").setEnabled(false);
				this._loadKeyWords();

				if (sDeafultData.enableDefaultCase && sDeafultData.defaultCustNo === this.sCustomerNo) {
					this.getModel("createCriticalSituation").setProperty("/CaseID", sDeafultData.defaultCase);
				}
			} else { /*if(){ */ //nav from incident list
				var iSelectedIncidents = this.getModel("selectedIncidentList").getProperty("/results").length;
				this.getModel("UIconfig").setProperty("/RadioBtnIncidentEnabled", iSelectedIncidents === 1);
				if (iSelectedIncidents === 1) {
					this.getView().byId("rbg3").setSelectedIndex(0);
				} else {
					this.getView().byId("rbg3").setSelectedIndex(1);
				}
				//fix to set based on iSelectedIncidents
			}
		},
		/******comment: This method is called by "Escalation" button in IncidentDetail page.******/
		_onRouteMatchedIncident: function (oEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}

			this.getModel("CreateEntity").setData({
				"TransType": "ZS90"
			});

			if (oEvent) {
				this.oArgs = oEvent.getParameter("arguments");
				this.onGiveUpCreateCritical();
				this._onInitCreate();
			}
			var sDeafultData = this.getModel("homePageConfig").getData();
			this.sEnableCase = sDeafultData.enableDefaultCase;
			if (sDeafultData.enableDefaultCase && sDeafultData.defaultCase !== "Empty") {
				this.getView().byId("setDefaultBtn").setVisible(true);
			} else {
				this.getView().byId("setDefaultBtn").setVisible(false);
			}
			this.sCustomerNo = formatter.trimPreZeros(this.oArgs.custnum);
			var sURLCustomerName = decodeURIComponent(this.oArgs.custname);
			var sIncidentID = this.oArgs.incident;
			this.getModel("createCriticalSituation").setProperty("/CustomerNo", this.oArgs.custnum.replace(/\b(0+)/gi, "") + " - " +
				sURLCustomerName);
			this.getModel("createCriticalSituation").setProperty("/CustomerNoEdit", false);
			this.getModel("createCriticalSituation").setProperty("/CustomerName", sURLCustomerName);
			this.getModel("createCriticalSituation").setProperty("/RequestReason", "");
			this.getModel("createCriticalSituation").setProperty("/BusinessImpact/Text", "");

			var oQAModel = this.getModel("ReqDescQA");
			var aReqDescQA;
			if (oQAModel && oQAModel.getData() && oQAModel.getData().QA) {
				aReqDescQA = oQAModel.getData().QA;
				for (var i = 0; i < aReqDescQA.length; i++) {
					this.getModel("createCriticalSituation").setProperty("/Description" + (2 + i), aReqDescQA[i]);
				}
			}
			// this.getModel("createCriticalSituation").setProperty("/Description", this.getModel("i18n").getResourceBundle().getText(
			// 	"requestHintWithA", aReqDescQA));

			var bExpertMode = this.getModel("homePageConfig").getProperty("/expertMode");
			this.getModel("UIconfig").setProperty("/RadioBtnIncidentVisible", bExpertMode);

			if (!this.ClearAll) {
				if (sIncidentID.substr(0, 2) === "CS") {
					this._loadSNowCase(sIncidentID);
				} else {
					this._loadIncident(sIncidentID);
				}

			}
			this._loadKeyWords();
			this._updateChekBoxSelections(false, false);
			this.getModel("FieldVisible").setData({
				"RequestReason": true,
				"BusinessImpact": true,
				"CaseID": sDeafultData.enableDefaultCase, //true,
				"CustomerNo": true,
				"CustomerName": false,
				"AddIncBtn": false
			});
			this.getView().byId("idSwitch").setEnabled(false);
			if (sDeafultData.enableDefaultCase && sDeafultData.defaultCustNo === this.sCustomerNo) {
				this.getModel("createCriticalSituation").setProperty("/CaseID", sDeafultData.defaultCase);
			}
		},
		_onRouteMatchedIncidentOptions: function (oEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}

			this.getModel("CreateEntity").setData({
				"TransType": "ZS90"
			});

			this.getView().setBusy(true);
			var oArgs = oEvent.getParameter("arguments");
			var sIncidentNo = oArgs.icdNum;
			var sIncidentYear = oArgs.icdYear;

			this.getModel("SelectIncident").setData({
				"IncidentNo": sIncidentNo,
				"IncidentYear": sIncidentYear,
				"BCIncident": {
					"results": [],
					"loadComplete": false
				},
				"ServiceNow": {
					"results": [],
					"loadComplete": false
				},
				"results": []
			});
			sap.support.fsc2.IncidentModel.read("/IncidentList", {
				filters: [
					new Filter("MessageYear", "EQ", sIncidentYear),
					new Filter("ObjectID", "EQ", sIncidentNo)
				],
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					var oDataResult = [];
					oData.results.forEach(function (obj) { // remove inactive incidents
						if (obj.ActiveSystem === "") {
							oDataResult.push({
								"ID": obj.CssObjectID,
								"IncidentNum": obj.CssObjectID,
								"Title": obj.ObjectID + "/" + obj.MessageYear + " " + obj.StatusTxt,
								"SNow_number": "",
								"Description": obj.Description,
								"ShortID": obj.ObjectID + "/" + obj.MessageYear,
								"CustomerName": obj.CustomerName,
								"CustomerNo": obj.CustomerNo,
								"SysID": "",
								"CIM_ID": obj.CIM_ID
							});
						}
					});
					this.getModel("SelectIncident").setProperty("/BCIncident", {
						"results": oDataResult,
						"loadComplete": true
					});
					this.afterLoadIncidents();
				}.bind(this),
				error: function () {
					this.getView().setBusy(false);
					sap.m.MessageToast.show("load BC* Incident error");
				}
			});
			var sEnableSnowCase = this.getModel("EnableSnowCase").getProperty("/bEnable");
			if (!sEnableSnowCase) {
				this.getModel("SelectIncident").setProperty("/ServiceNow", {
					"loadComplete": true,
					"results": []
				});
				this.afterLoadIncidents();
				return;
			}
			var shortID = formatter.trimPreZeros(sIncidentNo) + "/" + sIncidentYear;
			var oDataService = {
				"correlation_display": shortID,
				"u_responsible_party": "sno",
				"sysparm_fields": "active,number,correlation_display,sys_updated_by,escalation,sys_id,short_description,correlation_id,u_case_number,priority,state,account.number,account.name,account.country,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,u_app_component.u_short_description,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,u_deployed_item.u_environment,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,resolution_code,resolved_by,resolved_at,close_notes,u_deployed_item.u_data_center_region,u_deployed_item.u_data_center,u_next_action_due,u_last_user_updated_on,u_last_user_updated_by,opened_at,closed_at,u_sold_item.u_sold_item_name,u_escalation_type,u_escalation_reason,active_escalation.opened_at"
			};
			// var sUrl = sap.support.fsc2.servicenowUrl + "?sysparm_query=u_responsible_party=sno%5enumberLIKE" + sValue + "&sysparm_fields=" + oDataService.sysparm_fields;
			// var sUrl = sap.support.fsc2.servicenowUrl + "?sysparm_query=correlation_display=" + sIncidentNo + "&sysparm_fields=" + oDataService.sysparm_fields;
			//"%5eORcorrelation_idLIKE" + sValue +;
			$.ajax({
				method: "GET",
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sap.support.fsc2.servicenowUrl,
				data: oDataService,
				success: function (oData) {
					var sData = [];
					oData.result.forEach(function (obj) {
						sData.push({
							"ID": obj.correlation_id,
							"IncidentNum": obj.correlation_id,
							"Title": obj.correlation_display + " " + formatter.SnowCaseStatusTxt(obj.state),
							"SNow_number": obj.number,
							"Description": obj.short_description,
							"ShortID": obj.correlation_display,
							"CustomerName": obj["account.name"],
							"CustomerNo": obj["account.number"],
							"SysID": obj.sys_id,
							"CIM_ID": obj.u_ccs_service_request_id,
							"Assigned_to": obj["assigned_to.name"],
							"Last_updated_time": obj.u_last_user_updated_on,
							"Status": formatter.SnowCaseStatusTxt(obj.state),
							"Next_action_due_time": obj.u_next_action_due
						});

					});
					this.getModel("SelectIncident").setProperty("/ServiceNow", {
						"loadComplete": true,
						"results": sData
					});
					this.afterLoadIncidents();
				}.bind(this),
				error: function (a, b, c) {
					sap.m.MessageToast.show("Service now API Unavailable");
				}
			});
		},
		afterLoadIncidents: function () {
			// this.getView().setBusy(false);
			if (!this.IncidentDialog) {
				this.IncidentDialog = new sap.ui.xmlfragment("selectIncident", "sap.support.fsc2.view.fragments.SelectIncident", this);
			}
			var BcLoadComp = this.getModel("SelectIncident").getProperty("/BCIncident/loadComplete");
			var SNowLoadComp = this.getModel("SelectIncident").getProperty("/ServiceNow/loadComplete");
			var aData = [];
			if (!BcLoadComp || !SNowLoadComp) {
				return;
			}
			var aData_BC = this.getModel("SelectIncident").getProperty("/BCIncident/results");
			var aData_SNow = this.getModel("SelectIncident").getProperty("/ServiceNow/results");
			aData = aData_BC.concat(aData_SNow);
			this.getModel("SelectIncident").setProperty("/results", aData);
			if (aData.length === 1) {
				this.onNavToCreateByIncident();
				// this.getView().setBusy(false);
			} else {
				this.getView().addDependent(this.IncidentDialog);
				this.IncidentDialog.open();
				// this.getView().setBusy(false);
			}
		},
		onNavToCreateByIncident: function (oEvent) {
			var that = this;
			var oData = {};
			if (oEvent) {
				oData = oEvent.getSource().getBindingContext("SelectIncident").getObject();
			} else {
				oData = this.getModel("SelectIncident").getProperty("/results")[0];
			}
			if (oData.CIM_ID) {
				MessageBox.warning("A CIM request already exists for this incident, please update it.", {
					onClose: function () {
						that.getView().setBusy(false);
						var layout = that.getModel().getProperty("/layout");
						if (layout === "OneColumn") {
							var nextLayout = "MidColumnFullScreen";
							var route = "requestDetail";
						} else if (layout === "EndColumnFullScreen") {
							var nextLayout = "EndColumnFullScreen";
							var route = "requestDetailEnd";
						}
						if (route && nextLayout) {
							that.getRouter().navTo(route, {
								layout: nextLayout,
								id: oData.CIM_ID
							});
						}
						/*that.getRouter().navTo("requestDetail", {
							id: oData.CIM_ID
						});*/
					}
				});
				return;
			}
			this.onGiveUpCreateCritical();
			this._onInitCreate();
			var sDeafultData = this.getModel("homePageConfig").getData();
			this.sEnableCase = sDeafultData.enableDefaultCase;
			if (sDeafultData.enableDefaultCase && sDeafultData.defaultCase !== "Empty") {
				this.getView().byId("setDefaultBtn").setVisible(true);
			} else {
				this.getView().byId("setDefaultBtn").setVisible(false);
			}
			this.sCustomerNo = formatter.trimPreZeros(oData.CustomerNo);
			var sURLCustomerName = oData.CustomerName;
			var sIncidentID = oData.ID;
			this.getModel("createCriticalSituation").setProperty("/CustomerNo", this.sCustomerNo.replace(/\b(0+)/gi, "") + " - " +
				sURLCustomerName);
			this.getModel("createCriticalSituation").setProperty("/CustomerNoEdit", false);
			this.getModel("createCriticalSituation").setProperty("/CustomerName", sURLCustomerName);
			this.getModel("createCriticalSituation").setProperty("/RequestReason", "");
			this.getModel("createCriticalSituation").setProperty("/BusinessImpact/Text", "");
			this._loadKeyWords();
			this.getModel("FieldVisible").setData({
				"RequestReason": true,
				"BusinessImpact": true,
				"CaseID": sDeafultData.enableDefaultCase, //true,
				"CustomerNo": true,
				"CustomerName": false,
				"AddIncBtn": false
			});
			this.getView().byId("idSwitch").setEnabled(false);
			if (sDeafultData.enableDefaultCase && sDeafultData.defaultCustNo === this.sCustomerNo) {
				this.getModel("createCriticalSituation").setProperty("/CaseID", sDeafultData.defaultCase);
			}
			var selectedIncidentData = {
				"currentSelected": {},
				"allSelected": {
					"results": []
				}
			};
			this.aAllSelectedID = [sIncidentID];
			selectedIncidentData.currentSelected = oData;
			selectedIncidentData.allSelected.results.push({
				"id": oData.ID,
				"title": oData.Description,
				"desc": oData.Title,
				"IncidentNum": oData.ID,
				"Sys_ID": oData.SysID,
				"SNow_number": oData.SNow_number
			});
			this.getModel("incidentList").setData({
				"results": oData
			});
			this.getModel("createCriticalSituation").setProperty("/AllSelected", this.aAllSelectedID);
			this.getModel("selectedIncidentList").setData();
			this.getModel("selectedIncidentList").setData(selectedIncidentData.allSelected);
			this.getView().setBusy(false);
			this.loadInicidentLongText(null, null, selectedIncidentData);
			if (this.IncidentDialog) {
				this.IncidentDialog.close();
			}
		},
		onSetDefault: function () {
			var that = this;
			MessageBox.warning(
				"After setting default, the page will only display default Case with related Customer Number and clear all other contents. Do you still want to set default?", {
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					onClose: function (sAction) {
						if (sAction === "YES") {
							that.onConfirmSetDefault();
						}
					}
				});
		},
		onConfirmSetDefault: function () {
			this.onInit();
			this._onRouteMatched();
			//this._removeAllUpload();
		},
		onClearAll: function () {
			var that = this;
			MessageBox.warning(
				"After clear all, all contents in the page will be cleared and cannot be recovered. Do you still want to clear all?", {
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					onClose: function (sAction) {
						if (sAction === "YES") {
							that.onConfirmClearAll();
						}
					}
				});
		},
		onConfirmClearAll: function () {
			this.ClearAll = true;
			this.onConfirmSetDefault();
			this.sCustomerNo = "";
			this.getModel("createCriticalSituation").setProperty("/CustomerNo", "");
			this.getModel("createCriticalSituation").setProperty("/CustomerName", "");
			this.getModel("createCriticalSituation").setProperty("/CaseID", "");
			this.getModel("createCriticalSituation").setProperty("/AllSelected", []);
			this.getModel("FieldVisible").setProperty("/AddIncBtn", true);
			this.ClearAll = false;
		},
		_loadKeyWords: function () {
			this.getModel("keyWords").setData({
				"results": [{
					Key_ID: "API",
					Key_Name: "Assign processor",
					Description: "The case has no processor? This is the right choice.",
					enabled: true
				}, {
					Key_ID: "RIP",
					Key_Name: "Raise Priority to Very High", //"Raise priority"
					Description: "The business impact is higher? Choose this.",
					enabled: true
				}, {
					Key_ID: "SUI",
					Key_Name: "Speed up",
					Description: "The case is more urgent now? Click here.",
					enabled: true
				}]
			});
			// sap.support.fsc2.FSC2Model.read("/FSC2KeywordSet", {
			// 	success: function (oData) {
			// 		this.getModel("keyWords").setData(oData);
			// 	}.bind(this),
			// 	error: function (oError) {
			// 		this.showErrorMessage(oError);
			// 	}.bind(this)
			// });
		},
		checkConsistCustomer_Case: function () {
			var sCaseID = this.getModel("createCriticalSituation").getProperty("/CaseID");
			var sCustNo = this.sCustomerNo;
			if (!sCaseID || !sCustNo) {
				return;
			}
			sap.support.fsc2.FSC2Model.read("/CasesSet", {
				filters: [
					new Filter("customer_r3_no", "EQ", sCustNo),
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
					if (!oData.results || oData.results.length === 0) {
						sap.m.MessageBox.warning("The input Case ID does not belong to the Customer No, please check.");
					}
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		_loadIncident: function (sIncidentID) {
			this.getView().setBusy(true);
			var selectedIncidentData = {
				"currentSelected": {},
				"allSelected": {
					"results": []
				}
			};
			this.aAllSelectedID = [sIncidentID];
			var aFilter = [];
			aFilter.push(new Filter("CssObjectID", "EQ", sIncidentID));
			sap.support.fsc2.IncidentModel.read("/IncidentList", {
				filters: aFilter,
				success: function (oData) {
					var aData = oData.results;
					if (!aData[0] || aData[0] && aData[0].ActiveSystem === "SNO") {
						this._loadSNowCase(sIncidentID);
						return;
					}
					var aEntry = [];
					if (aData[0]) {
						aEntry.push({
							"ID": aData[0].CssObjectID,
							"Title": aData[0].ObjectID + "/" + aData[0].MessageYear + " " + aData[0].StatusTxt,
							"ShortID": aData[0].ObjectID + "/" + aData[0].MessageYear,
							"Name": aData[0].CustomerName,
							"ComponentName": aData[0].ComponentName,
							"Description": aData[0].Description,
							"Priority": aData[0].PriorityTxt,
							"PriorityKey": aData[0].Priority,
							"Status": aData[0].StatusTxt,
							"Type": "FAVORITE_INCIDENTS",
							"IncidentNum": aData[0].CssObjectID,
							"ProcessType": aData[0].ProcessType,
							"Sys_ID": "",
							"ActiveSystem": aData[0].ActiveSystem === "" ? "bcp" : "sno" //I338673 set same as leading system in snow
						});
						selectedIncidentData.currentSelected = aEntry[0];
						selectedIncidentData.allSelected.results.push({
							"id": aData[0].CssObjectID,
							"title": aData[0].ObjectID + "/" + aData[0].MessageYear + " " + aData[0].StatusTxt,
							"desc": aData[0].Description,
							"IncidentNum": aData[0].CssObjectID,
							"Sys_ID": ""
						});
					}
					this.getModel("incidentList").setData({
						"results": aEntry
					});
					if (aEntry.length === 1) {
						this.getModel("UIconfig").setProperty("/RadioBtnIncidentEnabled", true);
					} else {
						this.getView().byId("rbg3").setSelectedIndex(1);
					}
					this.getModel("createCriticalSituation").setProperty("/AllSelected", this.aAllSelectedID);
					this.getModel("selectedIncidentList").setData();
					this.getModel("selectedIncidentList").setData(selectedIncidentData.allSelected);
					this.getView().setBusy(false);
					this.loadInicidentLongText(null, null, selectedIncidentData);
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		_loadSNowCase: function (sIncidentID) {
			this.getView().setBusy(true);
			var selectedIncidentData = {
				"currentSelected": {},
				"allSelected": {
					"results": []
				}
			};
			var oDataService = {
				"number": sIncidentID,
				"u_responsible_party": "sno",
				"sysparm_fields": "number,correlation_display,sys_updated_by,escalation,sys_id,short_description,correlation_id,u_case_number,priority,state,account.number,account.name,account.country,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,u_app_component.u_short_description,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,u_deployed_item.u_environment,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,resolution_code,resolved_by,resolved_at,close_notes,u_deployed_item.u_data_center_region,u_deployed_item.u_data_center,u_last_user_updated_by,u_next_action_due,u_last_user_updated_on,opened_at,closed_at,u_sold_item.u_sold_item_name,u_escalation_type,u_escalation_reason,active_escalation.opened_at, u_source_channel"
			};
			if (sIncidentID.substr(0, 2) !== "CS") {
				oDataService = {
					"correlation_id": sIncidentID,
					//		"u_responsible_party": "sno",
					"sysparm_fields": "number,correlation_display,sys_updated_by,escalation,sys_id,short_description,correlation_id,u_case_number,priority,state,account.number,account.name,account.country,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,u_app_component.u_short_description,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,u_deployed_item.u_environment,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,resolution_code,resolved_by,resolved_at,close_notes,u_deployed_item.u_data_center_region,u_deployed_item.u_data_center,u_last_user_updated_by,u_next_action_due,u_last_user_updated_on,opened_at,closed_at,u_sold_item.u_sold_item_name,u_escalation_type,u_escalation_reason,active_escalation.opened_at, u_source_channel"
				};
			}
			$.ajax({
				method: "GET",
				data: oDataService,
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sap.support.fsc2.servicenowUrl,
				success: function (oData) {
					var aData = oData.result;
					var aEntry = [];
					if (aData[0]) {
						var x = aData[0];
						aEntry.push({
							"ID": x.correlation_id,
							"SNow_number": x.number,
							"Title": x.correlation_display + " " + formatter.SnowCaseStatusTxt(x.state),
							"ShortID": x.correlation_display,
							"Name": x["account.name"],
							"ComponentName": x["u_app_component.u_name"],
							"Description": x.short_description,
							"Priority": formatter.priorityTxt(x.priority),
							"PriorityKey": x.priority,
							"Status": formatter.SnowCaseStatusTxt(x.state),
							"Type": "FAVORITE_INCIDENTS",
							"Sys_ID": x.sys_id,
							"IncidentNum": x.correlation_id,
							"opened_at": x.opened_at,
							"business_impact": x.business_impact,
							"ActiveSystem": x.u_responsible_party,
							"Source": x.u_source_channel,
							"Assigned_to": x["assigned_to.name"]
						});
						selectedIncidentData.currentSelected = aEntry[0];
						selectedIncidentData.allSelected.results.push({
							"id": x.number,
							"title": x.correlation_display + " " + formatter.SnowCaseStatusTxt(x.state),
							"desc": x.short_description,
							"Sys_ID": x.sys_id,
							"IncidentNum": x.correlation_id,
							"SNow_number": x.number,
							"priority": x.priority,
							"Status": formatter.SnowCaseStatusTxt(x.state),
							"Assigned_to": x["assigned_to.name"],
							"Assignment_group": x["assignment_group.name"],
							"Last_updated_time": x.u_last_user_updated_on,
							"Next_action_due_time": x.u_next_action_due
						});
						this.aAllSelectedID = [x.correlation_id];
					}
					this.getModel("incidentList").setData({
						"results": aEntry
					});

					if (aEntry.length === 1) {
						this.getModel("UIconfig").setProperty("/RadioBtnIncidentEnabled", true);
					}
					this.getModel("createCriticalSituation").setProperty("/AllSelected", this.aAllSelectedID);
					this.getModel("selectedIncidentList").setData();
					this.getModel("selectedIncidentList").setData(selectedIncidentData.allSelected);
					this.getView().setBusy(false);
					this.loadInicidentLongText(null, null, selectedIncidentData);
					// var oEntry = {
					// 				"ID": oData.currentSelected.ShortID,
					// 				"Description": oData.currentSelected.Description,
					// 				"Author": "",    //obj.user_id + "-" + obj.user_name,
					// 				"Time": aData[0].opened_at,
					// 				"Text":aData[0].business_impact
					// 			};
					// this.getModel("createCriticalSituation").setProperty("/BusinessImpact/" + oData.currentSelected.IncidentNum, oEntry);
					// this._updateBusinessImpact(null, null, selectedIncidentData);

				}.bind(this),
				error: function (a, b, c) {
					this.getView().setBusy(false);
					sap.m.MessageToast.show("Service now API Unavailable");
				}
			});

		},
		onNavBackCreate: function () {
			this._handleMessageBoxOpen(this.getResourceBundle().getText("txt_createCancel1"), "warning", "back");
		},
		onNavHomeCreate: function () {
			this._handleMessageBoxOpen(this.getResourceBundle().getText("txt_createCancel1"), "warning", "home");
		},
		_handleMessageBoxOpen: function (sMessage, sMessageBoxType, sNav) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						this.onGiveUpCreateCritical();
						this._onInitCreate();
						if (sNav === "back") {
							this.onNavBack();
						} else {
							//this.onNavHome();
							this.onNavToDashboard();
						}
					}
				}.bind(this)
			});
		},
		_onInitCreate: function () {
			//this._removeAllUpload();
			this._removeAllSelectedKeyWords();
			this.getView().byId("idSwitch").setState(true);
			this.getModel("FieldVisible").setProperty("/CustomerNo", true);
			this.getModel("FieldVisible").setProperty("/CustomerName", false);
			this.getModel("FieldVisible").setProperty("/RequestReason", false);
			this.getModel("FieldVisible").setProperty("/BusinessImpact", false);
			this.getView().byId("idCustName").setValueState("None");
			this.getView().byId("idBusImpact").setValueState("None");
			this.selectedP1Incident = false;
			this.getView().byId("idDesc2").setValueState("None");
			this.getView().byId("idDesc3").setValueState("None");
			this.getView().byId("idDesc4").setValueState("None");
			this.getView().byId("idDesc5").setValueState("None");
			this.getView().byId("idDesc6").setValueState("None");
		},
		_removeAllUpload: function () {
			// var oUploadCollection = this.byId("idUploadCollection");
			// oUploadCollection.removeAllItems();

			var oUploadSet = this.getView().byId("UploadSet");
			// oUploadSet.removeAllHeaderFields();
			oUploadSet.removeAllItems();
			oUploadSet.removeAllIncompleteItems();
		},
		_removeAllSelectedKeyWords: function () {
			var cCheckBoxs = this.getView().byId("idVerticalLayout").getContent();
			cCheckBoxs.forEach(function (x) {
				if (x.getSelected()) {
					x.setSelected(false);
				}
			});
			this.selectedKeyWords = [];
			this.selectedKeyWordsID = [];
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
		_openSelectDialog: function () {
			if (!this._oSelectDialog) {
				this._oSelectDialog = sap.ui.xmlfragment("idSelectFrag", "sap.support.fsc2.view.fragments.CustomerList", this);
				this.getView().addDependent(this._oSelectDialog);
			}
			this._oSelectDialog.open();
		},
		onConfirm: function (oEvent) {
			this.eventUsage(false, "Search customer through value help");
			var sCaseID = this.getModel("createCriticalSituation").getProperty("/CaseID");
			if (this.getModel("customerList").getData().length !== 0) {
				var oTable = sap.ui.core.Fragment.byId("idSelectFrag", "idCustListTab");
				if (oTable.getSelectedItem()) {
					this.getView().getModel("SelectedCustomer").setData(oTable.getSelectedItem().getBindingContext("customerList").getObject());
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
					var oCCSModel = this.getModel("createCriticalSituation");
					oCCSModel.setProperty("/CustomerNo", sCustNo + " - " + sCustName);
					oCCSModel.setProperty("/CustomerName", sCustName);
					oCCSModel.setProperty("/IncidentTitle", this.getResourceBundle().getText("incident") + "(0)");
					oCCSModel.setProperty("/AllSelected", []);
					this.checkConsistCustomer_Case();
					this.getModel("incidentList").setData({
						"results": []
					});
					this.getModel("selectedIncidentList").setData({});
					this._onInitCreate();

					this.onAddIncidentImpact();
					//----End Add----// 
				} else {
					sap.m.MessageToast.show("Please select one item before confirm");
				}
			}
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
		onCustInputChange: function (oEvent) {
			var oData = this.getModel("createCriticalSituation").getData();
			var sCustomerName = $.trim(oData.CustomerName);
			if (sCustomerName !== "") {
				this.getView().byId("idCustName").setValueState("None");
			}
		},
		onSearchCustomerName: function () {
			this.eventUsage(false, "Search customer based on customer no.");
			var oCustomer = this.getView().byId("idCustNo");
			oCustomer.setBusy(true);
			/** old create critical situation model */
			var oDataCreateSituation = this.getModel("createCriticalSituation").getData(); //getProperty("/CustomerNo");
			var sCustomerNo = oDataCreateSituation.CustomerNo.trim();
			var oFilter = new Filter({
				filters: [
					new Filter("Accuracy", "EQ", "X"),
					new Filter("Customer_No", "EQ", sCustomerNo)
				],
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				and: true
			});
			if (sCustomerNo !== "") {
				sap.support.fsc2.FSC2Model.read("/CustomerInfoSet", {
					filters: [oFilter],
					success: function (oData) {
						oCustomer.setBusy(false);
						var sCustomerName = "";
						if (oData.results && oData.results[0]) {
							sCustomerName = oData.results[0].Customer_Name;
							this.getView().byId("idCustNo").setValue(sCustomerNo + " - " + sCustomerName);
							this.sCustomerNo = formatter.trimPreZeros(oData.results[0].Customer_No);
							this.checkConsistCustomer_Case();
							this.bCustomerFound = true;
						} else {
							this.sCustomerNo = "";
							this.bCustomerFound = false;
							sap.m.MessageBox.warning("Couldn't find customer.\nPlease search the exact customer number.", {
								title: "Warning",
								actions: [sap.m.MessageBox.Action.CLOSE]
							});
							sCustomerName = "";
						}
						this.getModel("createCriticalSituation").setData({
							"CustomerNo": oData.results[0] ? (sCustomerNo + " - " + sCustomerName) : "",
							"CustomerNoEdit": true,
							"CustomerName": sCustomerName,
							"BusinessImpact": {
								"Text": ""
							},
							"Description": oDataCreateSituation.Description,
							"Title": oDataCreateSituation.Title, //"Request support for critical situation",
							"RequestReason": "",
							"AllSelected": [],
							"IncidentTitle": this.getResourceBundle().getText("incident") + "(0)",
							"CaseID": this.sEnableCase ? oDataCreateSituation.CaseID : "",
							"IsBusiDown": oDataCreateSituation.IsBusiDown,
						});

						//bdmOnlyEscalations
						var currentHash = this.getRouter().getHashChanger().getHash();
						var routeName = this.getRouter().getRouteInfoByHash(currentHash).name;
						if (routeName === "bdmOnlyEscalations") {
							this.getModel("createCriticalSituation").setProperty("/CustomerNoEdit", false);
						}

						this.getModel("incidentList").setData({
							"results": []
						});

						this.getModel("selectedIncidentList").setData({});
						this._onInitCreate();
						if (this.bAddIncidentBtnPress === true && this.bCustomerFound) {
							this.getRouter().navTo("incidentList", {
								layout: "MidColumnFullScreen",
								custnum: this.getModel("createCriticalSituation").getProperty("/CustomerNo").split(" - ")[0]
							});
						}
					}.bind(this),
					error: function (oError) {
						this.sCustomerNo = "";
						oCustomer.setBusy(false);
						this.showErrorMessage(oError);
					}.bind(this)
				});
			} else {
				oCustomer.setBusy(false);
			}
		},
		onAddIncidentImpact: function (oEvent) {
			this.bAddIncidentBtnPress = true;
			if (this.bCustomerFound) {
				var layout = this.getModel().getProperty("/layout");
				if (layout === "OneColumn") {
					this.getRouter().navTo("incidentList", {
						layout: "MidColumnFullScreen",
						custnum: this.getModel("createCriticalSituation").getProperty("/CustomerNo").split(" - ")[0]
					});
				} else if (layout === "EndColumnFullScreen") {
					this.getRouter().navTo("incidentListEnd", {
						layout: "EndColumnFullScreen",
						custnum: this.getModel("createCriticalSituation").getProperty("/CustomerNo").split(" - ")[0]
					});
				}
			}

		},
		loadInicidentLongText: function (sChanel, sEvent, oData) {
			this.getView().setBusy(true);
			var oEntry = {};
			// this.getModel("selectedIncidentList").setData();
			// this.getModel("selectedIncidentList").setData(oData.allSelected);
			if (oData.currentSelected.SNow_number) { // incident from SNow
				// var oEntry = {};
				/*var oDataService = {
					"pointer": oData.currentSelected.IncidentNum
				};
				$.ajax({
					method: "GET",
					contentType: "application/json",
					url: sap.support.fsc2.snowBusImpUrl,
					data: oDataService,
					success: function (oData2) {
						oData2.result.communication_summary.forEach(function (obj) {
							if(obj.type === "business impact"){
								oEntry = {
									"ID": oData.currentSelected.ShortID,
									"Description": oData.currentSelected.Description,
									"Author": obj.user_id + "-" + obj.user_name,
									"Time": obj.created_on,
									"Text": obj.text
								};
							}
						});
						this.getModel("createCriticalSituation").setProperty("/BusinessImpact/" + oData.currentSelected.IncidentNum, oEntry);
						this.getView().setBusy(false);
						this._updateBusinessImpact(null, null, oData);
					}.bind(this),
					error: function (a, b, c) {
						this.getView().setBusy(false);
						sap.m.MessageBox.error("Service now API Unavailable");
					}.bind(this)
				});*/
				var sBussinessImp = oData.currentSelected.business_impact || "";
				sBussinessImp = sBussinessImp.replace(/<\/?.+?>/g, ""); // remove html tab
				oEntry = {
					"ID": oData.currentSelected.ShortID,
					"Description": oData.currentSelected.Description,
					"Author": "", //obj.user_id + "-" + obj.user_name,
					"Time": oData.currentSelected.opened_at || "",
					"Text": sBussinessImp
				};
				this.getModel("createCriticalSituation").setProperty("/BusinessImpact/" + oData.currentSelected.IncidentNum, oEntry);
				this._updateBusinessImpact(null, null, oData.currentSelected.IncidentNum);

			} else {
				// var oEntry = {};
				sap.support.fsc2.IncidentModel.read("/LongText", {
					urlParameters: {
						"search": oData.currentSelected.IncidentNum // "002007974700008600812015"//
					},
					headers: {
						"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
					},
					success: function (oResponceData) {
						for (var i = 0; i < oResponceData.results.length; i++) {
							if (oResponceData.results[i].Texttype === "Business Impact") {
								oEntry = {
									"ID": oData.currentSelected.ShortID,
									"Description": oData.currentSelected.Description,
									"Author": oResponceData.results[i].AuthorId + "-" + oResponceData.results[i].Author,
									"Time": oResponceData.results[i].Formated_Time,
									"Text": oResponceData.results[i].Text
								};
							}
						}
						this.getModel("createCriticalSituation").setProperty("/BusinessImpact/" + oData.currentSelected.IncidentNum, oEntry);
						this.getView().setBusy(false);
						this._updateBusinessImpact(null, null, oData);
					}.bind(this),
					error: function (oError) {
						this.getView().setBusy(false);
						this.showErrorMessage(oError);
					}.bind(this)
				});
			}
		},
		_updateBusinessImpact: function (sChanel, sEvent, oData) {
			// this.getModel("selectedIncidentList").setData();
			// this.getModel("selectedIncidentList").setData(oData.allSelected);
			var that = this;
			var bLongTextComp = true,
				bSingleLoadComp = true;
			var oDataSelectedIncd = this.getModel("selectedIncidentList").getProperty("/results");
			oDataSelectedIncd.forEach(function (x) {
				bSingleLoadComp = that.getModel("createCriticalSituation").getProperty("/BusinessImpact/" + x.IncidentNum) ? true : false;
				bLongTextComp = bLongTextComp && bSingleLoadComp;
			});
			if (!bLongTextComp) { //if bLongTextComp = true, it means all longText has load completed
				return;
			}
			this.getView().setBusy(false);
			var sSelectedNum = oDataSelectedIncd.length; //hide request reason when select more then one incident
			this._updateChekBoxSelections(false, false);
			this.getModel("keyWords").setProperty("/results/1/enabled", true);
			this.getModel("keyWords").setProperty("/results/1/Description", "The business impact is higher? Choose this.");
			this.getModel("keyWords").setProperty("/results/0/enabled", true);
			this.getModel("keyWords").setProperty("/results/0/Description", "The message has no processor? This is the right choice.");
			if (sSelectedNum === 1) {
				this.selectedP1Incident = (oDataSelectedIncd[0].priority === "1") ? true : false;
				this.getModel("FieldVisible").setProperty("/RequestReason", true);
				this.getModel("FieldVisible").setProperty("/BusinessImpact", true);
				this.getModel("keyWords").setProperty("/results/1/enabled", !this.selectedP1Incident);
				if (this.selectedP1Incident) this.getModel("keyWords").setProperty("/results/1/Description", "Selected case priority is VH.");
				if (!(oDataSelectedIncd[0].Assigned_to.length === 0)) {
					this.getModel("keyWords").setProperty("/results/0/enabled", false);
					this.getModel("keyWords").setProperty("/results/0/Description", "This case has assigned processors!");
				}

			} else if (sSelectedNum > 1) {
				this._removeAllSelectedKeyWords();
				this.getModel("FieldVisible").setProperty("/RequestReason", false);
				this.getModel("FieldVisible").setProperty("/BusinessImpact", true);

			} else { //sSelectedNum === 0
				this.getModel("FieldVisible").setProperty("/RequestReason", false);
				this._removeAllSelectedKeyWords();
				this.getModel("FieldVisible").setProperty("/BusinessImpact", false);
			}
			var aAllSelectedID = [];
			var sSelectList = "";
			oDataSelectedIncd.forEach(function (x) {
				aAllSelectedID.push(x.IncidentNum);
				if (x.SNow_number) {
					sSelectList += x.title + "\n" + x.desc + "\n" + x.SNow_number + "\n";
				} else {
					sSelectList += x.title + "\n" + x.desc + "\n";
				}

			}.bind(this));
			this.sSelectList = sSelectList;
			this.getModel("createCriticalSituation").setProperty("/AllSelected", aAllSelectedID);
			// this.getModel("selectedIncidentList").setData(oData.allSelected);
			// var oCurrent = this.getModel("createCriticalSituation").getProperty("/BusinessImpact/" + oData.currentSelected.IncidentNum);
			// if (oData.currentSelected.IncidentNum && oCurrent.ID) {
			// 	var sCurrentText = "----------\n" + oCurrent.ID + "\nFrom: " + oCurrent.Author + "\n" +
			// 		oCurrent.Description + "\n" + oCurrent.Time + "\n" + oCurrent.Text + "\n";
			// } else {
			// 	var sCurrentText = "";
			// }
			// if (oData.bFlag) {
			// 	var sBusImpact = this.getModel("createCriticalSituation").getProperty("/BusinessImpact/Text");
			// 	var sTemp = sBusImpact.replace(sCurrentText.replace(/^\s+|\s+$/, ''), "");
			// 	if (aAllSelectedID.length !== 0) {
			// 		this.getModel("createCriticalSituation").setProperty("/BusinessImpact/Text", sTemp);
			// 	} else {
			// 		var sHeader = "Inserted business impact from selected incidents:";
			// 		if (sTemp.replace(/^\s+|\s+$/, '') === sHeader) {
			// 			this.getModel("createCriticalSituation").setProperty("/BusinessImpact/Text", "");
			// 		} else {
			// 			this.getModel("createCriticalSituation").setProperty("/BusinessImpact/Text", sTemp);
			// 		}
			// 	}
			// } else {
			var sText;
			// if (this.getModel("createCriticalSituation").getProperty("/BusinessImpact/Text") === "") {
			sText = "";
			aAllSelectedID.forEach(function (i) {
				var oEntry = this.getModel("createCriticalSituation").getProperty("/BusinessImpact/" + i);
				if (oEntry && oEntry.ID) {
					sText += "----------\n" + oEntry.ID + "\nFrom: " + oEntry.Author + "\n" +
						oEntry.Description + "\n" + oEntry.Time + "\n" + oEntry.Text + "\n";
				}
			}.bind(this));
			if (sText !== "") {
				sText = "Please insert additional business impact details \n\n\n\n\nInserted business impact from selected incidents:\n" + sText;
			}
			// } else {
			// 	sText = this.getModel("createCriticalSituation").getProperty("/BusinessImpact/Text") + sCurrentText;
			// }
			this.getModel("createCriticalSituation").setProperty("/BusinessImpact/Text", sText);
			// }
			this.onBusImpactChange();
		},
		onBusImpactChange: function () {
			var oData = this.getModel("createCriticalSituation").getData();
			var sBusImpact = $.trim(oData.BusinessImpact.Text);
			if (sBusImpact !== "") {
				this.getView().byId("idBusImpact").setValueState("None");
			}
		},
		checkBoxSelect: function (oEvent) {
			var selectedKeyWords = [],
				selectedKeyWordsID = [];
			var cCheckBoxs = this.getView().byId("idVerticalLayout").getContent();
			var bSelected = false;
			cCheckBoxs.forEach(function (x) {
				if (x.getSelected()) {
					bSelected = true;
					selectedKeyWords.push(x.getText());
					selectedKeyWordsID.push(x.data().Key_ID);
				}
			});
			this.selectedKeyWords = selectedKeyWords;
			this.selectedKeyWordsID = selectedKeyWordsID;
			this._updateChekBoxSelections(false, bSelected);
		},
		onTitleInputChange: function () {
			this.eventUsage(false, "Change default request title");
		},
		onDescInputChange: function (oEvent) {
			var sId = oEvent.getSource().getId();
			var sDescriptionFieldNumber = sId.slice(-1);
			var oData = this.getModel("createCriticalSituation").getData();
			var SDesc;
			var bDefaultCase = false;

			switch (sDescriptionFieldNumber) {
			case "1":
				SDesc = $.trim(oData.Description1);
				break;
			case "2":
				SDesc = $.trim(oData.Description2);
				break;
			case "3":
				SDesc = $.trim(oData.Description3);
				break;
			case "4":
				SDesc = $.trim(oData.Description4);
				break;
			case "5":
				SDesc = $.trim(oData.Description5);
				break;
			case "6":
				SDesc = $.trim(oData.Description6);
				break;
			default:
				SDesc = $.trim(oData.Description);
				bDefaultCase = true;
				break;
			}

			if (bDefaultCase && SDesc !== "") {
				this.getView().byId("idDesc").setValueState("None");
			} else if (SDesc !== "") {
				this.getView().byId("idDesc" + sDescriptionFieldNumber).setValueState("None");
			}

		},
		// onChange: function (oEvent) {
		// 	// Header Token
		// 	var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
		// 		name: "x-csrf-token",
		// 		value: this.oFileModel.getSecurityToken()
		// 	});
		// 	oEvent.getSource().addHeaderParameter(oCustomerHeaderToken);
		// },
		onFileDeleted: function (oEvent) {
			sap.m.MessageToast.show("Deleted successfully.");
		},
		onFilenameLengthExceed: function (oEvent) {
			sap.m.MessageToast.show("Please choose a file name less than 100 characters.");
			var oItem = oEvent.getParameter("item");
			this.getView().byId("UploadSet").removeIncompleteItem(oItem);
		},
		onFileSizeExceed: function (oEvent) {
			sap.m.MessageToast.show("Please choose a file less than 10 MB.");
			var oItem = oEvent.getParameter("item");
			this.getView().byId("UploadSet").removeIncompleteItem(oItem);
		},
		onTypeMissmatch: function (oEvent) {
			sap.m.MessageToast.show("This file type is not allowed");
			var oItem = oEvent.getParameter("item");
			this.getView().byId("UploadSet").removeIncompleteItem(oItem);
		},
		onBeforeUploadStarts: function (oEvent) {
			// var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZS_AGS_FSC2_SRV", true);
			// // Header Token
			// var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
			// 	name: "x-csrf-token",
			// 	value: oModel.getSecurityToken()
			// });
			// oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
			// // Header Slug
			// var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
			// 	name: "slug",
			// 	value: oEvent.getParameter("fileName")
			// });
			// oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			oEvent.getSource().removeAllHeaderFields();
			var oModel = new sap.ui.model.odata.v2.ODataModel(this.getOwnerComponent().sICDest + "/sap/ZS_AGS_FSC2_SRV", true);
			// Header Token
			var oCustomerHeaderToken = new sap.ui.core.Item({
				key: "x-csrf-token",
				text: oModel.getSecurityToken()
			});
			oEvent.getSource().addHeaderField(oCustomerHeaderToken);
			// Header Slug
			var oCustomerHeaderSlug = new sap.ui.core.Item({
				key: "slug",
				text: oEvent.getParameters().item.getFileName()
			});
			oEvent.getSource().addHeaderField(oCustomerHeaderSlug);
		},
		onUploadComplete: function (oEvent) {
			try {
				this.getModel("customerPageConfig").setProperty("/reload", true);
				//refresh the model the next time you open it as it may have been changed
			} catch (e) {
				void(0);
			}
			//this.getModel("customerPageConfig").setProperty("/reload", true);
			this.getView().setBusy(false);
			var sReturnMsg = this.Create.ResultText;
			var sDisplayMsg = "";
			var sDetailMsg = "";
			var sCategory1 = (this.selectedKeyWordsID.indexOf("RIP") !== -1); //request reason selected "Rase Incident priority"
			var sPriority = formatter.formatCCSPriorityText(this.getModel(
				"selectedIncidentList").getProperty("/results/0/p_formatter"), this.getModel("selectedIncidentList").getProperty(
				"/results/0/priority")); //this code path there will only ever be 1 incident,

			var sTransType = this.Create.Type;
			sap.escCreated = sTransType === "sn_customerservice_escalation" ? true : false; //a flag to trigger create survey on navigation to incident detail.
			if ((sTransType === "ZS46" || (sTransType === "ZS90" || sTransType === "sn_customerservice_escalation") && (sCategory1 || this.selectedP1Incident)) ||
				sPriority === "Very High") {
				sDisplayMsg = sReturnMsg + "\n" + "We will review your request and respond to you within 1 hour.";
			} else {
				sDisplayMsg = sReturnMsg + '\n' +
					'We aim to review and respond to your request within 4 hours - depending on the workload this timeframe, however, may elapse.'
				sDetailMsg =
					"Please reach out to the <a target='_blank' href='https://fiorilaunchpad.sap.com/sites#boostmobile-Display'>CIM Duty Lead </a> of the active region in case criticality increases.";

			}
			if (this.getModel("CreateEntity").getProperty("/bLongRunner") && !this.getModel("CreateEntity").getProperty("/bEscLongRunner")) {
				sDisplayMsg =
					"We have identified that there is a processing delay for this customer case on Product Support side. We have therefore triggered a notification to the responsible team to take timely action on this case. Please follow up on the case activity stream for further details within the next business day. If no visible action during this timeframe, please consider approaching the MCC by creating an MCC SOS App request.";
			}
			MessageBox.success(
				sDisplayMsg, { //"Create Successfully, ID:" + that.Create.ID, {
					details: sDetailMsg,
					styleClass: "sapUiSizeCompact",
					onClose: function (oAction) {
						this.onNavToDetail();
						this.onGiveUpCreateCritical();
						if (this.getView().byId("idSwitch").getState() && this.Create.CustomerNo !== "") {
							jQuery.sap.delayedCall(500, this, function () {
								this.checkFavorite(this.Create.CustomerNo);
							});
						}
						this._onInitCreate();
					}.bind(this)
				}
			);
		},
		checkFavorite: function (sCusNo) {
			var iCount = 0;
			sap.support.fsc2.FSC2Model.read("/FavoriteObjectSet", {
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					var len = oData.results.length;
					var aFavCus = [];
					for (var i = 0; i < len; i++) {
						if (oData.results[i].FavoriteType === "FAVORITE_CUSTOMERS") {
							aFavCus.push(oData.results[i].CustomerNo.replace(/\b(0+)/gi, ""));
						}
					}
					aFavCus.forEach(function (x) {
						if (x.trim() !== sCusNo.trim()) {
							iCount++;
						}
					});
					if (iCount === aFavCus.length) {
						MessageBox.confirm("Do you want to set the customer as favorite?", {
							actions: [MessageBox.Action.YES, MessageBox.Action.NO],
							onClose: function (oAction) {
								if (oAction === MessageBox.Action.YES) {
									this.setFavorite(sCusNo);
								} else {
									this.getEventBus().publish("Request", "_onRouteMatched");
								}
							}.bind(this)
						});
					} else {
						this.getEventBus().publish("Request", "_onRouteMatched");
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("Service Unavailable!");
				}
			});
		},

		setFavorite: function (sCusNo) {
			var customerNo = (Array(10).join("0") + sCusNo).slice(-10);
			sap.support.fsc2.UserProfileModel.create("/Entries", {
				"Attribute": "FAVORITE_CUSTOMERS",
				"Value": customerNo
			}, {
				success: function () {
					this.eventUsage(false, "Set \'Customer\' favorite");
					this.loadFavCustData();
				}.bind(this)
			});
		},
		onNavToDetail: function () {
			/*var layout = this.getModel().getProperty("/layout");
			if (layout === "OneColumn") {
				var nextLayout = "MidColumnFullScreen";
				switch (this.Create.Type) { // case "ZS31"://Global Escalation Case
				case "ZS46": //Activity
					var route = "mccDetail";
					break;
				case "ZS90": //CIM Request
					var route = "requestDetail";
					break;
				case "sn_customerservice_escalation": //Snow Escalation Request
					var route = "requestDetail";
					break;
				}
			} else if (layout === "EndColumnFullScreen") {
				var nextLayout = "EndColumnFullScreen";
				switch (this.Create.Type) { // case "ZS31"://Global Escalation Case
				case "ZS46": //Activity
					var route = "mccDetailEnd";
					break;
				case "ZS90": //CIM Request
					var route = "requestDetailEnd";
					break;
				case "sn_customerservice_escalation": //Snow Escalation Request
					var route = "requestDetailEnd";
					break;
				}
			}*/
			if (this.Create.Type && this.Create.Type !== "") {
				/*	this.getRouter().navTo(route, {
						layout: nextLayout,
						"activity_id": this.Create.ID
					});*/
				this.onNavToCriticalRequest(this.Create.Type, this.Create.ID, "", 2);
			} else {
				this.getRouter().navTo("dashboard", {
					layout: "OneColumn"
				});
			}
			/*	switch (this.Create.Type) {
					// case "ZS31"://Global Escalation Case
					// 	this.getRouter().navTo("escalationCaseDetail", {
					// 		"id": this.Create.ID
					// 	});
					// 	break;

				case "ZS46": //Activity mccDetail/activity_id={activity_id}
					this.getRouter().navTo("mccDetail", {
						"activity_id": this.Create.ID
					});
					break;
				case "ZS90": //CIM Request "incident/id={id}"
					this.getRouter().navTo("requestDetail", {
						"id": this.Create.ID
					});
					break;
				case "sn_customerservice_escalation": //Snow Escalation Request "incident/id={id}&transType={transType}"
					this.getRouter().navTo("requestDetail", {
						"id": this.Create.ID,
						"transType": this.Create.Type
					});
					break;
				default:
					this.onNavToDashboard();
				}*/
		},
		handleCancel: function () {
			this._handleMessageBoxOpen(this.getResourceBundle().getText("txt_createCancel1"), "warning", "back");
		},
		handleSubmit: function () {
			this.getView().byId("submit_new").setEnabled(false);
			this.getView().setBusy(true);
			this.eventUsage(false, "Click Submit to create critical situation");
			var oData = this.getModel("createCriticalSituation").getData();
			var sCustomerName = $.trim(oData.CustomerName);
			var sBusinessImpact = $.trim(oData.BusinessImpact.Text);
			var sBImpactVisile = this.getModel("FieldVisible").getData().BusinessImpact;
			var sDesc = $.trim(oData.Description);
			var sCustomerNo = formatter.trimPreZeros(this.sCustomerNo);
			var sCaseID = oData.CaseID;
			//check whether Customer No and Case ID are matched
			var sRequestHint = this.getModel("i18n").getResourceBundle().getText("requestHint").trim();
			var sRequestHint1 = this.getModel("i18n").getResourceBundle().getText("requestHint1").trim();
			var sRequestHint2 = this.getModel("i18n").getResourceBundle().getText("requestHint2").trim();
			var sRequestHint3 = this.getModel("i18n").getResourceBundle().getText("requestHint3").trim();
			var sRequestHint4 = this.getModel("i18n").getResourceBundle().getText("requestHint4").trim();
			var sRequestHint5 = this.getModel("i18n").getResourceBundle().getText("requestHint5").trim();
			var sRequestHint6 = this.getModel("i18n").getResourceBundle().getText("requestHint6").trim();
			//var bDescChanged = sRequestHint !== sDesc;
			var bDescChanged = oData.Description2.trim().length > 0 &&
				oData.Description3.trim().length > 0 && oData.Description4.trim().length > 0 && oData.Description5.trim().length > 0 &&
				oData.Description6.trim().length > 0;
			if (sCustomerName !== "" && (sBImpactVisile && sBusinessImpact !== "" || !sBImpactVisile) && bDescChanged) {
				if (sCustomerNo && sCaseID) {
					sap.support.fsc2.FSC2Model.read("/CasesSet", {
						filters: [new Filter("customer_r3_no", "EQ", sCustomerNo),
							new Filter("case_id", "EQ", sCaseID),
							new Filter("case_type", "EQ", "ZS02"),
							new Filter("status", "EQ", "71"),
							new Filter("status", "EQ", "80"),
							new Filter("status", "EQ", "81"),
							new Filter("status", "EQ", "99")
						],
						success: function (oData2) {
							if (!oData2.results || oData2.results.length === 0) {
								this.getView().setBusy(false);
								this.getView().byId("submit_new").setEnabled(true);
								sap.m.MessageBox.warning(
									"The Case ID does not belong to the Customer No in creation page,\nPlease change and then submit again.", {
										title: "Warning",
										actions: [sap.m.MessageBox.Action.CLOSE]
									});
								return;
							} else {
								this.onBeforeSend();
							}
						}.bind(this),
						error: function (oError) {
							this.getView().setBusy(false);
							this.getView().byId("submit_new").setEnabled(true);
							this.showErrorMessage(oError);
						}.bind(this)
					});
				} else {
					this.onBeforeSend();
				}
			} else {
				if (!sCustomerName || sCustomerName === "") {
					this.getView().byId("idCustName").setValueState("Error");
				}
				if (sBusinessImpact === "") {
					this.getView().byId("idBusImpact").setValueState("Error");
				}
				// if (!bDescChanged) {
				// 	this.getView().byId("idDesc").setValueState("Error");
				// }

				// if (sRequestHint1 === $.trim(oData.Description1)) {
				// 	this.getView().byId("idDesc1").setValueState("Error");
				// }

				if (oData.Description2.trim().length === 0) {
					this.getView().byId("idDesc2").setValueState("Error");
				}

				if (oData.Description3.trim().length === 0) {
					this.getView().byId("idDesc3").setValueState("Error");
				}

				if (oData.Description4.trim().length === 0) {
					this.getView().byId("idDesc4").setValueState("Error");
				}

				if (oData.Description5.trim().length === 0) {
					this.getView().byId("idDesc5").setValueState("Error");
				}

				if ($.trim(oData.Description6).length === 0) {
					this.getView().byId("idDesc6").setValueState("Error");
				}

				this.getView().setBusy(false);
				this.getView().byId("submit_new").setEnabled(true);
				sap.m.MessageBox.error(this.getResourceBundle().getText("mandatoryCheck"), {
					title: "Error"
				});
			}
		},

		getServiceTeam: function () {
			var oServiceTeamMap = new Map();
			var oMax = {
				serviceTeamId: "",
				solutionArea: "",
				count: 0,
			};
			var aTeamList = this.getModel("serviceTeamListModel").getData();

			var aPortfolio = aTeamList.filter((team) => team.portfolio.length > 0);
			var aProductFamily = aTeamList.filter((team) => team.productFamily.length > 0);
			var aImsSupportProduct = aTeamList.filter(
				(team) => team.imsSupportProduct.length > 0
			);
			var aComponent = aTeamList.filter((team) => team.component.length > 0);
			var aFunctional = aTeamList.filter((team) => team.functionalArea.length > 0);
			var aRegion = aTeamList.filter((team) => team.region.length > 0);
			//productFamily
			var fnHelperFuncion = (map, item) => {
				if (map.has(item.serviceTeamId)) {
					map.set(item.serviceTeamId, map.get(item.serviceTeamId) + 1);
				} else {
					map.set(item.serviceTeamId, 1);
				}
				let nCount = map.get(item.serviceTeamId);
				oMax =
					oMax.count >= nCount ? oMax : {
						serviceTeamId: item.serviceTeamId,
						solutionArea: item.solutionArea,
						count: nCount,
					};
			};

			// if (this.getModel("selectedIncidentList").getData().results.length > 1) {
			this.getModel("selectedIncidentList")
				.getData()
				.results.forEach((oSelectedIncident) => {
					let oFoundTeam;
					// 1. functionalArea contains: SAP S/4HANA
					if (oSelectedIncident.functionalArea.trim().length > 0) {
						let bCloud = false;
						oFoundTeam = aFunctional.filter((item) => {
							let bFound = oSelectedIncident.functionalArea
								.toLowerCase()
								.includes(
									item.functionalArea.toLowerCase()) &&
								oSelectedIncident.region.toLowerCase() ===
								item.region.toLowerCase()

							if (bFound) {
								bCloud = oSelectedIncident.functionalArea
									.toLowerCase()
									.includes("cloud");
							}

							return bFound;
						});

						if (oFoundTeam.length > 0) {
							if (bCloud) {
								oFoundTeam[0] = aTeamList[aTeamList.length - 1]; //MCC Global team
							}
							fnHelperFuncion(oServiceTeamMap, oFoundTeam[0]);
							return true;
						}
					}

					// 2. imsSupportProduct contains: Hybris
					if (oSelectedIncident.imsSupportProduct.trim().length > 0) {
						oFoundTeam = aImsSupportProduct.filter((item) =>
							oSelectedIncident.imsSupportProduct
							.toLowerCase()
							.includes(
								item.imsSupportProduct.toLowerCase()
							) &&
							oSelectedIncident.region.toLowerCase() ===
							item.region.toLowerCase()
						);
						if (oFoundTeam.length > 0) {
							fnHelperFuncion(oServiceTeamMap, oFoundTeam[0]);
							return true;
						}
					}

					// 3. product family: BTP HANA or BTP ABAP Platform
					// 4. product family: BW & EPM or Analytics
					if (oSelectedIncident.productFamily.trim().length > 0) {
						oFoundTeam = aProductFamily.filter(
							(item) =>
							item.productFamily.filter(
								(product) =>
								product.name.toLowerCase() ===
								oSelectedIncident.productFamily.toLowerCase()
							).length > 0 &&
							oSelectedIncident.region.toLowerCase() === item.region.toLowerCase()
						);
						if (oFoundTeam.length > 0) {
							fnHelperFuncion(oServiceTeamMap, oFoundTeam[0]);
							return true;
						}
					}

					// 5. portfolio: Business Technology Platform or Intelligent Technologies
					// 6. portfolio: Customer Experience
					// 7. portfolio: Digital Core
					// 8. portfolio: People
					// 9. portfolio: Ariba & Fieldglass
					if (oSelectedIncident.portfolio.trim().length > 0) {
						oFoundTeam = aPortfolio.filter(
							(item) =>
							item.portfolio.filter(
								(product) =>
								product.name.toLowerCase() ===
								oSelectedIncident.portfolio.toLowerCase()
							).length > 0 &&
							oSelectedIncident.region.toLowerCase() ===
							item.region.toLowerCase() && !oSelectedIncident.functionalArea.toLowerCase().includes("grc")
						);
						if (oFoundTeam.length > 0) {
							fnHelperFuncion(oServiceTeamMap, oFoundTeam[0]);
							return true;
						}
					}

					// 10. default
					oFoundTeam = [aTeamList[aTeamList.length - 1]];
					if (oFoundTeam.length > 0) {
						fnHelperFuncion(oServiceTeamMap, oFoundTeam[0]);
						return true;
					}
				});

			return oMax;
			// }//
		},

		onBeforeSend: function () {
			this.eventUsage(false, "Request Support for Critical Situation");
			// this.getView().setBusy(true);
			var oData = this.getModel("createCriticalSituation").getData();
			var sDescription = "##" + this.getModel("i18n").getResourceBundle().getText("requestHint2") + oData.Description2 + "\n\n" +
				"##" + this.getModel("i18n").getResourceBundle().getText("requestHint3") + oData.Description3 + "\n\n" +
				"##" + this.getModel("i18n").getResourceBundle().getText("requestHint4") + oData.Description4 + "\n\n" +
				"##" + this.getModel("i18n").getResourceBundle().getText("requestHint5") + oData.Description5 + "\n\n" +
				"##" + this.getModel("i18n").getResourceBundle().getText("requestHint6") + oData.Description6;

			var sRequestDesc = sDescription + "\n\n" + "#" + this.selectedKeyWords.join("##") + "#";
			if (oData.IsBusiDown) {
				sRequestDesc = "!CRITICAL SITUATION, PLEASE CALL ME! " + "\n\n" + sRequestDesc;
			}
			if (!this.sCustomerNo) {
				this.sCustomerNo = formatter.trimPreZeros(oData.CustomerNo.split("-")[0]);
			}
			var oEntry = {
				"CustomerNo": this.sCustomerNo,
				"CustomerName": oData.CustomerName,
				"IncidentNum": oData.AllSelected.join(","), //|| "002028376000000010932018,002028376000000022312018", //for test
				"RequestDesc": sRequestDesc,
				"BusImpact": this.sSelectList + "\n" + oData.BusinessImpact.Text,
				"KeyWords": this.selectedKeyWords.join(","),
				"Description": oData.isRISE === true ? "[RISE] " + oData.Title : oData.Title,
				"IsBusiDown": oData.IsBusiDown ? "X" : "",
				"Case_ID": oData.CaseID
			};
			oEntry.Description = oEntry.Description.substring(0, 40);
			this.getModel("CreateEntity").setData({...this.getModel("CreateEntity").getData(),
				...oEntry
			});
			if (oData.AllSelected.length === 1) {
				this.getModel("CreateEntity").setProperty("/bLongRunner", false);
				var sFirstSelectedList = this.getModel("selectedIncidentList").getData().results[0];
				if (sFirstSelectedList && sFirstSelectedList.Sys_ID !== "") {
					oEntry.snow_sysid = sFirstSelectedList.Sys_ID;
				}

				if ((sFirstSelectedList.priority === "2") && (sFirstSelectedList.Assignment_group.toUpperCase()
						.startsWith("PS DCP")) && !oEntry.KeyWords.includes("Raise") &&
					(sFirstSelectedList.Status.includes("In progress") || sFirstSelectedList.Status.includes("New"))) {

					// let iTimeSinceLastAction = new Date().getTime() - new Date(sFirstSelectedList.Last_updated_time).getTime();
					// let bLastUpdateTimeExceded = iTimeSinceLastAction > 172800000 ? true : false; // 2d;

					// if (bLastUpdateTimeExceded && (new Date() > new Date(sFirstSelectedList.Next_action_due_time))) {
					// 	let sUrl = sap.support.fsc2.servicenowTableUrl + "/task_sla?sysparm_query=task=" + sFirstSelectedList.Sys_ID +
					// 		"%5Esla.u_sub_type=MPT";
					// 	$.ajax({
					// 		method: "GET",
					// 		contentType: "application/json",
					// 		headers: {
					// 			'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
					// 		},
					// 		url: sUrl,
					// 		success: function (oData) {
					// 			if (oData.result && parseFloat(oData.result[0].percentage) > 70) {
					// 				this.eventUsage(false, "PS Long Runners");
					// 				this.getModel("CreateEntity").setProperty("/bLongRunner", true);
					// 			}
					// 		}.bind(this),
					// 		error: function (oError) {
					// 			// only for debug log
					// 			// new log lib to be used
					// 		}.bind(this)
					// 	})
					// }
					if (sFirstSelectedList.p_formatter === "snow") {
						this.loadSummary_snow(sFirstSelectedList.IncidentNum, sFirstSelectedList); // also checks for ps long runenr based on communication summary time
					} else {
						this.loadSummary_BC(sFirstSelectedList.IncidentNum, sFirstSelectedList); // also checks for ps long runenr based on communication summary time
					}

				}
			}

			// var sActivityServiceTeam = ""
			var oServiceTeam;
			if (this.getModel("selectedIncidentList").getData().results && this.getModel("selectedIncidentList").getData().results.length > 1) {
				if (this.getModel("selectedIncidentList").getData().results.find(incident => incident.priority === "1")) {
					this.eventUsage(false, "Auto Dispatch not used due to VH.");
				} else {
					oServiceTeam = this.getServiceTeam();
					this.getView().getModel("SelectedServiceTeam").setData(oServiceTeam);
				}
			}
			var sExpertMode = this.getModel("homePageConfig").getProperty("/expertMode");
			if (oData.AllSelected.length === 1 && oData.IsBusiDown) {
				oEntry.Priority = "1"; //create ICP activity with priority - very high
				oEntry.TransType = "ZS46";
				this.getModel("CreateEntity").setData(oEntry);
				this.eventUsage(false, "Assigning activity to MCS Global service team");
				this.getModel("CreateEntity").setProperty("/ActivityServiceTeam", "29029183"); // adding service team 29029183
				this.getView().getModel("SelectedServiceTeam").setData({
					serviceTeamId: "29029183",
					solutionArea: "MCS Global"
				});
				// }
				this.onSend();
			} else if (oData.AllSelected.length === 1 && !oData.IsBusiDown && sExpertMode) {
				this.onSend();
			} else if (oData.AllSelected.length === 1 && !oData.IsBusiDown && !sExpertMode) {
				//create CIM Request
				this.getModel("CreateEntity").setProperty("/TransType", "ZS90");
				this.onSend();
			} else if (oData.AllSelected.length > 1 && !oData.IsBusiDown) {
				this.getModel("CreateEntity").setProperty("/TransType", "ZS46");
				if (oServiceTeam) {
					this.getModel("CreateEntity").setProperty("/ActivityServiceTeam", oServiceTeam.serviceTeamId);
					this.eventUsage(false,
						`Assigning activity to ${oServiceTeam.serviceTeamId} - ${oServiceTeam.solutionArea} via Auto Dispatch CCT.`);
				} else {
					this.getModel("CreateEntity").setProperty("/ActivityServiceTeam", "20672944");
					//this.getModel("CreateEntity").setProperty("/ServiceTeamSolutionArea", "MCC GLOBAL"); //MCC GLOBAL
					this.getView().getModel("SelectedServiceTeam").setData({
						serviceTeamId: "20672944",
						solutionArea: "MCC GLOBAL"
					});
				}

				this.onSend();
			} else {
				//create ICP activity like before
				this.getModel("CreateEntity").setProperty("/TransType", "ZS46");
				if (oData.IsBusiDown) {
					this.eventUsage(false, "Assigning activity to MCS Global service team");
					this.getModel("CreateEntity").setProperty("/ActivityServiceTeam", "29029183"); // adding service team 29029183
				}
				this.onSend();
			}
		},
		onPressRadioBtnExpertMode: function (oEvent) {
			var sText = oEvent.getSource().getSelectedIndex();
			//var sType;
			switch (sText) {
			case 0:
				this.getModel("CreateEntity").setProperty("/TransType", "");
				delete this.getModel("CreateEntity").getData().Priority;
				break;
			case 1:
				this.getModel("CreateEntity").setProperty("/TransType", "ZS46");
				delete this.getModel("CreateEntity").getData().Priority;
				break;
			case 2:
				this.getModel("CreateEntity").setProperty("/TransType", "ZS46");
				this.getModel("CreateEntity").setProperty("/Priority", "1");
				break;
			}

		},

		onCloseEscTypeDialog: function () {
			this._oEscTypeDialog.close();
			this.getView().setBusy(false);
			this.getView().byId("submit_new").setEnabled(true);
		},

		onSend: function () {
			this.getView().setBusy(true);
			var oEntry = this.getModel("CreateEntity").getData();
			var sLeadingSystem;
			var sProcessType;
			var sSource;
			var bExpertMode = this.getModel("homePageConfig").getProperty("/expertMode");
			var bCritSituation = this.getView().byId("rbg3").getSelectedIndex() === 1 && bExpertMode ? true : false;
			if (this.getModel("incidentList").getData().results.length > 0) {
				sLeadingSystem = this.getModel("incidentList").getData().results[0].ActiveSystem;
				sProcessType = this.getModel("incidentList").getData().results[0].ProcessType; //activesystem?
				sSource = this.getModel("incidentList").getData().results[0].Source;
			}
			if (sProcessType !== "ZTSR" && oEntry.IsBusiDown !== "X" && oEntry.IncidentNum !== "" && !oEntry.IncidentNum.includes(",") &&
				sSource !== "spcpt" && !bCritSituation) {
				// if leading is bcp then set escala

				if (!oEntry.snow_sysid) {
					var oDataService = {
						"correlation_id": oEntry.IncidentNum,
						"sysparm_fields": "sys_id"
					};
					var sUrl = sap.support.fsc2.servicenowUrl;
					$.ajax({
						method: "GET",
						data: oDataService,
						contentType: "application/json",
						headers: {
							'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
						},
						url: sUrl,
						success: function (oData) {
							this.getView().setBusy(false);
							if (oData.result && oData.result[0]) {
								oEntry.snow_sysid = oData.result[0].sys_id;
								this.checkForOpenTBEEscalation(oEntry);
								this.checkForPSLongRunnerEscalation(oEntry);
							} else {
								this.setBcEscalationFlag(oEntry);
							}
						}.bind(this),
						error: function (a, b, c) {
							this.getView().setBusy(false);
							sap.m.MessageToast.show("Service now API Unavailable");
						}
					});
				} else {
					this.checkForOpenTBEEscalation(oEntry);
					this.checkForPSLongRunnerEscalation(oEntry);
				}
			} else if (sProcessType === "ZTSR" || oEntry.IsBusiDown === "X" || (oEntry.IncidentNum === "" || oEntry.IncidentNum.includes(",")) ||
				sSource === "spcpt" || bCritSituation) { //create activity
				if (sProcessType === "ZTSR") {
					oEntry.TransType = "ZS46";
				}
				if (sSource === "spcpt") {
					oEntry.TransType = "ZS46";
					oEntry.Priority = "3";
				}
				if (bCritSituation) {
					oEntry.TransType = "ZS46";
					oEntry.Priority = "3";
				}
				delete oEntry.bLongRunner;
				delete oEntry.bEscLongRunner;
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
							"CustomerName": oResponceData.CustomerName
						};
						if (oResponceData.TransType === "ZS90") { //CIM REquest //I338673 can remove this since no cim request will be created anymore??
							this.eventUsage(false, "Create a CIM Request in MCC SOS app");
						} else if (oResponceData.TransType === "ZS46") { //Activity
							this.eventUsage(false, "Create an Activity in MCC SOS app");
							// creation of message postponed: no generic user available
							if (oEntry.ActivityServiceTeam && oEntry.ActivityServiceTeam !== "20672944" && oEntry.ActivityServiceTeam !== "29029183") {
								var sFSC2Set = this.getOwnerComponent().sFSC2Activity + "/receipt_notif/FSC2ActivitySet('" + oResponceData.ID + "')";
								var oModel = new sap.ui.model.odata.ODataModel(this.getOwnerComponent().sFSC2Activity + "/receipt_notif/FSC2ActivitySet/", {
									headers: {
										"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
									},
									loadMetadataAsync: true
								});
								sap.ui.getCore().setModel(oModel);
								oModel.refreshSecurityToken();
								var oModelHeaders = oModel.getHeaders();
								var oHeaders = new Object();
								oHeaders = {
									"x-csrf-token": oModelHeaders['x-csrf-token'],
									"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO", //API Management: ID for MCC SOS App
									"Content-Type": "application/json; charset=utf-8"
								};
								$.ajax({
									method: "PUT",
									data: JSON.stringify({
										"Notes": `Dear ${this.getModel("CurrentUserInfo").getProperty("/UserName")} , \n\nThank you for your message. This is to confirm the receipt of your request.\n\nThe evaluation process will be started soon to obtain a comprehensive view of the current situation and to suggest next actions. Please expect to be contacted by MCC to provide further information if required.\nPlease be aware that depending on the availability of required SAP stakeholders and complexity of the situation, this evaluation process may take up to one business day. Customer situations that do not qualify for 24/7 processing in Business Down Management, will be handled during your regional MCC business hours working 8/5\n\nBest regards,\nMission Control Center,\nSAP SE`,
										"activity_status": "E0010",
										"activity_person_user_id": "",
										"activity_process_type": "ZS46"
									}),
									url: sFSC2Set,
									headers: oHeaders,
								});
							}
							if ((JSON.stringify(this.getView().getModel("SelectedCustomer").getData()).length === 0 ||
									JSON.stringify(this.getView().getModel("SelectedCustomer").getData()) == "{}") &&
								this.getView().getModel("customerDetails") !== undefined) {
								this.getView().getModel("SelectedCustomer").setData(this.getView().getModel("customerDetails").getData());
							}
							this.onQueueButtonPress("ACTIVITY", null, this.getView().getModel("SelectedCustomer").getData(), this.getView().getModel(
								"SelectedServiceTeam").getData(), oResponceData.ID, null);
						}
						if (oResponceData.TransType === "ZS90" && oResponceData.snow_sysid !== "") { //escalating snow case
							var obj_Snow = {
								"u_external_id": oResponceData.IncidentNum, //"002075129200003283302019",
								"u_external_id_field": "correlation_id",
								"u_target_field": "u_ccs_service_request_id",
								"u_target_table": "sn_customerservice_case",
								"u_target_value": oResponceData.ID //"74098908"
							};
							$.ajax({
								method: "POST",
								data: JSON.stringify(obj_Snow),
								contentType: "application/json",
								headers: {
									'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
								},
								url: sap.support.fsc2.postServicenowUrl
									// success: function () {
									// 	sap.m.MessageToast.show("Post to Service Now successfully");
									// },
									// error: function () {
									// 	sap.m.MessageToast.show("Post to Service Now failed");
									// }
							});
						}
						//this.fillEmbeddedData();
						sap.ACreated = true
						this.onUploadComplete(this.Create.ID);

					}.bind(this),
					error: function (oError) {
						this.getView().setBusy(false);
						this.getView().byId("submit_new").setEnabled(true);
						// var sEntity = JSON.stringify(oEntry);
						// sap.m.MessageBox.error(sEntity);
						this.showErrorMessage(oError);
					}.bind(this)
				});
			}
		},
		processSnowCreateEscaErrorMsg: function (oObj) {
			this.getView().setBusy(false);
			this.getView().byId("submit_new").setEnabled(true);
			sap.m.MessageBox.show(oObj.response_message, {
				icon: sap.m.MessageBox.Icon.ERROR,
				title: "Error",
				actions: [sap.m.MessageBox.Action.CLOSE],
				details: oObj.more_info,
				styleClass: "sapUiSizeCompact"
			});
		},
		createSnowEscalation: function () {
			this.getView().setBusy(true);
			var that = this;
			var sUserID = this.getModel("CurrentUserInfo").getProperty("/UserID");

			var oEntry = this.getModel("CreateEntity").getData();
			var aKeywords = oEntry.KeyWords.split(',');
			var aSnowCategories = this.getModel("snowEscCategoryJson").getData().categories;
			var aSnowID = new Array();
			for (var i = 0; i < aKeywords.length; i++) {
				for (var k = 0; k < aSnowCategories.length; k++) {
					if (aSnowCategories[k].categoryName === aKeywords[i]) {
						aSnowID.push(aSnowCategories[k].categoryId);
					}
				}
			}

			var obj_Snow = {
				"u_bcp_correlation_id": oEntry.IncidentNum,
				"u_escalation_type": "3",
				"u_short_description": oEntry.Description,
				"u_request": oEntry.RequestDesc,
				"u_requested_by": sUserID,
				"u_type": "Escalated Case",
				"u_last_user_updated_by": sUserID,
				"sys_target_sys_id": "",
				"u_expected_action": aSnowID.join(','),
				"u_business_impact": oEntry.BusImpact.replaceAll("\n", "<br>"), //oEntry.BusImpact,
				"u_update_expected_action": true,
				"u_update_business_impact": true
			};

			if (oEntry.bLongRunner && !oEntry.bEscLongRunner) {
				obj_Snow.approval = "immediate_action";
				obj_Snow.u_request_reason = "15";
			}

			var currentHash = this.getRouter().getHashChanger().getHash();
			var routeName = this.getRouter().getRouteInfoByHash(currentHash).name;
			if (routeName === "bdmOnlyEscalations") {
				obj_Snow.u_escalation_type = 0;
			}
			$.ajax({
				method: "POST",
				data: JSON.stringify(obj_Snow),
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sap.support.fsc2.servicenowEscalationUrlCreateApi,
				success: function (oData) {
					this.getView().setBusy(false);
					this.getView().byId("submit_new").setEnabled(true);
					that.bEscalationTimeout = false;
					var oOdataObj = oData.result[0];
					//to accomodate new snow API where unsuccessful creation returns success resp
					if (oOdataObj.status === "error") {
						this.processSnowCreateEscaErrorMsg(oOdataObj);
					} else {
						this.eventUsage(false, "Create Escalation record in MCC SOS app");
						let aKeywords = this.getModel("CreateEntity").getData().KeyWords.split(',');
						for (var i = 0; i < aKeywords.length; i++) {
							if (aKeywords[i] === "Assign processor") {
								this.eventUsage(false, "Create Escalation record in MCC SOS app with Expected Action: Assign Processor");
							} else if (aKeywords[i] === "Speed up") {
								this.eventUsage(false, "Create Escalation record in MCC SOS app with Expected Action: Speed Up");
							}
						}
						var obj = oData.result[0];
						this.Create = {
							"ID": obj.sys_id,
							"Type": obj.table,
							"ResultText": "Successfully created: " + obj.display_value,
							"CustomerNo": oEntry.CustomerNo,
							"CustomerName": oEntry.CustomerName
						};
						if (obj.u_request_reason == 15) {
							this.getModel("CreateEntity").setProperty("/bEscLongRunner", true);
						}
						this.onUploadComplete(this.Create.ID); //I338673  add in once sNow implementation complete

						if ((JSON.stringify(this.getView().getModel("SelectedCustomer").getData()).length === 0 ||
								JSON.stringify(this.getView().getModel("SelectedCustomer").getData()) == "{}") &&
							this.getView().getModel("customerDetails") !== undefined) {
							this.getView().getModel("SelectedCustomer").setData(this.getView().getModel("customerDetails").getData());
						}

						this.onQueueButtonPress("CIM", null, this.getView().getModel("SelectedCustomer").getData(), null, null, {
							Id: oOdataObj.display_value,
							ExpectedAction: this.selectedKeyWords.join(", "),
							Sys_id: oOdataObj.sys_id,
							Table: oOdataObj.table
						});
					}
				}.bind(this),
				error: function (oResponse) {
					this.getView().setBusy(false);
					this.getView().byId("submit_new").setEnabled(true);
					if (oResponse.status === 504) { // change to 504
						jQuery.sap.delayedCall(10000, this, function () {
							//	this.checkTimeoutFlag();
							this.checkForOpenEscalationAfterTimeout(this.getModel("CreateEntity").getData().IncidentNum);
						});
					} else {
						this.getView().setBusy(false);
						this.checkForOpenEscalation(this.getModel("CreateEntity").getData().IncidentNum, oResponse);
					}
				}.bind(this)
			});
		},
		checkTimeoutFlag: function (sValue, oResponse) {
			if (this.bEscalationTimeout !== false) {
				this.checkForOpenEscalationAfterTimeout(this.getModel("CreateEntity").getData().IncidentNum);
			}
		},
		checkForOpenEscalation: function (sValue, oResponse) {
			this.getView().setBusy(true);
			var oDataService = {
				"u_bcp_correlation_id": sValue, //I338673 change this bcp from model?
				"sysparm_fields": "sys_created_on,sys_class_name,u_escalation_type,number,sys_id,state,assigned_to.name,u_request,short_description,u_expected_action,requested_by.name,u_business_impact"
			};
			var bExists = false;
			$.ajax({
				method: "GET",
				data: oDataService,
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sap.support.fsc2.servicenowEscalationUrl,
				success: function (oData) {
					this.getView().setBusy(false);
					if (oData.result.length > 0) {
						for (var i = 0; i < oData.result.length; i++) {
							if (oData.result[i].state === "100" || oData.result[i].state === "101") { //Client side check, check in network request for state
								var obj = oData.result[i];
								bExists = true;
								MessageBox.confirm("A ServiceNow escalation record already exists for this incident, would you like to view it?", {
									onClose: function (oAction) {
										this.getView().setBusy(false);
										if (oAction === "OK") {
											var layout = this.getModel().getProperty("/layout");
											if (layout === "OneColumn") {
												var nextLayout = "MidColumnFullScreen";
												var route = "requestDetail";
											} else if (layout === "EndColumnFullScreen") {
												var nextLayout = "EndColumnFullScreen";
												var route = "requestDetailEnd";
											}
											if (route && nextLayout) {
												this.getRouter().navTo(route, {
													layout: nextLayout,
													id: obj["sys_id"],
													transType: "sn_customerservice_escalation"
												});
											}
											/*	this.getRouter().navTo("requestDetail", {
													id: obj["sys_id"],
													transType: "sn_customerservice_escalation"
												});*/
										}
									}.bind(this)
								});
								break;
							}
						}
						if (!bExists) {
							this.showErrorMessage(oResponse);
						}
					}
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});

			return bExists;
		},

		checkForOpenEscalationAfterTimeout: function (sValue) {
			this.getView().setBusy(true);
			var oDataService = {
				"u_bcp_correlation_id": sValue, //I338673 change this bcp from model?
				"sysparm_fields": "sys_created_on,sys_class_name,u_escalation_type,number,sys_id,state,assigned_to.name,u_request,short_description,u_expected_action,requested_by.name,u_business_impact"
			};
			var bExists = false;
			$.ajax({
				method: "GET",
				data: oDataService,
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sap.support.fsc2.servicenowEscalationUrl,
				success: function (oData) {
					this.getView().setBusy(false);
					if (oData.result.length > 0) {
						for (var i = 0; i < oData.result.length; i++) {
							if ((oData.result[i].state === "100" || oData.result[i].state === "101") && new Date().getTime() - new Date(oData.result[i].sys_created_on)
								.getTime() < 300000) { //Client side check, check in network request for state
								var obj = oData.result[i];

								var oEntry = this.getModel("CreateEntity").getData();
								this.Create = {
									"ID": obj["sys_id"],
									"Type": obj["sys_class_name"],
									"ResultText": "Successfully created: " + obj.number,
									"CustomerNo": oEntry.CustomerNo,
									"CustomerName": oEntry.CustomerName
								};
								bExists = true;
								this.onUploadComplete(this.Create.ID);
								break;
							}
						}
						if (!bExists) {
							sap.m.MessageBox.error("504 gateway timeout occured");
						}

					}
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});

			return bExists;
		},
		setBcEscalationFlag: function (oEntry) {
			this.getView().setBusy(true);
			sap.support.fsc2.BcIncidentModel.update("/Critical_IncidentsSet(IncidentId='" + oEntry.IncidentNum + "')", {
				"EscltnStatus": "03"
			}, {
				success: function () {
					this.createSnowEscalation();
				}.bind(this),
				error: function (oResponse) {
					var bSpecificError = JSON.parse(oResponse.responseText).error.code === "/IWBEP/CM_MGW_RT/022";
					/* added more genereic error catching */
					if (oResponse.statusCode === 404 || bSpecificError) {
						this.createSnowEscalation();
					} else {
						this.getView().setBusy(false);
						this.getView().byId("submit_new").setEnabled(true);
						this.showErrorMessage(oResponse);
					}
				}.bind(this)
			});
		},

		onSwitchChange: function () {
			this.eventUsage(false, "Don’t know customer number");
			var oDefaultData = this.getModel("homePageConfig").getData();
			var sState = this.getView().byId("idSwitch").getState();
			var sMessage = "All inputs will be reset when switching customers. Do you want to continue?";
			sap.m.MessageBox.warning(sMessage, {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						this.getView().byId("idSwitch").setState(sState);
						this.getModel("FieldVisible").setProperty("/CustomerNo", sState);
						this.getModel("FieldVisible").setProperty("/CustomerName", !sState);
						this.getModel("FieldVisible").setProperty("/CaseID", sState && oDefaultData.enableDefaultCase);
						this.getModel("FieldVisible").setProperty("/BusinessImpact", false);
						this.getModel("FieldVisible").setProperty("/RequestReason", false);
						//this._removeAllUpload(); //I338673 removed due to attachment set functionality removed
						this.onGiveUpCreateCritical();
						this._removeAllSelectedKeyWords();
						this.getView().byId("idCustName").setValueState("None");
						this.getView().byId("idBusImpact").setValueState("None");
						this.getView().byId("idBusImpact").setValue();
						this.sSelectList = "";
						this.getView().byId("idDesc").setValueState("None");
						this.sCustomerNo = "";
						if (sState && this.sDefaultCase && oDefaultData.enableDefaultCase) {
							this.getModel("createCriticalSituation").setProperty("/CaseID", this.sDefaultCase);
							this.sCustomerNo = this.sDeafultCustNo;
							this.getModel("createCriticalSituation").setProperty("/CustomerNo", this.sCustomerNo);
							this.onSearchCustomerName();
						} else {
							this.getModel("createCriticalSituation").setProperty("/CaseID", "");
							this.getModel("createCriticalSituation").setProperty("/CustomerNo", "");
						}
					} else {
						this.getView().byId("idSwitch").setState(!sState);
					}
				}.bind(this)
			});
		},
		onSwitchRISE: function (oEvent) {},
		onNavtoJamGroup: function () {
			var sUrl = "htt";
			window.open(sUrl + "ps://jam4.sapjam.com/wiki/show/qxaKZ45VwSItNJO9zAnYPn"); // not allowed to use hardcode url
		},
		onCaseHelp: function () {
			// if (!this._oCaseDialog) {
			this._oCaseDialog = new sap.ui.xmlfragment("CaseFragId", "sap.support.fsc2.view.fragments.CaseSearch", this);
			this.getView().addDependent(this._oCaseDialog);
			this.getModel("ActivityCaseList").setData();
			// }
			if (this.sCustomerNo) {
				this.getModel("caseSearch").setProperty("/customer_r3_no", this.sCustomerNo);
			} else {
				this.getModel("caseSearch").setProperty("/customer_r3_no", "");
			}
			this._oCaseDialog.open();
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
			oDialog.destroy();
		},
		onConfirmCaseSecect: function (oEvent) {
			var selestecItem = sap.ui.core.Fragment.byId("CaseFragId", "iResultsList").getSelectedItem();
			if (!selestecItem) {
				sap.m.MessageBox.warning("Please select one case first");
				return;
			} else {
				var sCustNoByCase = selestecItem.getBindingContext("ActivityCaseList").getObject().customer_r3_no;
				var sCaseID = selestecItem.getBindingContext("ActivityCaseList").getObject().case_id;
				var sCustNo = this.sCustomerNo;
				if (!sCustNo) {
					this.getModel("createCriticalSituation").setProperty("/CustomerNo", sCustNoByCase);
					this.getModel("createCriticalSituation").setProperty("/CaseID", sCaseID);
					this.onSearchCustomerName();
				} else if (sCustNo !== sCustNoByCase) {
					this.getModel("createCriticalSituation").setProperty("/CaseID", sCaseID);
					sap.m.MessageBox.warning("The Case ID you have selected is not belong to the Customer No in creation page, please check.");
					// return;
				} else {
					this.getModel("createCriticalSituation").setProperty("/CaseID", sCaseID);
				}
			}
			this.onCloseCaseDialog(oEvent);
		},
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
			var sTable = sap.ui.core.Fragment.byId("CaseFragId", "iResultsList");
			sTable.setBusy(true);
			sap.support.fsc2.FSC2Model.read("/CasesSet", {
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
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
		onSearchCaseID: function (oEvent) {
			var sCtrl = oEvent.getSource();
			var sValue = sCtrl.getValue();
			if (!sValue) {
				sCtrl.setValueState("None");
				return;
			} else if (sValue.length !== 8 && sValue.length !== 10 || sValue.length === 8 && sValue.substr(0, 1) !== "2" || sValue.length ===
				10 && sValue.substr(0, 3) !== "002") {
				sCtrl.setValueState("Error");
				sap.m.MessageToast.show("The Case ID is not correct, please check.");
				return;
			}
			var aFilter = [];
			aFilter.push(new Filter("case_id", "EQ", sValue));
			//case_type ZS02 Engagement Cases
			aFilter.push(new sap.ui.model.Filter("case_type", "EQ", "ZS02"));
			//status without 90 Closed, 98 Restricts
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "71"));
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "80"));
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "81"));
			aFilter.push(new sap.ui.model.Filter("status", "EQ", "99"));

			sap.support.fsc2.FSC2Model.read("/CasesSet", {
				filters: aFilter,
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					if (!oData.results || oData.results.length === 0) {
						sCtrl.setValueState("Error");
						sap.m.MessageBox.warning("Couldn't find the case.\nPlease search the exact case id.", {
							title: "Warning",
							actions: [sap.m.MessageBox.Action.CLOSE]
						});
					} else {
						sCtrl.setValueState("None");
						var sCustNoByCase = oData.results[0].customer_r3_no;
						var CustNo = this.sCustomerNo;
						if (!CustNo) {
							this.getModel("createCriticalSituation").setProperty("/CustomerNo", sCustNoByCase);
							this.onSearchCustomerName();
						} else if (CustNo !== sCustNoByCase) {
							sap.m.MessageBox.warning("The Case ID you have entered is not belong to the Customer No, please check.");
						}
					}
				}.bind(this),
				error: function (oError) {
					sCtrl.setValueState("None");
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		handlePopoverPress: function (oEvent) {
			var oButton = oEvent.getSource(),
				oView = this.getView();

			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "sap.support.fsc2.view.fragments.Popover",
					controller: this
				}).then(function (oPopover) {
					oView.addDependent(oPopover);
					//oPopover.bindElement("/ProductCollection/0");
					return oPopover;
				});
			}
			this._pPopover.then(function (oPopover) {
				oPopover.openBy(oButton);
			});
		},

		checkForOpenTBEEscalation: function (oEntry) {
			this.getView().setBusy(true);
			var oDataService = {
				// "u_bcp_correlation_id": sValue,
				"source_record": oEntry.snow_sysid,
				"u_escalation_type": "0",
				"state": "101",
				"sysparm_fields": "sys_id,state,u_escalation_type,number" //sys_created_on,sys_class_name,u_escalation_type,number,assigned_to.name,u_request,short_description,u_expected_action,requested_by.name,u_business_impact
			};

			$.ajax({
				method: "GET",
				data: oDataService,
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sap.support.fsc2.servicenowEscalationUrl,
				success: function (oData) {
					this.getView().setBusy(false);
					if (oData.result.length > 0) {
						for (var i = 0; i < oData.result.length; i++) {
							if (oData.result[i].state === "101" && oData.result[i].u_escalation_type === "0") { //Client side check, check in network request for state
								var obj = oData.result[i];
								MessageBox.confirm("Technical Backoffice Engagement number: " + oData.result[i].number + " is open. Please check the case.", {
									onClose: function (oAction) {
										this.getView().setBusy(false);
										if (oAction === "OK") {
											this.getRouter().navTo("requestDetailEnd", {
												layout: "EndColumnFullScreen",
												id: obj["sys_id"],
												transType: "sn_customerservice_escalation"
											});
										}
										this.getView().byId("submit_new").setEnabled(true);
									}.bind(this)
								});
								break;
							}
						}
					}
					if (oData && oData.result.length === 0) {
						this.setBcEscalationFlag(oEntry);
					}
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
				}.bind(this)
			});
		},

		checkForPSLongRunnerEscalation: function (oEntry) {
			this.getView().setBusy(true);
			var oDataService = {
				// "u_bcp_correlation_id": sValue,
				"source_record": oEntry.snow_sysid,
				"u_escalation_type": "3",
				"u_request_reason": "15",
				"sysparm_fields": "sys_id,number" //sys_created_on,sys_class_name,u_escalation_type,number,assigned_to.name,u_request,short_description,u_expected_action,requested_by.name,u_business_impact
			};

			$.ajax({
				method: "GET",
				data: oDataService,
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sap.support.fsc2.servicenowEscalationUrl,
				success: function (oData) {
					this.getView().setBusy(false);
					if (oData.result.length > 0) {
						this.getModel("CreateEntity").setProperty("/bEscLongRunner", true);
					}
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
				}.bind(this)
			});
		},

		_updateChekBoxSelections: function (bBDMSelected, bOneOfCheckBoxSelected) {
			var bExpertMode = this.getModel("homePageConfig").getProperty("/expertMode");
			var aSelectedIncident = this.getModel("selectedIncidentList").getData();
			var oUpdate = {
					"enableBDM_cb": true,
					"enable_3_cb": true
				}
				// check expert mode
			if (bExpertMode) {
				oUpdate.enableBDM_cb = false;
				oUpdate.enable_3_cb = true;
			} else if (aSelectedIncident && aSelectedIncident.results && aSelectedIncident.results.length === 1) {
				oUpdate.enableBDM_cb = aSelectedIncident.results[0].priority === "1" ? true : false;
				oUpdate.enable_3_cb = true;
				if (oUpdate.enableBDM_cb && bBDMSelected) {
					oUpdate.enable_3_cb = false;
				} else if (bOneOfCheckBoxSelected) {
					oUpdate.enableBDM_cb = false;
				}
			}

			this.getModel("UIconfig").setData({...this.getModel("UIconfig").getData(),
				...oUpdate
			});
		},

		onBDMCheckBoxSelect: function (oEvent) {
			this._updateChekBoxSelections(oEvent.getParameter("selected"), false);
		},

		loadSummary_snow: function (sValue, sFirstSelectedList) {
			var sBusImpact = "";
			var oDataService = {
				"pointer": sValue
			};
			$.ajax({
				method: "GET",
				contentType: "application/json",
				url: sap.support.fsc2.snowBusImpUrl,
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				data: oDataService,
				success: function (oData2) {
					// communication summary---------------------------------------
					var aData = oData2.result.communication_summary === "" ? [] : oData2.result.communication_summary;
					var aModData = [];
					for (var i = 0; i < aData.length; i++) {
						var oEntry = {
							"Text": aData[i].text,
							"Texttype": formatter.formatTextType(aData[i].type),
							"UserName": aData[i].user_name,
							"UserID": aData[i].user_id,
							"UserInitials": aData[i].user_name.split(" ").length > 1 ? aData[i].user_name.split(" ")[0].substring(0, 1) + aData[i].user_name
								.split(
									" ")[1].substring(0, 1) : "",
							"Formated_Time": aData[i].created_on,
							"Timestamp": formatter.formatDateTime11(aData[i].created_on)
						};
						aModData.push(oEntry);
					}
					// this.getModel("Communication").setData({
					// 	"results": aModData
					// });
					this._checkIfPSLongRunnerScenarioMatched(aModData, sFirstSelectedList);
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		loadSummary_BC: function (sValue, sFirstSelectedList) {
			sap.support.fsc2.IncidentModel.read("/LongText", {
				urlParameters: {
					"search": sValue
				},
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					var aData = oData.results;
					var aModData = [];
					for (var i = 0; i < aData.length; i++) {
						var oEntry = {
							"Text": aData[i].Text,
							"Texttype": aData[i].Texttype,
							"UserName": aData[i].Author + "(" + aData[i].AuthorId + ")",
							"UserID": aData[i].AuthorId,
							"UserInitials": aData[i].Author.split(" ").length > 1 ? aData[i].Author.split(" ")[0].substring(0, 1) + aData[i].Author.split(
								" ")[1].substring(0, 1) : "",
							"Formated_Time": aData[i].Formated_Time,
							"Timestamp": aData[i].Timestamp
						};
						aModData.push(oEntry);
					}
					// this.getModel("Communication").setData({
					// 	"results": aModData
					// });
					this._checkIfPSLongRunnerScenarioMatched(aModData, sFirstSelectedList);
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		_checkIfPSLongRunnerScenarioMatched: function (aSummaryData, sFirstSelectedList) {
			var oCommunicaion = aSummaryData.find((element) => {
				return element.Texttype === "comments"
			});

			var sSAP_Respended_on = sFirstSelectedList.Last_updated_time;
			if (oCommunicaion) {
				sSAP_Respended_on = oCommunicaion.Formated_Time;
			}

			let iTimeSinceLastAction = new Date().getTime() - new Date(sFirstSelectedList.sSAP_Respended_on).getTime();
			let bLastUpdateTimeExceded = iTimeSinceLastAction > 172800000 ? true : false; // 2d;

			if (bLastUpdateTimeExceded && (new Date() > new Date(sFirstSelectedList.Next_action_due_time))) {
				let sUrl = sap.support.fsc2.servicenowTableUrl + "/task_sla?sysparm_query=task=" + sFirstSelectedList.Sys_ID +
					"%5Esla.u_sub_type=MPT";
				$.ajax({
					method: "GET",
					contentType: "application/json",
					headers: {
						'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
					},
					url: sUrl,
					success: function (oData) {
						if (oData.result && parseFloat(oData.result[0].percentage) > 70) {
							this.eventUsage(false, "PS Long Runners");
							this.getModel("CreateEntity").setProperty("/bLongRunner", true);
						}
					}.bind(this),
					error: function (oError) {
						this.showErrorMessage(oError);
					}.bind(this)
				})
			}
		}

	});

});