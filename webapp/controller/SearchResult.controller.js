/*global history*/
sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/formatter',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/ui/model/Filter',
	'sap/support/fsc2/model/models'
], function (BaseController, formatter, JSONModel, ODataModel, Filter, models) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.SearchResult", {
		formatter: formatter,
		onInit: function () {
			this.setModel(new JSONModel(), "searchResult");
			this.SearchDescription = "";
			this.oCategory = {
				"ALL": "ALL"
			};
			this.setModel(new JSONModel(), "history");
			this.setModel(new JSONModel(), "suggestion");
			this.bSelectItem = false;
			this.getRouter().getRoute("search").attachPatternMatched(this._onRouteMatched, this);
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
		},
		_updateSearchData: function (searchValue, description) {
			this.getModel("searchResult").setData({
				"Customer": {
					"count": "0",
					"expanded": false,
					"results": []
				},
				"Situation": {
					"count": "0",
					"expanded": false,
					"results": []
				},
				"BcIncident": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				},
				"SnowCase": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				},
				"SnowEscalation": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				},
				"Incident": {
					"count": "0",
					"expanded": false,
					"results": []
				}
			});
			var oTabBar = this.getView().byId("idSearchTab");
			//	var oArgs = oEvent.getParameter("arguments");
			//	var sValue = decodeURIComponent(oArgs.value); // atob(oArgs.value);
			//	this.sSearchValue = sValue;
			//	var sDescription = oArgs.description;
			var sValue = searchValue;
			this.sSearchValue = searchValue;
			var sDescription = description;
			switch (sDescription) {
			case "searchCustomer":
				this.eventUsage(false, "Search customer");
				oTabBar.setSelectedKey("keyCustomer");
				this.loadCustomerData(sValue);
				break;
			case "searchSituation":
				this.eventUsage(false, "Search critical situation");
				oTabBar.setSelectedKey("keySituation");
				this.loadSituationData(sValue);
				break;
			case "searchIncident":
				this.eventUsage(false, "Search incident");
				oTabBar.setSelectedKey("keyIncident");
				this.loadIncidentData(sValue);
				this.loadSnowCaseData(sValue);
				break;
			default:
				oTabBar.setSelectedKey("keyCustomer");
				this.loadCustomerData(sValue);
				this.loadSituationData(sValue);
				this.loadIncidentData(sValue);
				this.loadSnowCaseData(sValue);
				break;
			}
		},
		loadCustomerData: function (sValue) {
			var that = this;
			var oList = this.getView().byId("idCustomer");
			oList.setBusy(true);
			var oFilter = new Filter("Search_Content", "EQ", sValue);
			sap.support.fsc2.FSC2Model.read("/CustomerInfoSet", {
				filters: [oFilter],
				success: function (oData) {
					oList.setBusy(false);
					var aData = oData.results;
					var aResults = [];
					for (var i = 0; i < aData.length; i++) {
						aResults.push({
							"ID": aData[i].Customer_No,
							"CustomerNo": aData[i].Customer_No,
							"CustomerName": aData[i].Customer_Name,
							"Action": aData[i].Is_Favorite,
							"Field": aData[i].Favorite_Field,
							"Type": "FAVORITE_CUSTOMERS"
						});
					}
					that.getModel("searchResult").setProperty("/Customer", {
						"results": aResults,
						"count": aResults.length,
						"expanded": aResults.length ? true : false
					});
				},
				error: function (err) {
					oList.setBusy(false);
					sap.m.MessageToast.show("CustomerInfoSet Service Unavailable!");
				}
			});
		},
		loadSituationData: function (sValue) {
			var that = this;
			var oList = this.getView().byId("idSituation");
			oList.setBusy(true);
			var iCallCount = 0;
			var reg = /^[0-9]*$/; // number check
			var aMCCFilter = [];
			var aCIMFilter = [];
			if (reg.test(sValue)) {
				aMCCFilter.push(new Filter("activity_id", "EQ", sValue));
				aCIMFilter.push(new Filter("object_id", "EQ", sValue));
			} else {
				aMCCFilter.push(new Filter({
					filters: [
						new Filter("type", "EQ", "B"),
						new Filter("activity_description", "EQ", sValue)
					],
					and: true
				}));
				aCIMFilter.push(new Filter({
					filters: [
						new Filter("type", "EQ", "B"),
						new Filter("description", "EQ", sValue)
					],
					and: true
				}));
			}
			sap.support.fsc2.FSC2Model.read("/FSC2ActivitySet", {
				filters: aMCCFilter,
				success: function (oData) {
					iCallCount++;
					if (iCallCount === 2) {
						oList.setBusy(false);
					}
					var aData = oData.results;
					var aOldData = that.getModel("searchResult").getProperty("/Situation/results") || [];
					for (var i = 0; i < aData.length; i++) {
						aOldData.push({
							"ID": aData[i].activity_id,
							"Name": aData[i].account_name_F,
							"CustomerNo": aData[i].activity_customer,
							"Description": aData[i].activity_description,
							"Status": aData[i].activity_status_desc,
							"Action": aData[i].is_favorite,
							"Field": aData[i].favorite_field,
							"Type": that.formatter.formatCriticalTansType(aData[i].activity_process_type),
							"TransType": aData[i].activity_process_type
						});
					}
					that.getModel("searchResult").setProperty("/Situation", {
						"results": aOldData,
						"count": aOldData.length,
						"expanded": aOldData.length ? true : false
					});
					this.loadSnowEscalationData(sValue);
				}.bind(this),
				error: function (err) {
					iCallCount++;
					if (iCallCount === 2) {
						oList.setBusy(false);
					}
					sap.m.MessageToast.show("FAC2MCCSet Service Unavailable!");
				}.bind(this)
			});
			
		},
		loadIncidentData: function (sValue) {
			var that = this;
			var oList = this.getView().byId("idIncident");
			oList.setBusy(true);
			this.readSuccess = 0;
			this.aIncidentResult = [];
			var aFilter = [];
			var reg = /^[0-9]*$/; // number check
			if (sValue.substr(0, 2) === "CS") {
				that.getModel("searchResult").setProperty("/BcIncident", {
					"results": [],
					"count": 0,
					"expanded": false,
					"loadComplete": true
				});
				that.IncidentLoadComplete();
			} else if (sValue.length === 24) {
				if (reg.test(sValue)) {
					aFilter.push(new Filter("CssObjectID", "EQ", sValue));
				}
				this.readIncidentList(aFilter, 1);
			} else {
				sValue = sValue.replace(/\s*/g, ""); //remove blanks
				var sObjectID = sValue.split("/")[0];
				var sYear = sValue.split("/")[1];
				if (sYear && !reg.test(sYear) || !sYear) {
					var sCurrentYear = new Date().getFullYear(); //search incident of last 3 years
					for (var i = 0; i < 3; i++) {
						var sFilterYear = (sCurrentYear - i).toString();
						aFilter = [];
						aFilter.push(new Filter({
							filters: [
								new Filter("MessageYear", "EQ", sFilterYear),
								new Filter("ObjectID", "EQ", sObjectID)
							],
							and: true
						}));
						this.readIncidentList(aFilter, 3);
					}
				} else {
					aFilter.push(new Filter({
						filters: [
							new Filter("MessageYear", "EQ", sYear),
							new Filter("ObjectID", "EQ", sObjectID)
						],
						and: true
					}));
					this.readIncidentList(aFilter, 1);
				}
			}
			// oList.setBusy(true);
			/*sap.support.fsc2.IncidentModel.read("/IncidentList", {
				filters: aFilter,
				success: function (oData) {
					oList.setBusy(false);
					var aData = oData.results;
					var aResults = [];
					for (var i = 0; i < aData.length; i++) {
						var sField = "";
						var sFavorite = "";
						aResults.push({
							"ID": aData[i].CssObjectID,
							"ShortID": aData[i].ObjectID + "/" + aData[i].MessageYear,
							"Name": aData[i].CustomerName,
							"ComponentName": aData[i].ComponentName,
							"Description": aData[i].Description + " " + aData[i].ComponentName,
							"Priority": aData[i].PriorityTxt,
							"PriorityID": aData[i].Priority,
							"Status": aData[i].StatusTxt,
							"Action": sFavorite,
							"Field": sField,
							"Type": "FAVORITE_INCIDENTS",
							"Escalation": aData[i].Escalation === "X" ? true : false
						});
					}

					that.getModel("searchResult").setProperty("/Incident", {
						"results": aResults,
						"count": aResults.length,
						"expanded": aResults.length ? true : false
					});
				},
				error: function (err) {
					oList.setBusy(false);
					sap.m.MessageToast.show("IncidentList Service Unavailable!");
				}
			});*/
		},
		readIncidentList: function (aFilter, num) { //num means how many times to read
			var that = this;
			var oList = this.getView().byId("idIncident");
			var aSorter = [new sap.ui.model.Sorter("MessageYear", true)];
			sap.support.fsc2.IncidentModel.read("/IncidentList", {
				filters: aFilter,
				sorters: aSorter,
				success: function (oData) {
					that.readSuccess++;
					// var oData = {
					// 	"results": []
					// };
					// oData.results = oDataInit.results.filter(function (oItem) {
					// 	return oItem.ActiveSystem !== "SNO";
					// });
					var aData = oData.results;
					for (var i = 0; i < aData.length; i++) {
						var sField = "";
						var sFavorite = "";
						that.aIncidentResult.push({
							"ID": aData[i].CssObjectID,
							"ShortID": that.formatter.formatCssShortID(aData[i].CssObjectID),
							"Name": aData[i].CustomerName,
							"ComponentName": aData[i].ComponentName,
							"Description": aData[i].Description,
							"Component": aData[i].ComponentName,
							"Priority": aData[i].PriorityTxt,
							"PriorityID": aData[i].Priority,
							"Status": aData[i].StatusTxt,
							"Action": that.checkIcdFavorite(aData[i].CssObjectID), //sFavorite,
							"Field": sField,
							"Type": "FAVORITE_INCIDENTS",
							"Escalation": aData[i].Escalation === "X" ? true : false,
							"ActiveSystem": aData[i].ActiveSystem,
							"Active": aData[i].ActiveSystem === "" ? true : false
						});
					}
					if (that.readSuccess === num) {
						// that.aIncidentResult =  that.aIncidentResult.filter(function(oItem){
						// 	return oItem.ActiveSystem !=="SNO" ;
						// });
						that.getModel("searchResult").setProperty("/BcIncident", {
							"results": that.aIncidentResult,
							"count": that.aIncidentResult.length,
							"expanded": that.aIncidentResult.length ? true : false,
							"loadComplete": true
						});
						that.IncidentLoadComplete();
					}
				},
				error: function (err) {
					oList.setBusy(false);
					sap.m.MessageToast.show("IncidentList Service Unavailable!");
				}
			});
		},
		// onFavoritePress: function(oEvent) {
		// 	this.onFavoriteAction(oEvent, "searchResult");
		// },
		loadSnowCaseData: function (sValue) {
			var that = this;
			var bSearchSnowCase = false;
			var sEnableSnowCase = this.getModel("EnableSnowCase").getProperty("/bEnable");
			if (!sEnableSnowCase) {
				this.getModel("searchResult").setProperty("/SnowCase", {
					"count": 0,
					"expanded": false,
					"loadComplete": true,
					"results": []
				});
				that.IncidentLoadComplete();
				return;
			}
			var oDataService = {
				// "number": sValue,
				"sysparm_fields": "u_major_case_usage,active,number,correlation_display,sys_updated_by,escalation,sys_id,short_description,correlation_id,u_case_number,priority,state,account.number,account.name,account.country,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,u_app_component.u_short_description,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,u_deployed_item.u_environment,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,resolution_code,resolved_by,resolved_at,close_notes,u_deployed_item.u_data_center_region,u_deployed_item.u_data_center,u_last_user_updated_by,opened_at,closed_at,u_sold_item.u_sold_item_name,u_escalation_type,u_escalation_reason,active_escalation.opened_at"
			};
			// var sUrl = sap.support.fsc2.servicenowUrl + "?sysparm_query=u_responsible_party=sno%5enumberLIKE" + sValue + "&sysparm_fields=" + oDataService.sysparm_fields;
			var sUrl = sap.support.fsc2.servicenowUrl + "?sysparm_query=numberLIKE" + sValue +
				"%5eORcorrelation_idLIKE" + sValue + "&sysparm_fields=" + oDataService.sysparm_fields;

			if (sValue.startsWith("CS")) {
				bSearchSnowCase = true;
			}
			$.ajax({
				method: "GET",
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sUrl,
				success: function (oData) {
					var sData = [];
					oData.result.forEach(function (x) {
						if (x.u_major_case_usage === "" && (bSearchSnowCase || x.u_responsible_party === "sno")) {
							sData.push({
								"ID": x.correlation_id,
								"SNow_number": x.number,
								"ShortID": x.correlation_display,
								"Name": x["account.name"],
								"Component": x["u_app_component.u_name"],
								"ComponentName": x["u_app_component.u_short_description"],
								"Description": x.short_description,
								"Priority": formatter.SnowCasePriorityTxt(x.priority),
								"PriorityID": x.priority,
								"Status": formatter.SnowCaseStatusTxt(x.state),
								"Action": that.checkIcdFavorite(x.number), //"",
								"Field": "",
								"Type": "FAVORITE_INCIDENTS",
								"Escalation": x.escalation === "1" ? true : false,
								"Active": x.u_responsible_party === "sno" ? "true" : false
							});
						}

					});
					this.getModel("searchResult").setProperty("/SnowCase", {
						"count": sData.length,
						"expanded": false,
						"loadComplete": true,
						"results": sData
					});
					that.IncidentLoadComplete();
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},

		loadSnowEscalationData: function (sValue) {
			var that = this;
			var oList = this.getView().byId("idSituation");
			var sEnableSnowCase = this.getModel("EnableSnowCase").getProperty("/bEnable"); //I338673 needed?
			if (!sEnableSnowCase) {
				this.getModel("searchResult").setProperty("/SnowEscalation", {
					"count": 0,
					"expanded": false,
					"loadComplete": true,
					"results": []
				});
				that.IncidentLoadComplete();
				return;
			}
			var oDataService = {
				"u_escalation_type": 3,
				"sysparm_fields": "u_task_record.ref_sn_customerservice_case.u_responsible_party,u_bcp_correlation_id,u_task_record.ref_sn_customerservice_case.u_app_component.u_name,u_task_record.ref_sn_customerservice_case.u_app_component.u_short_description,u_task_record.ref_sn_customerservice_case.account.name,active,number,correlation_display,sys_updated_by,escalation,sys_id,short_description,correlation_id,u_case_number,priority,state,account.number,account.name,account.country,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,u_app_component.u_short_description,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,u_deployed_item.u_environment,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,resolution_code,resolved_by,resolved_at,close_notes,sys_updated_on,u_deployed_item.u_data_center_region,u_deployed_item.u_data_center,u_last_user_updated_by,opened_at,closed_at,u_sold_item.u_sold_item_name,u_escalation_type,u_escalation_reason,active_escalation.opened_at,sys_class_name"
			};
			// var sUrl = sap.support.fsc2.servicenowUrl + "?sysparm_query=u_responsible_party=sno%5enumberLIKE" + sValue + "&sysparm_fields=" + oDataService.sysparm_fields;
			var sUrl = sap.support.fsc2.servicenowEscalationUrl + "?sysparm_query=numberLIKE" + sValue +
				"%5eORu_bcp_correlation_idLIKE" + sValue + "%5Eu_escalation_type=" + oDataService.u_escalation_type + "&sysparm_fields=" +
				oDataService.sysparm_fields;
			$.ajax({
				method: "GET",
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sUrl,
				success: function (oData) {
					var aData = [];
					oData.result.forEach(function (x) {
						aData.push({
							"SysID": x.sys_id,
							"SNow_number": x.number,
							"ID": x.u_bcp_correlation_id,
							"Name": x["u_task_record.ref_sn_customerservice_case.account.name"],
							"Component": x["u_task_record.ref_sn_customerservice_case.u_app_component.u_name"],
							"ComponentName": x["u_task_record.ref_sn_customerservice_case.u_app_component.u_short_description"],
							"Description": x.short_description,
							"Priority": formatter.SnowCasePriorityTxt(x.priority),
							"PriorityID": x.priority,
							"Status": formatter.SnowEscalationStatusTxt(x.state),
							"Action": "",
							/*that.checkIcdFavorite(x.number), */ //"",
							"Field": "",
							"Type": "FAVORITE_INCIDENTS",
							"Escalation": x.escalation === "1" ? true : false,
							"Active": x["u_task_record.ref_sn_customerservice_case.u_responsible_party"] === "sno" ? "true" : false,
							"TransType": x.sys_class_name
						});
					});
					var aCriticalSituation = this.getModel("searchResult").getProperty("/Situation");
					this.getModel("searchResult").setProperty("/Situation", {
						"results": aCriticalSituation.results.concat(aData),
						"count": aCriticalSituation.count + aData.length,
						"expanded": false
					});
					that.IncidentLoadComplete();
					oList.setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		IncidentLoadComplete: function () {
			var that = this;
			var oList = this.getView().byId("idIncident");
			var oBCIncident = this.getModel("searchResult").getProperty("/BcIncident");
			var oSnowCase = this.getModel("searchResult").getProperty("/SnowCase");
			if (oBCIncident.loadComplete && oSnowCase.loadComplete) {
				var oResult = {
					"count": oBCIncident.count + oSnowCase.count,
					"expanded": false,
					"loadComplete": true,
					"results": oBCIncident.results.concat(oSnowCase.results)
				};
				this.getModel("searchResult").setProperty("/Incident", oResult);
				oList.setBusy(false);
			} else {
				setTimeout(function () {
					that.IncidentLoadComplete();
				}, 200);
			}

		},
		handleRowPress: function (oEvent) {
			// Determine where we are right now
			var that = this;
			var oBindingObject = oEvent.getSource().getBindingContext("searchResult");
			var sPath = oBindingObject.getPath();
			var oObject = oBindingObject.getObject();
			var aPath = sPath.split("/");
			if (aPath[1] === "Customer") {
				this.getRouter().navTo("customer", {
					layout: "MidColumnFullScreen",
					custnum: oObject.CustomerNo,
					custname: encodeURIComponent(oObject.CustomerName),
					favorite: oObject.Action === "X" ? true : false
				});
			} else if (aPath[1] === "Situation" && oObject.TransType === "sn_customerservice_escalation") {
				this.onNavToCriticalRequest(oObject.TransType, oObject.SysID, 2);
			} else if (aPath[1] === "Situation" && oObject.TransType !== "sn_customerservice_escalation") {
				this.onNavToCriticalRequest(oObject.TransType, oObject.ID, 2);
			} else if (aPath[1] === "Incident" && oObject.Active) {
				var sIncidentNum = oObject.SNow_number ? oObject.SNow_number : oObject.ID;
				this.getRouter().navTo("incidentSearch", {
					layout: "TwoColumnsMidExpanded",
					id: sIncidentNum,
					flag: false,
					sam: false
				});
			} else if (aPath[1] === "Incident" && !oObject.Active && oObject.TransType !== "sn_customerservice_escalation") {
				that.getRouter().navTo("incidentSearch", {
					layout: "TwoColumnsMidExpanded",
					id: oObject.ID,
					flag: false,
					sam: false
				});
			} else if (aPath[1] === "Incident" && !oObject.Active && oObject.TransType === "sn_customerservice_escalation") {
				// var sIncidentNum2 = oObject.SNow_number ? oObject.SNow_number : oObject.ID;
				sap.m.MessageBox.information("The details in the active system will be displayed.", {
					onClose: function () {
						that.getRouter().navTo("requestDetailSearch", {
							layout: "TwoColumnsMidExpanded",
							id: oObject.SysID,
							transType: oObject.TransType,
							flag: false,
							sam: false
						});
					}
				});

			}
		},
		checkIcdFavorite: function (sID) {
			var sAction = "";
			var sDataIcd = this.getModel("favoriteIncidents").getProperty("/results");
			for (var i = 0; i < sDataIcd.length; i++) {
				if (sDataIcd[i].Value === sID) {
					sAction = "X";
				}
			}
			return sAction;
		},
		formatActiveStatus: function (bActive) {
			var sValue = bActive ? "" : "(Inactive)";
			return sValue;
		},
		onSearch: function (oEvent) {
			var item = oEvent.getParameter("suggestionItem");
			var sValue = "";
			if (item) {
				sValue = item.getText().trimStart();
				this.SearchDescription = item.getDescription() || "ALL";
				this.bSelectItem = true;
				if (sValue) {
					this._updateHistory(sValue);
					/*	this.getRouter().navTo("search", {
							"value": encodeURIComponent(sValue),
							"description": this.oCategory[this.SearchDescription]
						});*/
					this._updateSearchData(sValue, this.oCategory[this.SearchDescription]);
				}
			} else {
				if (!this.bSelectItem) {
					this.SearchDescription = "ALL";
					sValue = oEvent.getParameter("query").trimStart();
					if (sValue) {
						this._updateHistory(sValue);
						/*	this.getRouter().navTo("search", {
								"value": encodeURIComponent(sValue),
								"description": this.oCategory[this.SearchDescription]
							});*/
						this._updateSearchData(sValue, this.oCategory[this.SearchDescription]);
					}
				}
				this.bSelectItem = false;
			}
		},
		_updateHistory: function (sValue) {
			var aHistroy = this.getModel("history").getData().results || [];
			var sGroup = "myHistory";
			sap.support.fsc2.UserProfileModel.setUseBatch(true);
			sap.support.fsc2.UserProfileModel.setDeferredGroups([sGroup]);
			var aEntries = [];
			for (var i = aHistroy.length - 1; i >= 0; i--) {
				if (aHistroy[i].Value.toUpperCase() !== sValue.toUpperCase()) {
					aEntries.push({
						"Attribute": "APP_FSC2_SEARCH_HISTORY",
						"Value": aHistroy[i].Value
					});
				}
			}
			aEntries.push({
				"Attribute": "APP_FSC2_SEARCH_HISTORY",
				"Value": sValue
			});
			for (var j = 0; j < aEntries.length; j++) {
				sap.support.fsc2.UserProfileModel.create("/Entries", aEntries[j], {
					groupId: sGroup
				});
			}
			sap.support.fsc2.UserProfileModel.remove("/Entries(Username='',Attribute='APP_FSC2_SEARCH_HISTORY',Field='')", {
				success: function () {
					sap.support.fsc2.UserProfileModel.submitChanges({
						groupId: sGroup,
						success: function () {
							sap.support.fsc2.UserProfileModel.setUseBatch(false);
						}
					});
				}
			});
		},
		onSuggest: function (oEvent) {
			if (this.getRouter()._oMatchedRoute.getPattern().indexOf("search") > -1) {
				var value = oEvent.getParameter("suggestValue");
				this._updateSuggestionModel(value);
				var oSearchField = oEvent.getSource();
				oSearchField.suggest();
			}
		},
		_updateSuggestionModel: function (value) {
			var that = this;
			var sValue = value.trim();
			var oHistoryModel = this.getModel("history");
			var aHistoryData = oHistoryModel.getData().results;
			var aSuggestionData = [];
			if (aHistoryData) {
				for (var i = 0, len = aHistoryData.length; i < len; i++) {
					if (aHistoryData[i].Value.toUpperCase().indexOf(sValue.toUpperCase()) > -1) {
						aSuggestionData.push({
							"Name": aHistoryData[i].Value,
							"Description": ""
						});
					}
				}
			}
			var aCategory = ["searchCustomer", "searchSituation", "searchIncident"];
			var aSuggestionCategory = [];
			if (sValue) {
				aCategory.forEach(function (v) {
					aSuggestionCategory.push({
						"Name": sValue,
						"Description": that.getResourceBundle().getText(v)
					});
				});
				aSuggestionData = aSuggestionData.concat(aSuggestionCategory);
			}
			var oSuggestionModel = this.getModel("suggestion");
			oSuggestionModel.setData({
				"results": aSuggestionData
			});
		}
	});
});