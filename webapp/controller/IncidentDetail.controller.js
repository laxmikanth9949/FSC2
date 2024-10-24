/*global history*/
sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/support/fsc2/model/formatter',
	'sap/m/MessageBox',
	"sap/ui/richtexteditor/RichTextEditor",
	"sap/ui/core/Fragment",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/DialogType",
	"sap/m/Text"
], function (BaseController, JSONModel, Filter, ODataModel, models, formatter, MessageBox, RichTextEditor, Fragment, Dialog, Button,
	DialogType, Text) {
	"use strict";
	return BaseController.extend("sap.support.fsc2.controller.IncidentDetail", {
		formatter: formatter,
		onInit: function () {
			if (!sap.support.fsc2.oDataBCRequestModel) {
				// var sUrl = this.getOwnerComponent().sFirstSlash + this.getOwnerComponent().sFioriLaunchpad + "bc" + sap.support.fsc2.Landscape +
				// 	"/odata/SID/SERVICE_REQUEST_SRV/";
				var sUrl = this.sBCIncidentDest + "/SID/SERVICE_REQUEST_SRV/";
				sap.support.fsc2.oDataBCRequestModel = new ODataModel(sUrl, {
					json: true,
					useBatch: false
				});
			}

			this.setModel(new JSONModel(), "customerDetails");

			this.getRouter().getRoute("incident").attachPatternMatched(this._onRouteMatched, this); //for incident
			this.getRouter().getRoute("incidentEnd").attachPatternMatched(this._onRouteMatched, this); //for incident
			this.getRouter().getRoute("incidentSearch").attachPatternMatched(this._onRouteMatched, this); //for incident
			this.getRouter().getRoute("requestDetail").attachPatternMatched(this._onRouteRequestMatched, this); //for cim request
			this.getRouter().getRoute("requestDetails").attachPatternMatched(this._onRouteRequestMatched, this); //for cim request
			this.getRouter().getRoute("requestDetailEnd").attachPatternMatched(this._onRouteRequestMatched, this); //for cim request
			this.getRouter().getRoute("requestDetailIncidentSearch").attachPatternMatched(this._onRouteRequestMatched, this); //for cim request
			this.getRouter().getRoute("requestDetailRequestSearch").attachPatternMatched(this._onRouteRequestMatched, this); //for cim request
			var categoryModel = models.createCimCategoryModel();
			var snowEscCategoryModel = models.createSnowEscCategoryModel();
			this.getView().setModel(snowEscCategoryModel, "snowEscCategoryJson"); //expected action model for NOW escalation
			this.getView().setModel(categoryModel, "categoryJson");
			this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/model/ReagionHelp.json")),
				"reagionHelpModel");			
		},
		initializeJsonModels: function () {
			this.setModel(new JSONModel(), "incidentDetail");
			this.setModel(new JSONModel({
				"isRequest": true,
				"isSnowEscalation": false,
				"isCimRequest": false,
				"incidentHasEscalation": false,
				/******comment: Check view shows CIM Request Detail or Incident Deatil ******/
				"title": "",
				"Description": "",
				"ShowFavorite": false,
				"ShowFlag": false,
				"showFeedbackButton": false,
				"enableChangeEscLevel": true,
				"showEscalateButtton": true
			}), "incidentDetailPage");
			this.setModel(new JSONModel({
				"incidentHasEscalation": false
			}), "CIMRequest");
			this.setModel(new JSONModel({
				"bEditContact": false
			}), "SaMDetail");
			this.setModel(new JSONModel({
				"enableCreate": false
			}), "SaMEnable");
			this.setModel(new JSONModel(), "Communication");
			this.setModel(new JSONModel({
				"results": []
			}), "NoteList");
			this.setModel(new JSONModel({
				"incidentHasEscalation": false
			}), "BDMRequest");
			this.setModel(new JSONModel({}), "PS_Long_Runner");
			this.setModel(new JSONModel({}), "ReqDescQA");
		},
		handleClose: function () {
			//when two columns are visible --> close second one, nav to first on fullscreen
			var prevTarget = this.getRouter()._oMatchedRoute._oConfig.target[0];
			var columnPages = this.getRouter().getTarget(prevTarget)._oOptions.controlAggregation;
			if (prevTarget === "incidentSearch") {
				prevTarget = "searchIncident";
			}

			if (columnPages === "beginColumnPages") {
				var layout = "OneColumn";
			} else if (columnPages === "midColumnPages") {
				var layout = "MidColumnFullScreen";
			}
			this.getRouter().navTo(prevTarget, {
				layout: layout
			});
		},
		/******comment: isResuest is false. The view will be Incident Detail******/
		_onRouteMatched: function (oEvent) {
			if (this.getView().getParent() && this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			this.oCustomerMap = new Map();
			this.initializeJsonModels();
			var oView = this.getView();
			this.getModel("incidentDetail").setData();
			this.getModel("incidentDetailPage").setProperty("/requestEditable", false);
			var oArgs = oEvent.getParameter("arguments");

			this.sID = "";
			this.loadSnowCaseData(oArgs.id, "incident");
			this.getModel("SaMDetail").setData({
				"bEditContact": false
			});
			oView.byId("SamDetail").setVisible(false);
			this.getModel("incidentDetailPage").setProperty("/isRequest", false);
			this.getModel("incidentDetailPage").setProperty("/title", "Case Details");
			this.getModel("incidentDetailPage").setProperty("/CriticalTitle", "");
			this.markFavorite();
			if (oArgs.sam === "true") {
				oView.byId("SamDetail").setVisible(true);
				setTimeout(function () {
					oView.byId("idObjectPageLayout").setSelectedKey("appointment");
					// oView.byId("idObjectPageLayout").scrollToSection(oView.byId("SamDetail").getId());
				}, 100);
			}

			this.onIconTabFilterChanged();
		},
		afterGetPointer: function () {
			var oView = this.getView();
			/*********check if SaM function is enable********/
			this.markFavorite();
			this.SamCheck(this.sID);
			this.loadSamDetail();
		},
		//determine now esc vs CIM request
		isSnowEscalation: function (sTransType) {
			if (sTransType === "sn_customerservice_escalation") {
				return true;
			} else {
				return false;
			}
		},
		/******comment: isResuest is true. The view will be CIM Request Detail******/
		_onRouteRequestMatched: function (oEvent) {
			if (!!this.getView().getParent() && this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			this.oCustomerMap = new Map();
			this.initializeJsonModels();
			var oArgs = oEvent.getParameter("arguments");
			var sRequestId = oArgs.id;
			this.transType = oArgs.transType;
			this.objectId = sRequestId;

			this.sID = "";
			this.sSnowEscalationID = sRequestId;
			this.getModel("incidentDetailPage").setProperty("/isSnowEscalation", true);
			this.getModel("incidentDetailPage").setProperty("/title", "ServiceNow Escalation Details"); //maybe too soon?
			this.loadSnowEscalationData(sRequestId);

			this.getModel("incidentDetailPage").setProperty("/CriticalTitle", "	Critical Incident Management"); //I338673 where is this used?
			this.getView().byId("idObjectPageLayout").setSelectedKey("CIMRequest");
			this.onIconTabFilterChanged();
		},
		markFavorite: function () {
			var iField;
			var aFavEntries = this.getModel("favoriteIncidents").getData();
			var sID;
			if (!aFavEntries || !aFavEntries.results) {
				setTimeout(function () {
					this.markFavorite();
				}.bind(this), 200);
				return;
			}
			sID = this.getModel("incidentDetailPage").getProperty("/isSnowEscalation") ? this.sSnowEscalationID : this.sID; //bcp id
			/*sID = this.sSnowEscalationID
			}*/
			var sFav = false;

			for (var i = 0; i < aFavEntries.results.length; i++) {
				if (aFavEntries.results[i].Value === sID) {
					sFav = true;
					iField = aFavEntries.results[i].Field;
				}
			}
			this.getModel("incidentDetailPage").setProperty("/ShowFavorite", sFav);
			this.getModel("CIMRequest").setProperty("/field", iField);
		},
		loadIncidentData: function (sValue, sLevel) {
			this.getView().setBusy(true);
			var aFilter = [];
			aFilter.push(new Filter("CssObjectID", "EQ", sValue));
			sap.support.fsc2.IncidentModel.read("/IncidentList", {
				filters: aFilter,
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					this.getView().setBusy(false);
					if (oData.results && oData.results[0]) {
						this.getModel("incidentDetail").setData(oData.results[0]);
						//--------------------------Add by I319741------------------------------------//
						this.getModel("incidentDetail").setProperty("/Processor", oData.results[0].Processor + " " + oData.results[0].PROCESSOR_TIME);
						//-------------------------------End-----------------------------------------//
						var sSize = 0;
						var sTotalDays = Number(oData.results[0].DAYS_CUSTOMER) + Number(oData.results[0].DAYS_SAP);
						if (sTotalDays !== 0) {
							sSize = parseInt(Number(oData.results[0].DAYS_CUSTOMER) / sTotalDays * 100);
						}
						this.getModel("incidentDetail").setProperty("/ID", oData.results[0].CssObjectID.substring(0, 10) + " " + oData.results[0].CssObjectID
							.substring(10, 20) +
							" " + oData.results[0].CssObjectID.substring(20));
						this.getModel("incidentDetail").setProperty("/ShortID", formatter.trimPreZeros(oData.results[0].ObjectID) + " " + oData.results[
							0].MessageYear);
						this.getModel("incidentDetail").setProperty("/CustomerPercent", sSize);
						this.getModel("incidentDetail").setProperty("/SAPPercent", sTotalDays === 0 ? 0 : 100 - sSize);
						this.getModel("incidentDetail").setProperty("/SAP_D", oData.results[0].DAYS_SAP + "/" + sTotalDays.toFixed(1));
						this.getModel("incidentDetail").setProperty("/Customer_D", oData.results[0].DAYS_CUSTOMER + "/" + sTotalDays.toFixed(1));
						this.getModel("incidentDetail").setProperty("/Escalation", oData.results[0].Escalation);
						this.CustomerNo = this.getModel("incidentDetail").getProperty("/CustomerNo");
						this.CustomerName = this.getModel("incidentDetail").getProperty("/CustomerName");
						this.getModel("incidentDetailPage").setProperty("/Description", oData.results[0].Description); //I338673 ok to get description from here for esc if leading is 
						this.loadSummary_BC(this.sID);
						if (sLevel === "incident") {
							this.checkForOpenEscalation();
						}

					}
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		loadSnowEscalationData: function (sValue) {
			this.getView().setBusy(true);
			var oDataService = {
				"sys_id": sValue,
				"sysparm_fields": "action_status,u_task_record.ref_sn_customerservice_case.correlation_id,u_task_record.ref_sn_customerservice_case.action_status,de_escalation_justification,escalation_justification,u_request_reason,u_escalation_type,u_task_record.ref_sn_customerservice_case.description,u_task_record.ref_sn_customerservice_case.sys_created_on,u_task_record.ref_sn_customerservice_case.sys_created_by,u_request,u_task_record.ref_sn_customerservice_case.account.number,assigned_to.name,assigned_to.email,u_expected_action,u_business_impact,u_task_record.ref_sn_customerservice_case.number,u_task_record.ref_sn_customerservice_case.u_responsible_party,u_responsible_party,state,u_task_record.ref_sn_customerservice_case.short_description,u_task_record.ref_sn_customerservice_case.business_impact,u_task_record.ref_sn_customerservice_case.u_contract_type_list,u_task_record.ref_sn_customerservice_case.priority,u_task_record.ref_sn_customerservice_case.account.name,u_task_record.ref_sn_customerservice_case.u_deployed_item.u_number,u_task_record.ref_sn_customerservice_case.u_deployed_item.u_sid, requested_by.name,requested_by.employee_number,requested_by.department.name,number,u_short_description,active,number,u_bcp_correlation_id,sys_updated_by,escalation,sys_id,short_description,u_task_record.ref_sn_customerservice_case.correlation_display,priority,u_task_record.ref_sn_customerservice_case.state,u_task_record.ref_sn_customerservice_case.u_app_component.u_name,u_task_record.ref_sn_customerservice_case.assigned_to.user_name,u_task_record.ref_sn_customerservice_case.assigned_to.name,u_task_record.ref_sn_customerservice_case.assignment_group.name,u_last_user_updated_on,u_next_action_due"
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
					this.getModel("incidentDetailPage").setProperty("/SnowEscaType", oData.result[0].u_escalation_type);
					this.getView().setBusy(false);
					var sData;
					if (oData.result && oData.result[0]) { //.length > 0
						for (var idx in oData.result) {
							var obj = oData.result[idx];
							if (!this.sID) {
								this.sID = obj.u_bcp_correlation_id || obj["u_task_record.ref_sn_customerservice_case.correlation_id"]; //obj["u_task_record.ref_sn_customerservice_case.number"];
								this.checkForOpenEscalation(); // temporariry 
								//this.afterGetPointer();
							}

							var firstCaseFeedItem = {
								text: obj["u_task_record.ref_sn_customerservice_case.description"] + "\n" + obj["u_task_record.ref_sn_customerservice_case.short_description"],
								user_name: obj["u_task_record.ref_sn_customerservice_case.sys_created_by"],
								created_on: obj["u_task_record.ref_sn_customerservice_case.sys_created_on"]
							};

							sData = {
								"ID": obj.u_bcp_correlation_id,
								"SNow_number": obj["u_task_record.ref_sn_customerservice_case.number"],
								"ShortID": obj["u_task_record.ref_sn_customerservice_case.correlation_display"], //002075129500004499092019
								"Priority": obj["u_task_record.ref_sn_customerservice_case.priority"],
								"PriorityTxt": formatter.SnowCasePriorityTxt(obj["u_task_record.ref_sn_customerservice_case.priority"]),
								"CustomerName": obj["u_task_record.ref_sn_customerservice_case.account.name"],
								"CustomerNo": obj["u_task_record.ref_sn_customerservice_case.account.number"],
								"Contract_Type": formatter.formatContractDes(obj["u_task_record.ref_sn_customerservice_case.u_contract_type_list"]),
								"StatusTxt": formatter.SnowCaseStatusTxt(obj["u_task_record.ref_sn_customerservice_case.state"]) + " / " + formatter.getCimActionStatus(obj[
									"u_task_record.ref_sn_customerservice_case.action_status"]),
								"Escalation": obj["u_task_record.ref_sn_customerservice_case.escalation"], //I338673 case level or esc level?
								"ComponentName": obj["u_task_record.ref_sn_customerservice_case.u_app_component.u_name"],
								"PROCESSOR_ORG": obj["u_task_record.ref_sn_customerservice_case.assignment_group.name"], //incident/case level
								"Processor": obj["u_task_record.ref_sn_customerservice_case.assigned_to.name"],
								"ExpectedAction": obj["u_expected_action"],
								/*!== "" ? obj["u_task_record.ref_sn_customerservice_case.assigned_to.name"] + " (" + obj[
									"u_task_record.ref_sn_customerservice_case.assigned_to.user_name"] + ")" : ""*/
								"Instno": formatter.trimPreZeros(obj["u_task_record.ref_sn_customerservice_case.u_deployed_item.u_number"]),
								"SysID": obj["u_task_record.ref_sn_customerservice_case.u_deployed_item.u_sid"], //obj.sys_id,//
								"business_impact": obj["u_task_record.ref_sn_customerservice_case.business_impact"], //obj.business_impact, 
								"FirstCaseFeedItem": firstCaseFeedItem,
								"SnowEscaNumber": obj.number,
								"Last_updated_time": obj.u_last_user_updated_on,
								"Next_action_due_time": obj.u_next_action_due
							};

							// this.setEscalationJustificationLabel(obj);
							this.snowEscaNo = obj.number; //temp can get model instead in setfavorites? i338673

							this.sSnowEscalationID = obj["sys_id"];
							var aEntry = {};
							switch (obj.u_escalation_type) {
							case "0":
								//escalation model (bdm)
								//BDMRequest
								this.setEscalationJustificationLabel(obj, "BDMRequest");
								this.getModel("BDMRequest").setProperty("/object_id", obj.number);
								this.getModel("BDMRequest").setProperty("/category_escalation", obj["u_expected_action"].split(','));
								this.getModel("BDMRequest").setProperty("/responsible_person_name", obj["assigned_to.name"]);
								this.getModel("BDMRequest").setProperty("/responsible_person_email", obj["assigned_to.email"]);
								this.getModel("BDMRequest").setProperty("/report_person_name", obj["requested_by.name"]);
								this.getModel("BDMRequest").setProperty("/business_impact", obj["u_business_impact"]);
								this.getModel("BDMRequest").setProperty("/request_description", obj["u_request"]);
								this.getModel("BDMRequest").setProperty("/notes", aEntry.notes);
								this.getModel("BDMRequest").setProperty("/status", formatter.SnowEscalationStatusTxt(obj.state)); //I38673 vhevk
								this.getModel("BDMRequest").setProperty("/AttachmentSet", aEntry.AttachmentSet);
								//new addition for qualtrics feedback
								this.getModel("BDMRequest").setProperty("/escalation_type", obj.u_escalation_type);
								this.getModel("BDMRequest").setProperty("/escalationCaseId", obj["u_task_record.ref_sn_customerservice_case.number"]);
								this.getModel("BDMRequest").setProperty("/escalationCaseComponent", obj["u_task_record.ref_sn_customerservice_case.u_app_component.u_name"]);
								this.getModel("BDMRequest").setProperty("/escalationCaseAssignmentGroup", obj["u_task_record.ref_sn_customerservice_case.assignment_group.name"]);
								this.getModel("BDMRequest").setProperty("/escalationCaseCustomerId", obj["u_task_record.ref_sn_customerservice_case.account.number"]);
								this.getModel("BDMRequest").setProperty("/escalationCaseCustomerName", obj["u_task_record.ref_sn_customerservice_case.account.name"]);
								this.getModel("BDMRequest").setProperty("/report_person_id", obj["requested_by.employee_number"]);
								this.getModel("BDMRequest").setProperty("/report_person_department", obj["requested_by.department.name"]);
								this.getModel("BDMRequest").setProperty("/escalation_action_status", obj.action_status);

								this.getModel("incidentDetailPage").setProperty("/enableChangeEscLevel", obj.state === 101 ? true : false);
								//u_task_record.ref_sn_customerservice_case.assignment_group.name
								this.sBDMEscalationID = obj["sys_id"];

								this.loadSnowNoteData(false, "BDMchatList");
								break;
							case "3":
								//cim model
								this.setEscalationJustificationLabel(obj, "CIMRequest");
								this.getModel("CIMRequest").setProperty("/object_id", obj.number);
								this.getModel("CIMRequest").setProperty("/category_escalation", obj["u_expected_action"].split(','));
								this.getModel("CIMRequest").setProperty("/responsible_person_name", obj["assigned_to.name"]);
								this.getModel("CIMRequest").setProperty("/responsible_person_email", obj["assigned_to.email"]);
								this.getModel("CIMRequest").setProperty("/report_person_name", obj["requested_by.name"]);
								this.getModel("CIMRequest").setProperty("/business_impact", obj["u_business_impact"]);
								this.getModel("CIMRequest").setProperty("/request_description", obj["u_request"]);
								this.getModel("CIMRequest").setProperty("/notes", aEntry.notes);
								this.getModel("CIMRequest").setProperty("/status", formatter.SnowEscalationStatusTxt(obj.state)); //I38673 vhevk
								this.getModel("CIMRequest").setProperty("/AttachmentSet", aEntry.AttachmentSet);
								//new addition for qualtrics feedback
								this.getModel("CIMRequest").setProperty("/escalation_type", obj.u_escalation_type);
								this.getModel("CIMRequest").setProperty("/escalationCaseId", obj["u_task_record.ref_sn_customerservice_case.number"]);
								this.getModel("CIMRequest").setProperty("/escalationCaseComponent", obj["u_task_record.ref_sn_customerservice_case.u_app_component.u_name"]);
								this.getModel("CIMRequest").setProperty("/escalationCaseAssignmentGroup", obj["u_task_record.ref_sn_customerservice_case.assignment_group.name"]);
								this.getModel("CIMRequest").setProperty("/escalationCaseCustomerId", obj["u_task_record.ref_sn_customerservice_case.account.number"]);
								this.getModel("CIMRequest").setProperty("/escalationCaseCustomerName", obj["u_task_record.ref_sn_customerservice_case.account.name"]);
								this.getModel("CIMRequest").setProperty("/report_person_id", obj["requested_by.employee_number"]);
								this.getModel("CIMRequest").setProperty("/report_person_department", obj["requested_by.department.name"]);
								this.getModel("CIMRequest").setProperty("/escalation_action_status", obj.action_status);
								this.getModel("CIMRequest").setProperty("/requestReason", obj.u_request_reason);
								this.sCIMEscalationID = obj["sys_id"];
								this.loadSnowNoteData();
								this.getModel("incidentDetailPage").setProperty("/incidentHasEscalation", obj.state === 101 || obj.state === 100 ? true :
									false);
								break;
							}
						}
						this.getModel("incidentDetailPage").setProperty("/SnowEscaNumber", obj.number);
						this.getModel("incidentDetailPage").setProperty("/requestEditable", ((obj.state === "100" || obj.state === "101") && obj.u_escalation_type ===
							"3"));
						this.getModel("incidentDetail").setData(sData);
						this.CustomerNo = obj["u_task_record.ref_sn_customerservice_case.account.number"];
						this.CustomerName = obj["u_task_record.ref_sn_customerservice_case.account.name"];
						this.loadCustomerData(this.CustomerNo);

						this.getModel("incidentDetailPage").setProperty("/Description", obj.short_description); //title
						// this.getModel("CIMRequest").setProperty("/AttachmentSet", aEntry.AttachmentSet);
						var sFavorite = false;
						if (aEntry.is_favorite === "X") {
							sFavorite = true;
						}
						//this.getModel("incidentDetailPage").setProperty("/ShowFavorite", sFavorite);

						if (obj["u_task_record.ref_sn_customerservice_case.u_responsible_party"] === "bcp") { //leading system bcp
							this.loadIncidentData(this.sID);
						} else {
							// this.loadSummary_snow(this.sID);
							this.loadSnowCaseData(this.sID, "incident");
						}

					}
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		loadSnowCaseData: function (sValue, sLevel) {
			this.getView().setBusy(true);
			var oDataService = {
				"number": sValue,
				"u_responsible_party": "sno",
				"sysparm_fields": "sys_id,action_status,u_major_case_usage,sys_created_on,sys_created_by,number,correlation_display,sys_updated_by,escalation,short_description,correlation_id,priority,state,account.number,account.name,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,u_last_user_updated_on,u_next_action_due"
			};
			if (sValue.substr(0, 2) !== "CS") {
				oDataService = {
					"correlation_id": sValue,
					//	"u_responsible_party": "sno",
					"sysparm_fields": "sys_id,action_status,u_major_case_usage,sys_created_on,sys_created_by,number,correlation_display,sys_updated_by,escalation,short_description,correlation_id,priority,state,account.number,account.name,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,u_last_user_updated_on,u_next_action_due"
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
					this._sSystem = '';
					this.getView().setBusy(false);
					var sData;
					if (oData.result && oData.result[0] && oData.result[0].u_major_case_usage === "" && oData.result[0].u_responsible_party ===
						"sno") {
						var obj = oData.result[0];
						this._sSystem = obj.u_responsible_party;
						// if (!this.sID) {
						this.sID = obj.correlation_id;
						this.afterGetPointer();
						// }

						var firstCaseFeedItem = {
							text: obj.description + "\n" + obj.short_description,
							user_name: obj.sys_created_by,
							created_on: obj.sys_created_on
						};
						sData = {
							"ID": obj.correlation_id,
							"SNow_number": obj.number,
							"Description": obj.short_description,
							"ShortID": obj.correlation_display,
							"Priority": obj.priority,
							"PriorityTxt": formatter.SnowCasePriorityTxt(obj.priority),
							"CustomerName": obj["account.name"],
							"CustomerNo": obj["account.number"],
							"Contract_Type": formatter.formatContractDes(obj.u_contract_type_list),
							"Escalation": obj.escalation,
							"SAPPercent": "",
							"SAP_D": formatter.formatDateToDays(obj.u_time_with_agent),
							"CustomerPercent": "",
							"Customer_D": formatter.formatDateToDays(obj.u_time_with_customer),
							"StatusTxt": formatter.SnowCaseStatusTxt(obj.state) + " / " + formatter.getCimActionStatus(obj.action_status),
							"ComponentName": obj["u_app_component.u_name"],
							"PROCESSOR_ORG": obj["assignment_group.name"],
							"Processor": obj["assigned_to.name"],
							/*!== "" ? obj["assigned_to.name"] + " (" + obj["assigned_to.user_name"] + ")" : ""*/
							"Instno": formatter.trimPreZeros(obj["u_deployed_item.u_number"]),
							"SysID": obj["u_deployed_item.u_sid"], //obj.sys_id,//
							"business_impact": obj.business_impact, //obj.business_impact,
							"FirstCaseFeedItem": firstCaseFeedItem,
							"Last_updated_time": obj.u_last_user_updated_on,
							"Next_action_due_time": obj.u_next_action_due,
							"CaseSysID": obj.sys_id
						};

						this.CustomerNo = obj["account.number"];
						this.CustomerName = obj["account.name"];
						this.loadCustomerData(this.CustomerNo);
						this.getModel("incidentDetail").setData(sData);
						this.loadSummary_snow(this.sID);
						var sSize = 0;
						// var sTotalDays = Number(oData.result[0].u_time_with_customer) + Number(oData.result[0].u_time_with_agent);
						var sTotalDays = Number(sData.SAP_D) + Number(sData.Customer_D);
						if (sTotalDays !== 0) {
							sSize = parseInt(Number(sData.Customer_D) / sTotalDays * 100);
						}
						this.getModel("incidentDetail").setProperty("/CustomerPercent", sSize);
						this.getModel("incidentDetail").setProperty("/SAPPercent", sTotalDays === 0 ? 0 : 100 - sSize);
						this.getModel("incidentDetailPage").setProperty("/Description", oData.result[0].short_description);

						if (sLevel === "incident") {
							this.checkForOpenEscalation(obj.sys_id);
						}

					} else {
						this.sID = sValue;
						this.loadIncidentData(sValue, "incident");
						this.afterGetPointer();
					}
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		setEscalationJustificationLabel: function (obj, sModel) {
			if (obj.state === "101") { //101 = escalted
				this.getModel(sModel).setProperty("/EscalationReasonLabel", "Escalation Justification");
				this.getModel(sModel).setProperty("/EscalationReason", obj.escalation_justification);
				this.getModel(sModel).setProperty("/EscalationReasonVisible", true);
			} else if (obj.state === "103") {
				this.getModel(sModel).setProperty("/EscalationReasonLabel", "De-Escalation Justification");
				this.getModel(sModel).setProperty("/EscalationReason", obj.de_escalation_justification);
				this.getModel(sModel).setProperty("/EscalationReasonVisible", true);
			} else {
				this.getModel(sModel).setProperty("/EscalationReasonVisible", false);
			}
		},

		_loadSamService: function () {
			if (!sap.support.fsc2.oDataW71Model) {
				//sap.support.fsc2.oDataBCRequestModel = new ODataModel(this.getOwnerComponent().sFirstSlash + this.getOwnerComponent().sFioriLaunchpad + "bc" + sap.support.fsc2.Landscape + "/odata/SID/SERVICE_REQUEST_SRV/", {
				sap.support.fsc2.oDataW71Model = new sap.ui.model.odata.v2.ODataModel(sap.ui.require.toUrl("sap/support/fsc2") + "/w71/sap/opu/odata/SVT/NGMSG_WEBSERVICES_SRV/", {
					json: true,
					useBatch: false
				});
				sap.support.fsc2.oDataW72Model = new sap.ui.model.odata.v2.ODataModel(sap.ui.require.toUrl("sap/support/fsc2") + "/w72/sap/opu/odata/SVT/NGMSG_WEBSERVICES_SRV/", {
					json: true,
					useBatch: false
				});
			}
		},
		onSamClick: function (oEvent) {
			var that = this;
			if (this.getModel("SaMEnable").getProperty("/enableCreate")) {
				sap.m.MessageBox.information(
					"It is possible to schedule a 15 minutes call with a Product Support Manager from the related product area for this incident. How would you like to proceed?", {
						actions: ["Schedule a Manager", "Request MCC Support"],
						//	title: sDescription,
						onClose: function (oAction) {
							if (oAction === "Schedule a Manager") {
								that.getRouter().navTo("SaM", {
									layout: "MidColumnFullScreen", //TwoColumnsMidExpanded
									"incident": that.getModel("SaMEnable").getProperty("/pointer"),
									"earea": that.getModel("SaMEnable").getProperty("/expertArea")
								});
							}
						}
					});
			}
		},

		SamCheck: function (sIncidentNum, attempt) {
			if(this._sSystem !== "sno") {
				this.getModel("SaMEnable").setProperty("/enableCreate", false);
			}
			if (attempt < 3) {
				sap.m.MessageToast.show("ChannelCheckSet service unavailable");
				return;
			}
			attempt = attempt || 1;

			var serviceUrl = attempt === 1 ? sap.ui.require.toUrl("sap/support/fsc2") + "/w71/odata/incidentws/" : sap.ui.require.toUrl("sap/support/fsc2") + "/w72/odata/incidentws/";
			var oDataI7P = new ODataModel(serviceUrl, {
				json: true,
				useBatch: false
			});

			oDataI7P.attachMetadataFailed(null, () => {
				this.SamCheck(sIncidentNum, ++attempt);
			}, this)

			oDataI7P.metadataLoaded().then(() => {
				oDataI7P.read("/ChannelCheckSet", {
					urlParameters: {
						"$select": "Active"
					},
					filters: [
						new Filter("IncidentID", "EQ", sIncidentNum),
						new Filter("ChannelType", "EQ", "SAM"),
						new Filter("Details", "EQ", "MCC"),
					],
					headers: {
						"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
					},
					success: function (oResponse) {
						if (oResponse.results.length > 0) {
							var sActive = oResponse.results[0].Active;

							if (sActive === "A") {
								this.getModel("SaMEnable").setProperty("/enableCreate", true);
								this.getModel("SaMEnable").setProperty("/pointer", sIncidentNum);
								this.getModel("SaMEnable").setProperty("/expertArea", "MCC");
							} else
								this.getModel("SaMEnable").setProperty("/enableCreate", false);
						} else
							this.getModel("SaMEnable").setProperty("/enableCreate", false);
					}.bind(this),
					error: function (error) {
						sap.m.MessageToast.show("ChannelCheckSet service unavailable");
					}.bind(this)
				});
			})
		},

		loadSamDetail: function () {
			var sID = this.sID;
			var oView = this.getView();
			sap.support.fsc2.oDataBCRequestModel.read("/SaMBookingSet(IncidentRef='" + sID + "',AppSource='MCC')", {
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (sData) {
					var sDateTime = sData.SamStartTime; //"20191024100400"
					var sDate = sDateTime.substr(0, 8);
					var sTime = sDateTime.substr(8, 2) + ":" + sDateTime.substr(10, 2);
					var sDataString = sData.SamInfo;
					var SamDetail = {};
					if (sDataString === "" || sDateTime === "0" || sData.SamStatus === "E0003" || sData.SamStatus === "E0002") {
						oView.byId("SamDetail").setVisible(false);
					} else {
						SamDetail = JSON.parse(sData.SamInfo);
						oView.byId("SamDetail").setVisible(true);
					}

					SamDetail.Date = sDate;
					SamDetail.Time = sTime;
					var sEntireDate = sDate.slice(0, 4) + " " + sDate.slice(4, 6) + " " + sDate.slice(6, 8) + " " + sTime;
					var options = {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric'
					};
					SamDetail.localTime = new Date(sEntireDate + 'z').toLocaleString('default', options);
					this.getModel("SaMDetail").setData(SamDetail);
					this.getModel("SaMDetail").setProperty("/bEditContact", false);
					this.getModel("SaMDetail").setProperty("/initResult", sData);
				}.bind(this),
				error: function (error) {
					sap.m.MessageToast.show("SaMBookingSet service unavailable");
				}
			});
		},
		loadSummary_snow: function (sValue) {
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
					// set Time@SAP and Time@Customer under overview tab---------------------------------------
					//Time is returned in seconds, some processing to convert into days before displaying in the ui
					var sSize = 0;
					var dDaysWithAgent = oData2.result.time_with_agent / 86400;
					var dDaysWithCustomer = oData2.result.time_with_customer / 86400;
					var dTotalDays = dDaysWithAgent + dDaysWithCustomer; //seconds -> days

					if (dTotalDays !== 0) {
						sSize = parseInt(dDaysWithCustomer / dTotalDays * 100);
					}
					// this will be rounded to 0 so we update the ui to reflect
					if (dDaysWithAgent < 0.5) {
						sSize = 100;
						dDaysWithCustomer = dTotalDays;
					}
					this.getModel("incidentDetail").setProperty("/CustomerPercent", sSize);
					this.getModel("incidentDetail").setProperty("/SAPPercent", dTotalDays === 0 ? 0 : 100 - sSize);
					this.getModel("incidentDetail").setProperty("/SAP_D", parseFloat(dDaysWithAgent.toFixed(1)) + "/" + parseFloat(dTotalDays.toFixed(
						1))); //toFixed returns string
					this.getModel("incidentDetail").setProperty("/Customer_D", parseFloat(dDaysWithCustomer.toFixed(1)) + "/" + parseFloat(
						dTotalDays.toFixed(1)));
					// set Time@SAP and Time@Customer under overview tab---------------------------------------

					// communication summary---------------------------------------

					var aData = oData2.result.communication_summary === "" ? [] : oData2.result.communication_summary;
					var aModData = [];
					aData.push(this.getModel("incidentDetail").getProperty("/FirstCaseFeedItem"));
					for (var i = 0; i < aData.length; i++) {
						var oEntry = {
							"Text": aData[i].text,
							"Texttype": formatter.formatTextType(aData[i].type),
							"UserName": aData[i].user_name /*+ "(" + aData[i].user_id + ")"*/ ,
							"UserID": aData[i].user_id,
							"UserInitials": aData[i].user_name.split(" ").length > 1 ? aData[i].user_name.split(" ")[0].substring(0, 1) + aData[i].user_name
								.split(
									" ")[1].substring(0, 1) : "",
							"Formated_Time": aData[i].created_on,
							"Timestamp": formatter.formatDateTime11(aData[i].created_on)
						};
						aModData.push(oEntry);
						// if (aData[i].type === "business impact") {
						// 	sBusImpact = "From: " + aData[i].user_name + "\n" + aData[i].created_on + "\n" + aData[i].text;
						// }
					}
					this.getModel("Communication").setData({
						"results": aModData
					});
					//-----Changed by I319741: bugfix confousion of cim request BI and incident BI----// 
					// if (!this.getModel("incidentDetail").getProperty("/SNow_number")) {
					// this.getModel("incidentDetail").setProperty("/business_impact", sBusImpact);
					// }
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		loadSummary_BC: function (sValue) {
			var sBusImpact = "";
			// var textLogBox = this.getView().byId("idIncidentTextLogVBox");
			// textLogBox.removeAllItems();
			sap.support.fsc2.IncidentModel.read("/LongText", {
				urlParameters: {
					"search": sValue //"002028376000000022372018" hard code incident ID for test
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
						if (aData[i].Texttype === "Business Impact") {
							sBusImpact = "From: " + aData[i].Author + "\n" + aData[i].Formated_Time + "\n" + aData[i].Text;
						}
					}
					this.getModel("Communication").setData({
						"results": aModData
					});
					//-----Changed by I319741: bugfix confousion of cim request BI and incident BI----// 
					if (!this.getModel("incidentDetail").getProperty("/SNow_number")) { //I338673 CHECK THIS CODE ISNT AFFECT BY NOW ESCALATYION ADDITION
						this.getModel("incidentDetail").setProperty("/business_impact", sBusImpact);
					}
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
					// sap.m.MessageToast.show("SID_GATEWAY_SRV Service Unavailable!");
				}.bind(this)
			});
		},

		handleLinkPress: function (oEvent) {
			var sNoteNum = oEvent.getSource().getText();
			var sUrl = "htt";
			window.open(sUrl + "ps://launchpad.support.sap.com/#/notes/" + sNoteNum); // not allowed to
		},
		formatTime: function (time) {
			var bSnowDate = false;
			if (time.includes("-")) { //if the date contains "-" we assume its coming from ServiceNow
				bSnowDate = true;
				time = time.replace(/-/g, ".");
			}
			var temp = time.split(" "); // snow returns 2020-mm-dd 16:00:40, exisng is dd.mm.yyyy 16:00:40, we replace the - with . to make all formats the s

			var temp1 = temp[0].split(".");
			var iDay = temp1[0];
			var iMonth = temp1[1];
			var iYear = temp1[2];

			if (bSnowDate) {
				iDay = temp1[2];
				iMonth = temp1[1];
				iYear = temp1[0];
			}

			var temp2 = temp[1].split(":");
			var sTime = new Date(Date.UTC(iYear, iMonth - 1, iDay, temp2[0], temp2[1], temp2[2]));
			return sTime;
		},

		// loadSnowNoteData: function (bAfterSave)
		loadSnowNoteData: function (bAfterSave, sControlId) {
			// improve method to accept sSnowEscalationID. Migth be best to convert method into a promise due to CIMRequest(report_person_name) dependency
			var sSysID = sControlId === "BDMchatList" ? this.sBDMEscalationID : this.sCIMEscalationID;
			var sUrl = sap.support.fsc2.servicenowEscalationNotesUrl + "?sys_id=" + sSysID || this.sSnowEscalationID;

			$.ajax({
				method: "GET",
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sUrl,
				success: function (oData) {
					var aNoteResults = oData.result.communication_summary;
					var aFeedItems = [];
					var index = 0;
					var sTime = "";
					while (aNoteResults.length > index) {
						var oFeedItem = {
							name: "",
							time: "",
							text: "\n",
							userId: ""
						};

						sTime = formatter.formatDateTime11(aNoteResults[index].created_on);
						oFeedItem.time = sTime;
						oFeedItem.name = aNoteResults[index].user_name;
						oFeedItem.userId = aNoteResults[index].user_id;
						oFeedItem.text = "\n" + aNoteResults[index].text;
						aFeedItems.push(oFeedItem);
						index++; //= index + 3;
					}

					this.getModel("NoteList").setProperty("/results", aFeedItems);
					var sCurrentModel = sControlId === "BDMchatList" ? "BDMRequest" : "CIMRequest";
					var requestor = this.getModel(sCurrentModel).getProperty("/report_person_name");
					var creator;
					this.addInitialFeedItems(aFeedItems, requestor.substring(requestor.indexOf("(") + 1, requestor.indexOf(")")), creator,
						sControlId);
					if (aFeedItems.length > 0 && bAfterSave === true) {
						this._myDelegate = {
							"onAfterRendering": function () {
								this.getView().byId("incidentDetail")._getPage().getScrollDelegate().scrollTo(0, 100000, 0);
							}

						};
						this.getView().byId(sControlId ? sControlId : "chatList").getItems()[this.getView().byId("chatList").getItems().length - 1].addEventDelegate(
							this._myDelegate,
							this);
					}
					this.onScrollBottom();
				}.bind(this),
				error: function (oError) {
					if (oError.status === 404) {
						this.getRouter().navTo("notFound");
					} else {
						this.getView().setBusy(false);
						this.showErrorMessage(oError);
					}

				}.bind(this)
			});
		},

		onSetFavorite: function () {
			if (this.getModel("incidentDetailPage").getProperty("/isSnowEscalation")) {
				var sDesc = this.getModel("incidentDetailPage").getProperty("/Description");
				var oObj = {
					"desc": sDesc,
					"sys_id": this.sSnowEscalationID,
					"escaNum": this.snowEscaNo,
					"customerName": this.CustomerName,
					"customerNum": this.CustomerNo,
					"status": "Closed"

				};
				this.eventUsage(false, "Set \'Esca Record\' favorite");
				sap.support.fsc2.UserProfileModel.create("/Entries", {
					"Attribute": "FAVORITE_ESCALATION_RECORDS",
					"Value": JSON.stringify(oObj) // provide json object in value

				}, {
					success: function (oData) {
						this.getModel("incidentDetailPage").setProperty("/ShowFavorite", true);
						this.getEventBus().publish("Favorites", "_onRouteMatched");
					}.bind(this)
				});
			} else if (this.getModel("incidentDetailPage").getProperty("/isRequest")) {
				sap.support.fsc2.UserProfileModel.create("/Entries", {
					"Attribute": "FAVORITE_CIM_REQUESTS",
					"Value": this.objectId
				}, {
					success: function (oData) {
						this.getModel("incidentDetailPage").setProperty("/ShowFavorite", true);
						this.loadFavCustData();
						this.getEventBus().publish("Favorites", "_onRouteMatched");
					}.bind(this)
				});
			} else {
				this.eventUsage(false, "Set \'Incident\' favorite");
				sap.support.fsc2.UserProfileModel.create("/Entries", {
					"Attribute": "FAVORITE_INCIDENTS",
					"Value": this.sID
				}, {
					success: function (oData) {
						this.getModel("incidentDetailPage").setProperty("/ShowFavorite", true);
						this.refreshFavoriteIncidentsModel();
						this.getEventBus().publish("Favorites", "_onRouteMatched");
						// this.refreshFavoriteIncidentsModel();
					}.bind(this)
				});
			}
		},

		//------------------------------------------------End-------------------------------------------------------//
		onRemoveFavorite: function () {
			if (this.getModel("incidentDetailPage").getProperty("/isSnowEscalation")) {
				this.eventUsage(false, "Set \'CIM Request\' unfavorite");
				var iField = this.getModel("CIMRequest").getProperty("/field");
				iField = iField.trim();
				sap.support.fsc2.UserProfileModel.remove("/Entries(Username='',Attribute='FAVORITE_ESCALATION_RECORDS',Field='" + iField + "')", {
					success: function () {
						this.getModel("incidentDetailPage").setProperty("/ShowFavorite", false);
						this.getEventBus().publish("Favorites", "_onRouteMatched");
					}.bind(this)
				});
			}
			if (this.getModel("incidentDetailPage").getProperty("/isRequest")) {
				this.eventUsage(false, "Set \'CIM Request\' unfavorite");
				var iField = this.getModel("CIMRequest").getProperty("/field");
				iField = iField.trim();
				sap.support.fsc2.UserProfileModel.remove("/Entries(Username='',Attribute='FAVORITE_CIM_REQUESTS',Field='" + iField + "')", {
					success: function () {
						this.getModel("incidentDetailPage").setProperty("/ShowFavorite", false);
						this.getEventBus().publish("Favorites", "_onRouteMatched");
					}.bind(this)
				});
			} else {
				this.eventUsage(false, "Set \'Incident\' unfavorite");
				sap.support.fsc2.UserProfileModel.read("/Entries", {
					filters: [
						new Filter("Attribute", "EQ", "FAVORITE_INCIDENTS")
					],
					success: function (oData) {
						for (var i = 0; i < oData.results.length; i++) {
							if (oData.results[i].Value === this.sID) {
								sap.support.fsc2.UserProfileModel.remove("/Entries(Username='',Attribute='FAVORITE_INCIDENTS',Field='" + oData.results[i]
									.Field +
									"')", {
										success: function () {
											this.getModel("incidentDetailPage").setProperty("/ShowFavorite", false);
											this.refreshFavoriteIncidentsModel();
											this.getEventBus().publish("Favorites", "_onRouteMatched");
										}.bind(this)
									});
								break;
							}
						}
					}.bind(this),
					error: function (oError) {
						this.showErrorMessage(oError);
					}.bind(this)
				});
			}
		},

		setCIMControllerBusy: function (busy) {
			this.getView().byId("idObjectPageLayout").setBusy(busy);
		},
		onOpenBusImpactDialog: function (OEvent) {
			var biString = this.getView().byId("idBITextArea").getHtmlText();
			this.oTextArea = new RichTextEditor({
				width: "100%",
				height: "750px",
				value: biString
			});
			this.oDialog = new sap.m.Dialog({
				title: "Edit Business Impact",
				contentWidth: "100%",
				contentHeight: "100%",
				stretch: true,
				content: [this.oTextArea],
				buttons: [
					new sap.m.Button({
						text: this.getResourceBundle().getText("save"),
						type: "Emphasized",
						press: function () {
							this.onBusImpactPress();
							this.oDialog.close();
						}.bind(this)
					}),
					new sap.m.Button({
						text: this.getResourceBundle().getText("cancel"),
						press: function () {
							this.oDialog.close();
						}.bind(this)
					})
				]
			});
			this.oDialog.open();
		},
		onBusImpactPress: function (oEvent) {
			this.updateSnowEscImpact();
		},
		updateSnowEscImpact: function () {
			this.eventUsage(false, "Edit business impact for NOW Escalation");
			var sBusinessImpact = this.oTextArea.getValue();
			var sUserID = this.getModel("CurrentUserInfo").getProperty("/UserID");
			this.setCIMControllerBusy(true);

			var obj_Snow = {
				"u_business_impact": sBusinessImpact,
				"u_last_user_updated_by": sUserID,
				"sys_target_sys_id": this.sCIMEscalationID, //this.sSnowEscalationID,
				"u_update_business_impact": true
			};
			$.ajax({
				method: "POST",
				data: JSON.stringify(obj_Snow),
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sap.support.fsc2.servicenowEscalationUrlCreateApi,
				success: function (oSuccess) {
					this.setCIMControllerBusy(false);
					sap.m.MessageToast.show("Successfully edited the business impact");
					this.loadSnowEscalationData(this.sCIMEscalationID); //this.sSnowEscalationID);
				}.bind(this),
				error: function (oError) {
					this.setCIMControllerBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)

			});
		},
		onSaveSnowCategoryButtonPress: function (oEvent) {
			var oButton = oEvent.getSource();
			var sUserID = this.getModel("CurrentUserInfo").getProperty("/UserID");
			var oMultiSelect = this.getView().byId("idCategoryMultiSnow"); // branch between combo and multi here based on CIM vs esc
			var aCategory = oMultiSelect.getSelectedKeys();
			oButton.setBusy(true);
			oMultiSelect.setBusy(true);
			var obj_Snow = {
				"u_expected_action": aCategory.join(","), //serviceNow expects comma seperated string
				"u_last_user_updated_by": sUserID,
				"sys_target_sys_id": this.sSnowEscalationID,
				"u_update_expected_action": true
			};
			$.ajax({
				method: "POST",
				data: JSON.stringify(obj_Snow),
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sap.support.fsc2.servicenowEscalationUrlCreateApi,
				success: function (oSuccess) {
					sap.m.MessageToast.show("Successfully edited the expected action");
					oButton.setBusy(false);
					oMultiSelect.setBusy(false);
					this.loadSnowEscalationData(this.sSnowEscalationID);
				}.bind(this),
				error: function (oError) {
					oButton.setBusy(false);
					oMultiSelect.setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)

			});
		},

		_checkIfPSLongRunnerScenarioMatched: function (oEvent) {
			var oIncidentDetail = this.getView().getModel("incidentDetail").getData();
			var aCommunicaiton = this.getModel("Communication").getData().results;
			var oCommunicaion = aCommunicaiton.find((element) => {
				return element.Texttype === "comments"
			});

			var sSAP_Respended_on = oIncidentDetail.Last_updated_time;
			if (oCommunicaion) {
				sSAP_Respended_on = oCommunicaion.Formated_Time;
			}

			if ((oIncidentDetail.Priority === "2") && (oIncidentDetail.PROCESSOR_ORG.toUpperCase()
					.startsWith("PS DCP")) && !this.isPSLongRunnerCreated() &&
				(oIncidentDetail.StatusTxt.includes("In progress") || oIncidentDetail.StatusTxt.includes("New"))) {
				let iTimeSinceLastAction = new Date().getTime() - new Date(sSAP_Respended_on).getTime();
				let bLastUpdateTimeExceded = iTimeSinceLastAction > 172800000 ? true : false; // 2d

				if (bLastUpdateTimeExceded && (new Date() > new Date(oIncidentDetail.Next_action_due_time))) {
					let sUrl = sap.support.fsc2.servicenowTableUrl + "/task_sla?sysparm_query=task=" + oIncidentDetail.CaseSysID +
						"%5Esla.u_sub_type=MPT";

					$.ajax({
						method: "GET",
						contentType: "application/json",
						headers: {
							'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
						},
						url: sUrl,
						success: function (oData) {
							if (oData.result && oData.result.length > 0 && parseFloat(oData.result[0].percentage) > 70) {
								this.eventUsage(false, "PS Long Runners");
								//this.getModel("CreateEntity").setProperty("/bLongRunner", true);

								var oIncidentDetail = this.getModel("incidentDetail").getData();
								var sUserID = this.getModel("CurrentUserInfo").getProperty("/UserID");

								var obj_Snow = {
									"u_bcp_correlation_id": oIncidentDetail.ID,
									"u_escalation_type": "3",
									"u_short_description": oIncidentDetail.Description,
									"u_requested_by": sUserID,
									"u_type": "Escalated Case",
									"u_last_user_updated_by": sUserID,
									"sys_target_sys_id": "",
									"u_business_impact": oIncidentDetail.business_impact.replaceAll("\n", "<br>"), //oEntry.BusImpact,
									"u_update_expected_action": true,
									"u_update_business_impact": true,
									"approval": "immediate_action",
									"u_request_reason": "15",
									"escalation_justification": "Automated Action - PS Long Runner"
								};
								this.getView().setBusy(true);
								$.ajax({
									method: "POST",
									data: JSON.stringify(obj_Snow),
									contentType: "application/json",
									headers: {
										'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
									},
									url: sap.support.fsc2.servicenowEscalationUrlCreateApi,
									success: function (oData) {
										var oOdataObj = oData.result[0];
										//to accomodate new snow API where unsuccessful creation returns success resp
										if (oOdataObj && oOdataObj.status === "error") {
											this.processSnowCreateEscaErrorMsg(oOdataObj);
										} else {
											if (!this.oPSLongRunnerCreatedInfoMessageDialog) {
												this.oPSLongRunnerCreatedInfoMessageDialog = new Dialog({
													type: DialogType.Message,
													title: "Information",
													contentWidth: "50%",
													state: sap.ui.core.ValueState.Information,
													content: new Text({
														text: "We have identified that there is a processing delay for this customer case on Product Support side. We have therefore triggered a notification to the responsible team to take timely action on this case. Please follow up on the case activity stream for further details within the next business day. If no visible action during this timeframe, please consider approaching the MCC by creating an MCC SOS App request."
													}),
													beginButton: new Button({
														type: sap.m.ButtonType.Emphasized,
														text: "Ok",
														press: function () {
															this.oPSLongRunnerCreatedInfoMessageDialog.close();
															this.loadSnowCaseData(this.sID, "incident");
															this.getView().setBusy(false);
														}.bind(this)
													})
												});
												this.getModel("PS_Long_Runner").setProperty("/u_request_reason", "15");
												this.getModel("PS_Long_Runner").setProperty("/sys_created_on", new Date());
												this.oPSLongRunnerCreatedInfoMessageDialog.open();
											} else {
												this.oPSLongRunnerCreatedInfoMessageDialog.open();
											}
										}
									}.bind(this),
									error: function (oResponse) {
										// error message
										this.getView().setBusy(false);
									}.bind(this)
								});
							} else {
								this._escalateIncident(oEvent);
							}
						}.bind(this),
						error: function (oError) {
							// only for debug log
							// new log lib to be used
						}.bind(this)
					})
				} else {
					this._escalateIncident(oEvent);
				}
			} else {
				this._escalateIncident(oEvent);
			}
		},

		onEscalateIncident: function (oEvent) {
			if (this.isPSLongRunnerCreated()) {
				var dCreatedAt = new Date(this.getModel("PS_Long_Runner").getProperty("/sys_created_on")).getTime();
				var iTimeToday = new Date().getTime();
				var iDifference = Math.ceil((iTimeToday - dCreatedAt) / (1000 * 3600));
				if (iDifference < 4) {
					if (!this.oPSLongRunnerInfoMessageDialog) {
						this.oPSLongRunnerInfoMessageDialog = new Dialog({
							type: DialogType.Message,
							title: "Information",
							state: sap.ui.core.ValueState.Information,
							content: new Text({
								text: "Product Support has been triggered already we should allow the reaction time. You can continue to standard escalation request creation process by clicking continue."
							}),
							beginButton: new Button({
								type: sap.m.ButtonType.Emphasized,
								text: "Continue",
								press: function () {
									this.oPSLongRunnerInfoMessageDialog.close();
									this._escalateIncident(oEvent);
								}.bind(this)
							}),
							endButton: new Button({
								type: sap.m.ButtonType.Default,
								text: "Close",
								press: function () {
									this.oPSLongRunnerInfoMessageDialog.close();
								}.bind(this)
							})
						});
					}
					this.oPSLongRunnerInfoMessageDialog.open();
				} else {
					this._escalateIncident(oEvent);
				}
			} else {
				this._checkIfPSLongRunnerScenarioMatched(oEvent);
			}
		},

		_escalateIncident: function (oEvent) {
			this.getView().getModel("ReqDescQA").setProperty("/QA", new JSONModel());
			var sPriority = this.getModel("incidentDetail").getData().PriorityTxt;
			var oButton = oEvent.getSource();
			this.CustomerNo = this.CustomerNo === "" ? "0" : this.CustomerNo;
			if (sPriority === "Low" || sPriority === "Medium") {

				var oView = this.getView();

				// create dialog lazily
				if (!this.pDialog) {
					this.pDialog = Fragment.load({
						id: oView.getId(),
						name: "sap.support.fsc2.view.fragments.LowPriorityEscaWarningDialog",
						controller: this
					}).then(function (oDialog) {
						// connect dialog to the root view of this component (models, lifecycle)
						oView.addDependent(oDialog);
						return oDialog;
					});
				}

				this.pDialog.then(function (oDialog) {
					oDialog.openBy(oButton);
				});
			} else {
				this._extractQA_FromInteractionContent();
				this.getRouter().navTo("createByIncidentEnd", { //I338673 Move logic of these or else request state over url. works as temp solution
					layout: "EndColumnFullScreen",
					custnum: this.CustomerNo,
					custname: encodeURIComponent(this.CustomerName) === "" ? " " : encodeURIComponent(this.CustomerName),
					incident: this.getModel("incidentDetail").getProperty("/SNow_number") || this.sID
				});
			}
		},

		handleCancelLowPrioityEscalation: function (oEvent) {
			this.eventUsage(false, "Cancel escalation after Low/Medium priority warning");
			//this.pDialog.close(); // will always be instantiated since we call for button on dialog
			this.pDialog.then(function (oDialog) {
				oDialog.close();
			});
		},
		handleProceedLowPrioityEscalation: function (oEvent) {
			this.eventUsage(false, "Continue escalation after Low/Medium priority warning");
			this.getRouter().navTo("createByIncidentEnd", { //I338673 Move logic of these or else request state over url. works as temp solution
				layout: "EndColumnFullScreen",
				custnum: this.CustomerNo,
				custname: encodeURIComponent(this.CustomerName),
				incident: this.sID
			});
		},

		navigateEscalation: function (sCIMstatus) {
			var sEnableCreateSaM = this.getModel("SaMEnable").getProperty("/enableCreate");
			if (sEnableCreateSaM) {
				this.getRouter().navTo("escalateIncident", {
					layout: "EndColumnFullScreen",
					custnum: this.CustomerNo,
					custname: encodeURIComponent(this.CustomerName),
					incident: this.sID
				});
			} else if (this.getModel("incidentDetail").getData().StatusTxt === "Closed") {
				sap.m.MessageBox.information("You cannot escalate this case as it is already closed.", {
					title: "Information", // default
					onClose: function () {}.bind(this)
				});

			} else if (this.getModel("incidentDetail").getData().StatusTxt === "Confirmed" || this.getModel("incidentDetail").getData().StatusTxt ===
				"Confirmed automatically") { // change to STATUS code rather than text? I338673
				sap.m.MessageBox.information("You cannot escalate this case as it is already confirmed.", {
					title: "Information", // default
					onClose: function () {

					}.bind(this)
				});

			} else if (this.getModel("incidentDetail").getData().StatusTxt === "Restricted") { // change to STATUS code rather than text? I338673
				sap.m.MessageBox.information("You cannot escalate this case as it is restricted.", {
					title: "Information", // default
					onClose: function () {

					}.bind(this)
				});

			} else {
				this.getRouter().navTo("createByIncidentEnd", { //I338673 Move logic of these or else request state over url. works as temp solution
					layout: "EndColumnFullScreen",
					custnum: this.CustomerNo,
					custname: encodeURIComponent(this.CustomerName),
					incident: this.sID
				});
			}
		},
		checkForOpenEscalation: function (sValue) {
			this.getView().setBusy(true);
			var oDataService = {
				"sysparm_fields": "action_status,u_task_record.ref_sn_customerservice_case.correlation_id,u_task_record.ref_sn_customerservice_case.action_status,de_escalation_justification,escalation_justification,u_request_reason,u_escalation_type,u_task_record.ref_sn_customerservice_case.description,u_task_record.ref_sn_customerservice_case.sys_created_on,u_task_record.ref_sn_customerservice_case.sys_created_by,u_request,u_task_record.ref_sn_customerservice_case.account.number,assigned_to.name,u_expected_action,u_business_impact,u_task_record.ref_sn_customerservice_case.number,u_task_record.ref_sn_customerservice_case.u_responsible_party,u_responsible_party,state,u_task_record.ref_sn_customerservice_case.short_description,u_task_record.ref_sn_customerservice_case.business_impact,u_task_record.ref_sn_customerservice_case.u_contract_type_list,u_task_record.ref_sn_customerservice_case.priority,u_task_record.ref_sn_customerservice_case.account.name,u_task_record.ref_sn_customerservice_case.u_deployed_item.u_number,u_task_record.ref_sn_customerservice_case.u_deployed_item.u_sid, requested_by.name,requested_by.employee_number,requested_by.department.name,number,u_short_description,active,number,u_bcp_correlation_id,sys_updated_by,escalation,sys_id,short_description,u_task_record.ref_sn_customerservice_case.correlation_display,priority,u_task_record.ref_sn_customerservice_case.state,u_task_record.ref_sn_customerservice_case.u_app_component.u_name,u_task_record.ref_sn_customerservice_case.assigned_to.user_name,assigned_to.email,u_task_record.ref_sn_customerservice_case.assigned_to.name,u_task_record.ref_sn_customerservice_case.assignment_group.name,u_last_user_updated_on,u_next_action_due,sys_created_on"
			};

			if (sValue) {
				oDataService["source_record"] = sValue;
			} else {
				oDataService.u_bcp_correlation_id = this.sID;
			}
			this.getModel("PS_Long_Runner").setData({});

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
							if (oData.result[i].state === "103" && oData.result[i].u_escalation_type === "3" && oData.result[i].u_request_reason ===
								"15") {
								// PS Long Runner	
								this.getModel("PS_Long_Runner").setData({
									"u_escalation_type": oData.result[i].u_escalation_type,
									"u_last_user_updated_on": oData.result[i].u_last_user_updated_on,
									"u_next_action_due": oData.result[i].u_next_action_due,
									"u_request_reason": oData.result[i].u_request_reason,
									"sys_created_on": oData.result[i].sys_created_on
								})
							}
							if (oData.result[i].state === "100" || oData.result[i].state === "101") { //Client side check, check in network request for state
								var obj = oData.result[i];

								// this.setEscalationJustificationLabel(obj);
								this.getModel("incidentDetailPage").setProperty("/SnowEscaNumber", obj.number);
								this.getModel("incidentDetailPage").setProperty("/requestEditable", ((obj.state === "100" || obj.state === "101") && obj.u_escalation_type ===
									"3"));
								this.getModel("incidentDetailPage").setProperty("/Description", obj.short_description); //title
								this.getModel("incidentDetailPage").setProperty("/incidentHasEscalation", true);
								this.sSnowEscalationID = obj["sys_id"];
								switch (obj.u_escalation_type) {
								case "0":
									this.setEscalationJustificationLabel(obj, "BDMRequest");
									this.getModel("BDMRequest").setProperty("/incidentHasEscalation", true);
									this.getModel("BDMRequest").setProperty("/object_id", obj.number);
									this.getModel("BDMRequest").setProperty("/category_escalation", obj["u_expected_action"].split(','));
									this.getModel("BDMRequest").setProperty("/responsible_person_name", obj["assigned_to.name"]);
									this.getModel("BDMRequest").setProperty("/responsible_person_email", obj["assigned_to.email"]);
									this.getModel("BDMRequest").setProperty("/report_person_name", obj["requested_by.name"]);
									this.getModel("BDMRequest").setProperty("/business_impact", obj["u_business_impact"]);
									this.getModel("BDMRequest").setProperty("/request_description", obj["u_request"]);
									this.getModel("BDMRequest").setProperty("/status", formatter.SnowEscalationStatusTxt(obj.state)); //I38673 vhevk
									//new addition for qualtrics feedback
									this.getModel("BDMRequest").setProperty("/escalation_type", obj.u_escalation_type);
									this.getModel("BDMRequest").setProperty("/escalationCaseId", obj["u_task_record.ref_sn_customerservice_case.number"]);
									this.getModel("BDMRequest").setProperty("/escalationCaseComponent", obj["u_task_record.ref_sn_customerservice_case.u_app_component.u_name"]);
									this.getModel("BDMRequest").setProperty("/escalationCaseAssignmentGroup", obj["u_task_record.ref_sn_customerservice_case.assignment_group.name"]);
									this.getModel("BDMRequest").setProperty("/escalationCaseCustomerId", obj["u_task_record.ref_sn_customerservice_case.account.number"]);
									this.getModel("BDMRequest").setProperty("/escalationCaseCustomerName", obj["u_task_record.ref_sn_customerservice_case.account.name"]);
									this.getModel("BDMRequest").setProperty("/report_person_id", obj["requested_by.employee_number"]);
									this.getModel("BDMRequest").setProperty("/report_person_department", obj["requested_by.department.name"]);
									this.getModel("BDMRequest").setProperty("/escalation_action_status", obj.action_status);
									this.getModel("incidentDetailPage").setProperty("/enableChangeEscLevel", obj.state === "101" ? true : false);
									if (this.getModel("incidentDetailPage").getProperty("/showEscalateButtton")) {
										this.getModel("incidentDetailPage").setProperty("/showEscalateButtton", obj.state === "101" ? false : true);
									}
									this.sBDMEscalationID = obj["sys_id"];
									this.loadSnowNoteData(false, "BDMchatList");
									break;
								case "3":
									//cim model
									this.setEscalationJustificationLabel(obj, "CIMRequest");
									this.getModel("CIMRequest").setProperty("/incidentHasEscalation", true);
									this.getModel("CIMRequest").setProperty("/object_id", obj.number);
									this.getModel("CIMRequest").setProperty("/category_escalation", obj["u_expected_action"].split(','));
									this.getModel("CIMRequest").setProperty("/responsible_person_name", obj["assigned_to.name"]);
									this.getModel("CIMRequest").setProperty("/responsible_person_email", obj["assigned_to.email"]);
									this.getModel("CIMRequest").setProperty("/report_person_name", obj["requested_by.name"]);
									this.getModel("CIMRequest").setProperty("/business_impact", obj["u_business_impact"]);
									this.getModel("CIMRequest").setProperty("/request_description", obj["u_request"]);
									this.getModel("CIMRequest").setProperty("/status", formatter.SnowEscalationStatusTxt(obj.state)); //I38673 vhevk
									//new addition for qualtrics feedback
									this.getModel("CIMRequest").setProperty("/escalation_type", obj.u_escalation_type);
									this.getModel("CIMRequest").setProperty("/escalationCaseId", obj["u_task_record.ref_sn_customerservice_case.number"]);
									this.getModel("CIMRequest").setProperty("/escalationCaseComponent", obj["u_task_record.ref_sn_customerservice_case.u_app_component.u_name"]);
									this.getModel("CIMRequest").setProperty("/escalationCaseAssignmentGroup", obj["u_task_record.ref_sn_customerservice_case.assignment_group.name"]);
									this.getModel("CIMRequest").setProperty("/escalationCaseCustomerId", obj["u_task_record.ref_sn_customerservice_case.account.number"]);
									this.getModel("CIMRequest").setProperty("/escalationCaseCustomerName", obj["u_task_record.ref_sn_customerservice_case.account.name"]);
									this.getModel("CIMRequest").setProperty("/report_person_id", obj["requested_by.employee_number"]);
									this.getModel("CIMRequest").setProperty("/report_person_department", obj["requested_by.department.name"]);
									this.getModel("CIMRequest").setProperty("/escalation_action_status", obj.action_status);

									if (this.getModel("incidentDetailPage").getProperty("/showEscalateButtton")) {
										this.getModel("incidentDetailPage").setProperty("/showEscalateButtton", obj.state === "100" || obj.state === "101" ?
											false : true);
									}
									this.sCIMEscalationID = obj["sys_id"];
									this.loadSnowNoteData();
									break;
								}
							}
						}
						if (sap.escCreated) {
							sap.escCreated = false;
							this.getUserData(true);
						}
					}
					this.onIconTabFilterChanged();
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});

			return bExists;
		},

		onAddNotes: function (oEvent) {
			var sUserID = this.getModel("CurrentUserInfo").getProperty("/UserID");
			var sValue = oEvent.getParameter("value");
			var sControlId = oEvent.getSource().getId().indexOf("addBDMNotes") > 0 ? "BDMchatList" : "chatList";
			this.getView().setBusy(true);

			sValue = sValue.replace("\n/g", "\\n"); //for sNow side cant handle return carraige. not needed anymore? i338673
			var obj_Snow = {
				"u_comments": "[code]" + sValue + "[code]",
				"u_last_user_updated_by": sUserID,
				"sys_target_sys_id": oEvent.getSource().getId().indexOf("addBDMNotes") > 0 ? this.sBDMEscalationID : this.sCIMEscalationID //this.sSnowEscalationID
			};
			$.ajax({
				method: "POST",
				data: JSON.stringify(obj_Snow),
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sap.support.fsc2.servicenowEscalationUrlCreateApi, //= sys_id
				success: function () {
					this.loadSnowNoteData(true, sControlId);
					this.getView().setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
					this.getView().setBusy(false);
				}.bind(this)

			});
		},
		onNavHomeCreate: function () {
			this.onNavHome();
			this.onGiveUpCreateCritical();
		},

		onBeforeUploadStarts: function (oEvent) {
			var oModel = new sap.ui.model.odata.v2.ODataModel(this.getOwnerComponent().sICDest + "/sap/ZS_AGS_FSC2_SRV", true);
			var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: oModel.getSecurityToken()
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
			// Header Slug
			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
		},

		onUploadComplete: function (oEvent) {
			this.eventUsage(false, "Upload \'CIM Request\' attachment");
		},

		onFileSizeExceed: function (oEvent) {
			sap.m.MessageToast.show("Please choose a file less than 10 MB.");
		},

		onFileNameExceed: function (oEvent) {
			sap.m.MessageToast.show("Please choose a file name less than 100 characters.");
		},
		onNavToSaM: function () {
			this.getRouter().navTo("SaM", {
				incident: this.sID
			});
		},
		onAddToCalendar: function () {
			var sIncidentID = this.sID;
			var sUrl = sap.support.fsc2.oDataBCRequestModel.sServiceUrl + "/SaMICSFileSet(FileName='" + sIncidentID +
				"',SaMSource='MCC')/$value";
			window.open(sUrl);
		},
		onEditSAMContact: function () {
			this.getModel("SaMDetail").setProperty("/bEditContact", true);
		},
		onSaveSaMContact: function () {
			this.getModel("SaMDetail").setProperty("/bEditContact", false);
			var sID = this.sID;
			var oSaMDetail = this.getModel("SaMDetail").getData();
			var oEntityDetail = {
				"AppInfo": "MCC",
				"SamAction": "update",
				"SamContact": oSaMDetail.SamContact,
				"SamPhone": oSaMDetail.SamPhone,
				"SamEmail": oSaMDetail.SamEmail,
				"SamcProcessing": oSaMDetail.SamcProcessing,
				"SaMcLackResponse": oSaMDetail.SaMcLackResponse,
				"SaMcNoProcessor": oSaMDetail.SaMcNoProcessor,
				"SaMcCriticalIssue": oSaMDetail.SaMcCriticalIssue,
				"SaMcCommunication": oSaMDetail.SaMcCommunication,
				"SaMcOther": oSaMDetail.SaMcOther,
				"SaMOtherInput": oSaMDetail.SaMOtherInput,
				"SaMAdditionalInfo": oSaMDetail.SaMAdditionalInfo
			};
			var oDataSaMBookingSet = oSaMDetail.initResult;
			var oEntity = {
				"AppSource": "MCC",
				"IncidentRef": oDataSaMBookingSet.IncidentRef,
				"SamDuration": oDataSaMBookingSet.SamDuration,
				"SamInfo": JSON.stringify(oEntityDetail),
				"SamStartTime": oDataSaMBookingSet.SamStartTime,
				"SamStatus": "E0001" //"oDataSaMBookingSet.SamStatus"
			};
			sap.support.fsc2.oDataBCRequestModel.update("/SaMBookingSet(IncidentRef='" + sID + "',AppSource='MCC')", oEntity, {
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData, sResponse) {
					var sError = false; //default create success
					var sMsg = sResponse.headers["sap-message"];
					var sErrorMsg = "";
					if (sMsg) {
						sError = JSON.parse(sMsg).severity === "error" ? true : false;
						sErrorMsg = JSON.parse(sMsg).message;
					}
					if (!sError) {
						sap.m.MessageToast.show("Contact information updated successfully");
					} else {
						sap.m.MessageToast.show(sErrorMsg);
					}
				}.bind(this),
				error: function (error) {
					sap.m.MessageToast.show("SaMBookingSet service unavailable");
				}
			});
		},
		onCancelSaMContact: function () {
			this.getModel("SaMDetail").setProperty("/bEditContact", false);
		},
		onCancelSamSession: function () {
			var sID = this.sID;
			var that = this;
			var oView = this.getView();
			// var Obj = this.getModel("SaMDetail").getProperty("/initResult");
			var oSaMDetail = this.getModel("SaMDetail").getData();
			var oEntityDetail = {
				"AppInfo": "MCC",
				"SamAction": "delete",
				"SamContact": oSaMDetail.SamContact,
				"SamPhone": oSaMDetail.SamPhone,
				"SamEmail": oSaMDetail.SamEmail,
				"SamcProcessing": oSaMDetail.SamcProcessing,
				"SaMcLackResponse": oSaMDetail.SaMcLackResponse,
				"SaMcNoProcessor": oSaMDetail.SaMcNoProcessor,
				"SaMcCriticalIssue": oSaMDetail.SaMcCriticalIssue,
				"SaMcCommunication": oSaMDetail.SaMcCommunication,
				"SaMcOther": oSaMDetail.SaMcOther,
				"SaMOtherInput": oSaMDetail.SaMOtherInput,
				"SaMAdditionalInfo": oSaMDetail.SaMAdditionalInfo
			};
			var oDataSaMBookingSet = oSaMDetail.initResult;
			var oEntity = {
				"AppSource": "MCC",
				"IncidentRef": oDataSaMBookingSet.IncidentRef,
				"SamDuration": oDataSaMBookingSet.SamDuration,
				"SamInfo": JSON.stringify(oEntityDetail),
				"SamStartTime": oDataSaMBookingSet.SamStartTime,
				"SamStatus": oDataSaMBookingSet.SamStatus
			};
			MessageBox.warning("Do you really want to cancel the session?", {
				title: "Cancel",
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (sAction) {
					if (sAction !== "NO") {
						//action to delete the SAM session
						sap.support.fsc2.oDataBCRequestModel.update("/SaMBookingSet(IncidentRef='" + sID + "',AppSource='MCC')", oEntity, {
							headers: {
								"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
							},
							success: function (oData, sResponse) {
								var sError = false; //default create success
								var sMsg = sResponse.headers["sap-message"];
								var sErrorMsg = "";
								if (sMsg) {
									sError = JSON.parse(sMsg).severity === "error" ? true : false;
									sErrorMsg = JSON.parse(sMsg).message;
								}
								if (!sError) {
									sap.m.MessageToast.show("Schedule a manager cancelled successfully");
									oView.byId("SamDetail").setVisible(false);
									//that.getModel("SaMEnable").setProperty("/enableCreate", true);
									that.SamCheck(sID);
								} else {
									sap.m.MessageToast.show(sErrorMsg);
								}

							}.bind(this),
							error: function (error) {
								sap.m.MessageToast.show("SaMBookingSet service unavailable");
							}
						});
					}
				}
			});
		},
		formatSNow_BusImpact: function (business_impact, SNow_number) {
			if (SNow_number && business_impact) {
				return business_impact;
			} else {
				// return "<div/><div/>";
				return "<div></div>";
			}
		},
		onChangeEscLevel: function () {
			var that = this;
			var snowEscaId = that.objectId === undefined ? that.sSnowEscalationID : that.objectId;
			if (that.transType === undefined && that.sSnowEscalationID !== undefined) {
				that.transType = "sn_customerservice_escalation";
			}
			MessageBox.information(
				//	"The incident is being handled at MCC as an incident escalation. You are now requesting to change escalation level. So that we can access your request. We would like to ask you to provide few important information regarding this critical customer situation.", {
				//"You are now requesting to change the escalation level. In order to assess your request we would like to ask you to provide some important information regarding this critical customer situation.", {
				"WARNING: You are about to start a new escalation request process within SAP MCC. Changing the escalation level means that the situation criticality has increased and further engagement from SAP MCC is required. If you would like to update the escalation record, press Cancel and use the Reply /Add Comments section.", {

					actions: ["Continue", "Cancel"],
					onClose: function (sAction) {
						if (sAction === "Continue") {
							that.getRouter().navTo("ChangeEscLevel", {
								layout: "EndColumnFullScreen",
								cimId: snowEscaId,
								transType: that.transType
							});
						}
					}
				});
		},
		onScrollTop: function (oEvent) {
			this.getView().byId("incidentDetail")._getPage().getScrollDelegate().scrollTo(0, 0, 0);
		},

		onScrollBottom: function (oEvent) {
			this.getView().byId("incidentDetail")._getPage().getScrollDelegate().scrollTo(0, 100000, 500);
			jQuery.sap.delayedCall(400, this, function () {
				//sap.ui.getCore().byId("__component0---requestDetail--addNotes-textArea").focus(); // only way to focus on the input
			});
		},

		onReply: function (oEvent) {
			this.getView().byId("idObjectPageLayout").setSelectedKey("CIMRequest");
			this.getView().byId("scrollUpButton").setVisible(true);
			this.getView().byId("scrollDownButton").setVisible(true);
			this.onScrollBottom();
		},

		onIconTabFilterChanged: function (oEvent) {
			var sSelectedKey = oEvent ? oEvent.getParameter("selectedKey") : this.getView().byId("idObjectPageLayout").getSelectedKey();
			if (sSelectedKey === "comunicationSummaryItKey" || sSelectedKey === "CIMRequest" || sSelectedKey === "TBEDetails") {
				this.getView().byId("scrollUpButton").setVisible(true);
				this.getView().byId("scrollDownButton").setVisible(true);
				this.onScrollBottom();
			} else {
				this.getView().byId("scrollUpButton").setVisible(false);
				this.getView().byId("scrollDownButton").setVisible(false);
			}
			this.getModel("incidentDetailPage").setProperty("/showFeedbackButton", sSelectedKey === "CIMRequest" ? true : false);
		},

		onEscalationFeedbackPress: function (oEvent) {
			this.getUserData();
		},

		getUserData: function (onCreateEsc) { //Qualtrics >> activity odata
			var that = this;

			var promise = new Promise(function (resolve, reject) {
				var oUser = that.getOwnerComponent().getModel("CurrentUserInfo").getData();
				var oUserModel = new sap.ui.model.json.JSONModel();

				// load external JSON file
				oUserModel.loadData(sap.support.fsc2.AppUrl + "sap/ui5/1/resources/sapit/sapitapi/user-info/" + oUser.UserID);
				oUserModel.attachRequestCompleted(function () {
					resolve(oUserModel.getData());
				});
			});
			promise.then(function (uData) {
				that.processEscalationFeedback(uData, onCreateEsc);
				// that.processEscalationFeedback(uData);
			});
		},

		/*
		 * @param {Object} QSI - Qualtrics intercept object
		 */
		processEscalationFeedback: function (userData, onCreateEsc) {
			// get selected tab key
			var oSelectedModelData = {};
			if (onCreateEsc) {
				oSelectedModelData = this.getView().getModel("CIMRequest").getData();
				document.cookie = "qualtrics=cimcreate";
			} else {
				var sSelectedIconFilterKey = this.byId("idObjectPageLayout").getSelectedKey();
				switch (sSelectedIconFilterKey) {
				case "CIMRequest":
					oSelectedModelData = this.getView().getModel("CIMRequest").getData();
					break;
				case "TBEDetails":
					oSelectedModelData = this.getView().getModel("BDMRequest").getData();
					break;
				default:
					return;
				}
				// document.cookie= "qualtrics=permanent";
				document.cookie = "qualtrics=cimpermanent";

			}
			var qData = this.getOwnerComponent().getModel("QualtricsData").getData();
			qData.escalation_id = oSelectedModelData.object_id;
			qData.escalation_type = formatter.formatEscalationType(oSelectedModelData.escalation_type);
			var sExpectedActions = "";
			oSelectedModelData.category_escalation.forEach(function (item) {
				sExpectedActions += formatter.formatEscalationExpectedAction(item) + ",";
			});

			qData.expected_action = sExpectedActions.slice(0, -1);
			qData.escalation_state = oSelectedModelData.status;
			qData.escalation_action_status = oSelectedModelData.escalation_action_status;
			qData.case_id = oSelectedModelData.escalationCaseId;
			qData.case_component = oSelectedModelData.escalationCaseComponent;
			qData.case_assignment_group = oSelectedModelData.escalationCaseAssignmentGroup;
			qData.channel = "mccSOS";
			var oCountry = userData.company.address.country;
			var oReagionInfo = this.getModel("reagionHelpModel").getData().find(country => country.COUNTRYCODE === oCountry);
			qData.region = oReagionInfo.MCCREGION;
			// qData.region = userData.company.address.region;
			// if (userData.company.address.region === "AMER") {
			// 	var country = userData.company.address.country;
			// 	if (country === "US" || country === "CA") {
			// 		qData.region = "NA";
			// 	} else {
			// 		qData.region = "LAC";
			// 	}
			// }
			qData.requestor_name = userData.firstName + " " + userData.lastName;
			qData.requestor_id = userData.id;
			qData.requestor_department = userData.department.name;
			qData.survey_name = "MCC-SOS-APP-Escalation-Record";
			var sources = new Map([
				['t', 'test'],
				['d', 'dev'],
				['p', 'prod']
			]);
			qData.source_system = sources.get(sap.support.fsc2.Landscape)
			qData.customer_id = oSelectedModelData.escalationCaseCustomerId;
			qData.customer_name = oSelectedModelData.escalationCaseCustomerName;
			qData.assigned_to = oSelectedModelData.responsible_person_name; //
			qData.assigned_to_manager = oSelectedModelData.responsible_person_name;

			// at the end update model
			this.getOwnerComponent().getModel("QualtricsData").setData(qData);
			sap.qualtricsData = qData;
			QSI.API.unload();
			QSI.API.load().then(QSI.API.run());
		},

		loadCustomerData: function (sValue) {
			if (this.oCustomerMap.has(sValue)) {
				return;
			} else {
				var that = this;
				this.oCustomerMap.set(sValue);
				this.searchCustomers(sValue).then(
					function (aResults) {
						//success
						if (aResults.length > 0) {
							that.getModel("customerDetails").setData(aResults[0]);
						}
					}.bind(this),
					function (error) {
						sap.m.MessageToast.show("CustomerInfoSet Service Unavailable!");
					}
				).finally(function () {
					// final steps to perform
				});
			}
		},

		isPSLongRunnerCreated: function () {
			var output = false;
			var sRequestReason = this.getModel("PS_Long_Runner").getProperty("/u_request_reason");
			if (sRequestReason === "15") {
				output = true;
			}
			return output;
		},

		_extractQA_FromInteractionContent: function () {
			var aComData = this.getModel("Communication").getData().results;
			var sQ = "Which business processes are affected, e.g. Payroll, Reporting? Is this a production or implementation project issue?"

			var aPatterns = [
				"Which business processes are affected, e.g. Payroll, Reporting? Is this a production or implementation project issue?",
				"Explain in a non-technical way how this/these business process is/are affected:",
				"Are there upcoming due dates that could be affected by the issue? If yes, please state the details of those due dates and the consequences if they were not met:",
				"Is there any political involvement/circumstances (e.g SAP Board Member, Senior Executive, Strategic Account)?",
				"Contact information of anyone internal already involved/working on this issue?"
			];

			var aExtA = ["", "", "", "", ""];
			var aSplitText = [];
			var iQIndex = 0;
			var sParsedHTMLText = ""

			for (var i = 0; i < aComData.length; i++) {
				if (aComData[i].Texttype === "comments") {
					if (aComData[i].Text.indexOf(sQ) > 0) {
						sParsedHTMLText = new DOMParser().parseFromString(aComData[i].Text, 'text/html');
						aSplitText = sParsedHTMLText.body.textContent.split("##");
						for (var y = 0; y < aSplitText.length; y++) {
							if (aSplitText[y].indexOf(aPatterns[iQIndex]) >= 0) {
								aExtA[iQIndex] = aSplitText[y].replace(aPatterns[iQIndex], "");
								iQIndex++;
							}
						}
						this.getView().getModel("ReqDescQA").setProperty("/QA", aExtA);
						// set aExtA to model to be passed to next screen for updating description using new i18n text with accepting parameters -  requestHintWithA
						return;
					}
				}
			}
		}
	});
});