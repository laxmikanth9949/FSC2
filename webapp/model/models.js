sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
		createDeviceModel: function () {
			var oDeviceModel = new JSONModel({
				isTouch: Device.support.touch,
				isNoTouch: !Device.support.touch,
				isPhone: Device.system.phone,
				isNoPhone: !Device.system.phone,
				listMode: Device.system.phone ? "None" : "SingleSelectMaster",
				listItemType: Device.system.phone ? "Active" : "Inactive",
				os: Device.os.name,
				isLaunchpad: !window["sap-fiori-ui5-bootstrap"] ? false : true
			});
			oDeviceModel.setDefaultBindingMode("OneWay");
			return oDeviceModel;
		},
		// createLanguageModel:function(){
		// 	var oLang = new JSONModel({
		// 		"browserLang": sap.ui.getCore().getConfiguration().getLanguage()
		// 		//window.navigator.languages ? window.navigator.languages[0] : (window.navigator.language || window.navigator.userLanguage)
		// 	});
		// 	oLang.setDefaultBindingMode("OneWay");
		// 	return oLang;
		// },
		createFavoriteModel: function () {
			var oModel = new JSONModel({
				"Customer": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				},
				"Situation": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				},
				"BCIncident": {
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
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				}
			});
			return oModel;
		},
		createCimCategoryModel: function () {
			var oModel = new JSONModel({
				categories: [{
					categoryId: "0100",
					categoryName: "Assign Processor"
				}, {
					categoryId: "0300",
					categoryName: "P2: Set Escal Flag"
				}, {
					categoryId: "0400",
					categoryName: "Raise to VH"
				}, {
					categoryId: "0600",
					categoryName: "Request from RCA BO"
				}, {
					categoryId: "0200",
					categoryName: "Speed up"
				}, {
					categoryId: "0500",
					categoryName: "Support required"
				}]
			});
			return oModel;
		},
		createSnowEscCategoryModel: function () { //keys and name are the same since Snow returns name not key
			var oModel = new JSONModel({
				categories: [{
					categoryId: "70bcad0ddb3ed4103da8366af4961975",
					categoryName: "Assign processor"
				}, {
					categoryId: "bb4d29cddb3ed4103da8366af4961971",
					categoryName: "Speed up"
				}, {
					categoryId: "b14da5cddb3ed4103da8366af4961917",
					categoryName: "Raise Priority to Very High" //"Raise priority"
				}]
			});
			return oModel;
		},
		createCustomerDetailModel: function () {
			var oModel = new JSONModel({
				"title": "",
				"_bFavorite": true,
				"all": {
					"count": 0,
					"results": [],
					"loadBusDown": false,
					"loadBcIncident": false,
					"loadSnowCase": false,
					"loadSituation": false,
					"loadCase": false
				},
				"history": {
					"count": 0,
					"results": []
				},
				"businessDown": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"incident": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"bcIncident": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"snowCase": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"case": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"situation": {
					"count": 0,
					"results": [],
					"loadComplete": false
				}
			});
			return oModel;
		},
		initCustomerDetailData: function () {
			return {
				"title": "",
				"_bFavorite": true,
				"all": {
					"count": 0,
					"results": [],
					"loadBusDown": false,
					"loadBcIncident": false,
					"loadSnowCase": false,
					"loadSituation": false,
					"loadCase": false
				},
				"history": {
					"count": 0,
					"results": []
				},
				"businessDown": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"incident": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"bcIncident": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"snowCase": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"case": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"situation": {
					"count": 0,
					"results": [],
					"loadComplete": false
				},
				"closed": {
					"all": false,
					"situation": false,
					"businessDown": false,
					"incident": false,
					"case": false
				},
				"NoClosed": {
					"snowCase": false,
					"situation": false,
					"businessDown": false,
					"bcIncident": false,
					"case": false,
					"snowEscalation": false
				}
			};
		},
		createCustSearchModel: function () {
			var oModel = new JSONModel({
				"CustomerBPNo": "",
				"CustomerNo": "",
				"CustomerName": ""
			});
			return oModel;
		},

		createSortPropertiesModel: function () {
			var oModel = new JSONModel([{
				text: "Trans. Type",
				key: "TransType",
				type: "CustomerDetails"
			}, {
				text: "Description",
				key: "Description",
				type: "CustomerDetails"
			}, {
				text: "Changed At",
				key: "UpdateAt",
				type: "CustomerDetails"
			}, {
				text: "Object ID",
				key: "ID",
				type: "CustomerDetails"
			}, {
				text: "Status",
				key: "Status",
				type: "CustomerDetails"
			}, {
				text: "Trans. Type",
				key: "TransType",
				type: "Request"
			}, {
				text: "Description",
				key: "Description",
				type: "Request"
			}, {
				text: "Customer Name",
				key: "CustomerName",
				type: "Request"
			}, {
				text: "Changed At",
				key: "ChangedAtNotFormatted",
				type: "Request"
			}, {
				text: "Object ID",
				key: "ID",
				type: "Request"
			}, {
				text: "Status",
				key: "StatusSort",
				type: "Request"
			}, {
				text: "Trans. Type",
				key: "activity_process_type",
				type: "ToDo"
			}, {
				text: "Description",
				key: "activity_description",
				type: "ToDo"
			}, {
				text: "Customer Name",
				key: "account_name_F",
				type: "ToDo"
			}, {
				text: "Changed At",
				key: "activity_change_date_not_formatted",
				type: "ToDo"
			}, {
				text: "Object ID",
				key: "activity_id",
				type: "ToDo"
			}, {
				text: "Status",
				key: "StatusSort", // "activity_status_desc",
				type: "ToDo"
			}, {
				text: "Description",
				key: "Description",
				type: "RequestSearch"
			}, {
				text: "Customer Name",
				key: "Name",
				type: "RequestSearch"
			}, {
				text: "Object ID",
				key: "ID",
				type: "RequestSearch"
			}, {
				text: "Status",
				key: "Status",
				type: "RequestSearch"
			}, {
				text: "Description",
				key: "Description",
				type: "RequestFav"
			}, {
				text: "Customer Name",
				key: "CustomerName",
				type: "RequestFav"
			}, {
				text: "Object ID",
				key: "ID",
				type: "RequestFav"
			}, {
				text: "Status",
				key: "Status",
				type: "RequestFav"
			}, {
				text: "Customer Name",
				key: "CustomerName",
				type: "CustomerSearch"
			}, {
				text: "Customer No.",
				key: "CustomerNo",
				type: "CustomerSearch"
			}, {
				text: "Description",
				key: "Description",
				type: "IncidentSearch"
			}, {
				text: "Customer Name",
				key: "Name",
				type: "IncidentSearch"
			}, {
				text: "Object ID",
				key: "ShortID",
				type: "IncidentSearch"
			}, {
				text: "Priority",
				key: "Priority",
				type: "IncidentSearch"
			}]);
			return oModel;
		}
	};
});