sap.ui.require([
	"sap/support/fsc2/controller/Homepage.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/m/SearchField",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"

], function(Homepage, model, ManagedObject, ResourceModel, SearchField, Filter, JSONModel, ODataModel) {
	"use strict";

	QUnit.module("Homepage - search", {
		beforeEach: function() {
			this.oHomepage = new Homepage();
			this.oHistoryModel = new JSONModel();
			this.oHistoryModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/suggestion.json"), {}, false);
			this.oSuggestionModel = new JSONModel();
			this.oModelI18n = new ResourceModel({
				bundleName: "sap.support.fsc2.i18n.i18n",
				bundleLocale: "EN"
			});
			this.oConfigModel = new JSONModel();
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(this.oHistoryModel, "history");
			this.oComponent.setModel(this.oSuggestionModel, "suggestion");
			this.oComponent.setModel(this.oConfigModel, "homePageConfig");
			this.oComponent.setModel(this.oModelI18n, "i18n");
			sinon.stub(this.oHomepage, "getOwnerComponent").returns(this.oComponent);
			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
			});

			this.FSC2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");
			sap.support.fsc2.UserProfileModel = new ODataModel({
				json: true,
				useBatch: true,
				serviceUrl: "/sap/opu/odata/SVT/USER_PROFILE_SRV"
			});
			this.UserProfileRead = sinon.stub(sap.support.fsc2.UserProfileModel, "read");
			this.UserProfileDelete = sinon.stub(sap.support.fsc2.UserProfileModel, "remove");
			sinon.stub(sap.support.fsc2.UserProfileModel, "submitChanges");
		},
		afterEach: function() {
			this.oHomepage.destroy();
			this.oHomepage.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});
	// QUnit.test("Get search category mapping ",function(assert){
	// 	//Arangement
	// 		this.oHomepage.oCategory = {
	// 			"ALL": "ALL"
	// 		};
	// 	var oMap = {
	// 		"ALL": "ALL",
	// 		"in Customer":"searchCustomer",
	// 		"in Critical Customer Situation":"searchSituation",
	// 		"(ID:xxx)in Customer Incident":"searchIncident"
	// 	};
	// 		//Action
	// 	this.oHomepage._mapCategory();
	// 	//Assertion
	// 	assert.deepEqual(this.oHomepage.oCategory, oMap);
	// });
	QUnit.test("Display all history content when user entry nothing and just click the search field", function(assert) {
		// 	var oSearchField = new sap.m.SearchField();
		// var oEvent = new sap.ui.base.Event(null, oSearchField, {
		var sSearchValue = "";
		// });
		var oData = {
			"results": [{
				"Name": "202418",
				"Description": ""
			}, {
				"Name": "OSS corp. function",
				"Description": ""
			}, {
				"Name": "BMW",
				"Description": ""
			}, {
				"Name": "aPaul Pharma Test",
				"Description": ""
			}, {
				"Name": "Bayer",
				"Description": ""
			}]
		};
		//Action
		this.oHomepage._updateSuggestionModel(sSearchValue);
		//Assertion
		assert.deepEqual(this.oHomepage.getModel("suggestion").getData(), oData);
	});
	QUnit.test("Display all history content when user entry blanks", function(assert) {
		var sSearchValue = " ";
		var oData = {
			"results": [{
				"Name": "202418",
				"Description": ""
			}, {
				"Name": "OSS corp. function",
				"Description": ""
			}, {
				"Name": "BMW",
				"Description": ""
			}, {
				"Name": "aPaul Pharma Test",
				"Description": ""
			}, {
				"Name": "Bayer",
				"Description": ""
			}]
		};
		//Action
		this.oHomepage._updateSuggestionModel(sSearchValue);
		//Assertion
		assert.deepEqual(this.oHomepage.getModel("suggestion").getData(), oData);
	});
	// QUnit.test("Should see all history with 'a' and suggest all search area when user entry 'a' in search field", function(assert) {
	// 	//Arrangment   
	// 	var sSearchValue = "a";
	// 	var oData = {
	// 		"results": [{
	// 			"Name": "aPaul Pharma Test",
	// 			"Description": ""
	// 		}, {
	// 			"Name": "Bayer",
	// 			"Description": ""
	// 		}, {
	// 			"Name": "a",
	// 			"Description": "in Customer"
	// 		}, {
	// 			"Name": "a",
	// 			"Description": "in Critical Customer Situation"
	// 		}, {
	// 			"Name": "a",
	// 			"Description": "(ID:xxx)in Customer Incident"
	// 		}]
	// 	};
	// 	//Action
	// 	this.oHomepage._updateSuggestionModel(sSearchValue);
	// 	//Assertion
	// 	assert.deepEqual(this.oHomepage.getModel("suggestion").getData(), oData);
	// });
	// QUnit.test("Suggest all search area when user entry 'a gt' which is not in history list", function(assert) {
	// 	var sSearchValue = "a gt";
	// 	var oData = {
	// 		"results": [{
	// 			"Name": "a gt",
	// 			"Description": "in Customer"
	// 		}, {
	// 			"Name": "a gt",
	// 			"Description": "in Critical Customer Situation"
	// 		}, {
	// 			"Name": "a gt",
	// 			"Description": "(ID:xxx)in Customer Incident"
	// 		}]
	// 	};
	// 	//Action
	// 	this.oHomepage._updateSuggestionModel(sSearchValue);
	// 	//Assertion
	// 	assert.deepEqual(this.oHomepage.getModel("suggestion").getData(), oData);
	// });

	// QUnit.test("Load 'My Reqeusts' count and 'My Favorites' count", function(assert) {
	// 	//Arrangment   
	// 	this.FSC2Read.withArgs("/FSC2RequestSet/$count").yieldsTo("success", "5");
	// 	this.UserProfileRead.withArgs("/Entries/$count").yieldsTo("success", "3");
	// 	//Action
	// 	this.oHomepage.loadHomeData();
	// 	//Assertion

	// 	assert.equal(this.oComponent.getModel("homePageConfig").getProperty("/request"), "5");
	// 	assert.equal(this.oComponent.getModel("homePageConfig").getProperty("/favorite"), "3");
	// });
	QUnit.test("Load 'Search History' data", function(assert) {
		//Arrangment   
		this.oHistoryModel = new JSONModel();
		this.oHistoryModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SearchHistory.json"), {}, false);
		var oData = this.oHistoryModel.getData();
		this.UserProfileRead.withArgs("/Entries").yieldsTo("success", oData);
		//Action
		this.oHomepage.loadHistroyData();
		//Assertion
		assert.equal(this.oHistoryModel.getData().results.length, "5");
	});
	QUnit.test("Update 'Search History' data when trigger a new search", function(assert) {
		//Arrangment   
		this.UserProfileDelete.yieldsTo("success");

		//Action
		this.oHomepage._updateHistory("test 1");
		//Assertion
		assert.equal(sap.support.fsc2.UserProfileModel.submitChanges.callCount, "1");
	});
});