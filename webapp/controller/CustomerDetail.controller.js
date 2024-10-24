sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/support/fsc2/model/formatter',
	"sap/ui/core/util/ExportTypeCSV",
	"sap/ui/core/util/Export"
], function (BaseController, JSONModel, Filter, ODataModel, models, formatter, ExportTypeCSV, Export) {
	"use strict";
	return BaseController.extend("sap.support.fsc2.controller.CustomerDetail", {

		formatter: formatter,
		onInit: function () {
			this.oIconTab = this.getView().byId("idIconTabBar");
			this.setModel(new JSONModel(), "customerPageConfig");
			this.initCustData = models.initCustomerDetailData();
			this.getModel("customerPageConfig").setData(this.initCustData);
			this.getModel("customerPageConfig").setSizeLimit(10000);
			this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2") + "/model/CustDetailFilter.json"), "filterOptionModel");
			this.setModel(new JSONModel(), "downloadModel");
			this.setModel(new JSONModel(), "customerDetails");
			this.getRouter().getRoute("customer").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("customer1").attachPatternMatched(this._onRouteMatched, this);
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
			this.eventUsage("customer\' view");
			
			this.initSearch();
			this.getView().setBusy(true);
			var oArgs = oEvent.getParameter("arguments");
			this.loadCustomerData(oArgs.custnum);
			//do not reload all data when navigation from detail page to Customer detail page
			var bReload = 	this.getModel("customerPageConfig").getProperty("/reload");           
			if (this.sCustomerNo === oArgs.custnum && !bReload) { //doesnt work
				this.getView().setBusy(false);
				return;
			}
			this._bFavorite = oArgs.favorite === "true" ? true : false;
			this.getModel("customerPageConfig").setData(models.initCustomerDetailData());
			this.sCustomerNo = (Array(10).join("0") + oArgs.custnum).slice(-10);
			this.getModel("customerPageConfig").setProperty("/_bFavorite", this._bFavorite);
			this.oAll = {
				"count": 0,
				"results": []
			};
			/******Initiate filter condiction for each list,all list contains the data from request, incident and case.******/
			this.oFilter = {
				"all": {
					"situation": [],
					"businessDown": [],
					"incident": [],
					"snowCase": {
						"status": [],
						"priority": [],
						"timePeriod": []
					}
				},
				"situation": [],
				"businessDown": [],
				"incident": [],
				"snowCase": {
					"status": [],
					"priority": [],
					"timePeriod": []
				},
				"bStatus": {
					"situation": false,
					"businessDown": false,
					"incident": false,
					"situationAll": false,
					"businessDownAll": false,
					"incidentAll": false
				}
			};
			this.initFilter();
			this.oTabBar = this.getView().byId("idIconTabBar");
			/******comment: get default criteria for all tab. Then load incident, situation, case(if have authorization) data into all list.******/
			this.getFilterCond_All();
			this.loadAllData(false, "bothTab", false);
			this.oFilter.all.businessDown = this.getFilter(true, "businessDown");
			this.oFilter.businessDown = this.getFilter(false, "businessDown");
			//this.loadBusDownData(false, "bothTab", false);
			/******comment: get default criteria for businessDown Tab. Because business down included in incident, so it do not load businessDown when load all data.******/
		},
		initSearch: function () {
			/******comment: set all search Field value to empty.******/
			var oView = this.getView();
			oView.byId("allSearch").setValue().fireLiveChange();
			oView.byId("situationSearch").setValue().fireLiveChange();
			oView.byId("businessDownSearch").setValue().fireLiveChange();
			oView.byId("incidentSearch").setValue().fireLiveChange();
			oView.byId("caseSearch").setValue().fireLiveChange();

		},
		initFilter: function () {
			/******comment: remove all filter criteria from filter panel ******/
			var oView = this.getView();
			var aMultiCombobBox = ["allPriorityFilter", "allStatusFilter", "situationPriorityFilter", "situationStatusFilter",
				"businessDownPriorityFilter", "businessDownStatusFilter", "incidentPriorityFilter", "incidentStatusFilter", "casePriorityFilter",
				"caseStatusFilter"
			];
			var sComboBox = ["allTimeFilter", "situationTimeFilter", "businessDownTimeFilter", "incidentTimeFilter", "caseTimeFilter"];
			aMultiCombobBox.forEach(function (x) {
				oView.byId(x).removeAllSelectedItems();
			});
			sComboBox.forEach(function (y) {
				oView.byId(y).setSelectedKey();
			});
			this.getModel("filterOptionModel").setProperty("/allFilterIcon", "sap-icon://clear-filter");
			this.getModel("filterOptionModel").setProperty("/situationFilterIcon", "sap-icon://clear-filter");
			this.getModel("filterOptionModel").setProperty("/businessDownFilterIcon", "sap-icon://clear-filter");
			this.getModel("filterOptionModel").setProperty("/incidentFilterIcon", "sap-icon://clear-filter");
		},
		/******comment: 
		 There are 4 situations that view will need to load 5 services:
			1.Nav to customer detail view when you press an item in customer list.
			2.Click "Show More" button on the "All" tab
			3.Click "Download" button on the "All" tab
			4.Click "Apply" button on the "All" tab
		When a service loads data successfully, this method is called once. When the call count is 5, the view busy or control busy in "All" tab will be closed.   
		******/
		loadAllDataComplete: function (dFlag, bClosed) {
			var oDataAll = this.getModel("customerPageConfig").getProperty("/all");
			var sBusDownloadComp = this.getModel("customerPageConfig").getProperty("/businessDown/loadComplete");
			var bAllComplete = oDataAll.loadBcIncident && oDataAll.loadSnowCase && oDataAll.loadSituation && oDataAll.loadCase &&
				sBusDownloadComp;
			/******comment: iLoadCount = 5 means load all data, include 1 time situation, 1 time business down, 1 time incident, 2 time case(count & items)******/
			if (!bAllComplete) {
				return;
			}
			if (bClosed !== true) {
				this.oAll.results.sort(function (a, b) {
					return b["Update_sortby"] - a["Update_sortby"];
				});
			}
			// this.oAll.results = this.QuickSort(this.oAll.results,function(a,b){
			// 	var sResult =  a["Update_sortby"] - b["Update_sortby"] > 0 ? true :false;
			// 	return sResult;
			// });  
			// var aMsg =  [];
			// this.oAll.results.forEach(function(x){
			// 	aMsg.push({"ID":x.ID, "UpdateAt":x.UpdateAt,"Update_sortby":x.Update_sortby});
			// });
			// var sMsg = JSON.stringify(aMsg);
			// sap.m.MessageBox.information(sMsg);
			/******comment: Download data in "All" tab******/
			if (dFlag) {
				this.getModel("downloadModel").setData(this.oAll);
				this.exportData();
			} else {
				/******comment: show top 10 items in "All" Tab and close view busy.******/
				/*if (topFlag) {
					var aDataTop = [],
						i = 0;
					while (i < 10 && i < this.oAll.results.length) {
						aDataTop.push(this.oAll.results[i]);
						i++;
					}
					this.oAll.results = aDataTop;
				}*/
				this.getModel("customerPageConfig").setProperty("/all/results", this.oAll.results);
				this.getModel("customerPageConfig").setProperty("/all/count", this.oAll.count);
			}
			this.getView().setBusy(false);
		},
		/******comment: topFlag = true: load top 10 items.
						tabFlag = both:load data for all list and separate tab-- trigger loadAllDataComplete method.
						dFlag = true: download data of current selected tab .
		******/
		onCheckUserEscalationAuth: function (bClosed, tabFlag, dFlag) {
			var oData = this.getModel("user").getData();
			if (!oData || oData.Authgeneral === undefined) {
				setTimeout(function () {
					this.onCheckUserEscalationAuth(bClosed, tabFlag, dFlag);
				}.bind(this), 100);
			} else {
				if (this.getModel("user").getProperty("/Authgloesca") !== "X") { //=== do not have authorization to check case==
					this.getView().byId("idCaseFilter").setVisible(false);
					switch (tabFlag) {
					case "allTab":
						this.getModel("customerPageConfig").setProperty("/all/loadCase", true);
						break;
					case "case":
						this.getModel("customerPageConfig").setProperty("/case", {
							"results": [],
							"count": 0,
							"loadComplete": true
						});
						break;
					case "bothTab":
						this.getModel("customerPageConfig").setProperty("/all/loadCase", true);
						this.getModel("customerPageConfig").setProperty("/case", {
							"results": [],
							"count": 0,
							"loadComplete": true
						});
						break;
					}
					this.loadAllDataComplete(dFlag, bClosed);
				} else {
					this.getView().byId("idCaseFilter").setVisible(true);
					this.loadCaseData(bClosed, tabFlag, dFlag);
				}
			}
		},
		openFilterPanel: function () {
			var cGrid = this.getView().byId(this.oTabBar.getSelectedKey() + "FilterGrid");
			var bVisible = cGrid.getVisible();
			cGrid.setVisible(!bVisible);
		},
		onFilterAll: function () {
			this.getView().setBusy(true);
			this.getModel("customerPageConfig").setProperty("/all", this.initCustData.all);
			this.getModel("customerPageConfig").setProperty("/all/loadBcIncident", false);
			this.getModel("customerPageConfig").setProperty("/all/loadSnowCase", false);
			this.getModel("customerPageConfig").setProperty("/all/loadSituation", false);
			this.getModel("customerPageConfig").setProperty("/all/loadCase", false);
			this.getModel("customerPageConfig").setProperty("/closed/all", false);
			this.oAll = {
				"count": 0,
				"results": []
			};
			this.getFilterCond_All();
			this.loadAllData(false, "allTab", false); //tabFlag(AllTab,SepTab,Both), dFalg
		},
		getFilterCond_All: function () {
			this.hasPriorityVeryHigh = false;
			this.hasPriorityMediumLow = false;
			/******comment: Filter all including filter incident, filter situation and all case******/
			this.oFilter.all = {
				"situation": [],
				"incident": [],
				"businessDown": [],
				"snowCase": {
					"status": [],
					"priority": [],
					"timePeriod": []
				}
			};
			this.oFilter.all.situation = this.getFilter(true, "situation");
			this.oFilter.all.incident = this.getFilter(true, "incident");
			this.oFilter.all.snowCase = this.getFilter_snowCase(true);
			var sCount = this.oFilter.all.situation.length + this.oFilter.all.incident.length + this.oFilter.all.businessDown.length;
			var allFilterIcon = (sCount > 4) ? "sap-icon://filter" : "sap-icon://clear-filter";
			this.getModel("filterOptionModel").setProperty("/allFilterIcon", allFilterIcon);
			//Initiate the default criteria
			this.oFilter.situation = this.getFilter(false, "situation");
			this.oFilter.incident = this.getFilter(false, "incident");
			this.oFilter.snowCase = this.getFilter_snowCase(true);
		},
		loadAllData: function (bClosed, tabFlag, dFlag) { //load data for UI or download all data
			this.onCheckUserEscalationAuth(bClosed, tabFlag, dFlag); //load case count after check auth
			this.loadRequestData(bClosed, tabFlag, dFlag);
			if (!this.hasPriorityVeryHigh && this.hasPriorityMediumLow) {
				this.getModel("customerPageConfig").setProperty("/all/loadSnowCase", true);
				this.getModel("customerPageConfig").setProperty("/all/loadBcIncident", true);
				this.loadAllDataComplete(dFlag, bClosed);
			} else {
				this.loadSnowCaseData(bClosed, tabFlag, dFlag);
				this.loadBcIncidentData(bClosed, tabFlag, dFlag);
			}
		},
		/******comment: triggered when press "Apply" button on situation Tab******/
		onFilterSituation: function () {
			this.getModel("customerPageConfig").setProperty("/closed/situation", false);
			this.getModel("customerPageConfig").setProperty("/situation", this.initCustData.situation);
			this.oFilter.situation = this.getFilter(false, "situation");
			this.loadRequestData(false, "situation", false);
		},
		onFilterIncident: function () { //Bc incident + Snow Case
			this.getModel("customerPageConfig").setProperty("/closed/incident", false);
			this.getModel("customerPageConfig").setProperty("/incident", this.initCustData.incident);
			this.getModel("customerPageConfig").setProperty("/bcIncident", this.initCustData.bcIncident);
			this.getModel("customerPageConfig").setProperty("/snowCase", this.initCustData.snowCase);
			this.oFilter.snowCase = this.getFilter_snowCase(false);
			this.loadSnowCaseData(false, "snowCase", false);
			this.oFilter.incident = this.getFilter(false, "incident");
			this.loadBcIncidentData(false, "bcIncident", false);
		},
		onFilterBusinessDown: function () {
			this.getModel("customerPageConfig").setProperty("/closed/businessDown", false);
			this.getModel("customerPageConfig").setProperty("/businessDown", this.initCustData.businessDown);
			this.oFilter.businessDown = this.getFilter(false, "businessDown");
			this.loadBusDownData(false, "businessDown", false);
		},
		getFilter_snowCase: function (bAllTab) { //aAllTab = true means get filter in all tab
			var that = this,
				oView = this.getView();
			var sFilterSnowCase = {
				"status": [],
				"priority": [], // display priority with high and very high by default
				"timePeriod": ""
			};
			var sFilterCtrlID = bAllTab ? "all" : "incident";
			var aPriorityItems = oView.byId(sFilterCtrlID + "PriorityFilter").getSelectedItems();
			aPriorityItems.forEach(function (sPrioItem) {
				var sPriorityCode = sPrioItem.getKey();
				if (sPriorityCode === "1") {
					sFilterSnowCase.priority.push("1");
				} else if (sPriorityCode === "3") {
					sFilterSnowCase.priority.push("2");
				}
			});
			if (sFilterSnowCase.priority.length === 0) {
				sFilterSnowCase.priority = ["1", "2"];
			}

			//Status
			var aStatusItems = oView.byId(sFilterCtrlID + "StatusFilter").getSelectedItems();
			aStatusItems.forEach(function (sStatusItem) {
				var sStatusCode = sStatusItem.getKey();
				switch (sStatusCode) {
					//all list filter
				case "E0010": //new
					sFilterSnowCase.status.push("1");
					break;
				case "E0011": //not complete
					sFilterSnowCase.status.push("10");
					sFilterSnowCase.status.push("18");
					sFilterSnowCase.status.push("6");
					break;
					//incident filter
				case "E0001": //new
					sFilterSnowCase.status.push("1");
					break;
				case "E0002": //in process
					sFilterSnowCase.status.push("10");
					break;
					//snow status filter	
				case "18": //awaiting info
					sFilterSnowCase.status.push("18");
					break;
				case "6": //Resolved
					sFilterSnowCase.status.push("6");
					break;
				default:
					if (sFilterSnowCase.status.indexOf("empty") === -1) {
						sFilterSnowCase.status.push("empty");
					}
					break;
				}
			});
			if (sFilterSnowCase.status.length === 0) {
				sFilterSnowCase.status = ["1", "10", "18"]; //, "6"
			}
			var sTimePeriod = oView.byId(sFilterCtrlID + "TimeFilter").getSelectedKey();
			if (sTimePeriod && sTimePeriod !== "6") {
				sFilterSnowCase.timePeriod = this.getTimePeriod(sTimePeriod, "String19"); //DateTime means ChangeAt field is type DateTime
			}
			return sFilterSnowCase;

		},
		getFilter: function (bAllTab, sTabName) { //aAllTab = true means get filter in all tab
			var oView = this.getView(),
				that = this;
			this.oFilter[sTabName] = [];
			var aFilter = [];
			//default filter criteria
			if (sTabName === "businessDown") {
				aFilter.push(new Filter("CustomerNo", "EQ", this.sCustomerNo));
				aFilter.push(new Filter("Description", "EQ", "searchbycustomer"));
				aFilter.push(new Filter("Escalation", "EQ", "15"));
			} else if (sTabName === "incident") {
				aFilter.push(new Filter("CustomerNo", "EQ", this.sCustomerNo));
				aFilter.push(new Filter("Description", "EQ", "searchbycustomer"));
			} else if (sTabName === "situation") {
				aFilter.push(new Filter("CustomerNo", "EQ", this.sCustomerNo));
			}
			//Priority filter
			var aPriorityItems = [],
				sPriorityCodes = "",
				aPriorityFilter = [],
				sPriorityFilter = "";
			var sFilterCtrlID = bAllTab ? "all" : sTabName;
			aPriorityItems = oView.byId(sFilterCtrlID + "PriorityFilter").getSelectedItems();
			aPriorityItems.forEach(function (x) {
				sPriorityCodes = x.getKey();
				if (sTabName === "incident" && (sPriorityCodes === "5" || sPriorityCodes === "9")) {
					that.hasPriorityMediumLow = true;
				} else if (sTabName === "incident" && (sPriorityCodes === "1" || sPriorityCodes === "3")) {
					that.hasPriorityVeryHigh = true;
					aPriorityFilter.push(new Filter("Priority", "EQ", sPriorityCodes));
				} else {
					aPriorityFilter.push(new Filter("Priority", "EQ", sPriorityCodes));
				}
			});
			if (aPriorityFilter.length > 1) {
				sPriorityFilter = new Filter({
					filters: aPriorityFilter,
					and: false
				});
				aFilter.push(sPriorityFilter);
			} else if (aPriorityFilter.length === 1) {
				sPriorityFilter = aPriorityFilter[0];
				aFilter.push(sPriorityFilter);
			}

			var aStatusItems = [],
				sStatusCodes = "",
				aStatusFilter = [],
				sStatusFilter = "";
			var statusFieldName = (sTabName === "situation") ? "Action" : "Status";
			aStatusItems = oView.byId(sFilterCtrlID + "StatusFilter").getSelectedItems();
			aStatusItems.forEach(function (x) {
				sStatusCodes = x.getKey();
				if (!bAllTab) {
					aStatusFilter.push(new Filter(statusFieldName, "EQ", sStatusCodes));
					if (sStatusCodes === "cust_req_compl" || sStatusCodes === "NoCompleteIncident") {
						this.getModel("customerPageConfig").setProperty("/closed/" + sTabName, true);
					}
				} else {
					if (sTabName === "situation") {
						switch (sStatusCodes) {
						case "E0010": //new
							aStatusFilter.push(new Filter("Action", "EQ", "cust_req_new"));
							break;
						case "E0011": //Non Complete(Excl. New)
							aStatusFilter.push(new Filter({
								filters: [
									new Filter("Action", "NE", "cust_req_new"),
									new Filter("Action", "EQ", "cust_req_inproc")
								],
								and: true
							}));
							break;
						case "E0014":
							aStatusFilter.push(new Filter("Action", "EQ", "cust_req_compl")); //complete
							this.getModel("customerPageConfig").setProperty("/closed/all", true);
							break;
						default:
							aStatusFilter.push(new Filter("Action", "EQ", "cust_req_all"));
							break;
						}
					} else if (sTabName === "incident" || sTabName === "businessDown") {
						switch (sStatusCodes) {
						case "E0010": //new
							aStatusFilter.push(new Filter("Status", "EQ", "E0001"));
							break;
						case "E0011": //Non Complete(Excl. New)
							aStatusFilter.push(new Filter("Status", "NE", "E0001"));
							break;
						case "E0014":
							aStatusFilter.push(new Filter("Status", "EQ", "NoCompleteIncident")); //complete
							this.getModel("customerPageConfig").setProperty("/closed/all", true);
							break;
						}
					}
				}
			}.bind(this));
			if (aStatusFilter.length > 1) {
				sStatusFilter = new Filter({
					filters: aStatusFilter,
					and: false
				});
				aFilter.push(sStatusFilter);
			} else if (aStatusFilter.length === 1) {
				sStatusFilter = aStatusFilter[0];
				aFilter.push(sStatusFilter);
			}

			if (aStatusFilter.length === 0) {
				if (!bAllTab) {
					this.oFilter.bStatus[sTabName] = false;
				} else {
					this.oFilter.bStatus[sTabName + "All"] = false;
				}
			} else {
				if (!bAllTab) {
					this.oFilter.bStatus[sTabName] = true;
				} else {
					this.oFilter.bStatus[sTabName + "All"] = true;
				}
			}
			/*else if (sTabName === "situation") {
						//		aFilter.push(new Filter("Action", "EQ", "cust_req_all")); //default filter criticia for Critical situation 
						aStatusFilter.push(new Filter("Action", "EQ", "cust_req_new"));
							aStatusFilter.push(new Filter({
								filters: [
									new Filter("Action", "NE", "cust_req_new"),
									new Filter("Action", "EQ", "cust_req_inproc")
								],
								and: true
							}));
							sStatusFilter = new Filter({
								filters: aStatusFilter,
								and: false
							});
							aFilter.push(sStatusFilter);
					}*/
			var sTimePeriod = oView.byId(sFilterCtrlID + "TimeFilter").getSelectedKey();
			if (sTimePeriod && sTimePeriod !== "6") {
				if (sTabName === "incident" || sTabName === "businessDown" || sTabName === "situation") {
					aFilter.push(new Filter("ChangedAt", "GE", this.getTimePeriod(sTimePeriod, "DateTime"))); //DateTime means ChangeAt field is type DateTime
				} 
				/*else if (sTabName === "situation") {
					aFilter.push(new Filter("ChangedAt", "GE", this.getTimePeriod(sTimePeriod, "String14"))); //String14 means ChangeAt field is type String with length 14
				}*/
			}
			/******comment: under each tab, if filter criteria is more then default filter criteria, then display icon sap-icon://filter, otherwise display icon  sap-icon://clear-filter******/
			var oData = this.getModel("filterOptionModel").getData();
			if (!bAllTab) {
				switch (sTabName) {
				case "situation":
					oData[sTabName + "FilterIcon"] = (aFilter.length > 2) ? "sap-icon://filter" : "sap-icon://clear-filter";
					break;
				case "businessDown":
					oData[sTabName + "FilterIcon"] = (aFilter.length > 3) ? "sap-icon://filter" : "sap-icon://clear-filter";
					break;
				case "incident":
					oData[sTabName + "FilterIcon"] = (aFilter.length > 2) ? "sap-icon://filter" : "sap-icon://clear-filter";
					break;
				}
			}
			this.getModel("filterOptionModel").setData(oData);
			this.getModel("filterOptionModel").refresh();
			return aFilter;
		},

		//bInitialRequest is flag, if false means we are requesting all the snow esc not currently in the ui via 'see more'
		loadSnowEscalationData: function (bClosed) {
			if (bClosed === true) {
				var filterState = "%5eesca_state=102%5eOResca_state=103";
			} else {
				var filterState = "%5eesca_state!=102%5eesca_state!=103";
			}
			var sUrl = sap.support.fsc2.servicenowEscalationByCustomerUrl + "?sysparm_query=cs_account.number%3D" + this.sCustomerNo +
				filterState;
			$.ajax({
				method: "GET",
				contentType: "application/json",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				url: sUrl,
				success: function (oData) {
					var aData = [];
					var aBudData = [];
					oData.result.forEach(function (x) {
						var addData = true;
						if (x.esca_state === "102" || x.esca_state === "103" && ((new Date() - new Date(x.esca_sys_updated_on)) / (1000 * 3600 * 24)) >
							60) {
							addData = false; // older than 2 months in final state
						}
						if (addData === true) {
							if(x.esca_u_escalation_type === "0") {
								// push to business down
								aBudData.push({
									"ID": x.esca_number,
									"EscalationSysID": x.esca_sys_id,
									"ShortID": x.esca_u_bcp_correlation_id,
									"Name": x["cs_account.name"],
									"Component": x["u_app_component.u_name"],
									"ComponentName": x["u_app_component.u_short_description"],
									"Description": x.esca_short_description,
									"Priority": x.esca_priority,
									"PriorityID": x.esca_priority,
									"Priority_sortby": (x.esca_priority === "2") ? "3" : x.esca_priority,
									"Status": formatter.SnowEscalationStatusTxt(x.esca_state),
									"Action": "" /*that.checkIcdFavorite(x.number)*/ , //"",
									"Field": "",
									//TYPE: escalation record ADD FOR FAVS i338673
									"Escalation": x.escalation === "1" ? true : false,
									"Active": x.u_responsible_party === "sno" ? "true" : false,
									"ChangedAt": new Date(x.esca_sys_updated_on),
									"UpdateAt": /*"Updated: " + */ formatter.formatDateTime6(x.esca_sys_updated_on),
									"UpdateDate": formatter.formatDateTime5(x.esca_sys_updated_on, true), // "09022020125054"formatter.formatTime1(oData.results[i].ChangedAt, true)
									"Update_sortby": formatter.formatDateTime7(x.esca_sys_updated_on),
									"TransType": x.esca_sys_class_name,
									"EscType": x.esca_u_escalation_type,
									"StatusTxt": formatter.SnowEscalationStatusTxt(x.esca_state)
								});
							} else {
								aData.push({
									"ID": x.esca_number,
									"EscalationSysID": x.esca_sys_id,
									"ShortID": x.esca_u_bcp_correlation_id,
									"Name": x["cs_account.name"],
									"Component": x["u_app_component.u_name"],
									"ComponentName": x["u_app_component.u_short_description"],
									"Description": x.esca_short_description,
									"Priority": x.esca_priority,
									"PriorityID": x.esca_priority,
									"Priority_sortby": (x.esca_priority === "2") ? "3" : x.esca_priority,
									"Status": formatter.SnowEscalationStatusTxt(x.esca_state),
									"Action": "" /*that.checkIcdFavorite(x.number)*/ , //"",
									"Field": "",
									//TYPE: escalation record ADD FOR FAVS i338673
									"Escalation": x.escalation === "1" ? true : false,
									"Active": x.u_responsible_party === "sno" ? "true" : false,
									"ChangedAt": new Date(x.esca_sys_updated_on),
									"UpdateAt": /*"Updated: " + */ formatter.formatDateTime6(x.esca_sys_updated_on),
									"UpdateDate": formatter.formatDateTime5(x.esca_sys_updated_on, true), // "09022020125054"formatter.formatTime1(oData.results[i].ChangedAt, true)
									"Update_sortby": formatter.formatDateTime7(x.esca_sys_updated_on),
									"TransType": x.esca_sys_class_name,
									"EscType": x.esca_u_escalation_type,
									"StatusTxt": formatter.SnowEscalationStatusTxt(x.esca_state)
								});
							}
						}
					});
					var situationModel = this.getModel("customerPageConfig").getProperty("/situation");
					var iTotalEscalations = aData.length;
					var aSnowEscalation = aData;
					// business down esc
						this.getModel("customerPageConfig").setProperty("/businessDown", {
							"count": aBudData.length,
							"results": aBudData,
							"loadComplete": true //Check what this is used for
						});
						this.loadBusDownData(false, "businessDown", false);
					if (bClosed === true) {
						if (aData.length === 0) {
							this.getModel("customerPageConfig").setProperty("/NoClosed/snowEscalation", true);
							this.showNoClosedMsg();
						}
						this.getModel("customerPageConfig").setProperty("/situation", {
							"count": situationModel.count,
							"results": situationModel.results.concat(aSnowEscalation),
							"loadComplete": true //Check what this is used for
						});
						this.getModel("customerPageConfig").setProperty("/all", {
							"count": this.oAll.count,
							"results": this.getModel("customerPageConfig").getProperty("/all/results").concat(aSnowEscalation).concat(aBudData),
							"loadComplete": true 
						});
						this.oAll = {
							"count": this.oAll.results.length,
							"results": this.oAll.results.concat(aSnowEscalation).concat(aBudData)
						};
						this.getModel("customerPageConfig").setProperty("/snowEscalation", {
							"count": this.getModel("customerPageConfig").getProperty("/snowEscalation/count") + aSnowEscalation.length,
							"results": this.getModel("customerPageConfig").getProperty("/snowEscalation/results").concat(aSnowEscalation),
							"loadComplete": true //Check what this is used for
						});
					} else {
						var aSortedAll = this.oAll.results.concat(aSnowEscalation).concat(aBudData).sort(function (a, b) {
							var bSorter = parseInt(a.Priority_sortby) - parseInt(b.Priority_sortby);
							if (bSorter !== 0) {
								return bSorter;
							} else {
								bSorter = b.Update_sortby - a.Update_sortby;
								return bSorter;
							}
						});
						this.getModel("customerPageConfig").setProperty("/situation", {
							"count": situationModel.count + iTotalEscalations,
							"results": situationModel.results.concat(aSnowEscalation),
							"loadComplete": true //Check what this is used for
						});
						// this.getModel("customerPageConfig").setProperty("/all", {
						// 	"count": this.oAll.count + iTotalEscalations,
						// 	"results": aSortedAll,
						// 	"loadComplete": true //Check what this is used for
						// });
						
						/*
						// changed:, as duplicate records appear using filter
						this.oAll = {
							"count": aSortedAll.length,
							"results": aSortedAll
						};*/
						this.getModel("customerPageConfig").setProperty("/snowEscalation", {
							"count": iTotalEscalations,
							"results": aSnowEscalation,
							"loadComplete": true //Check what this is used for
						});
						
						// changed:, direct update for /all/results, as duplicate records appear during merge of this.oAll.result
						this.getModel("customerPageConfig").setProperty("/all/results", aSortedAll);
						this.getModel("customerPageConfig").setProperty("/all/count", aSortedAll.length);
					}
					this.getModel("customerPageConfig").setProperty("/situation/loadComplete", true);//just in case i missd something 
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		loadSnowCaseData: function (bClosed, tabFlag, dFlag) {
			var that = this,
				oAllIncident;
			var sEnableSnowCase = this.getModel("EnableSnowCase").getProperty("/bEnable");
			if (!sEnableSnowCase) {
				switch (tabFlag) {
				case "allTab":
					this.getModel("customerPageConfig").setProperty("/all/loadSnowCase", true);
					this.loadAllDataComplete(dFlag, bClosed);
					break;
				case "bothTab":
					this.getModel("customerPageConfig").setProperty("/snowCase", {
						"count": 0,
						"results": [],
						"loadComplete": true
					});
					this.getModel("customerPageConfig").setProperty("/all/loadSnowCase", true);
					this.loadAllDataComplete(dFlag, bClosed);
					break;
				case "snowCase":
					this.getModel("customerPageConfig").setProperty("/snowCase", {
						"count": 0,
						"results": [],
						"loadComplete": true
					});
					break;
				}
				return;
			}
			var oDataService = {
				"sysparm_fields": "u_major_case_usage,u_ccs_service_request_id,sys_updated_on,number,correlation_display,sys_updated_by,escalation,sys_id,short_description,correlation_id,u_case_number,priority,state,account.number,account.name,account.country,description,u_contract_type_list,u_time_with_agent,u_time_with_customer,u_app_component.u_name,u_app_component.u_short_description,assignment_group.name,assigned_to.user_name,assigned_to.name,u_deployed_item.u_sid,u_deployed_item.u_environment,business_impact,u_deployed_item.u_number,contact.name,u_responsible_party,partner.name,partner.number,resolution_code,resolved_by,resolved_at,close_notes,u_deployed_item.u_data_center_region,u_deployed_item.u_data_center,u_last_user_updated_by,opened_at,closed_at,u_sold_item.u_sold_item_name,u_escalation_type,u_escalation_reason,active_escalation.opened_at"
			};
			var sStatusPara = "";
			var sPrioPara = "";
			var oFilterSnowCase;
			switch (tabFlag) {
			case "allTab":
				oFilterSnowCase = this.oFilter.all.snowCase;
				break;
			case "snowCase":
				oFilterSnowCase = this.oFilter.snowCase;
				break;
			default:
				oFilterSnowCase = this.oFilter.all.snowCase;
				break;
			}
			var sUrl = sap.support.fsc2.servicenowUrl + "?sysparm_query=u_responsible_party=sno";
			sUrl = (oFilterSnowCase.timePeriod === "") ? sUrl : sUrl + "%5esys_updated_on>" + oFilterSnowCase.timePeriod;
			oFilterSnowCase.priority.forEach(function (sPrio, index) {
				switch (index) {
				case 0:
					sPrioPara = "priority=" + sPrio;
					break;
				default:
					sPrioPara = sPrioPara + "%5eOR" + "priority=" + sPrio;
					break;
				}
			});
			sUrl = (sPrioPara === "") ? sUrl : sUrl + "%5e" + sPrioPara;

			if (bClosed === true) {
				sUrl = sUrl + "%5estate=3%5eORstate=6";
			} else if (dFlag) {
				sUrl = sUrl + "%5estate=1%5eORstate=10%5eORstate=18%5eORstate=6";
			} else {
				oFilterSnowCase.status.forEach(function (sStatus, index) {
					switch (index) {
					case 0:
						sStatusPara = "state=" + sStatus;
						break;
					default:
						sStatusPara = sStatusPara + "%5eOR" + "state=" + sStatus;
						break;
					}
				});
				sUrl = (sStatusPara === "") ? sUrl + "%5estate=1%5eORstate=10%5eORstate=18" : sUrl + "%5e" + sStatusPara; //%5eORstate=6
			}
			sUrl = sUrl + "&account.number=" + this.sCustomerNo + "&sysparm_fields=" + oDataService.sysparm_fields;

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
						var addData = true;
						if (x.u_major_case_usage === "") { //if not a mjor case, can enhance request instead of hanlde on front end
							if (x.state === "3" && ((new Date() - new Date(x.sys_updated_on)) / (1000 * 3600 * 24)) > 60) {
								addData = false; // older than 2 months in final state
							}
							if (addData === true) {
								aData.push({
									"ID": x.correlation_display,
									"SNow_number": x.number,
									"Description": x.short_description,
									"CreateAt": "Created: " + formatter.formatDateTime6(x.opened_at), //x.opened_at, //2017-03-02T09:47:57
									"UpdateAt": /*"Updated: " + */ formatter.formatDateTime6(x.sys_updated_on),
									"CreateDate": formatter.formatDateTime5(x.opened_at),
									"UpdateDate": formatter.formatDateTime5(x.sys_updated_on), //used to download
									"Update_sortby": formatter.formatDateTime7(x.sys_updated_on), //used to sort
									"CustomerName": x["account.name"],
									"PriorityCode": x.priority,
									"Priority_sortby": (x.priority === "2") ? "3" : x.priority,
									"Priority": formatter.SnowCasePriorityTxt(x.priority),
									"Status": formatter.SnowCaseStatusTxt(x.state),
									"EntryKey": x.number,
									"TransType": "ZTINP",
									"Component": x["u_app_component.u_name"],
									"IncidentNo": formatter.formatNumString(x.correlation_id),
									"Escalation": x.escalation,
									"CustomerNumber": x["account.number"],
									"SysID": x["u_deployed_item.u_sid"], //x.sys_id,
									"Installation": x["u_deployed_item.u_number"],
									"ContractType": formatter.formatContractDes(x.u_contract_type_list),
									"ProcessorOrg": x["assignment_group.name"],
									"Processor": x["assigned_to.name"] + "(" + x["assigned_to.user_name"] + ")",
									"DaysatCustomer": formatter.formatDateToDays(x["u_time_with_agent"]),
									"DaysatSAP": formatter.formatDateToDays(x["u_time_with_customer"])
								});
							}
						}
					});
					var sBcCount = this.getModel("customerPageConfig").getProperty("/bcIncident/count");
					var sBcResult = this.getModel("customerPageConfig").getProperty("/bcIncident/results");
					var sBcLoadComplete = this.getModel("customerPageConfig").getProperty("/bcIncident/loadComplete");
					var oResultNumber = aData.length;
					if (bClosed === true) {
						if (aData.length === 0) {
							this.getModel("customerPageConfig").setProperty("/NoClosed/snowCase", true);
							this.showNoClosedMsg();
						}
						if (tabFlag === "allTab") {
							this.oAll = {
								"count": this.oAll.count, //oResultNumber + this.oAll.count, 
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadSnowCase", true);
							this.loadAllDataComplete(dFlag, bClosed);
						} else if (!dFlag && (tabFlag === "snowCase" || tabFlag === "bothTab")) {
							this.getModel("customerPageConfig").setProperty("/snowCase", {
								"count": this.getModel("customerPageConfig").getProperty("/snowCase/count"),
								"results": this.getModel("customerPageConfig").getProperty("/snowCase/results").concat(aData),
								"loadComplete": true
							});
							this.getModel("customerPageConfig").setProperty("/incident", {
								"count": this.getModel("customerPageConfig").getProperty("/incident/count"),
								"results": this.getModel("customerPageConfig").getProperty("/incident/results").concat(aData),
								"loadComplete": true
							});
							/*	if (sBcLoadComplete) {
									oAllIncident = this.getModel("customerPageConfig").getProperty("/snowCase/results").concat(sBcResult.concat(aData));
									this.getModel("customerPageConfig").setProperty("/incident", {
										"count": this.getModel("customerPageConfig").getProperty("/incident/count"),
										"results": oAllIncident,
										"loadComplete": true
									});
								}*/
						}
						if (tabFlag === "bothTab") {
							this.oAll = {
								"count": this.oAll.count,
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadSnowCase", true);
							this.loadAllDataComplete(false, bClosed);
						}
					} else {
						if (tabFlag === "allTab") {
							this.oAll = {
								"count": this.oAll.count + oResultNumber, //oResultNumber + this.oAll.count, 
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadSnowCase", true);
							this.loadAllDataComplete(dFlag, bClosed);
						} else if (dFlag && tabFlag === "snowCase") {
							this.getModel("customerPageConfig").setProperty("/snowCase/loadComplete", true);
							if (sBcLoadComplete) {
								var oDownloadList = this.getModel("downloadModel").getProperty("/results");
								oDownloadList = aData.concat(oDownloadList);
								oDownloadList.sort(function (a, b) {
									var bSorter = parseInt(a.Priority_sortby) - parseInt(b.Priority_sortby);
									if (bSorter !== 0) {
										return bSorter;
									} else {
										bSorter = b.Update_sortby - a.Update_sortby;
										return bSorter;
									}
								});
								this.getModel("downloadModel").setData({
									"results": oDownloadList
								});
								this.exportData();
							} else {
								this.getModel("downloadModel").setData({
									"results": aData
								});
							}
						} else if (!dFlag && tabFlag === "snowCase") {
							this.getModel("customerPageConfig").setProperty("/snowCase", {
								"count": oResultNumber,
								"results": aData,
								"loadComplete": true
							});
							if (sBcLoadComplete) {
								oAllIncident = sBcResult.concat(aData);
								oAllIncident.sort(function (a, b) {
									var bSorter = parseInt(a.Priority_sortby) - parseInt(b.Priority_sortby);
									if (bSorter !== 0) {
										return bSorter;
									} else {
										bSorter = b.Update_sortby - a.Update_sortby;
										return bSorter;
									}
								});

								this.getModel("customerPageConfig").setProperty("/incident", {
									"count": sBcCount + oResultNumber,
									"results": oAllIncident,
									"loadComplete": true
								});
							}
						} else if (tabFlag === "bothTab") {
							this.getModel("customerPageConfig").setProperty("/snowCase", {
								"count": oResultNumber,
								"results": aData,
								"loadComplete": true
							});
							if (sBcLoadComplete) {
								oAllIncident = sBcResult.concat(aData);
								oAllIncident.sort(function (a, b) {
									var bSorter = parseInt(a.Priority_sortby) - parseInt(b.Priority_sortby);
									if (bSorter !== 0) {
										return bSorter;
									} else {
										bSorter = b.Update_sortby - a.Update_sortby;
										return bSorter;
									}
								});
								this.getModel("customerPageConfig").setProperty("/incident", {
									"count": sBcCount + oResultNumber,
									"results": oAllIncident,
									"loadComplete": true
								});
							}
							this.oAll = {
								"count": this.oAll.count + oResultNumber,
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadSnowCase", true);
							this.loadAllDataComplete(false, bClosed);
						}
					}
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		loadCaseData: function (bClosed, tabFlag, dFlag) {
			this.oIconTab.setBusy(true);
			/******comment: only load case with defaut filter criteria******/
			var aFilter = [
				new Filter("customer_r3_no", "EQ", this.sCustomerNo),
				new Filter("case_type", "EQ", "ZS01")
			];
			if (bClosed === true) {
				aFilter.push(new Filter({
					filters: [new Filter("status", "EQ", "50"), new Filter("status", "EQ", "40")],
					and: false
				}));
			}
			/* else if (!dFlag) {
							aFilter.push(new Filter({
								filters: [new Filter("status", "NE", "50"), new Filter("status", "NE", "40")],
								and: true
							}));
						}*/
			sap.support.fsc2.FSC2Model.read("/CasesSet", {
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				filters: aFilter,
				success: function (oData) {
					var aData = [];
					for (var i = 0; i < oData.results.length; i++) {
						var addData = true;
						if ((bClosed === true || dFlag) && (oData.results[i].status === "40" || oData.results[i].status === "50") && ((new Date() -
									new Date(oData.results[i].change_time)) /
								(1000 * 3600 * 24)) > 60) {
							addData = false; // older than 2 months in final state
						} else if (bClosed !== true && !dFlag && (oData.results[i].status === "40" || oData.results[i].status === "50")) {
							addData = false; // initially only show open 
						}
						if (addData === true) {
							var oEntry = {
								"ID": formatter.trimPreZeros(oData.results[i].case_id),
								"Description": oData.results[i].case_title,
								"CreateAt": formatter.formatTime3(oData.results[i].create_time, false), //20040924110541
								"UpdateAt": formatter.formatTime3(oData.results[i].change_time, false), //20170406073400
								"UpdateDate": formatter.formatTime3(oData.results[i].change_time, true),
								"Update_sortby": formatter.formatDateTime10(oData.results[i].change_time),
								"CustomerName": oData.results[i].customer_name,
								"Priority": oData.results[i].priority_text,
								"Status": oData.results[i].status_text,
								"EntryKey": oData.results[i].case_id,
								"TransType": oData.results[i].case_type // ZS01
							};
							aData.push(oEntry);
						}
					}
					if (bClosed === true) {
						if (aData.length === 0) {
							this.getModel("customerPageConfig").setProperty("/NoClosed/case", true);
							this.showNoClosedMsg();
						}
						if (!dFlag && (tabFlag === "case" || tabFlag === "bothTab")) { //click show more button on case tab
							this.getModel("customerPageConfig").setProperty("/case", {
								"count": this.getModel("customerPageConfig").getProperty("/case/count"),
								"results": this.getModel("customerPageConfig").getProperty("/case/results").concat(aData),
								"loadComplete": true
							});
							this.oIconTab.setBusy(false);
						}
						if (tabFlag === "allTab" || tabFlag === "bothTab") { //click show more button on all tab
							this.oAll = {
								"count": this.oAll.count,
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadCase", true);
							this.loadAllDataComplete(dFlag, bClosed);
							this.oIconTab.setBusy(false);
						}
					} else {
						if (!dFlag && (tabFlag === "case" || tabFlag === "bothTab")) { //click show more button on case tab
							this.getModel("customerPageConfig").setProperty("/case", {
								"count": aData.length,
								"results": aData,
								"loadComplete": true
							});
							this.oIconTab.setBusy(false);
						} else if (dFlag && tabFlag === "case") { //download case list
							this.getModel("downloadModel").setData({
								"results": aData
							});
							this.exportData();
							this.oIconTab.setBusy(false);
						}
						if (tabFlag === "allTab" || tabFlag === "bothTab") { //click show more button on all tab
							this.oAll = {
								"count": aData.length + this.oAll.count,
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadCase", true);
							this.loadAllDataComplete(dFlag, bClosed);
							this.oIconTab.setBusy(false);
						}
					}
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.oIconTab.setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		loadRequestData: function (bClosed, tabFlag, dFlag) {
			this.oIconTab.setBusy(true);
			var aReqFilter = [];
			switch (tabFlag) {
			case "allTab":
				aReqFilter = this.oFilter.all.situation;
				break;
			case "situation":
				aReqFilter = this.oFilter.situation;
				break;
			default:
				aReqFilter = this.oFilter.all.situation;
				break;
			}
			if (bClosed === true) {
				/*new Filter({
							filters: [new Filter("Status", "EQ", "E0014"), new Filter("Status", "EQ", "E0007"), new Filter("Status", "EQ", "E0012")],
							and: false
						})	*/
				aReqFilter.push(new Filter("Action", "EQ", "cust_req_compl"));
			} else if (!dFlag && ((this.oFilter.bStatus.situation === false && tabFlag === "situation") || (this.oFilter.bStatus.situationAll ===
					false && tabFlag === "allTab") || tabFlag === "bothTab")) {
				/*	var sStatusFilter = new Filter({
						filters: [new Filter("Action", "EQ", "cust_req_new"),
							new Filter("Action", "EQ", "cust_req_inproc")
						],

						and: false
					});
					aReqFilter.push(sStatusFilter);*/
				aReqFilter.push(new Filter("Action", "EQ", "cust_req_inproc"));
			}
			/* else if (!dFlag) {
							aReqFilter.push(new Filter({
								filters: [new Filter("Status", "NE", "E0014"), new Filter("Status", "NE", "E0007"), new Filter("Status", "NE", "E0012")],
								and: true
							}));
						}*/

			sap.support.fsc2.FSC2Model.read("/FSC2RequestSet", {
				filters: aReqFilter,
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					var aData = [];
					var oResultNumber = 0;
					for (var i = 0; i < oData.results.length; i++) {
						var addData = true;
						if (oData.results[i].Status === "E0014" || oData.results[i].Status === "E0007" || oData.results[i].Status === "E0012" && ((
								new Date() - new Date(oData.results[i].ChangedAt)) / (1000 * 3600 * 24)) > 60) {
							addData = false; // older than 2 months in final state
						}
						//if statement for simplicity sake rather changing existing functionality
						if (oData.results[i].TransType !== "ZS90" && addData === true) {
							var oEntry = {
								"ID": formatter.trimPreZeros(oData.results[i].ID),
								"Description": oData.results[i].Description,
								"CreateAt": formatter.formatTime1(oData.results[i].CreateAt, false), //13122006101557
								"UpdateAt": formatter.formatRequestDate(oData.results[i].ChangedAt, false), //20170406073400
								"UpdateDate": formatter.formatTime1(oData.results[i].ChangedAt, true),
								"Update_sortby": formatter.formatDateTime9(oData.results[i].ChangedAt),
								"Status": oData.results[i].StatusTxt,
								"CustomerName": oData.results[i].CustomerName,
								"EntryKey": oData.results[i].ID,
								"TransType": oData.results[i].TransType,
								"Priority": oData.results[i].Priority
							};
							aData.push(oEntry);
						}

					}
					oResultNumber = aData.length; //oData.results[0].ResultNumber;
					if (bClosed === true) {
						if (aData.length === 0) {
							this.getModel("customerPageConfig").setProperty("/NoClosed/situation", true);
							this.showNoClosedMsg();
						}
						if (tabFlag === "allTab") {
							var snowEscalationModel = this.getModel("customerPageConfig").getProperty("/snowEscalation");
							this.oAll = {
								"count": this.oAll.count,
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadSituation", true);
							this.loadAllDataComplete(dFlag, bClosed);
						} else if (!dFlag && (tabFlag === "situation" || tabFlag === "bothTab")) {
							var situationModel = this.getModel("customerPageConfig").getProperty("/situation");
							this.getModel("customerPageConfig").setProperty("/situation", {
								"count": situationModel.count,
								"results": situationModel.results.concat(aData),
								//"loadComplete": true
							});
							this.oIconTab.setBusy(false);
						}
						if (tabFlag === "bothTab") { //initial request??? appears so c
							this.oAll = {
								"count": this.oAll.count,
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadSituation", true);
							this.loadAllDataComplete(false, bClosed);
							this.loadSnowEscalationData(true);
						}
					} else {
						if (tabFlag === "allTab") {
							var snowEscalationModel = this.getModel("customerPageConfig").getProperty("/snowEscalation");
							this.oAll = {
								// "count": oResultNumber + this.oAll.count, //+ snowEscalationModel.count,
								// "results": this.oAll.results.concat(aData) //.concat(snowEscalationModel.results)
								"count": oResultNumber + this.oAll.count + snowEscalationModel.count,
								"results": this.oAll.results.concat(aData).concat(snowEscalationModel.results)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadSituation", true);
							this.loadAllDataComplete(dFlag, bClosed);
						} else if (dFlag && tabFlag === "situation") {
							this.getModel("downloadModel").setData({
								"results": aData
							});
							this.exportData();
							this.oIconTab.setBusy(false);
						} else if (!dFlag && tabFlag === "situation") {
							//	var situationModel = this.getModel("customerPageConfig").getProperty("/situation");

							this.getModel("customerPageConfig").setProperty("/situation", {
								"count": oResultNumber, //situationModel.count,
								"results": aData, //situationModel.results.concat(aData),
								"loadComplete": false
							});
							this.loadSnowEscalationData();
							this.loadAllDataComplete(false, bClosed);
							this.oIconTab.setBusy(false);
						} else if (tabFlag === "bothTab") { //initial request??? appears so c
							this.getModel("customerPageConfig").setProperty("/situation", {
								"count": oResultNumber,
								"results": aData,
								//"loadComplete": true
							});
							this.oAll = {
								"count": oResultNumber + this.oAll.count,
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadSituation", true);
							this.loadAllDataComplete(false, bClosed);
							this.loadSnowEscalationData();
						}
					}
					this.oIconTab.setBusy(false);
					this.getView().setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.oIconTab.setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		loadBusDownData: function (bClosed, tabFlag, dFlag) {
			this.oIconTab.setBusy(true);
			var aReqFilter = [];

			switch (tabFlag) {
			case "allTab":
				aReqFilter = this.oFilter.all.businessDown;
				break;
			case "businessDown":
				aReqFilter = this.oFilter.businessDown;
				break;
			default:
				aReqFilter = this.oFilter.all.businessDown;
				break;
			}
			if (bClosed === true) {
				aReqFilter.push(new Filter("Status", "EQ", "NoCompleteIncident")); //complete);
			} else if (!dFlag && ((this.oFilter.bStatus.businessDown === false && tabFlag === "businessDown") || (this.oFilter.bStatus.businessDownAll ===
					false && tabFlag === "allTab") || tabFlag === "bothTab")) {
				aReqFilter.push(new Filter({
					filters: [new Filter("Status", "EQ", "E0001"),
						new Filter("Status", "NE", "E0001")
					],
					and: true
				}));
			}
			sap.support.fsc2.IncidentModel.read("/IncidentList", {
				filters: aReqFilter,
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					var aData = [];
					var oResultNumber = 0;
					for (var i = 0; i < oData.results.length; i++) {
						var addData = true;
						if (oData.results[i].Status === "6" || oData.results[i].Status === "E0009" || oData.results[i].Status === "E0010" && ((new Date() -
								new Date(oData.results[i].ChangedAt)) / (1000 * 3600 * 24)) > 60) {
							addData = false; // older than 2 months in final state
						}
						if (addData === true) {
							var oEntry = {
								"ID": formatter.trimPreZeros(oData.results[i].ObjectID) + "/" + oData.results[i].MessageYear,
								"Description": oData.results[i].Description,
								"CreateAt": formatter.formatTime2(oData.results[i].CreatedAt, false), //2017-03-02T09:47:57
								"UpdateAt": formatter.formatTime2(oData.results[i].ChangedAt, false),
								"CreateDate": formatter.formatTime4(oData.results[i].CreatedAt),
								"UpdateDate": formatter.formatTime4(oData.results[i].ChangedAt),
								"CustomerName": oData.results[i].CustomerName,
								"PriorityCode": oData.results[i].Priority,
								"Priority": oData.results[i].PriorityTxt,
								"Status": oData.results[i].StatusTxt,
								"EntryKey": oData.results[i].CssObjectID,
								"TransType": "ZTINB",
								"Component": oData.results[i].ComponentName,
								"IncidentNo": formatter.formatNumString(oData.results[i].CssObjectID),
								"Escalation": "Business Down",
								"CustomerNumber": oData.results[i].CustomerNo,
								"SysID": oData.results[i].SysID,
								"Installation": oData.results[i].Instno,
								"ContractType": oData.results[i].Contract_Type,
								"ProcessorOrg": oData.results[i].PROCESSOR_ORG,
								"Processor": (oData.results[i].Processor === "null") ? " " : oData.results[i].Processor,
								"DaysatCustomer": oData.results[i].DAYS_CUSTOMER,
								"DaysatSAP": oData.results[i].DAYS_SAP
							};
							aData.push(oEntry);
						}
					}
					if (!dFlag && oData.results.length > 0) {
						oResultNumber = aData.length; //oData.results[0].ResultNumber;
					}
					if (bClosed === true) {
						if (aData.length === 0) {
							this.getModel("customerPageConfig").setProperty("/NoClosed/businessDown", true);
							this.showNoClosedMsg();
						}
						if (!dFlag && tabFlag === "businessDown") {
							this.getModel("customerPageConfig").setProperty("/businessDown", {
								"count": this.getModel("customerPageConfig").getProperty("/businessDown/count"),
								"results": this.getModel("customerPageConfig").getProperty("/businessDown/results").concat(aData),
								"loadComplete": true
							});
						} else if (tabFlag === "bothTab") {
							this.getModel("customerPageConfig").setProperty("/businessDown", {
								"count": this.getModel("customerPageConfig").getProperty("/businessDown/count"),
								"results": this.getModel("customerPageConfig").getProperty("/businessDown/results").concat(aData),
								"loadComplete": true
							});
							this.loadAllDataComplete(false, bClosed);
						}
					} else {
						if (dFlag && tabFlag === "businessDown") {
							this.getModel("downloadModel").setData({
								"results": aData
							});
							this.exportData();
						} else if (!dFlag && tabFlag === "businessDown") {
							// this.getModel("customerPageConfig").setProperty("/businessDown", {
							// 	"count": oResultNumber,
							// 	"results": aData,
							// 	"loadComplete": true
							// });
							this.getModel("customerPageConfig").setProperty("/businessDown", {
								"count": this.getModel("customerPageConfig").getProperty("/businessDown/count") + oResultNumber,
								"results": this.getModel("customerPageConfig").getProperty("/businessDown/results").concat(aData),
								"loadComplete": true
							});
						} else if (tabFlag === "bothTab") {
							this.getModel("customerPageConfig").setProperty("/businessDown", {
								"count": oResultNumber,
								"results": aData,
								"loadComplete": true
							});
							
							this.loadAllDataComplete(false, bClosed);
						}
					}
					this.oIconTab.setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.oIconTab.setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		loadBcIncidentData: function (bClosed, tabFlag, dFlag) {
			var that = this;
			this.oIconTab.setBusy(true);
			var oAllIncident;
			var aReqFilter = [];
			var aSorter = [new sap.ui.model.Sorter("Priority", false), //Priority 1 very high 3high
				new sap.ui.model.Sorter("ChangedAt", true)
			];
			switch (tabFlag) {
			case "allTab":
				aReqFilter = this.oFilter.all.incident;
				break;
			case "bcIncident":
				aReqFilter = this.oFilter.incident;
				break;
			default:
				aReqFilter = this.oFilter.all.incident;
				break;
			}
			if (bClosed === true) {
				aReqFilter.push(new Filter("Status", "EQ", "NoCompleteIncident")); //complete);
			} else if (!dFlag && ((this.oFilter.bStatus.incident === false && tabFlag === "incident") || (this.oFilter.bStatus.incidentAll ===
					false && tabFlag === "allTab") || tabFlag === "bothTab")) {
				aReqFilter.push(new Filter({
					filters: [new Filter("Status", "EQ", "E0001"),
						new Filter("Status", "NE", "E0001")
					],
					and: true
				}));
			}
			sap.support.fsc2.IncidentModel.read("/IncidentList", {
				filters: aReqFilter,
				sorters: aSorter,
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oDataInit) {
					var oData = {
						"results": []
					};
					oData.results = oDataInit.results.filter(function (oItem) {
						return oItem.ActiveSystem !== "SNO";
					}); //remove duplicate data from BC*, by default all Snow Case will be exist in BC*
					var aData = [];
					var oResultNumber = 0;
					for (var i = 0; i < oData.results.length; i++) {
						var addData = true;
						if (oData.results[i].Status === "6" || oData.results[i].Status === "E0009" || oData.results[i].Status === "E0010" && ((new Date() -
								new Date(oData.results[i].ChangedAt)) / (1000 * 3600 * 24)) > 60) {
							addData = false; // older than 2 months in final state
						}
						if (addData === true) {
							var oEntry = {
								"ID": formatter.trimPreZeros(oData.results[i].ObjectID) + "/" + oData.results[i].MessageYear,
								"Description": oData.results[i].Description,
								"CreateAt": formatter.formatTime2(oData.results[i].CreatedAt, false), //2017-03-02T09:47:57
								"UpdateAt": formatter.formatTime2(oData.results[i].ChangedAt, false),
								"CreateDate": formatter.formatTime4(oData.results[i].CreatedAt),
								"UpdateDate": formatter.formatTime4(oData.results[i].ChangedAt),
								"Update_sortby": formatter.formatDateTime9(oData.results[i].ChangedAt),
								"CustomerName": oData.results[i].CustomerName,
								"PriorityCode": oData.results[i].Priority,
								"Priority_sortby": oData.results[i].Priority,
								"Priority": oData.results[i].PriorityTxt,
								"Status": oData.results[i].StatusTxt,
								"EntryKey": oData.results[i].CssObjectID,
								"TransType": "ZTINP", // tabFlag === "businessDown") ? "ZTINB" : "ZTINP"
								"Component": oData.results[i].ComponentName,
								"IncidentNo": formatter.formatNumString(oData.results[i].CssObjectID),
								"Escalation": oData.results[i].Escalation,
								"CustomerNumber": oData.results[i].CustomerNo,
								"SysID": oData.results[i].SysID,
								"Installation": oData.results[i].Instno,
								"ContractType": oData.results[i].Contract_Type,
								"ProcessorOrg": oData.results[i].PROCESSOR_ORG,
								"Processor": (oData.results[i].Processor === "null") ? " " : oData.results[i].Processor,
								"DaysatCustomer": oData.results[i].DAYS_CUSTOMER,
								"DaysatSAP": oData.results[i].DAYS_SAP
							};
							aData.push(oEntry);
						}
					}
					var snowLoadComplete = this.getModel("customerPageConfig").getProperty("/snowCase/loadComplete");
					var snowCount = this.getModel("customerPageConfig").getProperty("/snowCase/count");
					var snowResult = this.getModel("customerPageConfig").getProperty("/snowCase/results");
					if (!dFlag && oDataInit.results.length > 0) {
						// Changed by I321528 on Dec 17th 2019
						//oResultNumber = oData.results[0].ResultNumber;
						oResultNumber = aData.length; //oDataInit.results[0].ResultNumber;
					}
					if (bClosed === true) {
						if (aData.length === 0) {
							this.getModel("customerPageConfig").setProperty("/NoClosed/bcIncident", true);
							this.showNoClosedMsg();
						}
						if (tabFlag === "allTab") {
							this.oAll = {
								"count": this.oAll.count,
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadBcIncident", true);
							this.loadAllDataComplete(dFlag, bClosed);
						} else if (!dFlag && (tabFlag === "bcIncident" || tabFlag === "bothTab")) { //load all incident data both from snow amd BC incident
							this.getModel("customerPageConfig").setProperty("/bcIncident", {
								"count": this.getModel("customerPageConfig").getProperty("/bcIncident/count"),
								"results": this.getModel("customerPageConfig").getProperty("/bcIncident/results").concat(aData),
								"loadComplete": true
							});
							this.getModel("customerPageConfig").setProperty("/incident", {
								"count": this.getModel("customerPageConfig").getProperty("/incident/count"),
								"results": this.getModel("customerPageConfig").getProperty("/incident/results").concat(aData),
								"loadComplete": true
							});
							/*if (snowLoadComplete) {
								oAllIncident = this.getModel("customerPageConfig").getProperty("/bcIncident/results").concat(snowResult.concat(aData));
								this.getModel("customerPageConfig").setProperty("/incident", {
									"count": this.getModel("customerPageConfig").getProperty("/incident/count"), // + snowCount,
									"results": oAllIncident,
									"loadComplete": true
								});
							}*/
							this.oIconTab.setBusy(false);
						}
						if (tabFlag === "bothTab") {
							this.oAll = {
								"count": this.oAll.count,
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadBcIncident", true);
							this.loadAllDataComplete(false, bClosed);
						}
					} else {
						if (tabFlag === "allTab") {
							this.oAll = {
								"count": oResultNumber + this.oAll.count,
								"results": this.oAll.results.concat(aData)
							};
							this.getModel("customerPageConfig").setProperty("/all/loadBcIncident", true);
							this.loadAllDataComplete(dFlag, bClosed);
						} else if (dFlag && tabFlag === "bcIncident") { //download all data under incident list:snowCase + BC incident
							if (this.getModel("customerPageConfig").getProperty("/snowCase/loadComplete")) {
								var oDownloadList = this.getModel("downloadModel").getProperty("/results");
								oDownloadList = aData.concat(oDownloadList);
								oDownloadList.sort(function (a, b) {
									var bSorter = parseInt(a.Priority_sortby) - parseInt(b.Priority_sortby);
									if (bSorter !== 0) {
										return bSorter;
									} else {
										bSorter = b.Update_sortby - a.Update_sortby;
										return bSorter;
									}
								});
								this.getModel("downloadModel").setData({
									"results": oDownloadList
								});
								this.exportData();
							}
							this.oIconTab.setBusy(false);
						} else if (!dFlag && tabFlag === "bcIncident") { //load all incident data both from snow amd BC incident
							this.getModel("customerPageConfig").setProperty("/bcIncident", {
								"count": oResultNumber,
								"results": aData,
								"loadComplete": true
							});
							if (snowLoadComplete) {
								oAllIncident = aData.concat(snowResult);
								oAllIncident.sort(function (a, b) {
									var bSorter = parseInt(a.Priority_sortby) - parseInt(b.Priority_sortby);
									if (bSorter !== 0) {
										return bSorter;
									} else {
										bSorter = b.Update_sortby - a.Update_sortby;
										return bSorter;
									}
								});

								this.getModel("customerPageConfig").setProperty("/incident", {
									"count": oResultNumber + snowCount,
									"results": oAllIncident,
									"loadComplete": true
								});
							}
							this.oIconTab.setBusy(false);
						} else if (tabFlag === "bothTab") {
							this.getModel("customerPageConfig").setProperty("/bcIncident", {
								"count": oResultNumber,
								"results": aData,
								"loadComplete": true
							});
							this.oAll = {
								"count": oResultNumber + this.oAll.count,
								"results": this.oAll.results.concat(aData)
							};
							if (snowLoadComplete) {
								oAllIncident = aData.concat(snowResult);
								oAllIncident.sort(function (a, b) {
									var bSorter = parseInt(a.Priority_sortby) - parseInt(b.Priority_sortby);
									if (bSorter !== 0) {
										return bSorter;
									} else {
										bSorter = b.Update_sortby - a.Update_sortby;
										return bSorter;
									}
								});

								this.getModel("customerPageConfig").setProperty("/incident", {
									"count": oResultNumber + snowCount,
									"results": oAllIncident,
									"loadComplete": true
								});
							}
							this.getModel("customerPageConfig").setProperty("/all/loadBcIncident", true);
							this.loadAllDataComplete(false, bClosed);
						}
					}
					this.oIconTab.setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.oIconTab.setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		onOpenExpertDialog: function () { // same function in base controller, used herer still difference, possible refactor
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
							var sSelectedIndex = oRadioGroup.getSelectedIndex();
							if (sSelectedIndex === 0) {
								this.eventUsage("create\' view");
								this.getRouter().navTo("createByCustomerEnd", {
									layout: "EndColumnFullScreen",
									custnum: this.sCustomerNo,
									custname: encodeURIComponent(this.sCustomerName)
								});
								/*this.getRouter().navTo("createByCustomer", {
					custnum: this.sCustomerNo,
					custname: encodeURIComponent(this.sCustomerName)
				});*/
							} else {
								this.eventUsage("\'Escalation Request\' App");
								//this.getRouter().navTo("escalationRequestStart");
								this.getRouter().navTo("escalationRequestStart", {
									layout: "OneColumn",
									custnum: this.sCustomerNo
								});
							}
							this._oExpertDialog.close();
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
		onCreateSituation: function () {
			var oState = this.getModel("homePageConfig").getProperty("/expertMode");
			if (oState) {
				this.onOpenExpertDialog();
			} else {
				this.eventUsage("create\' view");
				this.getRouter().navTo("createByCustomerEnd", {
					layout: "EndColumnFullScreen",
					custnum: this.sCustomerNo,
					custname: encodeURIComponent(this.sCustomerName)
				});
			}
		},
		onSetFavorite: function () {
			sap.support.fsc2.UserProfileModel.create("/Entries", {
				"Attribute": "FAVORITE_CUSTOMERS",
				"Value": this.sCustomerNo
			}, {
				success: function () {
					this.eventUsage(false, "Set \'Customer\' favorite");
					this.getModel("customerPageConfig").setProperty("/_bFavorite", true);
					this.loadFavCustData();
					this.getEventBus().publish("Favorites", "_onRouteMatched");
				}.bind(this)
			});
		},
		onRemoveFavorite: function () {
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "FAVORITE_CUSTOMERS")
				],
				success: function (oData) {
					for (var i = 0; i < oData.results.length; i++) {
						if (oData.results[i].Value == parseInt(this.sCustomerNo)) {
							sap.support.fsc2.UserProfileModel.remove("/Entries(Username='',Attribute='FAVORITE_CUSTOMERS',Field='" + oData.results[i].Field +
								"')", {
									success: function () {
										this.eventUsage(false, "Set \'Customer\' unfavorite");
										this.getModel("customerPageConfig").setProperty("/_bFavorite", false);
										this.loadFavCustData();
										this.getEventBus().publish("Favorites", "_onRouteMatched");
									}.bind(this)
								});
							break;
						}
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("UserProfile Service Unavailable!");
				}
			});
		},
		onDownload: function () {
			var sKey = this.oTabBar.getSelectedKey();
			var bShowMore = this.getView().byId(sKey + "Toolbar").getVisible();
			if (!bShowMore) {
				var oWholeData = this.getModel("customerPageConfig").getData()[sKey];
				this.getModel("downloadModel").setData(oWholeData);
				this.exportData();
				return;
			}
			this.getModel("downloadModel").setData({
				"results": []
			});
			switch (sKey) {
			case "businessDown":
				this.eventUsage(false, "Download list - business down");
				this.loadBusDownData(false, "businessDown", true);
				break;
			case "incident":
				this.getModel("customerPageConfig").setProperty("/bcIncident/loadComplete", false);
				this.getModel("customerPageConfig").setProperty("/snowCase/loadComplete", false);
				this.eventUsage(false, "Download list - P1&P2 incident");
				this.loadSnowCaseData(false, "snowCase", true);
				this.loadBcIncidentData(false, "bcIncident", true);
				break;
			case "case":
				this.onCheckUserEscalationAuth(false, "case", true);
				break;
			case "situation":
				this.loadRequestData(false, "situation", true);
				break;
			case "all":
				this.getView().setBusy(true);
				this.eventUsage(false, "Download list - all");
				this.oAll = {
					"count": 0,
					"results": []
				};
				this.getModel("customerPageConfig").setProperty("/all/loadBcIncident", false);
				this.getModel("customerPageConfig").setProperty("/all/loadSnowCase", false);
				this.getModel("customerPageConfig").setProperty("/all/loadSituation", false);
				this.getModel("customerPageConfig").setProperty("/all/loadCase", false);
				this.loadAllData(false, "allTab", true);
				break;
			}
		},
		exportData: function () {
			var sKey = this.oTabBar.getSelectedKey(); //add fields when download incident list
			var sColumns = [{
				name: "ID",
				template: {
					content: {
						path: "ID"
					}
				}
			}, {
				name: "Description",
				template: {
					content: {
						path: "Description"
					}
				}
			}, {
				name: "Status",
				template: {
					content: {
						path: "Status"
					}
				}
			}];
			if (sKey === "businessDown" || sKey === "incident") {
				sColumns = [{
					name: "Incident Number",
					template: {
						content: {
							path: "IncidentNo"
						}
					}
				}, {
					name: "Incident Desc.",
					template: {
						content: {
							path: "Description"
						}
					}
				}, {
					name: "Priority",
					template: {
						content: {
							path: "Priority"
						}
					}
				}, {
					name: "Component",
					template: {
						content: {
							path: "Component"
						}
					}
				}, {
					name: "Status",
					template: {
						content: {
							path: "Status"
						}
					}
				}, {
					name: "Escalation",
					template: {
						content: {
							path: "Escalation"
						}
					}
				}, {
					name: "Customer Number",
					template: {
						content: {
							path: "CustomerNumber"
						}
					}
				}, {
					name: "Customer Name",
					template: {
						content: {
							path: "CustomerName"
						}
					}
				}, {
					name: "SysID",
					template: {
						content: {
							path: "SysID"
						}
					}
				}, {
					name: "Installation",
					template: {
						content: {
							path: "Installation"
						}
					}
				}, {
					name: "Contract Type",
					template: {
						content: {
							path: "ContractType"
						}
					}
				}, {
					name: "Processor Org",
					template: {
						content: {
							path: "ProcessorOrg"
						}
					}
				}, {
					name: "Processor",
					template: {
						content: {
							path: "Processor"
						}
					}
				}, {
					name: "Created At",
					template: {
						content: {
							path: "CreateDate"
						}
					}
				}, {
					name: "Changed At",
					template: {
						content: {
							path: "UpdateDate"
						}
					}
				}, {
					name: "Days at Customer",
					template: {
						content: {
							path: "DaysatCustomer"
						}
					}
				}, {
					name: "Days at SAP",
					template: {
						content: {
							path: "DaysatSAP"
						}
					}
				}];
			}
			var oExport = new Export({
				exportType: new ExportTypeCSV({
					separatorChar: ","
				}),
				models: this.getModel("downloadModel"),
				rows: {
					path: "/results"
				},
				columns: sColumns
			});
			oExport.saveFile();
		},
		onRowPress: function (oEvent) {
			var oObject = oEvent.getSource().getBindingContext("customerPageConfig").getObject();
			this.sType = this.oTabBar.getSelectedKey();
			//------------Changed by I319741: when user select one incident under 'All' tab, view should navto incidentDetail-------// 
			// this.sType === "businessDown" ||
			if (this.sType === "incident" || (this.sType === "all" && oObject.TransType === "ZTINP")) {
				this.eventUsage("incident\' view");
				var sIncidentNum = oObject.SNow_number ? oObject.SNow_number : oObject.EntryKey;
				// var sIncidentNum = oObject.EntryKey;
				this.getRouter().navTo("incidentEnd", {
					layout: "EndColumnFullScreen",
					id: sIncidentNum, //oObject.EntryKey,
					flag: false,
					sam: false
				});
			}
			if (this.sType === "case" || (this.sType === "all" && oObject.TransType === "ZS01")) {
				this.eventUsage("escalationCaseDetail \'view");
				this.getRouter().navTo("escalationCaseDetailEnd", {
					layout: "EndColumnFullScreen",
					id: oObject.ID
				});
			}
			if ((this.sType === "all" && oObject.TransType !== "ZS01") || this.sType === "history" || this.sType === "situation" || this.sType === "businessDown") {
				var sID = (oObject.TransType === "sn_customerservice_escalation") ? oObject.EscalationSysID : oObject.ID; // IF ESCA use esca sys id for nav
				this.onNavToCriticalRequest(oObject.TransType, sID, oObject.Status, 3);
			}
		},
		onSearch: function (oEvent) {
			this.eventUsage(false, "Search in \'customer\' view");
			var sValue = oEvent.getSource().getValue();
			var aFilters = [];
			var oFilter = [];
			var sTabKey = this.getView().byId("idIconTabBar").getSelectedKey();
			var sListID = sTabKey + "List";
			var sList = this.getView().byId(sListID);
			if (sList) {
				if (sValue && sValue.length > 0) {
					aFilters.push(new Filter("Description", sap.ui.model.FilterOperator.Contains, sValue));
					aFilters.push(new Filter("ID", sap.ui.model.FilterOperator.Contains, sValue));
					aFilters.push(new Filter("Status", sap.ui.model.FilterOperator.Contains, sValue));
					if (sTabKey === "incident" || sTabKey === "all") {
						aFilters.push(new Filter("SNow_number", sap.ui.model.FilterOperator.Contains, sValue));
					}
					oFilter = [
						new sap.ui.model.Filter(aFilters, false)
					];
					sList.getBinding("items").filter(oFilter);
				} else {
					sList.getBinding("items").filter();
				}
			}
		},
		onShowMore: function (oEvent) {
			var sKey = this.oTabBar.getSelectedKey();
			switch (sKey) {
			case "businessDown":
				this.getModel("customerPageConfig").setProperty("/closed/businessDown", true);
				this.oFilter.businessDown = this.getFilter(false, "businessDown");
				this.loadBusDownData(true, "businessDown", false);
				break;
			case "incident":
				this.getModel("customerPageConfig").setProperty("/bcIncident/loadComplete", false);
				this.getModel("customerPageConfig").setProperty("/snowCase/loadComplete", false);
				this.getModel("customerPageConfig").setProperty("/closed/incident", true);
				this.oFilter.snowCase = this.getFilter_snowCase(false);
				this.loadSnowCaseData(true, "snowCase", false);
				this.oFilter.incident = this.getFilter(false, "incident");
				this.loadBcIncidentData(true, "bcIncident", false);
				break;
			case "case":
				this.getModel("customerPageConfig").setProperty("/closed/case", true);
				this.oFilter.case = this.getFilter(false, "case");
				this.onCheckUserEscalationAuth(true, "case", false);
				break;
			case "situation":
				this.getModel("customerPageConfig").setProperty("/closed/situation", true);
				this.oFilter.situation = this.getFilter(false, "situation");
				this.loadRequestData(true, "situation", false);
				break;
			case "all":
				this.getView().setBusy(true);
				/*	this.oAll = {
						"count": 0,
						"results": []
					};*/
				this.getModel("customerPageConfig").setProperty("/closed/all", true);
				this.getModel("customerPageConfig").setProperty("/all/loadBcIncident", false);
				this.getModel("customerPageConfig").setProperty("/all/loadSnowCase", false);
				this.getModel("customerPageConfig").setProperty("/all/loadSituation", false);
				this.getModel("customerPageConfig").setProperty("/all/loadCase", false);
				this.getFilterCond_All();
				this.loadAllData(true, "allTab", false);
				break;
			}
			oEvent.getSource().getParent().setVisible(false);
		},
		showNoClosedMsg: function () {
			var noClosed = this.getModel("customerPageConfig").getProperty("/NoClosed");
			if (noClosed.situation === true && noClosed.snowCase === true && noClosed.bcIncident === true && noClosed.case === true && noClosed
				.snowEscalation === true && this.getModel("customerPageConfig").getProperty("/closed/all") === true) {
				sap.m.MessageBox.information("No closed records found within the last 2 months.");
				this.getModel("customerPageConfig").setProperty("/NoClosed/situation", false);
				this.getModel("customerPageConfig").setProperty("/NoClosed/snowCase", false);
				this.getModel("customerPageConfig").setProperty("/NoClosed/bcIncident", false);
				this.getModel("customerPageConfig").setProperty("/NoClosed/case", false);
				this.getModel("customerPageConfig").setProperty("/NoClosed/snowEscalation", false);
			} else if (noClosed.situation === true && noClosed.snowEscalation === true && this.getModel("customerPageConfig").getProperty(
					"/closed/situation") === true) {
				sap.m.MessageBox.information("No closed records found within the last 2 months.");
				this.getModel("customerPageConfig").setProperty("/NoClosed/situation", false);
				this.getModel("customerPageConfig").setProperty("/NoClosed/snowEscalation", false);
			} else if (noClosed.case === true && this.getModel("customerPageConfig").getProperty("/closed/case") === true) {
				sap.m.MessageBox.information("No closed records found within the last 2 months.");
				this.getModel("customerPageConfig").setProperty("/NoClosed/case", false);
			} else if (noClosed.snowCase === true && noClosed.bcIncident === true && this.getModel("customerPageConfig").getProperty(
					"/closed/incident") === true) {
				sap.m.MessageBox.information("No closed records found within the last 2 months.");
				this.getModel("customerPageConfig").setProperty("/NoClosed/snowCase", false);
				this.getModel("customerPageConfig").setProperty("/NoClosed/bcIncident", false);
			} else if (noClosed.businessDown === true && this.getModel("customerPageConfig").getProperty("/closed/businessDown") === true) {
				sap.m.MessageBox.information("No closed records found within the last 2 months.");
				this.getModel("customerPageConfig").setProperty("/NoClosed/businessDown", false);
			}
		},

		getTimePeriod: function (sKey, sDateType) { //return 14string(ddMMyyyyHHmmSS)
			var startDate = "";
			switch (sKey) {
			case "1": //Last 3 days
				startDate = this.getDay(-3, sDateType);
				break;
			case "2": // last 7 days
				startDate = this.getDay(-7, sDateType);
				break;
			case "3": // "Last month"
				startDate = this.getDay(-30, sDateType);
				break;
			case "4": //Last 3 months
				startDate = this.getDay(-90, sDateType);
				break;
			case "5": // last year
				startDate = this.getDay(-365, sDateType);
				break;
			case "6": // "All"
				startDate = this.getDay(-36500, sDateType);
				break;
			default:
				startDate = this.getDay(-36500, sDateType);
				break;
			}
			return startDate;
		},
		getDay: function (snum, sDateType) {
			var today = new Date();
			var sDate;
			var targetday_milliseconds = today.getTime() + 1000 * 60 * 60 * 24 * snum;
			today.setTime(targetday_milliseconds);
			var tYear = today.getFullYear();
			var tMonth = today.getMonth() + 1;
			var tDate = today.getDate();
			if (tMonth < 10) {
				tMonth = "0" + tMonth;
			}
			if (tDate < 10) {
				tDate = "0" + tDate;
			}
			if (sDateType === "String14") { //return dateTime with format string of length 14 
				sDate = tYear.toString() + tMonth.toString() + tDate.toString() + "000000";
			} else if (sDateType === "String19") { //return Date with foermat DateTime
				sDate = tYear.toString() + "-" + tMonth.toString() + "-" + tDate.toString() + " 00:00:00";
			} else if (sDateType === "DateTime") { //return Date with foermat DateTime
				sDate = new Date(tYear.toString() + "-" + tMonth.toString() + "-" + tDate.toString() + " 00:00:00");
			}
			return sDate;
		},
		compare: function (a, b) {
			var sSorter = a["UpdateDate"] >= b["UpdateDate"] ? -1 : 0;
			var sAPrio_H = a["priority"] && (a["priority"] === "2" || a["priority"] === 3);
			var sBPrio_H = b["priority"] && (b["priority"] === "2" || b["priority"] === 3);
			if (sAPrio_H && sBPrio_H || a["priority"] === b["priority"]) {
				return sSorter;
			} else {
				sSorter = sSorter && (a["priority"] >= b["priority"] ? 0 : -1);
				return sSorter;
			}
		},
		
		loadCustomerData: function (sValue) {
			var that = this;
			this.searchCustomers(sValue).then(
				function (aResults) {
					//success
					if(aResults.length > 0) {
						that.getModel("customerDetails").setData(aResults[0]);
						that.sCustomerName = aResults[0].CustomerName;
						that.getModel("customerPageConfig").setProperty("/title", that.sCustomerName + "(" + formatter.trimPreZeros(that.sCustomerNo) + ")");
					}}.bind(this),
				function (error) {
					sap.m.MessageToast.show("CustomerInfoSet Service Unavailable!");
				}
			).finally(function(){
				// final steps to perform
			});
		},
	});
});