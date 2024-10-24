sap.ui.require([
	"sap/support/fsc2/controller/CreateCriticalSituation.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function(CreateCriticalSituation, model, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";

	QUnit.module("CreateCriticalSituation - LoadCustomerIncidents", {
		beforeEach: function() {
			this.oCriticalSituation = new CreateCriticalSituation();
			this.oIncidentListModel = new JSONModel();
			this.oIncidentListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentList.json"), {}, false);
			this.oCriticalModel = new JSONModel({
				"CustomerNo": "",
				"CustomerNoEdit": true,
				"CustomerName": "",
				"BusinessImpact": {
					"Text": ""
				},
				"AllSelected": []
			});
			this.oIncidentModel = new JSONModel();
			this.oModelI18n = new ResourceModel({
				bundleName: "sap.support.fsc2.i18n.i18n",
				bundleLocale: "EN"
			});
			this.oCustomerSearch = new JSONModel({
				CustomerNo: "12186",
				CustomerName: "",
				CustomerBPNo: ""
			});
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(this.oIncidentModel, "incidentList");
			this.oComponent.setModel(this.oCustomerSearch, "customerSearch");
			this.oComponent.setModel(new JSONModel(), "customerList");
			this.oComponent.setModel(this.oCriticalModel, "createCriticalSituation");

			this.oComponent.setModel(this.oModelI18n, "i18n");
			sinon.stub(this.oCriticalSituation, "getOwnerComponent").returns(this.oComponent);

			var oView = {
				byId: function(sId) {},
				setBusy: function() {}
			};
			this.oControl = {
				setBusy: function() {},
				selectAll: function() {},
				setValueState:function(sValue){},
				setValidated:function(sFlag){}
			};
			sinon.stub(this.oCriticalSituation, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);
			sinon.stub(this.oControl, "setValueState");
			sap.support.fsc2.IncidentModel = new ODataModel({
				json: true,
				serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
			});
			this.IncidentRead = sinon.stub(sap.support.fsc2.IncidentModel, "read");
			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV",
				defaultUpdateMethod: "Put"
			});
			this.Fsc2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");
			this.Fsc2Create = sinon.stub(sap.support.fsc2.FSC2Model, "create");
			this.navBackModel = new JSONModel({
				"fromCreateToIncident":false
			});
			this.oComponent.setModel(this.navBackModel, "navBackModel");
			this.oComponent.setModel(new JSONModel(), "selectedIncidentList");
		},
		afterEach: function() {
			this.oCriticalSituation.destroy();
			this.oCriticalSituation.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});
		QUnit.test("Create a new request without customer name and customer no.", function(assert) {
		//Arrangment
		var oParam = {
			"custnum": "create",
			"custname": "none"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.stub(this.oCriticalSituation.__proto__, "_handleNavigationToStep");
		this.stub(this.oCriticalSituation.__proto__, "onCustInputChange");
		this.stub(this.oCriticalSituation.__proto__, "_loadCustomerIncident");
		//Action
		this.oCriticalSituation._onRouteMatched(oEvent);
		//Assertion

		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerNo"), "");
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerName"), "");
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerNoEdit"), true);
		assert.equal(this.oCriticalSituation._handleNavigationToStep.callCount, 1);
			assert.equal(this.oCriticalSituation.onCustInputChange.callCount, 1);
		assert.equal(this.oCriticalSituation._loadCustomerIncident.callCount, 0);
	});
	QUnit.test("Create a new request with customer name and customer no.", function(assert) {
		//Arrangment
		var oParam = {
			"custnum": "1111",
			"custname": "test name"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.stub(this.oCriticalSituation.__proto__, "_handleNavigationToStep");
		this.stub(this.oCriticalSituation.__proto__, "onCustInputChange");
		//this.stub(this.oCriticalSituation.__proto__, "_loadCustomerIncident");
		//Action
		this.oCriticalSituation._onRouteMatched(oEvent);
		//Assertion

		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerNo"), "1111 - test name");
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerName"), "test name");
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerNoEdit"), false);
		assert.equal(this.oCriticalSituation._handleNavigationToStep.callCount, 1);
		assert.equal(this.oCriticalSituation.onCustInputChange.callCount, 1);
		//assert.equal(this.oCriticalSituation._loadCustomerIncident.callCount, 1);
	});
	QUnit.test("Create a new request from an incident", function(assert) {
		//Arrangment
		var oParam = {
			"custnum": "1111",
			"custname": "test name2",
			"incident":"10100110"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		this.stub(this.oCriticalSituation.__proto__, "_handleNavigationToStep");
			this.stub(this.oCriticalSituation.__proto__, "onCustInputChange");
		this.stub(this.oCriticalSituation.__proto__, "_loadIncident");
		//Action
		this.oCriticalSituation._onRouteMatchedIncident(oEvent);
		//Assertion

		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerNo"), "1111 - test name2");
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerName"), "test name2");
		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerNoEdit"), false);
		assert.equal(this.oCriticalSituation._handleNavigationToStep.callCount, 1);
			assert.equal(this.oCriticalSituation.onCustInputChange.callCount, 1);
		assert.equal(this.oCriticalSituation._loadIncident.callCount, 1);
	});

	QUnit.test("Load all customer incidents with priority is 'high(1)' or 'very high(3)' by customer No.", function(assert) {
		//Arrangment   
		var sCustomerNo = "12186";
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		this.oCriticalSituation._oIncidentList = {
			setBusy:function(){}
		};
		// this.stub(this.oComponent._oIncidentList, "");
		//Action
		this.oCriticalSituation._loadCustomerIncident(sCustomerNo);
		//Assertion

		assert.equal(this.oComponent.getModel("incidentList").getProperty("/results/0/PriorityKey"), "1");
		assert.equal(this.oComponent.getModel("incidentList").getProperty("/results/1/PriorityKey"), "1");
		assert.equal(this.oComponent.getModel("incidentList").getProperty("/results/2/PriorityKey"), "3");

	});
	QUnit.test("Load no customer incidents when router customer No. is 'create' and type '9999' in customer No. input, and set input status error", function(assert) {
		//Arrangment   
		var sCustomerNo = "9999";
		this.oCriticalSituation.sURLCustomerNo = "create";
		this.oCriticalSituation.Offline = true;
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", {"results":[]});
		//Action
		this.oCriticalSituation._loadCustomerIncident(sCustomerNo);
		//Assertion

		assert.equal(this.oComponent.getModel("createCriticalSituation").getProperty("/CustomerName"), "");
	});
	QUnit.test("Load  incident by CssObjectID", function(assert) {
		//Arrangment   
		var sInicidentId = "002028376000000010932018";
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		var aData = oData.results;
		var oEntry = {
			"ID": aData[0].CssObjectID,
			"Title": aData[0].ObjectID + "/" + aData[0].MessageYear + " " + aData[0].StatusTxt,
			"ShortID": aData[0].ObjectID + "/" + aData[0].MessageYear,
			"Name": aData[0].CustomerName,
			"ComponentName": aData[0].ComponentName,
			"Description": aData[0].Description,
			"Priority": aData[0].PriorityTxt,
			"PriorityKey": aData[0].Priority,
			"Status": aData[0].StatusTxt,
			"Type": "FAVORITE_INCIDENTS"
		};
		//Action
		this.oCriticalSituation._loadIncident(sInicidentId);
		//Assertion

		assert.deepEqual(this.oComponent.getModel("incidentList").getProperty("/results/0"), oEntry);

	});
	QUnit.test("Load  incident 'LongText' by CssObjectID", function(assert) {
		//Arrangment   
		var sInicident = {
			"ID": "002028376000000010932018",
			"ShortID": "1093/2018",
			"Description": ""
		};
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);

		var oEntry = {
			"Timestamp": "/Date(1533032057000)/",
			"Author": "Long Zheng",
			"Text": "Test business Impact",
			"Texttype": "Business Impact",
			"AuthorId": "I034868",
			"Formated_Time": "31.07.2018 10:14:17"
		};
		this.IncidentRead.withArgs("/LongText").yieldsTo("success", {
			"results": [oEntry]
		});
		var oExpect = {
			"ID": sInicident.ShortID,
			"Description": sInicident.Description,
			"Author": "I034868-Long Zheng",
			"Time": "31.07.2018 10:14:17",
			"Text": "Test business Impact"
		};
		this.oCriticalSituation.aAllSelectedID = [sInicident.ID];
		//Action
		this.oCriticalSituation.loadInicidentLongText(sInicident);
		//Assertion

		assert.deepEqual(this.oComponent.getModel("createCriticalSituation").getProperty("/BusinessImpact/" + sInicident.ID), oExpect);

	});
	QUnit.test("Search 'Customer' by customer name 'Bayer' and then open customer list dialog", function(assert) {
		//Arrangment   
		var oData = {
			"results": [{
				"Customer_No": "0000010337",
				"Customer_Name": "Bayer S.p.A."
			}, {
				"Customer_No": "0000010582",
				"Customer_Name": "Kassenärztliche Vereinigung Bayerns"
			}]
		};
		this.Fsc2Read.withArgs("/CustomerInfoSet").yieldsTo("success", oData);
		this.oCriticalSituation._oDialog = {
			setBusy:function(){}
		};
		this.stub(this.oCriticalSituation, "_openSelectDialog");
		//Action
		this.oCriticalSituation.onSearch();
		//Assertion
		assert.deepEqual(this.oComponent.getModel("customerList").getData(), oData);
		assert.equal(this.oCriticalSituation._openSelectDialog.callCount, 1);

	});
	QUnit.test("Search 'Customer' by customer No. '12186' and then open customer list dialog", function(assert) {
		//Arrangment   
		var oData = {
			"results": [{
				"Customer_No": "0000012186",
				"Customer_Name": "Bayer Aktiengesellschaft"
			}]
		};
		this.oCriticalSituation._oDialog = {
			setBusy:function(){}
		};
		this.Fsc2Read.withArgs("/CustomerInfoSet").yieldsTo("success", oData);
		this.stub(this.oCriticalSituation, "_openSelectDialog");
		//Action
		this.oCriticalSituation.onSearch();
		//Assertion
		assert.deepEqual(this.oComponent.getModel("customerList").getData(), oData);
		assert.equal(this.oCriticalSituation._openSelectDialog.callCount, 1);

	});
	QUnit.test("onSend: Send new customer critical situation and Upload attachments", function(assert) {
		//Arrangment   
			// var oRadioGrp = new sap.m.RadioButtonGroup();
			// var oContent ={ 
			// 	getContent:function(){
			// 	return [];
			// }
			// };
			// this.byId.withArgs("idVerticalLayout").returns(oContent);
			// this.stub(oRadioGrp.__proto__, "getSelectedButton");
			this.oCriticalSituation.selectedKeyWordsID =[];
		var oData = {
			"ID": "100023984",
			"Type": "ZS90"
		};
		this.Fsc2Create.withArgs("/FSC2RequestSet").yieldsTo("success", oData);
		this.stub(this.oCriticalSituation, "onStartUpload");
		//Action
		this.oCriticalSituation.onSend();
		//Assertion
		assert.equal(this.oCriticalSituation.onStartUpload.callCount, 1);

	});
	QUnit.test("onChange: Should set correct token header parameter.", function(assert) {
		// Arrangements
		var oCollection = new sap.m.UploadCollection();
		var oEvent = new sap.ui.base.Event(null, oCollection, {});
		this.oCriticalSituation.oFileModel = new ODataModel("/sap/opu/odata/sap/ZS_AGS_FSC2_SRV", {
			useBatch: true
		});
		this.stub(this.oCriticalSituation.oFileModel, "getSecurityToken").returns("test");
		// Actions
		this.oCriticalSituation.onChange(oEvent);
		// Assertions
		assert.strictEqual(oCollection.getHeaderParameters()[0].getName(), "x-csrf-token");
		assert.strictEqual(oCollection.getHeaderParameters()[0].getValue(), "test");
	});
	QUnit.test("onBeforeUploadStarts: Should set correct header parameter when before upload starts.", function(assert) {
		// Arrangements
		var oEvent = new sap.ui.base.Event(null, null, {
			fileName: "name",
			addHeaderParameter: function(oPara) {
				this.para = oPara;
			}
		});

		// Actions
		this.oCriticalSituation.onBeforeUploadStarts(oEvent);
		// Assertions
		assert.strictEqual(oEvent.getParameters().para.getName(), "slug");
		assert.strictEqual(oEvent.getParameters().para.getValue(), "name");
	});

	QUnit.test("onFileSizeExceed: Should show a message when the file size of the uploaded file is exceeded.", function(assert) {
		// Arrangements
		var oStubMessage = this.stub(sap.m.MessageToast, "show");
		// Actions
		this.oCriticalSituation.onFileSizeExceed();
		// Assertions
		assert.strictEqual(oStubMessage.callCount, 1);
	});

	QUnit.test(
		"onFilenameLengthExceed: Should show a message when the name of the chosen file is longer than the value specified with the maximumFilenameLength property.",
		function(assert) {
			// Arrangements
			var oStubMessage = this.stub(sap.m.MessageToast, "show");
			// Actions
			this.oCriticalSituation.onFilenameLengthExceed();
			// Assertions
			assert.strictEqual(oStubMessage.callCount, 1);
		});
			QUnit.test("onTypeMissmatch: Should show a message when the file type is not matched.", function(assert) {
		// Arrangements
		var oStubMessage = this.stub(sap.m.MessageToast, "show");
		// Actions
		this.oCriticalSituation.onTypeMissmatch();
		// Assertions
		assert.strictEqual(oStubMessage.callCount, 1);
	});

	QUnit.test(
		"onFileDeleted: Should show a message when delete a item from file list.",
		function(assert) {
			// Arrangements
			var oStubMessage = this.stub(sap.m.MessageToast, "show");
			// Actions
			this.oCriticalSituation.onFileDeleted();
			// Assertions
			assert.strictEqual(oStubMessage.callCount, 1);
		});
	QUnit.test(
		"Start upload file after create CIM reqeust successfully",
		function(assert) {
			// Arrangements
			var oUploadCollection = new sap.m.UploadCollection();
			this.byId.withArgs("idUploadCollection").returns(oUploadCollection);
			this.stub(oUploadCollection, "upload");
			this.stub(oUploadCollection, "getItems").returns(["item1"]);
				this.oCriticalSituation.Create = {
						"ID": "1001",
						"Type": "ZS90"
					};
			// Actions
			this.oCriticalSituation.onStartUpload(this.oCriticalSituation.Create.ID);
			// Assertions
			assert.strictEqual(oUploadCollection.upload.callCount, 1);
		});	
	QUnit.test(
		"Check the required fields and enable 'Send' button",
		function(assert) {
			// Arrangements
			var oCustInput = new sap.m.Input();
			this.byId.withArgs("idCustName").returns(oCustInput);
			this.oComponent.getModel("createCriticalSituation").setProperty("/CustomerName","test 1");
				var oWizard = new sap.m.Wizard();
				this.stub(oWizard.__proto__,"invalidateStep");
			this.oCriticalSituation._wizard = oWizard;
			// Actions
			this.oCriticalSituation.onCustInputChange();
			// Assertions
				assert.strictEqual(	oCustInput.getValueState(), "None");
		});
		// 	QUnit.test(
		// "Check the required fields and disable 'Send' button",
		// function(assert) {
		// 	// Arrangements
		// 	var oCustInput = new sap.m.Input();
		// 	this.byId.withArgs("idCustName").returns(oCustInput);
		// 	this.oComponent.getModel("createCriticalSituation").setProperty("/CustomerName","");
		// 	var oWizard = new sap.m.Wizard();
		// 	this.stub(oWizard.__proto__,"invalidateStep");
		// 	this.oCriticalSituation._wizard = oWizard;
		// 	// Actions
		// 	this.oCriticalSituation.onCustInputChange();
		// 	// Assertions
		// 	assert.strictEqual(	oCustInput.getValueState(), "Error");
		// });
});