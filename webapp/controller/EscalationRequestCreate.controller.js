sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/formatter',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/m/MessageBox'
], function (BaseController, formatter, JSONModel, Filter, ODataModel, models, MessageBox) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.EscalationRequestCreate", {
		formatter: formatter,
		onInit: function () {
			this.env_PG_AGS_DASHBOARDS = sap.support.fsc2.CXCSSModelUrl + "/"; //this.sICDest + "/sap/ZS_AGS_DASHBOARDS_SRV/";
			// this.env_PG_ESCALATIONS = "/sap/opu/odata/sap/ZS_ESCALATIONS/";
			this.currentUserID = this.getModel("CurrentUserInfo").getProperty("/UserID");
			this.externalCall = "";
			this.requestor = "";
			this.ActivityId = "";
			this.notesArray = ["ZU01", "ZU02", "ZU03", "ZU04"];
			this.setModel(new JSONModel(), "SharedUsers");
			this.setModel(new JSONModel(), "BPSearchResult");
			this.setModel(new JSONModel(), "BPSearchCriteria");
			this.setModel(new JSONModel(), "CustSearchResult");
			this.setModel(new JSONModel(), "CustSearchCriteria");
			this.setModel(new JSONModel(), "RequestorDetail");
			this.setModel(new JSONModel(), "CustDetail");
			this.setModel(new JSONModel({
				"enabled": true,
			}), "UIconfigModel");
			this.setModel(new JSONModel({
				"enableSaveDraftButton": true
			}), "GEViewModel");
			this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/model/Solution.json")), "Solutions");
			this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/model/PremEngagement.json")), "PremEngagement");
			this.setModel(new JSONModel(), "AffectedSolution");
			this.setModel(new JSONModel(), "EscRequestDetail");
			this.setModel(new JSONModel(), "InvolvedPerson");
			this.setModel(new JSONModel(), "RoleModel");
			this.setModel(new JSONModel(), "selectedIncidentList");
			this.getRole();
			this._oBPSearchDialog = new sap.ui.xmlfragment("BPSearch", "sap.support.fsc2.view.fragments.BPSearch", this);
			this.getView().addDependent(this._oBPSearchDialog);
			this._oCustSearchDialog = new sap.ui.xmlfragment("CustSearch", "sap.support.fsc2.view.fragments.CustSearch_EscReq", this);
			this.getView().addDependent(this._oCustSearchDialog);
			this.getRouter().getRoute("escalationRequestCreate").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("escalationRequestDetailEnd").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("escalationRequestDetail").attachPatternMatched(this._onRouteMatchedDetail, this);
			this.getRouter().getRoute("escalationRequest").attachPatternMatched(this._onRouteMatchedDetail, this);
			this.getRouter().getRoute("escalationRequestDetailSearch").attachPatternMatched(this._onRouteMatchedDetail, this);
			this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/model/ReagionHelp.json")),
				"reagionHelpModel");
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

			var aHistory = sap.ui.core.routing.History.getInstance().aHistory;
			var sPrevRoute = aHistory[aHistory.length - 1];
			var oDataSelectedIncd = [];
			var sSelectList = "";
			this.getView().getModel("GEViewModel").setProperty("/enableSaveDraftButton", true);
			if (sPrevRoute.indexOf("incidentList") === 0) {
				oDataSelectedIncd = this.getModel("selectedIncidentList").getProperty("/results");
				sSelectList = "";
				oDataSelectedIncd.forEach(function (x) {
					if (x.SNow_number) {
						sSelectList += x.SNow_number + "\n";
					}
				});

				this.getView().getModel("CustDetail").setProperty("/critial_incident", sSelectList);

			} else {
				this.setModel(new JSONModel(), "selectedIncidentList");
				this.ActivityId = "";
				var oArgs = oEvent.getParameter("arguments");
				this.getModel("UIconfigModel").setData({
					enabled: true
				});
				this.getModel("RequestorDetail").setData({});
				this.getModel("EscRequestDetail").setData({});
				this.getModel("CustDetail").setData({});
				this.getModel("SharedUsers").setData({
					"results": []
				});
				this.getModel("AffectedSolution").setData({
					"results": []
				});
				this.getModel("InvolvedPerson").setData({
					"results": []
				});
				var oParam = {
					parties_user_id: this.currentUserID
				};
				var oData = this.getPI(oParam);
				this.getModel("RequestorDetail").setData(oData[0] || {});

				if (oArgs.custnum !== undefined && oArgs.custnum !== false) {

					var oCustomerResult = this.getCustomer({
						customer_no: oArgs.custnum
					}); //[]
					if (oCustomerResult[0]) {
						this.getModel("CustDetail").setProperty("/customer_id", oCustomerResult[0].customer_id);
						this.getModel("CustDetail").setProperty("/customer_r3_no", oCustomerResult[0].customer_r3_no);
						this.getModel("CustDetail").setProperty("/customer_name", oCustomerResult[0].customer_name);
						this.getModel("CustDetail").setProperty("/customer_location", oCustomerResult[0].customer_location);
						this.getModel("CustDetail").setProperty("/country", oCustomerResult[0].country);
					}
				}
			}

		},
		_onRouteMatchedDetail: function (oEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}

			var aHistory = sap.ui.core.routing.History.getInstance().aHistory;
			var sPrevRoute = aHistory[aHistory.length - 1];
			var oDataSelectedIncd = [];
			var sSelectList = "";
			this.getView().getModel("GEViewModel").setProperty("/enableSaveDraftButton", true);
			if (sPrevRoute.indexOf("incidentList") === 0) {
				oDataSelectedIncd = this.getModel("selectedIncidentList").getProperty("/results");
				sSelectList = "";
				oDataSelectedIncd.forEach(function (x) {
					if (x.SNow_number) {
						sSelectList += x.SNow_number + "\n";
					}
				});

				this.getView().getModel("CustDetail").setProperty("/critial_incident", sSelectList);

			} else {
				this.getView().byId("escaReqCreate").setBusy(true);
				this.setModel(new JSONModel(), "selectedIncidentList");

				var oArgs = oEvent.getParameter("arguments");
				this.ActivityId = oArgs.activityid;
				var bEnabled = oArgs.editable === "true" ? true : false; /* === "true" || (oArgs.editable !== "false" oArgs.editable !== undefined));*/
				this.getModel("UIconfigModel").setData({
					enabled: bEnabled
				});
				this.getRequestDetail();

				//	this.getView().byId("shareEmailBtn").setVisible(false);
				this.getView().byId("saveEmailBtn").setVisible(true);
			}
		},
		getRequestDetail: function () {
			this.getView().byId("escaReqCreate").setBusy(true);
			this.getView().setBusy(true);
			var that = this;
			var activity_id = this.ActivityId;
			var success = "";
			var checkSharedUsersURL = this.env_PG_AGS_DASHBOARDS + "ActivityPartiesList?$filter=object_id%20eq%20'" + activity_id +
				"'%20and%20partner_no%20eq%20'" + this.currentUserID + "'";
			var loadActivityValues = this.env_PG_AGS_DASHBOARDS + "ActivityList('" + activity_id + "')";
			var loadEscalationValues = sap.support.fsc2.FSC2ModelUrl + "/" + "EscalationRequestSet('" + activity_id + "')";
			var loadNotesValues = this.env_PG_AGS_DASHBOARDS + "ActivityNotesList?$filter=activity_id%20eq%20'" + activity_id + "'";
			var loadInvolvedParties = this.env_PG_AGS_DASHBOARDS + "ActivityPartiesList?$filter=object_id%20eq%20'" + activity_id + "'";
			//	console.log("Check Shared Users of Escalation Activity (ZS31)");
			jQuery.ajax({
				async: false,
				url: checkSharedUsersURL,
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				type: "GET",
				dataType: "json",
				success: function (auth) {
					//	console.log("Escalation Request Shared Users Auth Check");
					auth = auth.d.results;
					//General Authorization Access
					if (auth.length !== 0) {
						success = 'X';
					} else {
						success = '';
						sap.m.MessageToast.show(
							"You are not maintained as a Shared User (Interested Party) and therefore not able to edit the data of the requested Escalation Request."
						);
					}
				}.bind(this),
				error: function () {
					sap.m.MessageToast.show("Error during Shared Users Authorizations Check");
				}.bind(this)
			});

			// Shared User Authorization Check was successful or Preview was requested -> Data needs to be loaded
			if (success === 'X') {
				jQuery.ajax({
					async: true,
					url: loadActivityValues,
					headers: {
						"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
					},
					type: "GET",
					dataType: "json",
					success: function (activity) {
						//	console.log("Load Activity Details");

						if (activity) {
							// Check if loaded Activity is in status DRAFT
							if (activity.d.activity_status !== 'E0015' && that.getModel("UIconfigModel").getProperty("/enabled")) {
								sap.m.MessageToast.show("The requested Activity is not in status DRAFT.");
								// Go directly to first page: General Information
								that.getRouter().navTo("escalationRequestStart", {
									layout: "OneColumn",
									custnum: false
								});
								return;
							} else {
								if (activity.d.activity_status === 'E0015') that.getView().getModel("GEViewModel").setProperty("/enableSaveDraftButton",
									true);
								else that.getView().getModel("GEViewModel").setProperty("/enableSaveDraftButton", false);
							}

							// Load General Activity Details
							activity_id = activity.d.activity_id;
							that.getModel("EscRequestDetail").setProperty("/activity_description", activity.d.activity_description);
							that.getModel("EscRequestDetail").setProperty("/main_reason", activity.d.activity_cat);

							// Load Customer Information
							var customer = {
								"customer_no": activity.d.activity_customer
							};
							var oCustomerResult = that.getCustomer(customer); //[]
							if (oCustomerResult[0]) {
								that.getModel("CustDetail").setProperty("/customer_id", oCustomerResult[0].customer_id);
								that.getModel("CustDetail").setProperty("/customer_r3_no", oCustomerResult[0].customer_r3_no);
								that.getModel("CustDetail").setProperty("/customer_name", oCustomerResult[0].customer_name);
								that.getModel("CustDetail").setProperty("/customer_location", oCustomerResult[0].customer_location);
								that.getModel("CustDetail").setProperty("/country", oCustomerResult[0].country);
							}
							// END: if check for activity
						}

						// Load the AET fields for Escalation Request Form
						jQuery.ajax({
							async: true,
							url: loadEscalationValues,
							headers: {
								"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
							},
							type: "GET",
							dataType: "json",
							success: function (escalation) {
								//console.log("Load Escalation Form Details");
								if (escalation) {
									// Load Escalation Form Details
									that.getModel("CustDetail").setProperty("/ref_customer", escalation.d.Zzfreferencecust);
									that.getModel("EscRequestDetail").setProperty("/business_impact", escalation.d.Zzfbizimpactcust);
									that.getModel("CustDetail").setProperty("/cust_landscape", escalation.d.Zzfcustlandscape);
									that.getModel("CustDetail").setProperty("/critial_incident", escalation.d.Zzfcriticalinc);
									that.getModel("EscRequestDetail").setProperty("/contract_volumn", escalation.d.Zzflicensevolume);
									that.getModel("EscRequestDetail").setProperty("/premium_engagement", escalation.d.Zzfmaintenagree);
									that.getModel("EscRequestDetail").setProperty("/affectedSolCust", escalation.d.Zzfbusinessarea);
									var affectedSolutions = escalation.d.Zzfaffectedsol;
									// Delete empty array element for further processing w.r.t. ITDirect 8005205125, Add Solutions not possible with Escalation Request in status Draft 
									var solutionsArrayUnfiltered = affectedSolutions.split("\n");
									var solutionsArray = solutionsArrayUnfiltered.filter(function (el) {
										return el !== "";
									});
									// Get current Solutions Array (3 solutions will have length of 2)
									var solutions = [],
										obj_solution = {}; //sap.ui.getCore().byId("oListAffectedSolutions").getModel().getData();
									solutionsArray.forEach(function (solutionName) {
										obj_solution = {};
										obj_solution.text = solutionName;
										solutions.push(obj_solution);
									});
									that.getModel("AffectedSolution").setProperty("/results", solutions);

									//load incident list add fill selected incident model based on values in property - Zzfcriticalinc.
									// use split("\n")
									var aSnowCases = escalation.d.Zzfcriticalinc.split("\n");
									var sSnowCasesFilter = "";
									if (aSnowCases.length > 0) {
										aSnowCases.forEach(sSnowCaseId => {
											if (sSnowCaseId.length > 0) {
												if (sSnowCasesFilter.length > 0) {
													sSnowCasesFilter = sSnowCasesFilter + "%5eORnumber=" + sSnowCaseId;
												} else {
													sSnowCasesFilter = sSnowCaseId;
												}
											}
										});

										var fnGetRegion = (region) => {
											var sRegion = "";
											switch (region) {
											case "NA":
												sRegion = "AMER";
												break;
											case "EMEA":
											case "MEE":
												sRegion = "EMEA";
												break;
											case "APJ":
											case "GTC":
												sRegion = "APJ";
												break;
											default:
												sRegion = region;
												break;
											}
											return sRegion;
										};

										var sCustNum = that.getModel("CustDetail").getProperty("/customer_r3_no");
										if (sCustNum && sCustNum.length < 10) {
											var sAlpha = "";
											for (var i = 0; i < 10 - sCustNum.length; i++) {
												sAlpha += "0";
											}
											sCustNum = sAlpha + sCustNum;

											var oParams = {
												"sysparm_fields": "u_ccs_service_request_id,sys_updated_on,number,correlation_display,sys_updated_by,escalation,sys_id,short_description,correlation_id,u_case_number,priority,state,account.number,account.name,account.country,account.u_region,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,u_app_component.u_short_description,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,u_deployed_item.u_environment,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,resolution_code,resolved_by,resolved_at,close_notes,u_deployed_item.u_data_center_region,u_deployed_item.u_data_center,u_last_user_updated_by,opened_at,closed_at,u_sold_item.u_sold_item_name,u_escalation_type,u_escalation_reason,active_escalation.opened_at,u_major_case_usage,u_last_user_updated_on,u_next_action_due,u_app_component.u_ps_portfolio,u_app_component.u_ps_product_family,u_app_component.u_ims_support_product,u_app_component.u_name,u_product_version_on_creation.name"
											};
											var sUrl = sap.support.fsc2.servicenowUrl +
												"?sysparm_query=u_responsible_party=sno%5enumber=" + sSnowCasesFilter +
												"%5epriority=1%5eORpriority=2%5estate=1%5eORstate=10%5eORstate=18%5e" + //ORstate=6
												"&account.number=" + sCustNum + "&sysparm_fields=" + oParams.sysparm_fields;

											$.ajax({
												method: "GET",
												// data: oDataService,
												headers: {
													"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
												},
												contentType: "application/json",
												url: sUrl,
												success: function (oData) {
													var sData = [];
													oData.result.forEach(function (x) {
														var addData = true;
														if (x.u_major_case_usage === "") { //if not a mjor case, can enhance request instead of hanlde on front end
															if (x.state === "3" && ((new Date() - new Date(x.sys_updated_on)) / (1000 * 3600 * 24)) > 60) {
																addData = false; // older than 2 months in final state
															}
															if (addData === true) {
																sData.push({
																	"id": x.correlation_id,
																	"SNow_number": x.number,
																	"desc": x.correlation_id + " " + formatter.SnowCaseStatusTxt(x.state),
																	//"ShortID": x.correlation_display,
																	//"Name": x["account.name"],
																	"component": x["u_app_component.u_name"] || "",
																	"title": x.short_description,
																	// "Priority": formatter.SnowCasePriorityTxt(x.priority),
																	"priority": x.priority,
																	// "Priority_sortby": (x.priority === "2") ? "3" : x.priority,
																	// "Update_sortby": formatter.formatDateTime7(x.sys_updated_on),
																	// "Status": formatter.SnowCaseStatusTxt(x.state),
																	// "Type": "FAVORITE_INCIDENTS",
																	"IncidentNum": x.correlation_id,
																	"Sys_ID": x.sys_id,
																	// "CIM_ID": x.u_ccs_service_request_id,
																	// "opened_at": x.opened_at,
																	// "business_impact": x.business_impact,
																	"Assignment_group": x["assignment_group.name"] || "",
																	"Last_updated_time": x.u_last_user_updated_on || "",
																	"Next_action_due_time": x.u_next_action_due || "",
																	"Assigned_to": x["assigned_to.name"],
																	"portfolio": x["u_app_component.u_ps_portfolio"] || "",
																	"productFamily": x["u_app_component.u_ps_product_family"] || "",
																	"imsSupportProduct": x["u_app_component.u_ims_support_product"] || "",
																	"system": x["u_product_version_on_creation.name"] || "",
																	"region": fnGetRegion(x["account.u_region"]) || "",
																	"p_formatter": x.number ? "snow" : "bcp"
																});
															}
														}
													});
													that.getModel("selectedIncidentList").setData({
														"results": sData
													});
												}.bind(this),
												error: function (a, b, c) {
													sap.m.MessageToast.show("Service now API Unavailable");
												}
											});
										}

									}

									that.getView().byId("escaReqCreate").setBusy(false);
									that.getView().setBusy(false);
								}

							}.bind(this),
							error: function () {
								sap.m.MessageToast.show("Error during Escalation Request Form Load");
								that.getView().byId("escaReqCreate").setBusy(false);
								that.getView().setBusy(false);
							}
						});

						// Load the Activity Notes
						jQuery.ajax({
							async: true,
							url: loadNotesValues,
							headers: {
								"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
							},
							type: "GET",
							dataType: "json",
							success: function (notes) {
								//console.log("Load Activity Notes");

								if (notes) {
									var data = notes.d.results;

									for (var i = 0; i < data.length; i++) {
										// Load Activity Notes
										that.getView().byId(data[i].notes_type).setValue(data[i].notes);
									}
									//END: if notes
								}
								that.getView().byId("escaReqCreate").setBusy(false);
								that.getView().setBusy(false);
							},
							error: function () {
								sap.m.MessageToast.show("Error during Activity Notes Load");
								that.getView().byId("escaReqCreate").setBusy(false);
								that.getView().setBusy(false);
							}
						});

						//Load Involved Parties
						jQuery.ajax({
							async: true,
							url: loadInvolvedParties,
							headers: {
								"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
							},
							type: "GET",
							dataType: "json",
							success: function (parties) {
								//console.log("Load Involved Persons");

								if (parties) {
									var data = parties.d.results;

									// Shared Users Array
									var oSharedUser = [];

									// Involved Persons Array
									var oInvolvedPerson = [];
									var obj_requetor = {};
									for (var i = 0; i < data.length; i++) {
										// Load Involved Persons Information
										var pi = [];
										pi.parties_bp_id = data[i].partner_no;

										var oPIResult = that.getPI(pi); //[]

										if (oPIResult && oPIResult !== "") {
											// Shared Users
											if (data[i].partner_fct === 'ZSCLAR02') {
												// Fill Users Array   
												var obj_user = {};
												obj_user.parties_user_id = oPIResult[0].parties_user_id;
												obj_user.parties_lastname = oPIResult[0].parties_lastname;
												obj_user.parties_firstname = oPIResult[0].parties_firstname;
												obj_user.parties_bp_id = oPIResult[0].parties_bp_id;
												// users.navigation[users.navigation.length - 1].userID = piResult.navigation[0].parties_user_id;
												// users.navigation[users.navigation.length - 1].lastName = piResult.navigation[0].lastName;
												// users.navigation[users.navigation.length - 1].firstName = piResult.navigation[0].firstName;
												// users.navigation[users.navigation.length - 1].bpid = piResult.navigation[0].parties_bp_id;
												oSharedUser.push(obj_user);
											}

											// Requestor
											if (data[i].partner_fct === 'ZSERR001') {
												obj_requetor = {};
												obj_requetor.parties_user_id = oPIResult[0].parties_user_id;
												obj_requetor.parties_bp_id = oPIResult[0].parties_bp_id;
												obj_requetor.parties_firstname = oPIResult[0].parties_firstname;
												obj_requetor.parties_lastname = oPIResult[0].parties_lastname;
												obj_requetor.parties_email = oPIResult[0].parties_email;
												obj_requetor.parties_mobile = oPIResult[0].parties_mobile;
												// Set Requestor for sending E-Mails
												// that.requestor = oPIResult[0].parties_user_id;
												that.requestorInit = oPIResult[0].parties_user_id;
												// that.getModel("RequestorDetail").setData();
												// that.getModel("RequestorDetail").setData(obj_requetor);
											}

											// Involved Persons
											if (data[i].partner_fct !== 'ZSERR001' && data[i].partner_fct !== 'ZSCLAR02' && data[i].partner_fct !== '00000009') {
												// Fill Involved Persons Array
												var obj_InvolvedPerson = {};
												obj_InvolvedPerson.parties_user_id = oPIResult[0].parties_user_id;
												obj_InvolvedPerson.parties_lastname = oPIResult[0].parties_lastname;
												obj_InvolvedPerson.parties_firstname = oPIResult[0].parties_firstname;
												obj_InvolvedPerson.role = data[i].partner_fct;
												obj_InvolvedPerson.parties_bp_id = oPIResult[0].parties_bp_id;
												oInvolvedPerson.push(obj_InvolvedPerson);

											}
											//END: Check Partner Functions
										}
										//END: for parties
									}

									// Set Shared Users Model
									that.getModel("SharedUsers").setProperty("/results", oSharedUser);
									// Set Involved Persons Model
									that.getModel("InvolvedPerson").setProperty("/results", oInvolvedPerson);
									that.getModel("RequestorDetail").setData();
									that.getModel("RequestorDetail").setData(obj_requetor);
									that.getView().byId("escaReqCreate").setBusy(false);
									that.getView().setBusy(false);
									//END: if parties
								}
							},
							error: function () {
								sap.m.MessageToast.show("Error during Involved Persons Load");
								that.getView().byId("escaReqCreate").setBusy(false);
								that.getView().setBusy(false);
							}
						});
					},
					error: function () {
						sap.m.MessageToast.show("Error during Activity Details Load");
						that.getView().byId("escaReqCreate").setBusy(false);
						that.getView().setBusy(false);
					}
				});
				//END: if Success    
			} else {
				that.getView().byId("escaReqCreate").setBusy(false);
				that.getView().setBusy(false);
			}
		},
		handleClose: function () {
			//when two columns are visible --> close second one, nav to first on fullscreen
			var prevTarget = this.getRouter()._oMatchedRoute._oConfig.target[0];
			var columnPages = this.getRouter().getTarget(prevTarget)._oOptions.controlAggregation;
			if (columnPages === "beginColumnPages") {
				var layout = "OneColumn";
			} else if (columnPages === "midColumnPages") {
				var layout = "MidColumnFullScreen";
			}
			this.getRouter().navTo(prevTarget, {
				layout: layout
			});
		},
		getRole: function () {
			this.getView().byId("escaReqCreate").setBusy(true);
			//sap.support.fsc2.DashBoardModel.read("/DropDownList", {
			sap.support.fsc2.FSC2Model.read("/DropDownSet", {
				filters: [
					new Filter("object_id", "EQ", "ZS31"),
					new Filter("element_id", "EQ", "PARTNER_FCT")
				],
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					this.getModel("RoleModel").setProperty("/results", oData.results);
					var oRoles = {};
					oData.results.forEach(function (oItem) {
						oRoles[oItem.value_key] = oItem.value_txt;
					});
					this.getModel("RoleModel").setProperty("/allRolesKey", oRoles);
					this.getView().byId("escaReqCreate").setBusy(false);
				}.bind(this),
				error: function () {
					this.getView().byId("escaReqCreate").setBusy(false);
					sap.m.MessageToast.show("Get error when load service ZS_AGS_DASHBOARDS_SRV");
				}
			});
		},

		getPI: function (pi) {
			var jsonData = [];
			var filter = "";
			var sFilterParam1 = "",
				sFilterParam2 = "";
			if (pi.parties_user_id !== undefined && pi.parties_user_id !== "")
				filter += "?$filter=parties_user_id%20eq%20%27" + pi.parties_user_id + "%27";

			if (pi.parties_bp_id !== undefined && pi.parties_bp_id !== "") {
				sFilterParam1 = "?$filter=parties_bp_id%20eq%20%27" + pi.parties_bp_id + "%27";
				sFilterParam2 = "and%20parties_bp_id%20eq%20%27" + pi.parties_bp_id + "%27";
				// filter += "?$filter=parties_bp_id%20eq%20%27" + pi.parties_bp_id + "%27";
				filter = filter === "" ? filter + sFilterParam1 : filter + sFilterParam2;
			}

			if (pi.parties_firstname !== undefined && pi.parties_firstname !== "") {
				// filter += "?$filter=parties_firstname%20eq%20%27" + pi.parties_firstname + "%27";
				sFilterParam1 = "?$filter=parties_firstname%20eq%20%27" + pi.parties_firstname + "%27";
				sFilterParam2 = "and%20parties_firstname%20eq%20%27" + pi.parties_firstname + "%27";
				filter = filter === "" ? filter + sFilterParam1 : filter + sFilterParam2;
			}
			if (pi.parties_lastname !== undefined && pi.parties_lastname !== "") {
				// Replace special characters, e.g. single quote (')
				pi.parties_lastname = pi.parties_lastname.replace("'", "%27%27");
				if (filter === "") {
					filter += "?$filter=parties_lastname%20eq%20%27" + pi.parties_lastname + "%27";
				} else {
					filter += "and%20parties_lastname%20eq%20%27" + pi.parties_lastname + "%27";
				}
			}
			var url_bp_information = sap.support.fsc2.FSC2ModelUrl + "/" + "PartiesSet" + filter + "&sap-language=en";
			jQuery.ajax({
				async: false,
				url: url_bp_information,
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				type: "get",
				dataType: "json",
				success: function (oData) {
					jsonData = oData.d.results;

				},
				error: function () {
					sap.m.MessageBox.show("Error loading Business Partner Information", {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Business Partner",
						actions: [sap.m.MessageBox.Action.OK]
					});
				}
			});
			return jsonData;
		},
		onClickAddUser: function () {
			this.contactSearchOpenBy = "sharedUser";
			this.onOpenBPSearchDialog();
		},
		onDeleteSharedUser: function (oEvent) {
			var aData = this.getModel("SharedUsers").getProperty("/results");
			aData.splice(0, 1);
			this.getModel("SharedUsers").setProperty("/results", aData);
		},
		onPerssBP: function (oEvent) {
			var obj = oEvent.getSource().getBindingContext("BPSearchResult").getObject();
			var aData = [];
			switch (this.contactSearchOpenBy) {
			case "sharedUser":
				aData = [];
				aData.push(obj);
				this.getModel("SharedUsers").setData({
					"results": aData
				});
				break;
			case "Requestor":
				this.getModel("RequestorDetail").setData(obj);
				break;
			case "InvolvedPerson":
				aData = this.getModel("InvolvedPerson").getProperty("/results");
				obj.role = "";
				aData.push(obj);
				this.getModel("InvolvedPerson").setProperty("/results", aData);
				break;
			}
			this._oBPSearchDialog.close();
		},
		onStartBpSearch: function () {
			var oDataCriteria = this.getModel("BPSearchCriteria").getData();
			var obj = {
				"parties_user_id": oDataCriteria.userID,
				"parties_firstname": oDataCriteria.firstName,
				"parties_lastname": oDataCriteria.lastName,
				"parties_bp_id": oDataCriteria.bpID
			};
			var oData = this.getPI(obj);
			this.getModel("BPSearchResult").setProperty("/results", oData);
		},
		onClearBpSearch: function () {
			this.getModel("BPSearchCriteria").setData({
				"userID": "",
				"lastName": "",
				"firstName": "",
				"bpID": ""
			});
			// var obj={
			// 	"parties_user_id":"",
			// 	"parties_firstname":"",
			// 	"parties_lastname":"",
			// 	"parties_bp_id":""
			// };
			// var oData=this.getPI(obj);
			this.getModel("BPSearchResult").setData({
				"results": []
			});
		},
		onCancelBpSearch: function () {
			this._oBPSearchDialog.close();
		},
		handleDelete: function (oEvent) {
			// var oTable = oEvent.getSource(),
			// oItem = oEvent.getParameter("listItem");
			// oTable.removeItem(oItem);
			this.getModel("SharedUsers").setData("/results", []);
		},
		onClickChangeRequestor: function () {
			this.contactSearchOpenBy = "Requestor";
			this.onOpenBPSearchDialog();
		},
		onOpenBPSearchDialog: function () {
			this.getModel("BPSearchCriteria").setData({
				"userID": "",
				"lastName": "",
				"firstName": "",
				"bpID": ""
			});
			var oParam = {
				parties_user_id: this.currentUserID
			};
			var oData = this.getPI(oParam) || [];
			this.getModel("BPSearchResult").setProperty("/results", oData);
			this._oBPSearchDialog.open();
		},
		onClickAddCust: function () {
			this.onClearCustSearch();
			this._oCustSearchDialog.open();
		},
		onClearCustSearch: function () {
			this.getModel("CustSearchResult").setProperty("/results", []);
			this.getModel("CustSearchCriteria").setData({
				"customer_no": "",
				"account_name": "",
				"partner": ""
			});
		},
		onStartCustSearch: function () {
			var oFilterData = this.getModel("CustSearchCriteria").getData();
			var oDataResult = this.getCustomer(oFilterData);
			this.getModel("CustSearchResult").setProperty("/results", oDataResult);
		},
		onCancelCustSearch: function () {
			this._oCustSearchDialog.close();
		},
		getCustomer: function (customer) {
			/*	var oFilter = [];
				var oDataResult = [];
				if (customer.customer_no) {
					oFilter.push(new Filter("Customer_No", "EQ", customer.customer_no));
				}
				if (customer.account_name) {
					oFilter.push(new Filter("Customer_Name", "EQ", customer.account_name));
				}
				if (customer.partner) {
					oFilter.push(new Filter("Customer_BP", "EQ", customer.partner));
				}
				if (oFilter.length === 0) {
					return oDataResult;
				}
				oFilter.push(new Filter("Accuracy", "EQ", "X"));
			sap.support.fsc2.FSC2Model.read("/CustomerInfoSet", {
					filters: oFilter,
					urlParameters:{
						async:false
					},
					success: function (oData) {
						oData.results.forEach(function (oItem) {
							oDataResult.push({
								"customer_r3_no": oItem.Customer_No,
								"customer_name": oItem.Customer_Name,
								"customer_id": oItem.Customer_BP,
								"customer_location": oItem.City_Name,//oItem.zip + ' ' + oItem.City_Name,
								"country": oItem.Country_Code 
							});
						});
					}.bind(this),
					error: function () {
						sap.m.MessageToast.show("Get error when load service ZS_ESCALATIONS");
					}
				});
				return oDataResult; */
			//

			var oDataResult = [];
			var filter = "";
			if (customer.customer_no) {
				filter += "?$filter=Customer_No%20eq%20%27" + customer.customer_no + "%27%20and%20Accuracy%20eq%20%27X%27";
			}
			if (customer.account_name) {
				if (filter === "") {
					filter += "?$filter=Customer_Name%20eq%20%27" + customer.account_name + "%27%20and%20Accuracy%20eq%20%27X%27";
				} else {
					filter += "and%20Customer_Name%20eq%20%27" + customer.account_name + "%27";
				}
			}
			if (customer.partner) {
				if (filter === "") {
					filter += "?$filter=Customer_BP%20eq%20%27" + customer.partner + "%27%20and%20Accuracy%20eq%20%27X%27";
				} else {
					filter += "and%20Customer_BP%20eq%20%27" + customer.partner + "%27";
				}
			}
			if (filter === "") {
				return oDataResult;
			}
			var url_customer_information = sap.support.fsc2.FSC2ModelUrl + "/CustomerInfoSet" + filter;

			jQuery.ajax({
				async: false,
				url: url_customer_information,
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				type: "get",
				dataType: "json",
				success: function (data) {
					var jsonData = data.d.results;
					var obj = {};
					for (var i = 0; i < jsonData.length; i++) {
						obj = {};
						obj.customer_r3_no = jsonData[i].Customer_No;
						obj.customer_name = jsonData[i].Customer_Name;
						obj.customer_id = jsonData[i].Customer_BP;
						obj.customer_location = jsonData[i].City_Name; //jsonData[i].zip + ' ' + jsonData[i].city;
						obj.country = jsonData[i].Country_Code;
						obj.global_ultimate_no = jsonData[i].Global_Ultimate_No;
						oDataResult.push(obj);
					}
				},

				error: function () {
					sap.m.MessageBox.show("Error loading Customer Information", {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Customer Information",
						actions: [sap.m.MessageBox.Action.OK]
					});
				}
			});
			return oDataResult;

		},
		onPerssCust: function (oEvent) {
			var obj = oEvent.getSource().getBindingContext("CustSearchResult").getObject();
			this.getModel("CustDetail").setData(obj);
			this.getView().byId("customer_id").fireLiveChange();
			this.onCancelCustSearch();
		},
		onClickAddInvPerson: function () {
			this.contactSearchOpenBy = "InvolvedPerson";
			this.onOpenBPSearchDialog();
		},
		handleDeleteInvPerson: function (oEvent) {
			var sIndex = oEvent.getParameter("listItem").getBindingContext("InvolvedPerson").getPath().split("/")[2];
			sIndex = parseInt(sIndex);
			var aData = this.getModel("InvolvedPerson").getProperty("/results");
			aData.splice(sIndex, 1);
			this.getModel("InvolvedPerson").setProperty("/results", aData);
		},
		onClickAddSol: function () {
			this._oSolSelecthDialog = new sap.ui.xmlfragment("Solution", "sap.support.fsc2.view.fragments.SolutionSelect", this);
			this.getView().addDependent(this._oSolSelecthDialog);
			this._oSolSelecthDialog.open();
		},
		onConfirmSol: function () {
			var SelectedSolutions = [],
				obj = {};
			var oAllItems = sap.ui.core.Fragment.byId("Solution", "allSolutionList").getItems();
			oAllItems.forEach(function (oItem) {
				if (oItem.getSelected()) {
					obj = oItem.getBindingContext("Solutions").getObject();
					SelectedSolutions.push(obj);
				}
			});
			this.getModel("AffectedSolution").setProperty("/results", SelectedSolutions);
			this.onCancelSol();
		},
		onCancelSol: function () {
			this._oSolSelecthDialog.close();
			this._oSolSelecthDialog.destroy();
		},
		handleDeleteSolution: function (oEvent) {
			var sIndex = oEvent.getParameter("listItem").getBindingContext("AffectedSolution").getPath().split("/")[2];
			sIndex = parseInt(sIndex);
			var aData = this.getModel("AffectedSolution").getProperty("/results");
			aData.splice(sIndex, 1);
			this.getModel("AffectedSolution").setProperty("/results", aData);
		},
		onClickSaveAsDraft: function () {
			var that = this;
			var sValue =
				"Saving the Escalation Request allows you to continue with your work later on.\n You will also find the saved Escalation Request" +
				"Form on the Start Page of the Application.\n \n Your updates will be saved in the already created CRM Activity of the type 'Escalation Request' in the system ICP (CRM@SAPSupport) as well.";
			MessageBox.information(sValue, {
				title: "Save as Draft",
				icon: "sap-icon://bookmark",
				actions: ["Save as Draft", "Cancel"],
				onClose: function (sAction) {
					if (sAction === "Save as Draft") {
						that.createActivity({
							"draftMode": "X"
						});
					}
				}
			});
		},
		onClickSaveAsEmail: function () {
			var that = this;
			var bHasShareUser = this.checkSharedUser();
			if (!bHasShareUser) {
				return;
			}
			// var bCompMad = this.checkMandatory();
			// if (!bCompMad) {
			// 	return;
			// }
			var sValue =
				"Saving the Global Escalation Request generates an E-Mail that should be sent to the Requestor for information. \n Please confirm that you would like to save the Escalation Request and send the generated E-Mail to the specified Requestor. \n \n" +
				"Please note: after saving your Escalation Request, you can only access the request through the link in the generated E-Mail! \n Your updates will be saved in the already created CRM Activity of the type 'Escalation Request' in the system ICP (CRM@SAPSupport) as well.";
			MessageBox.information(sValue, {
				title: "Save Global Escalation Request Form",
				icon: "sap-icon://save",
				actions: ["Save Escalation Request", "Cancel"],
				onClose: function (sAction) {
					if (sAction === "Save Escalation Request") {
						that.createActivity({
							"draftMode": "X",
							"saveAsEmail": "X"
						});
					}
				}
			});
		},
		checkSharedUser: function () {
			var bHasShareUser = false;
			var oUsers = this.getModel("SharedUsers").getProperty("/results");
			if (oUsers && oUsers.length > 0) {
				bHasShareUser = true;
				return bHasShareUser;
			}
			MessageBox.error("Please add one user to share with.", {
				title: "Share with one user",
				actions: [sap.m.MessageBox.Action.OK]
			});
			return bHasShareUser;
		},
		onClickSubmit: function () {
			var that = this;
			// this.Requestor = this.getModel("RequestorDetail").getProperty("/parties_user_id");
			if (this.ActivityId && this.requestorInit !== this.currentUserID) {
				MessageBox.error("Only the Requestor is allowed to Submit the Form");
				return;
			}
			var bCompMad = this.checkMandatory();
			if (!bCompMad) {
				return;
			}
			var sMsg =
				"Please click on 'Submit Global Escalation Request' to finally send your request to SAP Escalation. \n Please note that your request cannot be changed further after it has been submitted! \n \n Submitting the Escalation Request Form will send an email to SAP Escalation and create a CRM Activity of the type 'Escalation Request' in the system ICP (CRM@SAPSupport).";
			MessageBox.information(sMsg, {
				title: "Submit Global Escalation Request Form",
				actions: ["Submit Escalation Request", "Cancel"],
				onClose: function (sAction) {
					if (sAction === "Submit Escalation Request") {
						that.createActivity({
							"draftMode": ""
						});
					}
				}
			});
		},
		checkMandatory: function () {
			var oView = this.getView();
			var sMsg =
				"The following fields are mandatory:\n \n Customer BP ID: \n Customer Solution Landscape: \n Critical Open Incidents and Most Critical Tickets: \n Escalation Request Description: \n Affected Business Solutions at Customer: \n License Contract/Subscription Volume per Year: \n Maintenance Agreement/Premium Engagement: \n Detailed Reason for Escalation: \n Detailed Business Impact for Customer: \n Detailed Business Impact for SAP: \n ";
			var bCompMad = true;
			var oDataCustDetail = this.getModel("CustDetail").getData();
			var oDataEscReqDetail = this.getModel("EscRequestDetail").getData();
			bCompMad = bCompMad && (typeof oDataCustDetail.customer_id !== 'undefined' && oDataCustDetail.customer_id.length > 0) && (typeof oDataCustDetail
				.cust_landscape !== 'undefined' && oDataCustDetail.cust_landscape.length > 0) && (typeof oDataCustDetail.critial_incident !==
				'undefined' && oDataCustDetail.critial_incident
				.length > 0);
			bCompMad = bCompMad && oDataEscReqDetail.activity_description.length > 0 && oDataEscReqDetail.affectedSolCust.length > 0 &&
				oDataEscReqDetail.contract_volumn.length > 0 &&
				oDataEscReqDetail.premium_engagement.length > 0 && oDataEscReqDetail.detail_reason.length > 0 && oDataEscReqDetail.detail_BI_customer
				.length > 0 &&
				oDataEscReqDetail.detail_BI_sap.length > 0;
			var oIDs = ["customer_id", "cust_landscape", "activity_description", "affectedSolCust", "contract_volumn",
				"premium_engagement", "ZU01", "ZU02", "ZU03"
			];
			if (!bCompMad) {
				oIDs.forEach(function (x) {
					oView.byId(x).fireLiveChange();
				});
				MessageBox.error(sMsg, {
					title: "Please Fill all mandatory fields"
				});
			}
			return bCompMad;
		},
		_validateMandatoryInput: function (oInput) {
			var oCtrl = oInput.getSource();
			var sValue = oCtrl.getValue();
			if (!sValue) {
				oCtrl.setValueState("Error");
				oCtrl.setValueStateText("Mandatory field");
			} else {
				oCtrl.setValueState("None");
				oCtrl.setValueStateText();
			}
		},
		//Create Activity (also used for updateActivity)
		createActivity: function (oParam) {
			var oView = this.getView();
			this.getView().setBusy(true);
			var that = this;
			var oData_EscRequest = this.getModel("EscRequestDetail").getData();
			var oData_CustDetail = this.getModel("CustDetail").getData();
			var oData_AffectedSotion = this.getModel("AffectedSolution").getData();
			var oData_RequestorDetail = this.getModel("RequestorDetail").getData();
			var draftMode = oParam.draftMode;
			var activity_id = this.ActivityId;
			this.requestor = oData_RequestorDetail.parties_user_id; //parties_bp_id;
			var requestor = this.requestor;
			var sUrl = this.env_PG_AGS_DASHBOARDS;

			var affectedSolutions = "";
			oData_AffectedSotion.results.forEach(function (oItem) {
				affectedSolutions += oItem.text + "\n";
			});
			var sActivityList = "",
				sEscalationRequestSet = "",
				sActivityNotesList = "",
				sActivityPartiesList = "";
			// Check if Activity only needs to be updated
			if (activity_id) {
				// Activity and Escalation Set -> UPDATE
				sActivityList = sUrl + "ActivityList('" + activity_id + "')";
				sEscalationRequestSet = sap.support.fsc2.FSC2ModelUrl + "/" + "EscalationRequestSet('" + activity_id + "')";
			} else {
				// Activity and Escalation Set -> CREATE
				sActivityList = sUrl + "ActivityList";
				sEscalationRequestSet = sap.support.fsc2.FSC2ModelUrl + "/" + "EscalationRequestSet";
			}
			// Notes and Parties -> CREATE
			sActivityNotesList = sUrl + "ActivityNotesList";
			sActivityPartiesList = sUrl + "ActivityPartiesList";

			// Model Definition
			var oModel = new sap.ui.model.odata.ODataModel(sUrl, {
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				loadMetadataAsync: true
			});
			sap.ui.getCore().setModel(oModel);
			oModel.refreshSecurityToken();
			var oModelHeaders = oModel.getHeaders();

			var oHeaders = new Object();
			if (that.ActivityId) {
				oHeaders = {
					"x-csrf-token": oModelHeaders['x-csrf-token'],
					"Content-Type": "application/json; charset=utf-8",
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO", //API Management: ID for MCC SOS App
					"x-http-method": "MERGE"
				};
			} else {
				oHeaders = {
					"x-csrf-token": oModelHeaders['x-csrf-token'],
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO", //API Management: ID for MCC SOS App
					"Content-Type": "application/json; charset=utf-8"
				};
			}
			//Check Draft Mode
			var status = "";
			if (draftMode === "X") {
				status = "E0015";
			} else {
				status = "E0010";
				draftMode = '';
			}
			//-------------------------------------------------------------------------------------------------------------------------------------------------------

			var oEntity_ActivityList = {
				activity_process_type: "ZS31",
				activity_description: oData_EscRequest.activity_description,
				activity_status: status,
				activity_customer: oData_CustDetail.customer_id,
				activity_cat: oView.byId("mainReason").getSelectedKey() //oData_EscRequest.main_reason
			};

			jQuery.ajax({
				async: false,
				url: sActivityList,
				type: "POST",
				dataType: "json",
				headers: oHeaders,
				data: JSON.stringify(oEntity_ActivityList),
				success: function (data) {
					var activity_number = "";
					if (!activity_id) {
						activity_number = data.d.activity_id;
					} else {
						activity_number = activity_id;
					}
					//EscalationRequestSet Service
					var oEntity_EscReqSet = {
						activity_id: activity_number,
						Zzfreferencecust: oView.byId("RefCust").getSelectedKey(), //oData_CustDetail.ref_customer,
						Zzfbizimpactcust: oView.byId("businessImpact").getSelectedKey(), //oData_EscRequest.business_impact,
						Zzfcustlandscape: oData_CustDetail.cust_landscape,
						Zzfcriticalinc: oData_CustDetail.critial_incident,
						Zzfaffectedsol: affectedSolutions,
						Zzflicensevolume: oData_EscRequest.contract_volumn,
						Zzfmaintenagree: oData_EscRequest.premium_engagement,
						Zzfbusinessarea: oData_EscRequest.affectedSolCust
					};

					jQuery.ajax({
						async: false,
						url: sEscalationRequestSet,
						type: "POST",
						dataType: "json",
						headers: oHeaders,
						data: JSON.stringify(oEntity_EscReqSet),
						success: function (dataEscReq) {
							// Special Case: Create Functionality for Notes and Parties                       
							if (that.ActivityId) {
								// Changed Model Definition
								var oModel2 = new sap.ui.model.odata.ODataModel(sUrl, {
									headers: {
										"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
									},
									loadMetadataAsync: true
								});
								sap.ui.getCore().setModel(oModel2);
								oModel2.refreshSecurityToken();
								oModelHeaders = oModel2.getHeaders();
								oHeaders = {
									"x-csrf-token": oModelHeaders['x-csrf-token'],
									"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO", //API Management: ID for MCC SOS App
									"Content-Type": "application/json; charset=utf-8"
								};
							}
							var notesArray = that.notesArray;
							for (var i = 0; i < notesArray.length; i++) {
								var notesValue = that.getView().byId(notesArray[i]).getValue();
								if (notesValue) {
									//Update Activity Notes
									var oEntityActNotes = {
										activity_id: activity_number,
										process_type: 'ZS31',
										notes_type: notesArray[i],
										notes: notesValue
									};
									jQuery.ajax({
										async: false,
										url: sActivityNotesList,
										type: "POST",
										dataType: "json",
										headers: oHeaders,
										data: JSON.stringify(oEntityActNotes),
										success: function (dataNotes) {},
										error: function () {
											sap.m.MessageBox.show("Error during Notes Update", {
												icon: sap.m.MessageBox.Icon.ERROR,
												title: "Notes Update",
												actions: [sap.m.MessageBox.Action.OK]
											});
										},
									});
								}
							}

							//-----------------------------------------------------------------------------------------------------------------------------------------
							//--- Involved Persons / Shared Users Part ------------------------------------------------------------------------------------------------
							//-----------------------------------------------------------------------------------------------------------------------------------------
							var oData_InvolvedPerson = that.getModel("InvolvedPerson").getProperty("/results");
							if (oData_InvolvedPerson && oData_InvolvedPerson.length > 0) {
								for (var i = 0; i < oData_InvolvedPerson.length; i++) {

									//Update Activity Involved Persons
									var oEntity_ActivityParties = {
										object_id: activity_number,
										partner_no: oData_InvolvedPerson[i].parties_bp_id,
										partner_fct: oData_InvolvedPerson[i].role,
									}

									jQuery.ajax({
										async: false,
										url: sActivityPartiesList,
										type: "POST",
										dataType: "json",
										headers: oHeaders,
										data: JSON.stringify(oEntity_ActivityParties),
										success: function (dataParties) {},
										error: function () {
											sap.m.MessageBox.show("Error during Involved Persons Update", {
												icon: sap.m.MessageBox.Icon.ERROR,
												title: "Involved Persons Update",
												actions: [sap.m.MessageBox.Action.OK]
											});
										},
									});

								} //End: for-Loop Parties
							} //End: if partiesModel
							var oData_sharedUser = that.getModel("SharedUsers").getProperty("/results");
							if (oData_sharedUser && oData_sharedUser.length > 0) {
								for (var i = 0; i < oData_sharedUser.length; i++) {
									//Update Activity Shared Users
									var oEntity_SharedUsr = {
										object_id: activity_number,
										partner_no: oData_sharedUser[i].parties_bp_id,
										partner_fct: 'ZSCLAR02',
									};

									jQuery.ajax({
										async: false,
										url: sActivityPartiesList,
										type: "POST",
										dataType: "json",
										headers: oHeaders,
										data: JSON.stringify(oEntity_SharedUsr),
										success: function (dataUsers) {
											console.log("Escalation Request Shared Users Data");
										},
										error: function () {
											sap.m.MessageBox.show("Error during Shared Users Update", {
												icon: sap.m.MessageBox.Icon.ERROR,
												title: "Shared Users Update",
												actions: [sap.m.MessageBox.Action.OK]
											});
										},
									});
								} //End: for-Loop Users

								activity_id = activity_number;
							} //End: if usersModel
							if (requestor) {
								//Update Activity Requestor
								var oEntityRequestor = {
									object_id: activity_number,
									partner_no: oData_RequestorDetail.parties_bp_id,
									partner_fct: 'ZSERR001',
								};
								jQuery.ajax({
									async: false,
									url: sActivityPartiesList,
									type: "POST",
									dataType: "json",
									headers: oHeaders,
									data: JSON.stringify(oEntityRequestor),
									success: function (dataUsers) {
										console.log("Escalation Request Requestor Data");
									},
									error: function () {
										sap.m.MessageBox.show("Error during Requestor Update", {
											icon: sap.m.MessageBox.Icon.ERROR,
											title: "Requestor Update",
											actions: [sap.m.MessageBox.Action.OK]
										});
									}
								});
							}
							//-----------------------------------------------------------------------------------------------------------------------------------------

							if (that.ActivityId) {
								// sap.m.MessageBox.success("Escalation Request Activity with ID " + activity_number + " updated successfully.", {
								// 	title: "Update Escalation Request",
								// 	actions: [sap.m.MessageBox.Action.OK]
								// });
								//Set Activity ID for Usage within E-Mail
								activity_id = activity_number;
							} else {
								// sap.m.MessageBox.success("Escalation Request Activity with ID " + activity_id + " created successfully.", {
								// 	title: "Create Escalation Request",
								// 	actions: [sap.m.MessageBox.Action.OK],
								// });
								//Set Activity ID for Usage within E-Mail
								activity_id = dataEscReq.d.activity_id; //that.ActivityId ? that.ActivityId : dataEscReq.d.activity_id;
							}
							var sAccessUrl = that.getCurrentUrl();

							// to trigger event
							that.onQueueButtonPress("ESCALATION", null, oData_CustDetail, null, activity_id, null);

							if (draftMode === 'X' && !oParam.saveAsEmail && !oParam.shareAsEmail) { //click button --save as draft
								// var sEscDetailUrl = window.location;
								MessageBox.information(
									"Escalation Request Activity saved as Draft in system ICP (CRM@SAPSupport).\n\nThe following link was generated:\n\n " +
									sAccessUrl + activity_id + "&editable=true \n\nClick on OK to continue to work.", {
										title: "Continue to Work",
										onClose: function (oAction) {
											that.getRouter().navTo("escalationRequestStart", {
												layout: "OneColumn",
												custnum: false
											});
										}
									}
								);
							} else if (draftMode === 'X' && oParam.saveAsEmail === "X") { //click button --save request by email
								that.afterSaveEMail(activity_id);
							} else if (draftMode === 'X' && oParam.shareAsEmail === "X") { //click button --share request by email
								that.afterShareEMail(activity_id);
							} else { //submit request 
								MessageBox.information("An Escalation Request with the ID " + activity_id +
									" has been submitted to SAP Escalation. All submitted details are available in the referring Escalation Request Activity.", {
										icon: sap.m.MessageBox.Icon.INFORMATION,
										title: "Escalation Request submitted to SAP Escalation",
										actions: [sap.m.MessageBox.Action.OK],
										onClose: function () {
											/*var sRequestUrl = "h" + "ttps://" + sap.support.fsc2.BackendHost2 +
												"/sap(bD1lbiZjPTAwMSZkPW1pbg==)/bc/bsp/sap/crm_ui_start/default.htm?crm-object-type=BT126_APPT&crm-object-action=B&crm-object-keyname=OBJECT_ID&crm-object-value=" +
												activity_id; //0000385344
											window.open(sRequestUrl); removed due to mobile usage*/
											that.getRouter().navTo("dashboard", {
												layout: "OneColumn"
											});
										}
									});
							}

						}, //end: Success EscalationRequest creation
						error: function (oError) {
							sap.m.MessageBox.show("Error during Escalation Request Creation", {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Escalation Request Creation",
								actions: [sap.m.MessageBox.Action.OK]
							});

							// sap.ui.getCore().byId("EscalationRequestFormApp").to("GeneralInformation");
						}
					});
					that.getView().setBusy(false);
				},
				error: function (oError) {
					that.getView().setBusy(false);
					sap.m.MessageBox.show("Error during Activity Creation", {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Activity Creation",
						actions: [sap.m.MessageBox.Action.OK]
					});

					sap.ui.getCore().byId("EscalationRequestFormApp").to("GeneralInformation");
				}

			}); //END: Create Escalation Request
		},
		// sendMails: function (draftMode, activityId) {
		// 	var that = this;
		// 	if (draftMode === 'X' && this.ActivityId) {
		// 		this.clickSaveEMail(activityId);
		// 	} else if (draftMode === 'X' && !this.ActivityId) {
		// 		this.clickShareEMail(activityId);
		// 	} else if (draftMode !== 'X' && this.requestor === this.currentUserID) {
		// 		//D050657: Disabled to open user's Outlook. E-Mail will be send in back-end system to Escalation Request inbox.
		// 		sap.m.MessageBox.show("An Escalation Request with the ID " + activityId +
		// 			" has been submitted to SAP Escalation. All submitted details are available in the referring Escalation Request Activity.", {
		// 				icon: sap.m.MessageBox.Icon.INFORMATION,
		// 				title: "Escalation Request submitted to SAP Escalation",
		// 				actions: [sap.m.MessageBox.Action.OK],
		// 				onClose: function () {
		// 					that.getRouter().navTo("homepage");
		// 				}
		// 			});
		// 	}
		// },
		getCurrentUrl: function () {
			var sHost = location.host;
			var sUrl = "https://";
			var sSystem = "";
			if (sHost.indexOf("br339jmc4c") !== -1) { //Dev or Dev fiorilaunchpad
				sSystem = "mccsos-br339jmc4c.dispatcher.int.sap.eu2";
			} else if (sHost.indexOf("sapitcloudt") !== -1) { //Demo or Test or Test fiorilaunchpad
				sSystem = "mccsos-sapitcloudt.dispatcher";
			} else { //P or P fiorilaunchpad
				sSystem = "mccsos-sapitcloud.dispatcher";
			}
			sUrl = sUrl + sSystem + ".hana.ondemand.com#/escalationRequestDetail/MidColumnFullScreen/";
			return sUrl;
		},
		//Share Functionality
		afterShareEMail: function (activityId) {
			var that = this;
			// Get Shared Users of Request
			var activity_id = activityId;
			var data = this.getModel("SharedUsers").getData();
			var subject = "[CONFIDENTIAL] Shared Escalation Request with ID: " + activity_id;
			var ccAddress = "";
			if (this.requestor) {
				ccAddress = this.requestor;
			}
			var shareEmailText = new Object();
			var sAccessUrl = this.getCurrentUrl();
			shareEmailText =
				"Dear colleague,\n\n Please be informed that an Escalation Request has been created with status 'Draft' which needs further processing from your side." +
				"\n\n To access the Escalation Request please use the link below. Please review/adjust the content of the Escalation Request and click 'Submit' to finalize the Escalation Request and send it to SAP Escalation." +
				"\n\n Link to UI5 App: " + sAccessUrl + activity_id + "&editable=true " +
				"\n\n As soon as the Escalation Request will be submitted it will be handled according to the Mission Critical Support process definition." +
				"\n\n\n\n------------------------------------------------------------------------------------------------------------------\n" +
				"DISCLAIMER: This document is confidential and should only be used internally.\n" +
				"------------------------------------------------------------------------------------------------------------------";

			var recipients = "";

			for (var i = 0; i < data.results.length; i++)
				recipients = recipients + data.results[i].parties_user_id + '; ';

			sap.m.URLHelper.triggerEmail(recipients, subject, shareEmailText, ccAddress);
			that.getRouter().navTo("escalationRequestStart", {
				layout: "OneColumn",
				custnum: false
			});
		},

		afterSaveEMail: function (activityId) {
			var that = this;
			var activity_id = activityId;
			var requestor = this.requestor;
			var subject = "[CONFIDENTIAL] Escalation Request with ID: " + activity_id + " was updated.";

			// Get the Requestor of the Escalation Request Form
			var toAddress = "";
			if (requestor) {
				toAddress = requestor;
			}
			var ccAddress = this.currentUserID;
			var saveEmailText = new Object();
			var sAccessUrl = this.getCurrentUrl();
			saveEmailText = "Dear colleague,\n\n Please be informed that the Escalation Request with ID " + activity_id +
				" ( where you have been set as the Requestor ) has been updated and needs further processing from your side." +
				"\n\n To access the Escalation Request please use the link below. Please review/adjust the content of the Escalation Request and click 'Submit' to finalize the Escalation Request and send it to SAP Escalation." +
				"\n\n Link to UI5 App: " + sAccessUrl + "activityid=" + activity_id + "&editable=true" +
				"\n\n As soon as the Escalation Request will be submitted it will be handled according to the Mission Critical Support process definition." +
				"\n\n\n\n------------------------------------------------------------------------------------------------------------------\n" +
				"DISCLAIMER: This document is confidential and should only be used internally.\n" +
				"------------------------------------------------------------------------------------------------------------------";

			that.getRouter().navTo("escalationRequestStart", {
				layout: "OneColumn",
				custnum: false
			});
			sap.m.URLHelper.triggerEmail(toAddress, subject, saveEmailText, ccAddress);

		},
		formatSolutionSelect: function (sText) {
			// this.aSolutions=[];
			var oSolution = this.getModel("AffectedSolution").getProperty("/results");
			var bSelected = false;
			if (!oSolution) {
				return bSelected;
			}
			oSolution.forEach(function (oItem) {
				if (oItem.text === sText) {
					bSelected = true;
				}
			});
			return bSelected;
		},
		//integrate all content to html content
		gotoSolutionsLastCheck: function (oEvent) {
			//Mandatory Fields Check Array
			var checkArray = new Array();

			//Get values of models for Summary
			// _view.oController.getValuesOfModels();

			//Initialize the global texts
			this.generalText = '';
			this.solutionText = '';
			this.disclaimerText = '';

			//General Information Panel
			if (activity_id != "")
				this.generalText += '<div><h3>General Information for Activity ' + activity_id + ':</h3><p></p></div>';
			else
				this.generalText += '<h3>General Information:</h3><p></p>';

			for (var propertyName in _view.fieldsGeneral) {
				if (_view.fieldsGeneral[propertyName].mProperties.text != undefined) {
					this.generalText += _view.fieldsGeneral[propertyName].mProperties.text + ' ';
				}

				//Special handling for DDLB values: Reference Customer
				if (propertyName == 'tfCustomerReference') {
					var valueArray = new Array();
					valueArray = sap.ui.getCore().byId("referenceCustomerDDLB").getItems();
					var selectedKey = "";
					selectedKey = sap.ui.getCore().byId("referenceCustomerDDLB").mProperties.selectedKey;

					for (var i = 0; i < valueArray.length; i++) {
						if (valueArray[i].mProperties.key == selectedKey) {
							//Mandatory Check
							if (valueArray[i].mProperties.text == "") {
								//checkArray.push(valueArray[i].mProperties.text);
								checkArray.push(_view.fieldsGeneral[propertyName].sId);
							}

							this.generalText += '<strong>' + valueArray[i].mProperties.text + '</strong><p></p>';
						}
					}
				} else {
					if (_view.fieldsGeneral[propertyName].mProperties.value != undefined) {

						//Mandatory Check
						if (_view.fieldsGeneral[propertyName].mProperties.value == "") {
							checkArray.push(_view.fieldsGeneral[propertyName].sId);
						}
						this.generalText += '<strong>' + _view.fieldsGeneral[propertyName].mProperties.value + '</strong><p></p>';
					}
				}
			}

			//Solutions Information Panel
			this.solutionText += '<h3>Solutions Information:</h3><p></p>';

			//-------------------------------------------------------------------------------------------------------------------------------------------------------
			//--- Affected Solutions --------------------------------------------------------------------------------------------------------------------------------
			//-------------------------------------------------------------------------------------------------------------------------------------------------------
			this.affectedSolutionsHTML = '';
			this.affectedSolutions = '';

			// Get Solutions Model
			this.solutionModel = sap.ui.getCore().byId("oListAffectedSolutions").getModel().getData();

			if (this.solutionModel != undefined) {
				if (this.solutionModel.navigation.length == 1) {
					this.affectedSolutions = this.solutionModel.navigation[0].solutionName;
					this.affectedSolutionsHTML = this.solutionModel.navigation[0].solutionName;
				}
				if (this.solutionModel.navigation.length > 1) {
					for (var i = 0; i < this.solutionModel.navigation.length; i++) {
						this.affectedSolutions = this.affectedSolutions + this.solutionModel.navigation[i].solutionName + "\n";
						this.affectedSolutionsHTML = this.affectedSolutionsHTML + this.solutionModel.navigation[i].solutionName + "<p></p>";
					}
				}

				this.solutionText += '<strong>Affected Solutions:</strong><p> ' + this.affectedSolutionsHTML + '</p>';

				//D050657 - 25.02.2019: If solutions are not modified after an external call an error will occur w.r.t. 8005571485, Escalation Request App
				affectedSolutions = this.affectedSolutions;

			}
			//-------------------------------------------------------------------------------------------------------------------------------------------------------           
			//--- Details -------------------------------------------------------------------------------------------------------------------------------------------
			//-------------------------------------------------------------------------------------------------------------------------------------------------------

			//this.solutionText+= '<strong>Details:</strong><p> ';

			for (var propertyName in _view.fieldsGeneralSolutions) {
				if (_view.fieldsGeneralSolutions[propertyName].mProperties.text != undefined) {
					this.solutionText += _view.fieldsGeneralSolutions[propertyName].mProperties.text + ' ';
				}

				//Special handling for DDLB values: Main Reason for Escalation / Business Impact for Customer
				if (propertyName == 'tfPrimaryReason' || propertyName == 'tfImpactCustomer') {
					var valueArray = new Array();
					var selectedKey = "";

					//Main Reason for Escalation
					if (propertyName == 'tfPrimaryReason') {
						valueArray = sap.ui.getCore().byId("mainReason").getItems();
						selectedKey = sap.ui.getCore().byId("mainReason").mProperties.selectedKey;
					}
					//Business Impact for Customer
					if (propertyName == 'tfImpactCustomer') {
						valueArray = sap.ui.getCore().byId("customerImpact").getItems();
						selectedKey = sap.ui.getCore().byId("customerImpact").mProperties.selectedKey;
					}

					for (var i = 0; i < valueArray.length; i++) {
						if (valueArray[i].mProperties.key == selectedKey) {
							//Mandatory Check
							if (valueArray[i].mProperties.text == "") {
								//checkArray.push(valueArray[i].mProperties.text);
								checkArray.push(_view.fieldsGeneralSolutions[propertyName].sId);
							}

							this.solutionText += '<strong>' + valueArray[i].mProperties.text + '</strong><p></p>';
						}
					}
				} else {
					if (_view.fieldsGeneralSolutions[propertyName].mProperties.value != undefined) {
						//Mandatory Check
						if (_view.fieldsGeneralSolutions[propertyName].mProperties.value == "") {
							checkArray.push(_view.fieldsGeneralSolutions[propertyName].sId);
						}

						if (_view.fieldsGeneralSolutions[propertyName].mProperties.value.length > '300')
							this.solutionText += '</br><strong>' + _view.fieldsGeneralSolutions[propertyName].mProperties.value + '</strong><p></p>';
						else
							this.solutionText += '<strong>' + _view.fieldsGeneralSolutions[propertyName].mProperties.value + '</strong><p></p>';
					}
				}

			}
			//-------------------------------------------------------------------------------------------------------------------------------------------------------           
			//--- Involved Persons  ----------------------------------------------------------------------------------------------------------------------------------
			//-------------------------------------------------------------------------------------------------------------------------------------------------------                       
			this.solutionText += '<strong>Involved Persons:</strong><p> ';

			if (partiesModel != undefined && partiesModel != "") {
				var valueArray = new Array();
				valueArray = sap.ui.getCore().byId("piType").getItems();
				var selectedKey = "";

				for (var i = 0; i < partiesModel.navigation.length; i++) {
					selectedKey = partiesModel.navigation[i].role;
					var partnerRole = "";

					for (var j = 0; j < valueArray.length; j++) {
						if (valueArray[j].mProperties.key == selectedKey)
							partnerRole = valueArray[j].mProperties.text;
					}

					if (partnerRole == "")
						partnerRole = "No Role Selected";

					this.solutionText += partnerRole + ': <strong>' + partiesModel.navigation[i].firstName + ' ' + partiesModel.navigation[i].lastName +
						'</strong> with BP ID: ' + partiesModel.navigation[i].bpid + '</p><p>';
				}
			}

			//Disclaimer for Preview Screen (Summary)
			this.disclaimerText +=
				'<p></p><p></p>---------------------------------------------------------------------------------------------------------------------<br>';
			this.disclaimerText += 'DISCLAIMER: This document is confidential and should only be used internally.<br>';
			this.disclaimerText +=
				'---------------------------------------------------------------------------------------------------------------------';

			if (checkArray.length != '0') {
				var mandatoryInformation = "";

				for (var i = 0; i < checkArray.length; i++) {
					//Maintain the fields that should be check as mandatory fields
					if (checkArray[i] == "customerBPId" || checkArray[i] == "customerCriticalIncidents" || checkArray[i] == "requestDescription" ||
						checkArray[i] == "businessArea" || checkArray[i] == "premiumEngagement" || checkArray[i] == "contractVolume" || checkArray[i] ==
						"customerSolutionLandscape" || checkArray[i] == "ZU01" || checkArray[i] == "ZU02" || checkArray[i] == "ZU03") {
						mandatoryInformation += sap.ui.getCore().byId('l' + checkArray[i]).mProperties.text + '\n';
					}
				}

				if (mandatoryInformation == "") {
					//Go to last check page
					sap.ui.getCore().byId("EscalationRequestFormApp").to("SolutionsLastCheck");
					//Set the information to the Summary Panel
					sap.ui.getCore().byId("generalInformation").setHtmlText('<div id="test" style="max-width:300px;">' + this.generalText);
					sap.ui.getCore().byId("solutionInformation").setHtmlText(this.solutionText);
					sap.ui.getCore().byId("disclaimer").setHtmlText(this.disclaimerText + '</div>');
				} else {
					sap.m.MessageBox.show("The following fields are mandatory:\n\n" + mandatoryInformation, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Please fill all mandatory fields",
						actions: [sap.m.MessageBox.Action.OK]
					});
				}
				//END: checkArray length
			} else {
				//Go to last check page
				sap.ui.getCore().byId("EscalationRequestFormApp").to("SolutionsLastCheck");
				//Set the information to the Summary Panel
				sap.ui.getCore().byId("generalInformation").setHtmlText('<div id="test" style="max-width:300px;">' + this.generalText);
				sap.ui.getCore().byId("solutionInformation").setHtmlText(this.solutionText);
				sap.ui.getCore().byId("disclaimer").setHtmlText(this.disclaimerText + '</div>');
			}
		},
		onPrint: function () {
			/*	
        	*no need for this anymore
            var bCompMad = this.checkMandatory();
			if (!bCompMad) {
				return;
			}*/
			var sHtmlText = this.getPreview();
			var printWindow = window.open('', 'Global Escalation Request Form - Print View', 'height=800,width=800');
			printWindow.document.write('<html><head><title>Global Escalation Request Form - Print View</title>');
			printWindow.document.write('<link rel="stylesheet" href="EscalationRequest/EscalationRequestForm.css" type="text/css" />');
			printWindow.document.write('</head><body>');
			printWindow.document.write('<div class="dialogBox">');
			printWindow.document.write(sHtmlText);
			printWindow.document.write('</div>');
			printWindow.document.write('</body></html>');
			printWindow.document.close(); // necessary for IE >= 10
			printWindow.focus(); // necessary for IE >= 10
			printWindow.print();
			printWindow.close();
			return true;
		},
		getPreview: function () {
			var sHtmlText = "";
			var disclaimerText =
				"<p></p><p></p>---------------------------------------------------------------------------------------------------------------------<br>DISCLAIMER: This document is confidential and should only be used internally.<br>---------------------------------------------------------------------------------------------------------------------";
			var generalText = "";
			var solutionText = "";
			var oData_InvPsn = this.getModel("InvolvedPerson").getProperty("/results");
			var oData_EscRequest = this.getModel("EscRequestDetail").getData();
			var oData_CustDetail = this.getModel("CustDetail").getData();
			var oData_AffectedSotion = this.getModel("AffectedSolution").getProperty("/results");
			var oData_RequestorDetail = this.getModel("RequestorDetail").getData();
			var oData_allRoles = this.getModel("RoleModel").getProperty("/allRolesKey");
			//start general----------------------------------------------------------
			if (this.ActivityId === "") {
				generalText = "<div id=" + oData_EscRequest.activity_description + "><div><h3>General Information:</h3><p></p></div>";
			} else {
				generalText = "<div id=" + oData_EscRequest.activity_description + "><div><h3>General Information for Activity " + this.ActivityId +
					":</h3><p></p></div>";
			}
			// requestor detail
			generalText += "Requestor User ID:<strong>" + oData_RequestorDetail.parties_user_id + "</strong><p></p>";
			generalText += "Requestor BP ID: <strong>" + oData_RequestorDetail.parties_bp_id + "</strong><p></p>";
			generalText += "Requestor Name: <strong>" + oData_RequestorDetail.parties_firstname + " " + oData_RequestorDetail.parties_lastname +
				"</strong><p></p>";
			generalText += "E-Mail: <strong>" + oData_RequestorDetail.parties_email + "</strong><p></p>";
			generalText += "Mobile Phone No.: <strong>" + oData_RequestorDetail.parties_mobile + "</strong><p></p>";
			generalText += "Customer BP ID: <strong>" + (oData_CustDetail.customer_id || "") + "</strong><p></p>";
			generalText += "ERP Customer No.: <strong>" + (oData_CustDetail.customer_r3_no || "") + "</strong><p></p>";
			generalText += "Customer Name: <strong>" + (oData_CustDetail.customer_name || "") + "</strong><p></p>";
			generalText += "Address: <strong>" + (oData_CustDetail.customer_location || "") + "</strong><p></p>";
			generalText += "Country: <strong>" + (oData_CustDetail.country || "") + "</strong><p></p>";
			var sRefCustText = this.getView().byId("RefCust").getSelectedItem().getText();
			generalText += "Reference Customer: <strong>" + sRefCustText + "</strong><p></p>";
			generalText += "Customer Solution Landscape: <strong>" + (oData_CustDetail.cust_landscape || "") + "</strong><p></p>";
			generalText += "Critical Open Incidents and Most Critical Tickets: <strong>" + (oData_CustDetail.critial_incident || "") +
				"</strong><p></p></div>";
			//end General------------------------------------------------------------
			//Solution information---------------------------------------------------
			solutionText = "<h3>Solutions Information:</h3><p></p>" + "<strong>Affected Solutions:</strong><p>";
			oData_AffectedSotion.forEach(function (obj) {
				solutionText += obj.text + "<p></p>";
			});
			solutionText += "</p>";

			solutionText += "Escalation Request Description: <strong>" + (oData_EscRequest.activity_description || "") + "</strong><p></p>";
			solutionText += "Affected Business Solutions at Customer: <strong>" + (oData_EscRequest.affectedSolCust || "") +
				"</strong><p></p>";
			solutionText += "License Contract/Subscription Volume per Year: <strong>" + (oData_EscRequest.contract_volumn || "") +
				"</strong><p></p>";
			solutionText += "Maintenance Agreement/Premium Engagement: <strong>" + (oData_EscRequest.premium_engagement || "") +
				"</strong><p></p>";
			var sMainReason = this.getView().byId("mainReason").getSelectedItem().getText();
			solutionText += "Main Reason for Escalation: <strong>" + sMainReason + "</strong><p></p>";
			var sBusinessImpact = this.getView().byId("businessImpact").getSelectedItem().getText();
			solutionText += "Business Impact For Customer: <strong>" + sBusinessImpact + "</strong><p></p>";
			solutionText += "Detailed Reason for Escalation: <strong>" + (oData_EscRequest.detail_reason || "") + "</strong><p></p>";
			solutionText += "Detailed Business Impact for Customer: <strong>" + (oData_EscRequest.detail_BI_customer || "") +
				"</strong><p></p>";
			solutionText += "Detailed Business Impact for SAP: <strong>" + (oData_EscRequest.detail_BI_sap || "") + "</strong><p></p>";
			solutionText += "Miscellaneous Information: <strong>" + (oData_EscRequest.mis_info || "") + "</strong><p></p>";

			solutionText += "<strong>Involved Persons:</strong>";
			oData_InvPsn.forEach(function (obj) {
				solutionText += "<p> " + oData_allRoles[obj.role] + ": <strong>" + obj.parties_firstname + " " + obj.parties_lastname +
					"</strong> with BP ID: " + obj.parties_bp_id + "</p>";
			});
			solutionText += "<p></p>";
			//end Solution-----------------------------------------------------------
			sHtmlText = generalText + solutionText + disclaimerText;
			return sHtmlText;
		},
		handleValueHelp_PreumEng: function () {
			if (!this._PreumValueHelpDialog) {
				this._PreumValueHelpDialog = new sap.ui.xmlfragment("PreumEngValueHelp", "sap.support.fsc2.view.fragments.PreumEngValueHelp",
					this);
				this.getView().addDependent(this._PreumValueHelpDialog);
			}
			this._PreumValueHelpDialog.open();
		},
		_handleConfirm_PreumEng: function (oEvent) {
			var oSelectedText = oEvent.getSource().getTitle();
			this.getModel("EscRequestDetail").setProperty("/premium_engagement", oSelectedText);
			this._handleClose_PreumEng();
		},
		_handleClose_PreumEng: function () {
			this._PreumValueHelpDialog.close();
		},

		onAddIncidentImpact_GER: function (oEvent) {
			var sCustomerId = this.getModel("CustDetail").getProperty("/customer_r3_no");
			if (sCustomerId.length > 0) {
				this.getRouter().navTo("incidentList", {
					layout: "MidColumnFullScreen",
					custnum: sCustomerId
				});
			}
		}

	});

});