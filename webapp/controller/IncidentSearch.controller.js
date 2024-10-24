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

	return BaseController.extend("sap.support.fsc2.controller.IncidentSearch", {
		formatter: formatter,
		onInit: function () {
			this.setModel(new JSONModel(), "searchResult");
			this.setModel(new JSONModel(), "history");
			this.setModel(new JSONModel(), "suggestion");
			this.bSelectItem = false;
			this.getRouter().getRoute("searchIncident").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("incidentSearch").attachPatternMatched(this._onRouteMatchedRefresh, this); //needed so data is my request loaded after reloading of page
			this.getRouter().getRoute("requestDetailIncidentSearch").attachPatternMatched(this._onRouteMatchedRefresh, this); //needed so data is my request loaded after reloading of page
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
			this.loadFavIncidentData();
			//	this.loadFavSNOWCaseData();
		},
		_onRouteMatchedRefresh: function (oEvent) {
			if (this.bInit === true) {
				this.loadFavIncidentData();
				this.bInit = false;
			}
		},

		_updateSearchData: function (searchValue) {
			this.getModel("searchResult").setData({
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
				"Incident": {
					"count": "",
					"expanded": false,
					"results": []
				}
			});
			var oTabBar = this.getView().byId("idSearchTab");
			var sValue = searchValue;
			this.sSearchValue = searchValue;
			this.eventUsage(false, "Search incident");
			oTabBar.setSelectedKey("keyIncident");
			this.loadIncidentData(sValue);
			this.loadSnowCaseData(sValue);
		},
		loadIncidentData: function (sValue) {
			var that = this;
			var oList = this.getView().byId("idIncident");
			oList.setBusy(true);
			this.getView().byId("inactiveCheckBox").setEnabled(false);
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
							"Active": aData[i].ActiveSystem === "" ? true : false,
							"CustomerNo": aData[i].CustomerNo
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
					this.getView().byId("inactiveCheckBox").setEnabled(true);
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
			var sysparamQuery= "numberLIKE" + sValue +"%5eORcorrelation_idLIKE" + sValue;
			var bInactiveCases = this.getView().byId("inactiveCheckBox").getSelected();
			if (!bInactiveCases){
				sysparamQuery += "%5eactive=true";
			}
			// var sUrl = sap.support.fsc2.servicenowUrl + "?sysparm_query=u_responsible_party=sno%5enumberLIKE" + sValue + "&sysparm_fields=" + oDataService.sysparm_fields;
			var sUrl = sap.support.fsc2.servicenowUrl + "?sysparm_query=" + sysparamQuery + "&sysparm_fields=" + oDataService.sysparm_fields;

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
								"Active": x.u_responsible_party === "sno" ? "true" : false,
								"CustomerNo": x["account.number"]
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
		/** 
		 * @param {Array<snowInc} snowIncList 
		 * @param {Array<bcpInc>} bcpIncList 
		 * @returns {Array<bcpInc} * 
		 */
		 _filterBcpDuplicates: function (snowIncList, bcpIncList) {	
			//filters out the bcp results If the leading system is snow and the copy does exist in the snow results.	
			var filteredList = [];
			bcpIncList.forEach(function (bcpInc) {
				var bSnowActiveSystem = bcpInc.ActiveSystem === "SNO";
				var bCopyExistsInSnow = snowIncList.some(
					function (snoInc) {
						if (snoInc.CustomerNo === bcpInc.CustomerNo && snoInc.ShortID === bcpInc.ShortID) {
							return true;
						}
					});
				if(bCopyExistsInSnow && bSnowActiveSystem){
					console.log(bcpInc, " excluded");
				}
				else{
					filteredList.push(bcpInc);				
				}
			});
			return filteredList;
		},
		IncidentLoadComplete: function () {
			var that = this;
			var oList = this.getView().byId("idIncident");
			var oBCIncident = this.getModel("searchResult").getProperty("/BcIncident");
			var oSnowCase = this.getModel("searchResult").getProperty("/SnowCase");
			if (oBCIncident.loadComplete && oSnowCase.loadComplete) {
				//remove the duplicate incidents that are copied to sNow
				var filtered = this._filterBcpDuplicates(oSnowCase.results, oBCIncident.results);
				this.getModel("searchResult").setProperty("/BcIncident/results", filtered);
				this.getModel("searchResult").setProperty("/BcIncident/count", filtered.length);
				
				var oResult = {
					"count": oBCIncident.count + oSnowCase.count,
					"expanded": false,
					"loadComplete": true,
					"results": oBCIncident.results.concat(oSnowCase.results)
				};
				this.getModel("searchResult").setProperty("/Incident", oResult);
				oList.setBusy(false);
				this.getView().byId("inactiveCheckBox").setEnabled(true);
			} else {
				setTimeout(function () {
					that.IncidentLoadComplete();
				}, 200);
			}

		},
		restrictedWarning: function(sId){
				var $this = this
				var error = "This case is restricted and cannot be displayed";
				var bFavorited = this.getModel("favoriteIncidents").getData().results.some(function (item){return item.Value === sId});
				var actions =  [sap.m.MessageBox.Action.CANCEL];
				if (bFavorited){
					error += "\n Would you like to delete this favorite?";
					actions.unshift(sap.m.MessageBox.Action.DELETE);
				}
				sap.m.MessageBox.error(error, {
					title: "Restricted case",
					styleClass: "sapUiSizeCompact",
					actions: actions,
					
					onClose: function (oAction) {
						if(oAction === "DELETE"){
							$this.removeFavoriteCase(sId);
						}
					}
				});
		},

		handleRowPress: function (oEvent, binding) {
			var that = this;
			var oBindingObject = oEvent.getSource().getBindingContext(binding);
			var oObject = oBindingObject.getObject();
			if(oObject.Status === "Restricted"){
				this.restrictedWarning(oObject.ID);
		
			}
			else if  (oObject.Active) {
				var sIncidentNum = oObject.SNow_number ? oObject.SNow_number : oObject.ID;
				this.getRouter().navTo("incidentSearch", {
					layout: "TwoColumnsMidExpanded",
					id: sIncidentNum,
					flag: false,
					sam: false
				});
			} else if (!oObject.Active && oObject.TransType !== "sn_customerservice_escalation") {
				that.getRouter().navTo("incidentSearch", {
					layout: "TwoColumnsMidExpanded",
					id: oObject.ID,
					flag: false,
					sam: false
				});
			} else if (!oObject.Active && oObject.TransType === "sn_customerservice_escalation") {
				// var sIncidentNum2 = oObject.SNow_number ? oObject.SNow_number : oObject.ID;
				sap.m.MessageBox.information("The details in the active system will be displayed.", {
					onClose: function () {
						that.getRouter().navTo("requestDetailIncidentSearch", {
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
		onInactiveToggled: function(oEvent){
			var sValue = this.getView().byId("searchField").getValue()
			this.getView().byId("searchField").fireSearch({query:sValue});
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
			if (this.getRouter()._oMatchedRoute.getPattern().indexOf("searchIncident") > -1) {
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
				aFilters.push(new Filter("ShortID", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("Status", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("Priority", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("SNow_number", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("Name", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("Component", FilterOperator.Contains, sQuery));
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