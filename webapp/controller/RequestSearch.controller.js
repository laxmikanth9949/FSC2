/*global history*/
sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/formatter',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/support/fsc2/model/models'
], function (BaseController, formatter, JSONModel, ODataModel, Filter, FilterOperator, models) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.RequestSearch", {
		formatter: formatter,
		onInit: function () {
			this.setModel(new JSONModel(), "searchResult");
			this.setModel(new JSONModel(), "history");
			this.setModel(new JSONModel(), "suggestion");
			this.bSelectItem = false;
			this.getRouter().getRoute("requestSearch").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("requestDetailRequestSearch").attachPatternMatched(this._onRouteMatchedRefresh, this); //needed so data is my request loaded after reloading of page
			this.getRouter().getRoute("escalationRequestDetailSearch").attachPatternMatched(this._onRouteMatchedRefresh, this); //needed so data is my request loaded after reloading of page
			this.getRouter().getRoute("mccDetailRequestSearch").attachPatternMatched(this._onRouteMatchedRefresh, this); //needed so data is my request loaded after reloading of page
			this.bInit = true;
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
			this.loadFavCustData();
		},
		_onRouteMatchedRefresh: function (oEvent) {
			if (this.bInit === true) {
				this.loadFavCustData();
				this.bInit = false;
			}
		},
		_updateSearchData: function (searchValue) {
			this.getModel("searchResult").setData({
				"Situation": {
					//"loadComplete": true,
					"count": "0",
					"expanded": false,
					"results": []
				},
				"SnowEscalation": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				}
			});
			var oTabBar = this.getView().byId("idSearchTab");
			var sValue = searchValue;
			this.sSearchValue = searchValue;
			this.eventUsage(false, "Search critical situation");
			oTabBar.setSelectedKey("keySituation");
			this.loadSituationData(sValue);
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
						this.getModel("searchResult").setProperty("/Situation/loadComplete","true");
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
					oList.setBusy(false);
					this.loadSnowEscalationData(sValue);
				}.bind(this),
				error: function (err) {
					iCallCount++;
					if (iCallCount === 2) {
						this.getModel("searchResult").setProperty("/Situation/loadComplete","true");
					}
					oList.setBusy(false);
					sap.m.MessageToast.show("FAC2MCCSet Service Unavailable!");
				}.bind(this)
			});
		},
		loadSnowEscalationData: function (sValue) {
			var that = this;
			var sEnableSnowCase = this.getModel("EnableSnowCase").getProperty("/bEnable"); //I338673 needed?
			if (!sEnableSnowCase) {
				this.getModel("searchResult").setProperty("/SnowEscalation", {
					"count": 0,
					"expanded": false,
					"loadComplete": true,
					"results": []
				});
				//	that.IncidentLoadComplete();
				return;
			}
			var oDataService = {
				"u_escalation_type": 3,
				"u_escalation_type_bdm": 0,
				"sysparm_fields": "source_record.u_responsible_party,source_record.correlation_display,u_bcp_correlation_id,source_record.u_app_component.u_name,source_record.u_app_component.u_short_description,source_record.account.name,active,number,correlation_display,sys_updated_by,escalation,sys_id,short_description,correlation_id,u_case_number,priority,state,account.number,account.name,account.country,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,u_app_component.u_short_description,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,u_deployed_item.u_environment,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,resolution_code,resolved_by,resolved_at,close_notes,sys_updated_on,u_deployed_item.u_data_center_region,u_deployed_item.u_data_center,u_last_user_updated_by,opened_at,closed_at,u_sold_item.u_sold_item_name,u_escalation_type,u_escalation_reason,active_escalation.opened_at,sys_class_name"
			};
			// var sUrl = sap.support.fsc2.servicenowUrl + "?sysparm_query=u_responsible_party=sno%5enumberLIKE" + sValue + "&sysparm_fields=" + oDataService.sysparm_fields;
			var sUrl = sap.support.fsc2.servicenowEscalationUrl + "?sysparm_query=numberLIKE" + sValue +
				"%5eORu_bcp_correlation_idLIKE" + sValue + "%5Eu_escalation_type=" + oDataService.u_escalation_type + "%5eORu_escalation_type=" + oDataService.u_escalation_type_bdm + "&sysparm_fields=" +
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
							"ID": x["source_record.correlation_display"],
							"Name": x["source_record.account.name"],
							"Component": x["source_record.u_app_component.u_name"],
							"ComponentName": x["source_record.u_app_component.u_short_description"],
							"Description": x.short_description,
							"Priority": formatter.SnowCasePriorityTxt(x.priority),
							"PriorityID": x.priority,
							"Status": formatter.SnowEscalationStatusTxt(x.state),
							"Action": "",
							/*that.checkIcdFavorite(x.number), */ //"",
							"Field": "",
							"Type": "FAVORITE_INCIDENTS",
							"Escalation": x.escalation === "1" ? true : false,
							"Active": x["source_record.u_responsible_party"] === "sno" ? "true" : false,
							"TransType": x.sys_class_name
						});
					});
					var aCriticalSituation = this.getModel("searchResult").getProperty("/Situation");
					this.getModel("searchResult").setProperty("/Situation", {
						"loadComplete": "true",
						"results": aCriticalSituation.results.concat(aData),
						"count": aCriticalSituation.count + aData.length,
						"expanded": false
					});
					//		that.IncidentLoadComplete();
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		handleRowPress: function (oEvent, binding) {
			var oBindingObject = oEvent.getSource().getBindingContext(binding);
			var oObject = oBindingObject.getObject();
			if (oObject.TransType === "sn_customerservice_escalation") {
				var activityId = oObject.SysID;
			} else if (oObject.TransType !== "sn_customerservice_escalation") {
				var activityId = oObject.ID;
			}
			if (oObject.TransType === "ZS90" || oObject.TransType === "sn_customerservice_escalation") { // cim request
				this.eventUsage("cimrequest \'view");
				this.getRouter().navTo("requestDetailRequestSearch", {
					layout: "TwoColumnsMidExpanded",
					id: activityId,
					transType: oObject.TransType
				});
			} else if (oObject.TransType === "ZS31") { // global escalation request   
				this.eventUsage("\'escalation request\'");
				this.getRouter().navTo("escalationRequestDetailSearch", {
					layout: "TwoColumnsMidExpanded",
					activityid: activityId,
					editable: false
				});
			} else if (oObject.TransType === "ZS46") {
				this.eventUsage("mccDetail \'view");
				this.getRouter().navTo("mccDetailRequestSearch", {
					layout: "TwoColumnsMidExpanded",
					activity_id: activityId
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
				/*	this.SearchDescription = item.getDescription() || "ALL";*/
				this.bSelectItem = true;
				if (sValue) {
					this._updateHistory(sValue);
					this._updateSearchData(sValue);
				}
			} else {
				if (!this.bSelectItem) {
					/*	this.SearchDescription = "ALL";*/
					sValue = oEvent.getParameter("query").trimStart();
					if (sValue) {
						this._updateHistory(sValue);
						this._updateSearchData(sValue);
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
			if (this.getRouter()._oMatchedRoute.getPattern().indexOf("requestSearch") > -1) {
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
			var oSuggestionModel = this.getModel("suggestion");
			oSuggestionModel.setData({
				"results": aSuggestionData
			});
		},
		onFilterTable: function (oEvent, id) {
			// add filter for search
			var aFilters = [];
			var filter = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				aFilters.push(new Filter("ID", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("Status", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("Name", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("CustomerName", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("Description", FilterOperator.Contains, sQuery));

				filter = new Filter({
					filters: aFilters,
					and: false
				});
			}
			// update list binding
			var oList = this.getView().byId(id);
			var oBinding = oList.getBinding("items");
			oBinding.filter(filter);
		}
	});
});