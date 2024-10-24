/*global QUnit*/

sap.ui.require(
	[
		"sap/ui/core/UIComponent",
		"sap/ui/model/resource/ResourceModel",
		"sap/ui/base/ManagedObject",
		"sap/support/fsc2/model/formatter",
		"sap/support/fsc2/controller/BaseController",
		"sap/support/fsc2/model/models",
		"sap/ui/thirdparty/sinon",
		"sap/ui/thirdparty/sinon-qunit"
	],
	function (Component, ResourceModel, ManagedObject, formatter, BaseController, models) {
		"use strict";

		QUnit.module("Formatter-Favorite State");

		function favoriteStateTestCase(oOptions) {
			// Act
			var sState = formatter.favoriteState(oOptions.isFavorite);

			// Assert
			oOptions.assert.strictEqual(sState, oOptions.expected, "The favorite state was correct");
		}

		QUnit.test("Should format the favorite with a value 'X' to favorite", function (assert) {
			favoriteStateTestCase.call(this, {
				assert: assert,
				isFavorite: "X",
				expected: "sap-icon://favorite"
			});
		});
		QUnit.test("Should format the favorite with a value 'x' to unfavorite", function (assert) {
			favoriteStateTestCase.call(this, {
				assert: assert,
				isFavorite: "",
				expected: "sap-icon://unfavorite"
			});
		});
		QUnit.test("Should format the favorite with a value '' to unfavorite", function (assert) {
			favoriteStateTestCase.call(this, {
				assert: assert,
				isFavorite: "",
				expected: "sap-icon://unfavorite"
			});
		});

		QUnit.module("Formatter-Trim previous zeros");

		function TrimZerosTestCase(oOptions) {
			// Act
			var sState = formatter.trimPreZeros(oOptions.isFavorite);

			// Assert
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should trim previous zeros", function (assert) {
			TrimZerosTestCase.call(this, {
				assert: assert,
				isFavorite: "00321",
				expected: "321"
			});
		});
		QUnit.test("Should trim previous zeros", function (assert) {
			TrimZerosTestCase.call(this, {
				assert: assert,
				isFavorite: "00000",
				expected: ""
			});
		});
		QUnit.test("Should trim previous zeros", function (assert) {
			TrimZerosTestCase.call(this, {
				assert: assert,
				isFavorite: "23100ae",
				expected: "23100ae"
			});
		});
		QUnit.test("Should trim previous zeros", function (assert) {
			TrimZerosTestCase.call(this, {
				assert: assert,
				isFavorite: "0032100",
				expected: "32100"
			});
		});
		QUnit.module("Formatter-formatBPNo");

		function formatBPNoTestCase(oOptions) {
			// Act
			var sState = formatter.formatBPNo(oOptions.sString);

			// Assert
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should trim previous zeros", function (assert) {
			formatBPNoTestCase.call(this, {
				assert: assert,
				sString: "00000159926",
				expected: "BP: 159926"
			});
		});
		QUnit.module("Formatter-formatERPNo");

		function formatERPNoTestCase(oOptions) {
			// Act
			var sState = formatter.formatERPNo(oOptions.sString);

			// Assert
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should trim previous zeros", function (assert) {
			formatERPNoTestCase.call(this, {
				assert: assert,
				sString: "010010",
				expected: "ERP: 10010"
			});
		});
		QUnit.module("Formatter-Fovarite tooltip formatter", {
			beforeEach: function () {
				this.oModelI18n = new ResourceModel({
					bundleName: "sap.support.fsc2.i18n.i18n",
					bundleLocale: "EN"
				});
			},
			afterEach: function () {
				this.oModelI18n.destroy();
			}
		});

		QUnit.test("Should formmater action icon tooltip", function (assert) {
			var oGetResourceBundle = {
				getResourceBundle: this.stub().returns(this.oModelI18n.getResourceBundle())
			};
			// System under test
			var FavoriteTextTestCase = formatter.favoriteText.bind(oGetResourceBundle);
			// Assert
			assert.strictEqual(FavoriteTextTestCase("X"), "Remove Favorite", "The tooltip for action X is correct");
			assert.strictEqual(FavoriteTextTestCase(""), "Add Favorite", "The tooltip for action '' is correct");

		});

		QUnit.module("Formatter-Priority State");

		function FormatPriorityTestCase(oOptions) {
			// Act
			var sState = formatter.formatPriority(oOptions.sPriority);

			// Assert
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should format Priority 1 to 'Error' State", function (assert) {
			FormatPriorityTestCase.call(this, {
				assert: assert,
				sPriority: "1",
				expected: "Error"
			});
		});
		QUnit.test("Should format Priority 0 to 'None' State", function (assert) {
			FormatPriorityTestCase.call(this, {
				assert: assert,
				sPriority: "0",
				expected: "None"
			});
		});
		QUnit.test("Should format Priority 3 to 'None' State", function (assert) {
			FormatPriorityTestCase.call(this, {
				assert: assert,
				sPriority: "3",
				expected: "Warning"
			});
		});
	QUnit.module("Formatter-Incident Priority State");

		function FormatIndPriorityTestCase(oOptions) {
			// Act
			var sState = formatter.formatIcdPriority(oOptions.SNow_number,oOptions.sPriority);

			// Assert
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should format BC Incident Priority 1 to 'Error' State", function (assert) {
			FormatIndPriorityTestCase.call(this, {
				assert: assert,
				SNow_number:false,
				sPriority: "1",
				expected: "Error"
			});
		});
		QUnit.test("Should format BC Incident Priority 3 to 'Warning' State", function (assert) {
			FormatIndPriorityTestCase.call(this, {
				assert: assert,
				SNow_number:false,
				sPriority: "3",
				expected: "Warning"
			});
		});
		QUnit.test("Should format BC Incident Priority 5 and 9 to 'None' State", function (assert) {
			FormatIndPriorityTestCase.call(this, {
				assert: assert,
				SNow_number:false,
				sPriority: "5",
				expected: "None"
			});
		});
		QUnit.test("Should format SNow Case Priority 1 to 'Error' State", function (assert) {
			FormatIndPriorityTestCase.call(this, {
				assert: assert,
				SNow_number:true,
				sPriority: "1",
				expected: "Error"
			});
		});
		QUnit.test("Should format SNow Case Priority 2 to 'Warning' State", function (assert) {
			FormatIndPriorityTestCase.call(this, {
				assert: assert,
				SNow_number:true,
				sPriority: "2",
				expected: "Warning"
			});
		});
		QUnit.test("Should format SNow Case Priority 3 and 4 to 'None' State", function (assert) {
			FormatIndPriorityTestCase.call(this, {
				assert: assert,
				SNow_number:true,
				sPriority: "3",
				expected: "None"
			});
		});
		//-----
		QUnit.module("Formatter-Date");

		function formatDateTestCase(oOptions) {
			var sState = formatter.formatDate(oOptions.sDate);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return yyyy-mm-dd", function (assert) {
			formatDateTestCase.call(this, {
				assert: assert,
				sDate: "20181102115729",
				expected: "2018-11-02"
			});
		});

		QUnit.module("Formatter-CriticalTransType");

		function formatCriticalTansTypeTestCase(oOptions) {
			var sState = formatter.formatCriticalTansType(oOptions.sTransType);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}
		QUnit.test("Should format ZS31 to FAVORITE_ESCALATION_REQUESTS", function (assert) {
			formatCriticalTansTypeTestCase.call(this, {
				assert: assert,
				sTransType: "ZS31",
				expected: "FAVORITE_ESCALATION_REQUESTS"
			});
		});
		QUnit.test("Should format ZS46 to FAVORITE_ACTIVITIES", function (assert) {
			formatCriticalTansTypeTestCase.call(this, {
				assert: assert,
				sTransType: "ZS46",
				expected: "FAVORITE_ACTIVITIES"
			});
		});
		QUnit.test("Should format ZS90 to FAVORITE_CIM_REQUESTS", function (assert) {
			formatCriticalTansTypeTestCase.call(this, {
				assert: assert,
				sTransType: "ZS90",
				expected: "FAVORITE_CIM_REQUESTS"
			});
		});
		QUnit.test("Should format others type to ''", function (assert) {
			formatCriticalTansTypeTestCase.call(this, {
				assert: assert,
				sTransType: "",
				expected: ""
			});
		});

		QUnit.module("Formatter-formatStatusStateDetail");

		function formatStatusStateDetailTestCase(oOptions) {
			var sState = formatter.formatStatusStateDetail(oOptions.sStatus);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should format 'New' to 'Success'", function (assert) {
			formatStatusStateDetailTestCase.call(this, {
				assert: assert,
				sStatus: "New",
				expected: "Success"
			});
		});

		QUnit.test("Should format others value to 'None'", function (assert) {
			formatStatusStateDetailTestCase.call(this, {
				assert: assert,
				sStatus: "",
				expected: "None"
			});
		});

		QUnit.module("Formatter-formatRating");

		function formatRatingTestCase(oOptions) {
			var sState = formatter.formatRating(oOptions.sColor);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should format 'G' to 'Green'", function (assert) {
			formatRatingTestCase.call(this, {
				assert: assert,
				sColor: "G",
				expected: "Green"
			});
		});
		QUnit.test("Should format 'Y' to 'Yellow'", function (assert) {
			formatRatingTestCase.call(this, {
				assert: assert,
				sColor: "Y",
				expected: "Yellow"
			});
		});
		QUnit.test("Should format 'R' to 'Red'", function (assert) {
			formatRatingTestCase.call(this, {
				assert: assert,
				sColor: "R",
				expected: "Red"
			});
		});
		QUnit.test("Should format other value to ''", function (assert) {
			formatRatingTestCase.call(this, {
				assert: assert,
				sColor: "B",
				expected: ""
			});
		});

		QUnit.module("Formatter-formatRatingState");

		function formatRatingStateTestCase(oOptions) {
			var sState = formatter.formatRatingState(oOptions.sColor);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should format 'A' to 'Success'", function (assert) {
			formatRatingStateTestCase.call(this, {
				assert: assert,
				sColor: "A",
				expected: "Success"
			});
		});
		QUnit.test("Should format 'B' to 'Warning'", function (assert) {
			formatRatingStateTestCase.call(this, {
				assert: assert,
				sColor: "B",
				expected: "Warning"
			});
		});
		QUnit.test("Should format 'C' to 'Error'", function (assert) {
			formatRatingStateTestCase.call(this, {
				assert: assert,
				sColor: "C",
				expected: "Error"
			});
		});
		QUnit.test("Should format other value to 'None'", function (assert) {
			formatRatingStateTestCase.call(this, {
				assert: assert,
				sColor: "x",
				expected: "None"
			});
		});

		QUnit.module("Formatter-downloadUrl");

		function downloadUrlTestCase(oOptions) {
			var sState = formatter.downloadUrl(oOptions.oAttach);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return oAttach.file_type", function (assert) {
			var oAttach = {
				"__metadata": {
					"id": "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV/AttachmentSet(objtype='P',class='CRM_P_URL',objid='DF0B08106280E2F1AC30001CC4793BE2')",
					"uri": "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV/AttachmentSet(objtype='P',class='CRM_P_URL',objid='DF0B08106280E2F1AC30001CC4793BE2')",
					"type": "ZS_AGS_FSC2_SRV.Attachment",
					"content_type": "test",
					"media_src": "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV/AttachmentSet(objtype='P',class='CRM_P_URL',objid='DF0B08106280E2F1AC30001CC4793BE2')/$value"
				},
				"objtype": "P",
				"class": "CRM_P_URL",
				"objid": "DF0B08106280E2F1AC30001CC4793BE2",
				"file_name": "adfsdf",
				"file_type": "test",
				"file_descr": "adfsdf",
				"file_content": ""
			};
			downloadUrlTestCase.call(this, {
				assert: assert,
				oAttach: oAttach,
				expected: "test"
			});
		});

		QUnit.test("Should return oAttach.__metadata.media_src", function (assert) {
			var oAttach = {
				"__metadata": {
					"id": "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV/AttachmentSet(objtype='P',class='CRM_P_URL',objid='DF0B08106280E2F1AC30001CC4793BE2')",
					"uri": "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV/AttachmentSet(objtype='P',class='CRM_P_URL',objid='DF0B08106280E2F1AC30001CC4793BE2')",
					"type": "ZS_AGS_FSC2_SRV.Attachment",
					"content_type": "test",
					"media_src": "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV/AttachmentSet(objtype='P',class='CRM_P_URL',objid='DF0B08106280E2F1AC30001CC4793BE2')/$value"
				},
				"objtype": "P",
				"class": "",
				"objid": "DF0B08106280E2F1AC30001CC4793BE2",
				"file_name": "adfsdf",
				"file_type": "test",
				"file_descr": "adfsdf",
				"file_content": ""
			};
			downloadUrlTestCase.call(this, {
				assert: assert,
				oAttach: oAttach,
				expected: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV/AttachmentSet(objtype='P',class='CRM_P_URL',objid='DF0B08106280E2F1AC30001CC4793BE2')/$value"
			});
		});

		QUnit.module("Formatter-uppercaseLeadingLetter");

		function uppercaseLeadingLetterTestCase(oOptions) {
			var sState = formatter.uppercaseLeadingLetter(oOptions.sDate);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should uppercase the first letter", function (assert) {
			uppercaseLeadingLetterTestCase.call(this, {
				assert: assert,
				sDate: "i342453",
				expected: "I342453"
			});
		});
		QUnit.test("Should return null when input value is not a string", function (assert) {
			uppercaseLeadingLetterTestCase.call(this, {
				assert: assert,
				sDate: 11,
				expected: ""
			});
		});

		QUnit.module("Formatter-formatNotificationActId");

		function formatNotificationActIdTestCase(oOptions) {
			var sState = formatter.formatNotificationActId(oOptions.objId, oOptions.data);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return objId", function (assert) {
			formatNotificationActIdTestCase.call(this, {
				assert: assert,
				objId: "0010252492",
				data: "ICP#002075129500000730822017#0010252492",
				expected: "0010252492"
			});
		});

		QUnit.test("Should return data", function (assert) {
			formatNotificationActIdTestCase.call(this, {
				assert: assert,
				objId: "",
				data: "ICP#002075129500000730822017#0010252492",
				expected: "ICP#002075129500000730822017#0010252492"
			});
		});

		QUnit.module("Formatter-formatTimestamp");

		function formatTimestampTestCase(oOptions) {
			var sState = formatter.formatTimestamp(oOptions.sTime);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return exact time", function (assert) {
			formatTimestampTestCase.call(this, {
				assert: assert,
				sTime: "12112018085641",
				expected: "Updated: Nov 12, 2018"
			});
		});

		QUnit.test("Should return '' ", function (assert) {
			formatTimestampTestCase.call(this, {
				assert: assert,
				sTime: "2018111208564",
				expected: ""
			});
		});

		QUnit.module("Formatter-formatMsgIsRead");

		function formatMsgIsReadTestCase(oOptions) {
			var sState = formatter.formatMsgIsRead(oOptions.sFlag);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return 'High'", function (assert) {
			formatMsgIsReadTestCase.call(this, {
				assert: assert,
				sFlag: "",
				expected: "High"
			});
		});

		QUnit.test("Should return 'None'", function (assert) {
			formatMsgIsReadTestCase.call(this, {
				assert: assert,
				sFlag: "x",
				expected: "None"
			});
		});

		QUnit.module("Formatter-formatReviewDesc");

		function formatReviewDescTestCase(oOptions) {
			var sState = formatter.formatReviewDesc(oOptions.sDesc, oOptions.sReqReason);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return sDesc", function (assert) {
			formatReviewDescTestCase.call(this, {
				assert: assert,
				sDesc: "test",
				sReqReason: "",
				expected: "test"
			});
		});

		QUnit.test("Should return sDesc + sReqReason", function (assert) {
			formatReviewDescTestCase.call(this, {
				assert: assert,
				sDesc: "test",
				sReqReason: "Raise incident priority\nSpeed up incident",
				expected: "test\n#Raise incident priority##Speed up incident#"
			});
		});

		QUnit.module("Formatter-formatTimelineDate");

		function formatTimelineDateTestCase(oOptions) {
			var sState = formatter.formatTimelineDate(oOptions.sValue);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return Just now", function (assert) {
			formatTimelineDateTestCase.call(this, {
				assert: assert,
				sValue: new Date(),
				expected: "Just now"
			});
		});
		QUnit.test("Should return 2 Years ago", function (assert) {
			var sDate = new Date();
			var sYear = sDate.getFullYear();
			var sMonth = (sDate.getMonth() + 1) > 9 ? (sDate.getMonth() + 1).toString() : "0" + (sDate.getMonth() + 1).toString();
			var sDay = sDate.getDate() > 9 ? sDate.getDate().toString() : "0" + sDate.getDate();
			var inputDate = sDay + "." + sMonth + "." + (sYear - 2) + " 00:00:00";
			formatTimelineDateTestCase.call(this, {
				assert: assert,
				sValue: inputDate, //"03.12.2016 08:12:18",
				expected: "2 years ago"
			});
		});
		
		QUnit.test("Should return 1 day ago", function (assert) {
			var sDate = new Date();
			var sYear = sDate.getFullYear().toString();
			var sMonth = (sDate.getMonth() + 1) > 9 ? (sDate.getMonth() + 1).toString() : "0" + (sDate.getMonth() + 1).toString();
			var sDay = (sDate.getDate() - 1) > 9 ? (sDate.getDate() - 1).toString() : "0" + (sDate.getDate() - 1);
			var inputDate = sDay + "." + sMonth + "." + sYear + " 00:00:00";
			formatTimelineDateTestCase.call(this, {
				assert: assert,
				sValue: inputDate, //"03.12.2016 08:12:18",
				expected: "1 day ago"
			});
		});
		QUnit.test("Should return 1 month ago", function (assert) {
			var sDate = new Date();
			var sYear = sDate.getFullYear().toString();
			var sMonth = sDate.getMonth() > 9 ? sDate.getMonth().toString() : "0" + sDate.getMonth().toString();
			var sDay = sDate.getDate() > 9 ? sDate.getDate().toString() : "0" + sDate.getDate();
			var inputDate = sDay + "." + sMonth + "." + sYear + " 00:00:00";
			formatTimelineDateTestCase.call(this, {
				assert: assert,
				sValue: inputDate, //"03.12.2016 08:12:18",
				expected: "1 month ago"
			});
		});
		
		QUnit.module("Formatter-formatRequestIcon");

		function formatRequestIconTestCase(oOptions) {
			var sState = formatter.formatRequestIcon(oOptions.sTansType);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return right icon -'icon-gis-layer' when para is 'ZS31'", function (assert) {
			formatRequestIconTestCase.call(this, {
				assert: assert,
				sTansType: "ZS31",
				expected: "sap-icon://BusinessSuiteInAppSymbols/icon-gis-layer"
			});
		});

		QUnit.test("Should return right icon -'icon-gis-layer' when para is 'ZS46'", function (assert) {
			formatRequestIconTestCase.call(this, {
				assert: assert,
				sTansType: "ZS46",
				expected: "sap-icon://activity-items"
			});
		});

		QUnit.test("Should return right icon -'icon-gis-layer' when para is 'ZS90'", function (assert) {
			formatRequestIconTestCase.call(this, {
				assert: assert,
				sTansType: "ZS90",
				expected: "sap-icon://SAP-icons-TNT/raise-fault"
			});
		});

		QUnit.test("Should return right icon -'icon-gis-layer' when para is 'ZTINB'", function (assert) {
			formatRequestIconTestCase.call(this, {
				assert: assert,
				sTansType: "ZTINB",
				expected: "sap-icon://quality-issue"
			});
		});

		QUnit.test("Should return right icon -'icon-gis-layer' when para is 'ZTINP'", function (assert) {
			formatRequestIconTestCase.call(this, {
				assert: assert,
				sTansType: "ZTINP",
				expected: "sap-icon://overlay"
			});
		});

		QUnit.test("Should return right icon -'icon-gis-layer' when para is 'ZS01'", function (assert) {
			formatRequestIconTestCase.call(this, {
				assert: assert,
				sTansType: "ZS01",
				expected: "sap-icon://BusinessSuiteInAppSymbols/icon-gis-layer"
			});
		});
		QUnit.module("Formatter-formatRequestHeader",{
				// beforeEach: function (){
				// 	this.oModelDevice = models.createDeviceModel();
				// 	this.oComponent = new ManagedObject();
				// 	this.oComponent.setModel(this.oModelDevice, "device");
				// },
				// afterEach: function(){
				// 	this.oComponent.destroy();
				// 	this.oModelDevice.destroy();
				// }
		});
		QUnit.test("Should return the first 40 characters when in small screen mode", function (assert) {
			// Assert
			var oModelDevice = models.createDeviceModel();
			var formatRequestHeader = formatter.formatRequestHeader;
			var sDesc1 = "aaaaaaaaaabbbbbbbbbbccccccccccddddd"; //length = 45
			var sDesc2 = "aaaaaaaaaabbbbbbbbbb"; //length = 20
			if (oModelDevice.getProperty("/isPhone") || $(window).width() < 320) {
				assert.strictEqual(formatRequestHeader(sDesc1), "aaaaaaaaaabbbbbbbbbbcccccccccc...",
					"Long text should return the first 40 characters when in small screen mode");
				assert.strictEqual(formatRequestHeader(sDesc2), "aaaaaaaaaabbbbbbbbbb",
					"Short text should return the original string when in small screen mode");
			} else {
				assert.strictEqual(formatRequestHeader(sDesc1), "aaaaaaaaaabbbbbbbbbbccccccccccddddd",
					"Long text should return the original string when in large screen mode");
				assert.strictEqual(formatRequestHeader(sDesc2), "aaaaaaaaaabbbbbbbbbb",
					"Short text should return the original string when in large screen mode");
			}
			oModelDevice.destroy();
		});

		// QUnit.module("Formatter-formatAddBtnEnable");

		function formatAddBtnEnableTestCase(oOptions) {
			var sState = formatter.formatAddBtnEnable(oOptions.sCustnum);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return true when customer no is not ''", function (assert) {
			formatAddBtnEnableTestCase.call(this, {
				assert: assert,
				sCustnum: "12186",
				expected: true
			});
		});

		QUnit.test("Should return false when customer no is ''", function (assert) {
			formatAddBtnEnableTestCase.call(this, {
				assert: assert,
				sCustnum: "",
				expected: false
			});
		});

		QUnit.module("Formatter-formatRequestType");

		function formatRequestTypeTestCase(oOptions) {
			var sState = formatter.formatRequestType(oOptions.sTansType, oOptions.sID, oOptions.sPriority);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return 'Escalation ' when para is 'ZS31'", function (assert) {
			formatRequestTypeTestCase.call(this, {
				assert: assert,
				sTansType: "ZS31",
				sID: "1000002",
				expected: "Global Escal. Req. (1000002)"
			});
		});

		QUnit.test("Should return 'Activity ' when para is 'ZS46'", function (assert) {
			formatRequestTypeTestCase.call(this, {
				assert: assert,
				sTansType: "ZS46",
				sID: "1000002",
				expected: "Activity (1000002)"
			});
		});

		QUnit.test("Should return 'CIM request ' when para is 'ZS90'", function (assert) {
			formatRequestTypeTestCase.call(this, {
				assert: assert,
				sTansType: "ZS90",
				sID: "1000002",
				expected: "CIM Request (1000002)"
			});
		});

		QUnit.test("Should return 'Business down ' when para is 'ZTINB'", function (assert) {
			formatRequestTypeTestCase.call(this, {
				assert: assert,
				sTansType: "ZTINB",
				sID: "1000002",
				expected: "Business Down (1000002)"
			});
		});

		QUnit.test("Should return 'P1 incident ' when para is 'ZTINP' and priority is '1'", function (assert) {
			formatRequestTypeTestCase.call(this, {
				assert: assert,
				sTansType: "ZTINP",
				sID: "1000002",
				sPriority: "1",
				expected: "P1 Incident (1000002)"
			});
		});

		QUnit.test("Should return 'P2 incident ' when para is 'ZTINP' and priority is '3'", function (assert) {
			formatRequestTypeTestCase.call(this, {
				assert: assert,
				sTansType: "ZTINP",
				sID: "1000002",
				sPriority: "3",
				expected: "P2 Incident (1000002)"
			});
		});

		QUnit.test("Should return 'Escalation ' when para is 'ZS01'", function (assert) {
			formatRequestTypeTestCase.call(this, {
				assert: assert,
				sTansType: "ZS01",
				sID: "1000002",
				expected: "Escalation (1000002)"
			});
		});

		QUnit.module("Formatter-formatNotificationTime");

		function formatNotificationTimeTestCase(oOptions) {
			var sState = formatter.formatNotificationTime(oOptions.sTime);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return exact time", function (assert) {
			formatNotificationTimeTestCase.call(this, {
				assert: assert,
				sTime: "20181129055619",
				expected: "Nov 29, 2018"
			});
		});

		QUnit.test("Should return '' ", function (assert) {
			formatNotificationTimeTestCase.call(this, {
				assert: assert,
				sTime: "",
				expected: ""
			});
		});

		QUnit.module("Formatter-formatTime1");

		function formatTime1TestCase(oOptions) {
			var sState = formatter.formatTime1(oOptions.sTime, oOptions.sFlag);
			oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return exact time with format 'Updated: Dec 13, 2006'", function (assert) {
			formatTime1TestCase.call(this, {
				assert: assert,
				sTime: "13122006101557",
				sFlag: false,
				expected: "Updated: Dec 13, 2006"
			});
		});

		QUnit.module("Formatter-formatTime2");

		function formatTime2TestCase(oOptions) {
			var sState = formatter.formatTime2(oOptions.sTime, oOptions.sFlag);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return exact time with format 'Updated: Dec 13, 2006' when input new date() with flag false", function (assert) {
			formatTime2TestCase.call(this, {
				assert: assert,
				sTime: new Date("2018-11-29"),
				sFlag: false,
				expected: "Updated: Nov 29, 2018"
			});
		});
		QUnit.test("Should return exact time with original format when input new date() with flag true", function (assert) {
			var sDateTime =  new Date("2018-11-29");
			formatTime2TestCase.call(this, {
				assert: assert,
				sTime:sDateTime,
				sFlag: true,
				expected: sDateTime
			});
		});
		QUnit.module("Formatter-formatTime3");

		function formatTime3TestCase(oOptions) {
			var sState = formatter.formatTime3(oOptions.sTime, oOptions.sFlag);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return exact time ", function (assert) {
			formatTime3TestCase.call(this, {
				assert: assert,
				sTime: "20181129055619",
				sFlag: false,
				expected: "Updated: Nov 29, 2018"
			});
		});
		
		QUnit.module("Formatter-formatTime4");

		function formatTime4TestCase(oOptions) {
			var sState = formatter.formatTime4(oOptions.sTime).length;
			oOptions.assert.equal(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return exact time with format Dec 14,2018 THH:mm:ss", function (assert) {
			formatTime4TestCase.call(this, {
				assert: assert,
				sTime: new Date(),
				expected: 22
			});
		});
		// QUnit.module("Formatter-formatTime4");
		// QUnit.test("Should return exact time with format 'Dec 13, 2006 Thh:mm:ss' when input new Date", function (assert) {
		// 	assert.strictEqual(formatter.formatTime4(new Date("2018-11-29")), "Nov 29, 2018 T08:00:00",
		// 		"The result for function formatTime4 was correct");
		// });
		QUnit.module("Formatter-formatTimeLocal");
		QUnit.test("Should return exact time with format 'Dec 13, 2006 Thh:mm:ss' when input new date()", function (assert) {
			assert.strictEqual(formatter.formatTimeLocal(new Date("2018-11-29")), "Nov 29, 2018",
				"The result for function formatTimeLocal was correct");
		});

		QUnit.module("Formatter-formatTooltip");

		QUnit.test("Should return SID when user has authorization", function (assert) {
			assert.strictEqual(formatter.formatTooltip("X", "1234567"), "1234567", "The result was correct");
		});
		QUnit.test("Should return authorization warning text when there is no authorization ", function (assert) {
			this.oModelI18n = new ResourceModel({
					bundleName: "sap.support.fsc2.i18n.i18n",
					bundleLocale: "EN"
				});
			var oGetResourceBundle = {
				getResourceBundle: this.stub().returns(this.oModelI18n.getResourceBundle())
			};
			var formatTooltip = formatter.formatTooltip.bind(oGetResourceBundle);
			assert.strictEqual(formatTooltip("", "1234567"), "No authorization to open this case.", "The result was correct");
			this.oModelI18n.destroy();

		});
		QUnit.module("Formatter-formatEscalation");

		function formatEscalationTestCase(oOptions) {
			var sState = formatter.formatEscalation(oOptions.sEsca);
			oOptions.assert.strictEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return 'This is a Critical Incident' when sEsca is '14'", function (assert) {
			formatEscalationTestCase.call(this, {
				assert: assert,
				sEsca: "14",
				expected: "This is a Critical Incident"
			});
		});
		QUnit.test("Should return 'This is a Business Down incident' when sEsca is '15'", function (assert) {
			formatEscalationTestCase.call(this, {
				assert: assert,
				sEsca: "15",
				expected: "This is a Business Down incident"
			});
		});
		QUnit.test("Should return 'This is a Premium Engagement Critical incident' when sEsca is '17'", function (assert) {
			formatEscalationTestCase.call(this, {
				assert: assert,
				sEsca: "17",
				expected: "This is a Premium Engagement Critical incident"
			});
		});
		QUnit.test("Should return '' when sEsca is not '14','15' or '17'", function (assert) {
			formatEscalationTestCase.call(this, {
				assert: assert,
				sEsca: "0",
				expected: ""
			});
		});
		QUnit.module("Formatter-formatNumString");
		QUnit.test("Should return CssObjectID format '0000000000 0000000000 2017' when input string format with length 24", function (assert) {
			assert.strictEqual(formatter.formatNumString("000000000000000000002017"), "0000000000 0000000000 2017",
				"The result for function formatNumString was correct");
		});

		QUnit.module("Formatter-formatCssShortID");
		QUnit.test("Should return CssObjectID format '123456/2017' when input string format with length 24 '0000000000000001234562017'",
			function (assert) {
				assert.strictEqual(formatter.formatCssShortID("000000000000001234562017"), "123456/2017",
					"The result for function formatCssShortID was correct");
			});

		QUnit.module("Formatter-getMonthDesc");
		QUnit.test("Should return month description when enter month number", function (assert) {
			// Assert
			var aMonthNo = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
			var aMonthDesc = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
			for (var i = 0; i < 12; i++) {
				var sMonthNo = aMonthNo[i];
				var sMonthDesc = aMonthDesc[i];
				var sText = "The description for month " + (i + 1) + " is correct";
				assert.propEqual(formatter.getMonthDesc(sMonthNo), sMonthDesc, sText);
			}
		});
		QUnit.module("Formatter-formatDateTime5");

		function formatDateTime5TestCase(oOptions) {
			var sState = formatter.formatDateTime5(oOptions.sDateTime);
			oOptions.assert.equal(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return the given date time with format Nov 08, 2019 T02:09:50", function (assert) {
			formatDateTime5TestCase.call(this, {
				assert: assert,
				sDateTime: "2019-11-08 02:09:50",
				expected: "Nov 08, 2019 T02:09:50"
			});
		});
		
		QUnit.module("Formatter-formatDateTime6");

		function formatDateTime6TestCase(oOptions) {
			var sState = formatter.formatDateTime6(oOptions.sDateTime);
			oOptions.assert.equal(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return the given date time with format Nov 8, 2019", function (assert) {
			formatDateTime6TestCase.call(this, {
				assert: assert,
				sDateTime: "2019-11-08 02:09:50",
				expected: "Nov 08, 2019"
			});
		});
		
		QUnit.module("Formatter-formatDateTime7");

		function formatDateTime7TestCase(oOptions) {
			var sState = formatter.formatDateTime7(oOptions.sDateTime);
			oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should convert the date with format 2019-11-08 02:09:50 to how many Milliseconds from 1970-01-01 00:00:00", function (assert) {
			formatDateTime7TestCase.call(this, {
				assert: assert,
				sDateTime: "1970-01-01 00:00:00",
				expected: 10000
			});
		});
		
		QUnit.module("Formatter-formatDateTime8");

		function formatDateTime8TestCase(oOptions) {
			var sState = formatter.formatDateTime8(oOptions.sDateTime);
			oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should convert the date with format 25112019081602 to how many Milliseconds from 1970-01-01 00:00:00", function (assert) {
			formatDateTime8TestCase.call(this, {
				assert: assert,
				sDateTime: "25112019081602",
				expected: 10000
			});
		});
		QUnit.module("Formatter-formatDateTime9");

		function formatDateTime9TestCase(oOptions) {
			var sState = formatter.formatDateTime9(oOptions.sDateTime);
			oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should convert the date with format /Date(1531727955000)/ to how many Milliseconds from 1970-01-01 00:00:00", function (assert) {
			formatDateTime9TestCase.call(this, {
				assert: assert,
				sDateTime: new Date(),
				expected: 10000
			});
		});
		
		QUnit.module("Formatter-priorityTxt");

		function formatPriorityTxtTestCase(oOptions) {
			var sState = formatter.priorityTxt(oOptions.sPriorityCode);
			oOptions.assert.equal(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return the priority text of BC* incident according to priority code", function (assert) {
			formatPriorityTxtTestCase.call(this, {
				assert: assert,
				sPriorityCode: "1",
				expected: "Very High"
			});
		});
		QUnit.test("Should return the priority text of BC* incident according to priority code", function (assert) {
			formatPriorityTxtTestCase.call(this, {
				assert: assert,
				sPriorityCode: "3",
				expected: "High"
			});
		});
		QUnit.test("Should return the priority text of BC* incident according to priority code", function (assert) {
			formatPriorityTxtTestCase.call(this, {
				assert: assert,
				sPriorityCode: "5",
				expected: "Medium"
			});
		});
		QUnit.test("Should return the priority text of BC* incident according to priority code", function (assert) {
			formatPriorityTxtTestCase.call(this, {
				assert: assert,
				sPriorityCode: "9",
				expected: "Low"
			});
		});
		
		QUnit.module("Formatter-RequestReasonTxt");

		function formatRequestReasonTxtTestCase(oOptions) {
			var sState = formatter.RequestReasonTxt(oOptions.ReqReas1, oOptions.ReqReas2, oOptions.ReqReas3, oOptions.ReqReas4, oOptions.ReqReas5, oOptions.ReqReas6, oOptions.otherTxt);
			oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return the request reason text according to selected keys", function (assert) {
			formatRequestReasonTxtTestCase.call(this, {
				assert: assert,
				ReqReas1: true,
				ReqReas2: true,
				ReqReas3: true,
				ReqReas4: true,
				ReqReas5: true,
				ReqReas6: true,
				otherTxt:"other reasons",
				expected: "Overall processing time \nLack of response from SAP \nNo processor assigned \nCritical issue with approaching due date \nCommunication challenge with processor \nOther reason: other reasons"
			});
		});
		
		QUnit.module("Formatter-TimeTransToAmPm");

		function formatTimeTransToAmPmTestCase(oOptions) {
			var sState = formatter.TimeTransToAmPm(oOptions.sTime);
			oOptions.assert.equal(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should convert time with format 24 hours to AM and PM", function (assert) {
			formatTimeTransToAmPmTestCase.call(this, {
				assert: assert,
				sTime: "08:00",
				expected: "08:00 AM"
			});
		});
		
		QUnit.test("Should convert time with format 24 hours to AM and PM", function (assert) {
			formatTimeTransToAmPmTestCase.call(this, {
				assert: assert,
				sTime: "16:00",
				expected: "04:00 PM"
			});
		});
		
		QUnit.test("Should convert time with format 24 hours to AM and PM", function (assert) {
			formatTimeTransToAmPmTestCase.call(this, {
				assert: assert,
				sTime: "23:00",
				expected: "11:00 PM"
			});
		});
		
		QUnit.test("Should convert time with format 24 hours to AM and PM", function (assert) {
			formatTimeTransToAmPmTestCase.call(this, {
				assert: assert,
				sTime: "12:00",
				expected: "12:00 PM"
			});
		});
		
		QUnit.module("Formatter-SnowCaseStatusTxt");

		function formatSnowCaseStatusTxtTestCase(oOptions) {
			var sState = formatter.SnowCaseStatusTxt(oOptions.sStatusCode);
			oOptions.assert.equal(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return the status text of SNowCase according to status code", function (assert) {
			formatSnowCaseStatusTxtTestCase.call(this, {
				assert: assert,
				sStatusCode: "1",
				expected: "New"
			});
			formatSnowCaseStatusTxtTestCase.call(this, {
				assert: assert,
				sStatusCode: "10",
				expected: "In progress"
			});
			formatSnowCaseStatusTxtTestCase.call(this, {
				assert: assert,
				sStatusCode: "18",
				expected: "Awaiting Info"
			});
			formatSnowCaseStatusTxtTestCase.call(this, {
				assert: assert,
				sStatusCode: "6",
				expected: "Resolved"
			});
			formatSnowCaseStatusTxtTestCase.call(this, {
				assert: assert,
				sStatusCode: "3",
				expected: "Closed"
			});
		});
		
		QUnit.module("Formatter-SnowCasePriorityTxt");

		function formatSnowCasePriorityTxtTestCase(oOptions) {
			var sState = formatter.SnowCasePriorityTxt(oOptions.sPriorityCode);
			oOptions.assert.equal(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return the priority text of SNow Case according to priority code", function (assert) {
			formatSnowCasePriorityTxtTestCase.call(this, {
				assert: assert,
				sPriorityCode: "1",
				expected: "Very High"
			});
		});
		
		QUnit.test("Should return the priority text of SNow Case according to priority code", function (assert) {
			formatSnowCasePriorityTxtTestCase.call(this, {
				assert: assert,
				sPriorityCode: "2",
				expected: "High"
			});
		});
		QUnit.test("Should return the priority text of SNow Case according to priority code", function (assert) {
			formatSnowCasePriorityTxtTestCase.call(this, {
				assert: assert,
				sPriorityCode: "3",
				expected: "Medium"
			});
		});
		QUnit.test("Should return the priority text of SNow Case according to priority code", function (assert) {
			formatSnowCasePriorityTxtTestCase.call(this, {
				assert: assert,
				sPriorityCode: "4",
				expected: "Low"
			});
		});
		
		QUnit.module("Formatter-formatTimeOffset");

		function formatTimeOffsetTestCase(oOptions) {
			var sState = formatter.formatTimeOffset(oOptions.sTimeZone);
			oOptions.assert.equal(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return TimeZone offset according to Time Zone description", function (assert) {
			formatTimeOffsetTestCase.call(this, {
				assert: assert,
				sTimeZone: "PST",
				expected: "-8"
			});
		});
		
		QUnit.module("Formatter-formatDateFromUTC");

		function formatDateFromUTCTestCase(oOptions) {
			var sState = formatter.formatDateFromUTC(oOptions.sUTCDate, oOptions.sTimeoffset);
			oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return the converted time according to TimeZone offset", function (assert) {
			formatDateFromUTCTestCase.call(this, {
				assert: assert,
				sUTCDate: "20191220081030",
				sTimeoffset:"1",
				expected: "20191220091030"
			});
		});
		
		QUnit.module("Formatter-formatDateToUTC");

		function formatDateToUTCTestCase(oOptions) {
			var sState = formatter.formatDateToUTC(oOptions.sUTCDateString, oOptions.sTimeoffset);
			oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should return the converted time according to TimeZone offset", function (assert) {
			formatDateToUTCTestCase.call(this, {
				assert: assert,
				sUTCDateString: "20191220081030",
				sTimeoffset:"1",
				expected: "20191220071030"
			});
		});
		
		QUnit.module("Formatter-formatContractDes");

		function formatContractDesTestCase(oOptions) {
			var sState = formatter.formatContractDes(oOptions.sContractNo);
			oOptions.assert.equal(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "06ebc2841be9b3009307dceacd4bcb97",
				expected: "ES"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "06ebc2841be9b3009307dceacd4bcb99",
				expected: "PSLE-SEC"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "0aebc2841be9b3009307dceacd4bcb9a",
				expected: "CPC"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "0eebc2841be9b3009307dceacd4bcb9b",
				expected: "PSLA"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "0eebc2841be9b3009307dceacd4bcba9",
				expected: "SL"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "42ebc2841be9b3009307dceacd4bcb9c",
				expected: "MP"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "42ebc2841be9b3009307dceacd4bcbaa",
				expected: "MA4"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "46ebc2841be9b3009307dceacd4bcb98",
				expected: "STD"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "4aebc2841be9b3009307dceacd4bcb99",
				expected: "ES-SEC"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "4eebc2841be9b3009307dceacd4bcb9a",
				expected: "TSLDI"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "4eebc2841be9b3009307dceacd4bcba8",
				expected: "MA"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "82ebc2841be9b3009307dceacd4bcb9b",
				expected: "ORSL"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "82ebc2841be9b3009307dceacd4bcba9",
				expected: "AE"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "",
				expected: ""
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "86ebc2841be9b3009307dceacd4bcbaa",
				expected: "xMA4"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "8aebc2841be9b3009307dceacd4bcb98",
				expected: "PSLE"
			});
		});
		QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "8eebc2841be9b3009307dceacd4bcb99",
				expected: "CES"
			});
		});
			QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "c2ebc2841be9b3009307dceacd4bcb9a",
				expected: "CPremium"
			});
		});
			QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "c6ebc2841be9b3009307dceacd4bcb9b",
				expected: "PC"
			});
		});
			QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "c6ebc2841be9b3009307dceacd4bcba9",
				expected: "SLA"
			});
		});
			QUnit.test("Should convert contract No to contract description", function (assert) {
			formatContractDesTestCase.call(this, {
				assert: assert,
				sContractNo: "ceebc2841be9b3009307dceacd4bcb98",
				expected: "SEC"
			});
		});
		
		QUnit.module("Formatter-formatDateToDays");
		function formatDateToDaysTestCase(oOptions) {
			var sState = formatter.formatDateToDays(oOptions.sDate);
			oOptions.assert.propEqual(sState, oOptions.expected, "The result was correct");
		}

		QUnit.test("Should convert a data to how many hours after 1970-01-01 00:00:00", function (assert) {
			formatDateToDaysTestCase.call(this, {
				assert: assert,
				sDate: "1970-01-01 00:00:00",
				expected: 2
			});
		});

	});