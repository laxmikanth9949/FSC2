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

	return BaseController.extend("sap.support.fsc2.controller.CustomerSearch", {
		formatter: formatter,
		iacValues: ["8", "9", "V", "I"],
		onInit: function () {
			this.oCustomerModel = new sap.ui.model.odata.v2.ODataModel(this.sICDest + "/sap/ZS_MCC_CRITSIT_DASHBOARD_SRV", {
				useBatch: true
			});
			this.setModel(new JSONModel(), "searchResult");
			this.setModel(new JSONModel(), "history");
			this.setModel(new JSONModel(), "suggestion");
			this.bSelectItem = false;
			this.getRouter().getRoute("customerSearch").attachPatternMatched(this._onRouteMatched, this);
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
			var favCustomersLoaded = this.getView().getModel("favorite").getData().Customer.loadComplete;
			if (!favCustomersLoaded) {
				this.loadFavCustData();
			}

		},
		_updateSearchData: function (searchValue) {
			this.getModel("searchResult").setData({
				"Customer": {
					"count": "",
					"expanded": false,
					"results": []
				}
			});
			var oTabBar = this.getView().byId("idSearchTab");
			var sValue = searchValue;
			this.sSearchValue = searchValue;
			this.eventUsage(false, "Search customer");
			oTabBar.setSelectedKey("keyCustomer");
			this.loadCustomerData(sValue);
		},
		loadCustomerData: function (sValue) {
			var oList = this.getView().byId("idCustomer");
			var that = this;
			oList.setBusy(true);
			this.searchCustomers(sValue).then(
				function (aResults) {
					//success
						that.getModel("searchResult").setProperty("/Customer", {
						"results": aResults,
						"count": aResults.length,
						"expanded": aResults.length ? true : false
					});
				},
				function (error) {
					sap.m.MessageToast.show("CustomerInfoSet Service Unavailable!");
				}
			).finally(function(){
				oList.setBusy(false);
			});
		},

		checkFavorite: function (custNumber) {
			var favs = this.getView().getModel("favorite").getData().Customer.results;
			var isFav = favs.some(function (customer) {
				return customer.CustomerNo === custNumber;
			});
			return isFav;
		},
		navToCustomer: function (oObject) {
			var custNumberExpanded = (Array(10).join("0") + oObject.CustomerNo).slice(-10); //with preceding zeroes
			var favCustomersLoaded = this.getView().getModel("favorite").getData().Customer.loadComplete;
			if (favCustomersLoaded) {
				this.getRouter().navTo("customer", {
					layout: "MidColumnFullScreen",
					custnum: custNumberExpanded,
					custname: encodeURIComponent(oObject.CustomerName),
					favorite: this.checkFavorite(custNumberExpanded) //oObject.Action === "X" ? true : false
				});
			} else {
				setTimeout(function () {
					this.navToCustomer(oObject);
				}.bind(this), 200);
			}

		},

		handleRowPress: function (oEvent, binding) {
			var oBindingObject = oEvent.getSource().getBindingContext(binding);
			var oObject = oBindingObject.getObject();
			this.navToCustomer(oObject);
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
			if (this.getRouter()._oMatchedRoute.getPattern().indexOf("customerSearch") > -1) {
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
				aFilters.push(new Filter("CustomerNo", FilterOperator.Contains, sQuery));
				aFilters.push(new Filter("CustomerName", FilterOperator.Contains, sQuery));

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