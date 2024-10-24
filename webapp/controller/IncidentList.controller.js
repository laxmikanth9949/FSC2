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

	return BaseController.extend("sap.support.fsc2.controller.IncidentList", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.support.fsc2.view.IncidentList
		 */
		formatter: formatter,
		onInit: function () {
			this.setModel(new JSONModel(), "IncidentbyCust");
			this.getRouter().getRoute("incidentList").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("incidentListEnd").attachPatternMatched(this._onRouteMatched, this);
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
			var oArgs = oEvent.getParameter("arguments");
			var sURLCustomerNo = oArgs.custnum;
			this.getModel("IncidentbyCust").setData({
				"BCIncident": {
					results: [],
					loadComplete: true
				},
				"SnowCase": {
					results: [],
					loadComplete: false
				},
				"Incident": {
					results: [],
					loadComplete: false
				}
			});
			this.getView().setBusy(true);
			this.setModels();
			this._loadCustomerIncident(sURLCustomerNo);
			this._loadCustomerSnowCase(sURLCustomerNo);
		},
		//refresh page cause lose of model dependency from criticalCriticalSituation, we check for model and set if needed
		setModels: function () {
			if (!this.getModel("createCriticalSituation")) {
				this.setModel(new JSONModel(), "createCriticalSituation");
			}
			if (!this.getModel("incidentList")) {
				this.setModel(new JSONModel(), "incidentList");
			}
		},
		_loadCustomerIncident: function (sCustomerNo) {
			sCustomerNo = (Array(10).join("0") + sCustomerNo).slice(-10);
			var aFilter = [new Filter("Description", "EQ", "searchbycustomer")];
			aFilter.push(new Filter("CustomerNo", "EQ", sCustomerNo));
			aFilter.push(new Filter("Priority", "EQ", "1"));
			aFilter.push(new Filter("Priority", "EQ", "3"));
			sap.support.fsc2.IncidentModel.read("/IncidentList", {
				filters: aFilter,
				urlParameters: {
					"$orderby": "Priority asc"
				},
				success: function (oDataInit) {

					var oData = {
						"results": []
					};
					oData.results = oDataInit.results.filter(function (oItem) {
						return oItem.ActiveSystem !== "SNO";
					});
					var aData = oData.results;
					var aResults = [];
					for (var i = 0; i < aData.length; i++) {
						aResults.push({
							"ID": aData[i].CssObjectID,
							"Title": aData[i].ObjectID + "/" + aData[i].MessageYear + " " + aData[i].StatusTxt,
							"ShortID": aData[i].ObjectID + "/" + aData[i].MessageYear,
							"Name": aData[i].CustomerName,
							"ComponentName": aData[i].ComponentName,
							"Description": aData[i].Description,
							"Priority": aData[i].PriorityTxt,
							"PriorityKey": aData[i].Priority,
							"Priority_sortby": aData[i].Priority,
							"Update_sortby": formatter.formatDateTime9(oData.results[i].ChangedAt),
							"Status": aData[i].StatusTxt,
							"Type": "FAVORITE_INCIDENTS",
							"IncidentNum": aData[i].CssObjectID,
							"Sys_ID": "",
							"CIM_ID": aData[i].CIM_ID
						});
					}
					var obj = {
						results: aResults,
						loadComplete: true
					};
					this.getModel("IncidentbyCust").setProperty("/BCIncident", obj);
					this.loadDataByCustComplete();
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
				}.bind(this)
			});
			// }
		},
		_loadCustomerSnowCase: function (sCustomerNo) {
			var that = this;
			var sLen = sCustomerNo.length;
			var sNum = 10 - sLen;
			for (var i = 0; i < sNum; i++) {
				sCustomerNo = "0" + sCustomerNo;
			}
			var sEnableSnowCase = this.getModel("EnableSnowCase").getProperty("/bEnable");
			if (!sEnableSnowCase) {
				this.getModel("IncidentbyCust").setProperty("/SnowCase", {
					"loadComplete": true,
					"results": []
				});
				that.loadDataByCustComplete();
				return;
			}
			var oDataService = {
				"account.number": sCustomerNo,
				"sysparm_fields": "u_ccs_service_request_id,sys_updated_on,number,correlation_display,sys_updated_by,escalation,sys_id,short_description,correlation_id,u_case_number,priority,state,account.number,account.name,account.country,account.u_region,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,u_app_component.u_short_description,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,u_deployed_item.u_environment,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,resolution_code,resolved_by,resolved_at,close_notes,u_deployed_item.u_data_center_region,u_deployed_item.u_data_center,u_last_user_updated_by,opened_at,closed_at,u_sold_item.u_sold_item_name,u_escalation_type,u_escalation_reason,active_escalation.opened_at,u_major_case_usage,u_last_user_updated_on,u_next_action_due,u_app_component.u_ps_portfolio,u_app_component.u_ps_product_family,u_app_component.u_ims_support_product,u_app_component.u_name,u_app_component.u_functional_area_description"
			};
			var sUrl = sap.support.fsc2.servicenowUrl +
				"?sysparm_query=priority=1%5eORpriority=2%5estate=1%5eORstate=10%5eORstate=18%5e" + //ORstate=6
				"&account.number=" +
				sCustomerNo + "&sysparm_fields=" + oDataService.sysparm_fields;

			var fnGetRegion = (region) => {
				var sRegion = "";
				switch (region) {
				case "NA":
					sRegion = "AMER";
					break;
				// case "EMEA":
				// case "MEE":
				// 	sRegion = "EMEA";
				// 	break;
				// case "APJ":
				case "GTC":
					sRegion = "APJ";
					break;
				default:
					sRegion = region;
					break;
				}
				return sRegion;
			};

			$.ajax({
				method: "GET",
				// data: oDataService,
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
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
									"ID": x.correlation_id,
									"SNow_number": x.number,
									"Title": x.correlation_id + " " + formatter.SnowCaseStatusTxt(x.state),
									"ShortID": x.correlation_display,
									"Name": x["account.name"],
									"ComponentName": x["u_app_component.u_name"],
									"Description": x.short_description,
									"Priority": formatter.SnowCasePriorityTxt(x.priority),
									"PriorityKey": x.priority,
									"Priority_sortby": (x.priority === "2") ? "3" : x.priority,
									"Update_sortby": formatter.formatDateTime7(x.sys_updated_on),
									"Status": formatter.SnowCaseStatusTxt(x.state),
									"Type": "FAVORITE_INCIDENTS",
									"IncidentNum": x.correlation_id,
									"Sys_ID": x.sys_id,
									"CIM_ID": x.u_ccs_service_request_id,
									"opened_at": x.opened_at,
									"business_impact": x.business_impact,
									"Assignment_group": x["assignment_group.name"],
									"Last_updated_time": x.u_last_user_updated_on,
									"Next_action_due_time": x.u_next_action_due,
									"Assigned_to": x["assigned_to.name"],
									"portfolio": x["u_app_component.u_ps_portfolio"],
									"productFamily": x["u_app_component.u_ps_product_family"],
									"imsSupportProduct": x["u_app_component.u_ims_support_product"],
									"functionalArea": x["u_app_component.u_functional_area_description"],
									"region": fnGetRegion(x["account.u_region"])
								});
							}
						}
					});
					this.getModel("IncidentbyCust").setProperty("/SnowCase", {
						"loadComplete": true,
						"results": sData
					});
					that.loadDataByCustComplete();
				}.bind(this),
				error: function (a, b, c) {
					sap.m.MessageToast.show("Service now API Unavailable");
				}
			});
		},
		loadDataByCustComplete: function () {
			var that = this;
			var sDataBCIncident = this.getModel("IncidentbyCust").getProperty("/BCIncident");
			var sDataSnowCase = this.getModel("IncidentbyCust").getProperty("/SnowCase");
			if (sDataBCIncident.loadComplete && sDataSnowCase.loadComplete) {
				this.getView().setBusy(false);
				var sCount = sDataBCIncident.results.length + sDataSnowCase.results.length;
				var aResults = sDataSnowCase.results.concat(sDataBCIncident.results);
				aResults.sort(function (a, b) {
					var bSorter = parseInt(a.Priority_sortby) - parseInt(b.Priority_sortby);
					if (bSorter !== 0) {
						return bSorter;
					} else {
						bSorter = b.Update_sortby - a.Update_sortby;
						return bSorter;
					}
				});
				this.getModel("createCriticalSituation").setProperty("/IncidentTitle", this.getResourceBundle().getText("incidentTitle") + "(" +
					sCount + ")");
				this.getModel("incidentList").setSizeLimit(1000);
				this.getModel("incidentList").setData({
					"results": aResults
				});
				if (aResults.length === 0) {
					sap.m.MessageToast.show(this.getResourceBundle().getText("noDataIncidentList"));
				}
			} else {
				setTimeout(function () {
					that.loadDataByCustComplete();
				}, 200);
			}

		},
		handleIncidentSearch: function (oEvent) {
			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [];
			if (sValue && sValue.length > 0) {
				aFilters.push(new Filter("Title", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new Filter("Priority", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new Filter("SNow_number", sap.ui.model.FilterOperator.Contains, sValue));
				oFilter = [
					new sap.ui.model.Filter(aFilters, false)
				];
			}
			this.getView().byId("idIncidentList").getBinding("items").filter(oFilter);
		},
		onIncidentItemPress: function (oEvent) {
			var oObject = oEvent.getSource().getBindingContext("incidentList").getObject();
			var sIncidentNum = oObject.SNow_number ? oObject.SNow_number : oObject.ID;
			this.getRouter().navTo("incidentEnd", {
				layout: "EndColumnFullScreen",
				id: sIncidentNum,
				flag: true,
				sam: false
			});
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
		onSelectIncident: function (oEvent) {
			this.eventUsage(false, "Select Relevant Incidents on Creation UI");
			//check for open escalation record
			if (oEvent.getParameter("selected") === true) {
				var oIncident = oEvent.getParameter("listItem").getBindingContext("incidentList").getObject();
				if (!oIncident.Sys_ID) {
					var oDataService = {
						"correlation_id": oIncident.IncidentNum,
						"sysparm_fields": "sys_id"
					};
					var sUrl = sap.support.fsc2.servicenowUrl;
					$.ajax({
						method: "GET",
						data: oDataService,
						headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
						contentType: "application/json",
						url: sUrl,
						success: function (oData) {
							if (oData.result && oData.result[0]) {
								this.checkForOpenEscalation(oData.result[0].sys_id);
							}
						}.bind(this),
						error: function (a, b, c) {
							sap.m.MessageToast.show("Service now API Unavailable");
						}
					});
				} else {
					this.checkForOpenEscalation(oIncident.Sys_ID);
				}

				// this.checkForOpenEscalation(oIncident.IncidentNum);
				// put the other shite here too

				if(oIncident.SNow_number && oIncident.SNow_number.trim().length > 0) {
					this.checkSam(oIncident.Description, oIncident.IncidentNum);
				}
			}

			var oList = oEvent.getSource();
			var oLabel = this.byId("idFilterLabel");
			var oInfoToolbar = this.byId("idInfoToolbar");

			// With the 'getSelectedContexts' function you can access the context paths
			// of all list items that have been selected, regardless of any current
			// filter on the aggregation binding.
			var aContexts = oList.getSelectedContexts(true);

			// update UI
			var bSelected = (aContexts && aContexts.length > 0);
			var sText = (bSelected) ? aContexts.length + " selected" : null;
			oInfoToolbar.setVisible(bSelected);
			oLabel.setText(sText);
			// this.getView().setBusy(true);
			var selectedIncidentData = {
				"bFlag": false,
				/******comment: Check the item is selected or unselected.If true, list item is selected.If false, it's unselected******/
				"currentSelected": {},
				/******comment: Current selected items ******/
				"allSelected": { /******comment: all selected items including selected previously and cancelled items ******/
					"results": []
				}
			};
			var oListItem = oEvent.getParameter("listItem");
			var sCurrentSelectedPath = oListItem.getBindingContextPath();
			var sCurrentSelectedIncident = this.getModel("incidentList").getProperty(sCurrentSelectedPath);
			selectedIncidentData.currentSelected = sCurrentSelectedIncident;
			// var aAllSelectedItems = oEvent.getSource().getSelectedItems();
			var aAllSelectedItems = oEvent.getSource().getSelectedContexts(true);
			aAllSelectedItems.forEach(function (i) {
				// var obj = i.getBindingContext("incidentList").getObject();
				var obj = i.getObject();
				if (obj.SNow_number) {
					selectedIncidentData.allSelected.results.push({
						"id": obj.ID,
						"title": obj.Description,
						"desc": obj.Title,
						"priority": obj.PriorityKey,
						"Status": obj.Status,
						"IncidentNum": obj.IncidentNum,
						"Sys_ID": obj.Sys_ID,
						"SNow_number": obj.SNow_number,
						"Assigned_to": obj.Assigned_to,
						"Assignment_group": obj.Assignment_group,
						"Last_updated_time": obj.Last_updated_time,
						"Next_action_due_time": obj.Next_action_due_time,
						"portfolio": obj.portfolio,
						"productFamily": obj.productFamily,
						"imsSupportProduct": obj.imsSupportProduct,
						"functionalArea": obj.functionalArea,
						"region": obj.region,
						"component": obj.ComponentName,
						"p_formatter": "snow"
					});
				} else {
					selectedIncidentData.allSelected.results.push({
						"id": obj.ID,
						"title": obj.Description,
						"desc": obj.Title,
						"priority": obj.PriorityKey,
						"Status": obj.Status,
						"IncidentNum": obj.IncidentNum,
						"Sys_ID": obj.Sys_ID,
						"Assigned_to": obj.Assigned_to,
						"Assignment_group": obj.Assignment_group || "",
						"Last_updated_time": obj.Last_updated_time || "",
						"Next_action_due_time": obj.Next_action_due_time || "",
						"portfolio": obj.portfolio || "",
						"productFamily": obj.productFamily || "",
						"imsSupportProduct": obj.imsSupportProduct || "",
						"functionalArea": obj.functionalArea || "",
						"region": obj.region || "",
						"component": obj.ComponentName || "",
						"p_formatter": "bcp"
					});
				}
			}.bind(this));
			this.getModel("selectedIncidentList").setData();
			this.getModel("selectedIncidentList").setData(selectedIncidentData.allSelected);
			/******comment: 
			Check if the currently selected or cancelled item is in "allSelected" list. 
			If false, load the business impact of the item through the method "loadInicidentLongText" in "CreateCriticalSituationN" page. 
			If true, update the business impact of all seleted items through the method "_updateBusinessImpact" in "CreateCriticalSituationN" page.
			******/
			if (this.getModel("createCriticalSituation").getData() && this.getModel("createCriticalSituation").getData().BusinessImpact && !
				this.getModel("createCriticalSituation").getData().BusinessImpact.hasOwnProperty(sCurrentSelectedIncident.ID)) {
				if (oEvent.getParameter("selected")) {
					selectedIncidentData.bFlag = false;
					this.getEventBus().publish("Create", "loadInicidentLongText", selectedIncidentData);
				}
			} else {
				if (oEvent.getParameter("selected")) {
					selectedIncidentData.bFlag = false;
				} else {
					selectedIncidentData.bFlag = true;
				}
				this.getEventBus().publish("Create", "_updateBusinessImpact", selectedIncidentData);
			}
			// this.getView().setBusy(false);
		},
		checkForOpenEscalation: function (sValue) {
			this.getView().setBusy(true);
			var oDataService = {
				// "u_bcp_correlation_id": sValue,
				"source_record": sValue,
				"sysparm_fields": "sys_id,state,u_escalation_type" //sys_created_on,sys_class_name,u_escalation_type,number,assigned_to.name,u_request,short_description,u_expected_action,requested_by.name,u_business_impact
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
							if (oData.result[i].state === "100" || oData.result[i].state === "101") { //Client side check, check in network request for state
								var obj = oData.result[i];
								MessageBox.confirm("A ServiceNow escalation record already exists for this incident, would you like to view it?", {
									onClose: function (oAction) {
										this.getView().setBusy(false);
										if (oAction === "OK") {
											this.getRouter().navTo("requestDetailEnd", {
												layout: "EndColumnFullScreen",
												id: obj["sys_id"],
												transType: "sn_customerservice_escalation"
											});
										}
										// else {
										// 	if(oData.results[i].u_escalation_type === "0" && oData.result[i].state === "101"){
										// 		//deseltct entry
										// 	}
										// }
									}.bind(this)
								});
								break;
							}
						}
					}
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
				}.bind(this)
			});
		},
		handleIncidentClose: function (oEvent) {
			var selectedIncidentData = {
				"bFlag": true,
				/******comment: Check the item is selected or unselected.If true, list item is selected.If false, it's unselected******/
				"currentSelected": {},
				/******comment: Current selected items ******/
				"allSelected": { /******comment: all selected items including selected previously and cancelled items ******/
					"results": []
				}
			};
			this.getView().byId("idIncidentList").removeSelections();
			this.getModel("createCriticalSituation").setProperty("/BusinessImpact", {
				"Text": ""
			});
			this.getModel("selectedIncidentList").setData();
			this.getModel("selectedIncidentList").setData(selectedIncidentData.allSelected);
			this.getEventBus().publish("Create", "_updateBusinessImpact", selectedIncidentData);
			this.onNavBack();
		},
		/**
		 * @param {string} sIncidentNum 
		 * @param {number} [attempt=1] 
		 */

		checkSam: function (sDescription, sIncidentNum, attempt) {
			if (attempt === 3) {
				sap.m.MessageToast.show("ChannelCheckSet service unavailable");
				return true;
			}
			attempt = attempt || 1;

			var serviceUrl = attempt === 1 ? sap.ui.require.toUrl("sap/support/fsc2") + "/w71/odata/incidentws/" : sap.ui.require.toUrl("sap/support/fsc2") + "/w72/odata/incidentws/"
			var oDataI7P = new ODataModel(serviceUrl, {
				json: true,
				useBatch: false
			});

			oDataI7P.attachMetadataFailed(null, () => {
				this.checkSam(sDescription, sIncidentNum, ++attempt);
			}, this);

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
					success: function (oResponse) {
						if (oResponse.results.length > 0) {
							var sActive = oResponse.results[0].Active;

							if (sActive === "A") {
								sap.m.MessageBox.information(
									"It is possible to schedule a 15 minutes call with a Product Support Manager from the related product area for this incident. How would you like to proceed?", {
										actions: ["Schedule a Manager", "Request MCC Support"],
										title: sDescription,
										onClose: function (oAction) {
											if (oAction === "Schedule a Manager") {
												this.getRouter().navTo("SaM", {
													layout: "TwoColumnsMidExpanded",
													"incident": sIncidentNum,
													"earea": "MCC"
												});
											}
										}.bind(this)
									});
							}
						}
					}.bind(this),
					error: function (error) {
						sap.m.MessageToast.show("ChannelCheckSet service unavailable");
					}.bind(this)
				});
			});
		},

		handleSaveSelect: function () {
			var that = this;
			var selectedItems = this.getView().byId("idIncidentList").getSelectedItems();
			if (selectedItems.length !== 1) {
				this.onNavBack();
				return;
			}
			var sCIM = "";
			sCIM = selectedItems[0].getBindingContext("incidentList").getObject().CIM_ID;
			if (sCIM) {
				sap.m.MessageBox.information("A CIM request already exists for selected incident, please update it.", {
					title: "Information", // default
					onClose: function () {
						that.getRouter().navTo("requestDetail", {
							id: sCIM
						});
					}
				});
				return;
			}
			this.onNavBack();
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf sap.support.fsc2.view.IncidentList
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf sap.support.fsc2.view.IncidentList
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf sap.support.fsc2.view.IncidentList
		 */
		//	onExit: function() {
		//
		//	}

	});

});