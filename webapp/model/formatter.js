sap.ui.define(
	[
		"sap/support/fsc2/model/models",
	],
	function (models) {
		"use strict";

		return {
			/**
			 * Defines a value state based on the favorite
			 *
			 * @public
			 * @param {number} isFav the statue of a post
			 * @returns {string} sValue the state for the favorite
			 */
			favoriteState: function (isFav) {
				if (isFav === "X") {
					return "sap-icon://favorite";
				} else {
					return "sap-icon://unfavorite";
				}
			},
			favoriteText: function (isFav) {
				if (isFav === "X") {
					return this.getResourceBundle().getText("removeF");
				} else {
					return this.getResourceBundle().getText("addF");
				}
			},
			trimPreZeros: function (sString) {
				if (sString) {
					return sString.replace(/\b(0+)/gi, "");
				}
			},
			formatBPNo: function (sString) {
				if (sString) {
					var sValue = "BP: " + sString.replace(/\b(0+)/gi, "");
					return sValue;
				}
			},
			formatSnowDateToExisting: function (sTime) {

				var time = sTime.replace(/-/g, ".");

				var temp = time.split(" "); // snow returns 2020-mm-dd 16:00:40, exisng is dd.mm.yyyy 16:00:40, we replace the - with . to make all formats the s

				var temp1 = temp[0].split(".");
				var iDay = temp1[2];
				var iMonth = temp1[1];
				var iYear = temp1[0];

				var sSorted = [iDay, iMonth, iYear].join(".");
				return sSorted + " " + temp[1];
			},
			formatERPNo: function (sString) {
				if (sString) {
					var sValue = "ERP: " + sString.replace(/\b(0+)/gi, "");
					return sValue;
				}
			},
			formatDate: function (sDate) { //return yyyy-mm-dd
				if (sDate && sDate !== "" && sDate !== "00000000" && sDate !== "00000000000000") {
					return sDate.substr(0, 4) + "-" + sDate.substr(4, 2) + "-" + sDate.substr(6, 2);
				}
			},
			formatPriority: function (sPriority) {
				if (sPriority === "1") {
					return "Error";
				} else if (sPriority === "3") {
					return "Warning";
				} else {
					return "None";
				}
			},
			formatIcdPriority: function (SNow_number, sPriority) {
				if (!sPriority) {
					return "None";
				}
				var sPriorityState;
				if (SNow_number) { //SNow Case
					switch (sPriority) {
					case "1":
						sPriorityState = "Error";
						break;
					case "2":
						sPriorityState = "Warning";
						break;
					default:
						sPriorityState = "None";
						break;
					}
				} else { // BC Incident
					switch (sPriority) {
					case "1":
						sPriorityState = "Error";
						break;
					case "3":
						sPriorityState = "Warning";
						break;
					default:
						sPriorityState = "None";
						break;
					}
				}
				return sPriorityState;
			},
			formatCriticalTansType: function (sTransType) {
				var sType = "";
				switch (sTransType) {
				case "ZS31":
					sType = "FAVORITE_ESCALATION_REQUESTS";
					break;
				case "ZS46":
					sType = "FAVORITE_ACTIVITIES";
					break;
				}
				return sType;
			},
			// formatStatusState: function (activity_status) {
			// 	if (activity_status === "E0010") {
			// 		return "Success";
			// 	}
			// 	return "None";
			// },

			formatStatusStateDetail: function (activity_status) {
				if (activity_status === "New") {
					return "Success";
				}
				return "None";
			},
			formatRating: function (sColor) {
				switch (sColor) {
				case "G":
					return "Green";
				case "Y":
					return "Yellow";
				case "R":
					return "Red";
				default:
					return "";
				}
			},
			formatRatingState: function (sColor) {
				switch (sColor) {
				case "A":
					return "Success";
				case "B":
					return "Warning";
				case "C":
					return "Error";
				default:
					return "None";
				}
			},
			// formatMasterBtnEnable: function (sUserId, sCreator, aPartiesInvolved, fDisplay, sStatus) {
			// 	if (sUserId && fDisplay && sStatus && sStatus !== "E0014") {
			// 		if (sCreator && sCreator === sUserId) {
			// 			return true;
			// 		} else if (aPartiesInvolved && Array.isArray(aPartiesInvolved.results)) {
			// 			var fRequestor = false;
			// 			$.each(aPartiesInvolved.results, function (index, item) {
			// 				if (item.parties_function === "Requestor" && item.xubname === sUserId) {
			// 					fRequestor = true;
			// 					return false;
			// 				}
			// 			});
			// 			return fRequestor;
			// 		} else {
			// 			return false;
			// 		}
			// 	} else {
			// 		return false;
			// 	}
			// },
			downloadUrl: function (oAttach) {
				if (oAttach.class === "CRM_P_URL") {
					return oAttach.file_type;
				} else {
					return oAttach.__metadata.media_src;
				}
			},
			uppercaseLeadingLetter: function (sStr) {
				if (Object.prototype.toString.call(sStr) !== "[object String]") {
					return "";
				}
				return sStr.substring(0, 1).toUpperCase() + sStr.substring(1);
			},
			// formatMimeType: function (oAttach) {
			// 	var tempArr = oAttach.file_type.split(".");
			// 	var sFileType = tempArr[tempArr.length - 1];
			// 	switch (sFileType) {
			// 	case "doc" || "docx":
			// 		return "application/msword";
			// 	case "jpg" || "jpe" || "jpeg":
			// 		return "image/jpg";
			// 	case "png":
			// 		return "image/png";
			// 	case "ppt" || "pptx":
			// 		return "application/vnd.ms-powerpoint";
			// 	case "PDF":
			// 		return "application/pdf";
			// 	case "xls" || "xlsx":
			// 		return "application/msexcel";
			// 	default:
			// 		return "text/plain";
			// 	}
			// },
			formatNotificationActId: function (objId, data) {
				if (objId) {
					return objId;
				} else {
					return data;
				}
			},
			formatTimestamp: function (oTime) {
				// var lang = this.getModel("language").getProperty("/browserLang");//I338673 check everywher called, maybe remove?
				if (Object.prototype.toString.call(oTime) === "[object String]") {
					if (oTime.length === 14 && /^[0-9]+.?[0-9]*$/.test(oTime)) {
						var utcYear = oTime.substr(4, 4);
						var utcMonth = oTime.substr(2, 2);
						var utcDay = oTime.substr(0, 2);
						var utcHour = oTime.substr(8, 2);
						var utcMinute = oTime.substr(10, 2);
						var utcSecond = oTime.substr(12, 2);
						var localTime = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute, utcSecond));

						var localYear = localTime.getFullYear();
						var localMonth = localTime.getMonth() + 1;
						var localDay = localTime.getDate();
						// if (lang.indexOf("de") !== -1) {
						// 	if (localMonth < 10) {
						// 		localMonth = "0" + localMonth;
						// 	}
						// 	if (localDay < 10) {
						// 		localDay = "0" + localDay;
						// 	}
						// 	return localDay + '.' + localMonth + "." + localYear; //14.12.2018
						// } else {
						var oMonth = this.getMonthDesc(localMonth);
						return /* "Updated: " + */ oMonth + ' ' + localDay + ", " + localYear; //Dec 14,2018
						// }
					} else {
						return "";
					}
				} else {
					return "";
				}
			},

			formatRequestDate: function (oTime) { //I338673 enhance this for UTC times!!!!!!! check if date type
				// var lang = this.getModel("language").getProperty("/browserLang");
				//var utcTime = Date.UTC(oTime.getUTCFullYear(), oTime.getUTCMonth(), oTime.getUTCDay(), oTime.getUTCHours(), oTime.getUTCMinutes(), oTime.getUTCSeconds());
				//var y = utcTime;
				if (oTime) {
					if (typeof oTime === "string") {
						return /*"Updated: " + */ oTime.slice(0, -9); //Dec 14,2018
					} else {
						var sMonth = this.getMonthDesc(oTime.getMonth() + 1);
						var sDay = oTime.getDate();
						var sYear = oTime.getFullYear();

						return /*W*/ sMonth + ' ' + sDay + ", " + sYear; //Dec 14,2018
					}
				} else {
					return "";
				}
			},

			formatMsgIsRead: function (oFlag) {
				if (oFlag === "") {
					return "High";
				} else {
					return "None";
				}
			},
			formatReviewDesc: function (sDesc, sReqReason) {
				if (sReqReason) {
					return sDesc + "\n" + "#" + sReqReason.split("\n").join("##") + "#";
				} else {
					return sDesc;
				}
			},
			formatTimelineDate: function (sValue) { //"03.12.2018 08:12:18"
				if (sValue) {
					var sTime;
					/*if (this.getModel("device") && this.getModel("device").getProperty("/os") === "iOS") {
						var dd = sValue.getDate();
						var mm = sValue.getMonth() + 1; //January is 0, so always add + 1
						var yyyy = sValue.getFullYear();
						var hh = sValue.getHours();
						var min = sValue.getMinutes();
						var ss = "00";
						if (dd < 10) {
							dd = "0" + dd;
						}
						if (mm < 10) {
							mm = "0" + mm;
						}
						var dateString = mm + "-" + dd + "-" + yyyy + "T" + hh + ":" + min + ":" + ss;
						sTime = new Date(dateString);
					} else*/
					if (typeof (sValue) === 'object') {
						sTime = sValue;
					} else if (typeof (sValue) === 'string') {
						var temp = sValue.split(" ");
						var temp1 = temp[0].split("."),
							temp2 = temp[1].split(":");
						//sTime = new Date(temp[0].split(".")[2] + "/" + temp[0].split(".")[1] + "/" + temp[0].split(".")[0] + " " + temp[1]);
						sTime = new Date(Date.UTC(temp1[2], temp1[1] - 1, temp1[0], temp2[0], temp2[1], temp2[2]));
					}
					if (sTime && isNaN(sTime) === false) {
						var minute = 1000 * 60;
						var hour = minute * 60;
						var day = hour * 24;
						var week = day * 7;
						var month = day * 30;
						var year = month * 12;
						var nowTime = new Date();
						var diffTime = nowTime - sTime;
						if (diffTime < 0) {
							return "";
						} else if (diffTime < minute) {
							return "Just now";
						} else if (diffTime < hour) {
							return parseInt(diffTime / minute) + (parseInt(diffTime / minute) > 1 ? " minutes ago" : " minute ago");
						} else if (diffTime < day) {
							return parseInt(diffTime / hour) + (parseInt(diffTime / hour) > 1 ? " hours ago" : " hour ago");
						} else if (diffTime < week) {
							return parseInt(diffTime / day) + (parseInt(diffTime / day) > 1 ? " days ago" : " day ago");
						} else if (diffTime < month) {
							return parseInt(diffTime / week) + (parseInt(diffTime / week) > 1 ? " weeks ago" : " week ago");
						} else if (diffTime < year) {
							return parseInt(diffTime / month) + (parseInt(diffTime / month) > 1 ? " months ago" : " month ago");
						} else if (diffTime >= year) {
							return parseInt(diffTime / year) + (parseInt(diffTime / year) > 1 ? " years ago" : " year ago");
						} else {
							return sValue;
						}
					} else {
						return sValue;
					}
				} else {
					return "";
				}
			},
			formatRequestIcon: function (sTransType, sEscType) {
				var sIcon = "";
				switch (sTransType) {
				case "sn_customerservice_escalation": //SNOW escalation
					if (sEscType === "0")
						sIcon = "sap-icon://quality-issue";
					else
						sIcon = "sap-icon://BusinessSuiteInAppSymbols/icon-gis-layer";
					break;
				case "ZS31": //Escalation
					sIcon = "sap-icon://BusinessSuiteInAppSymbols/icon-gis-layer";
					break;
				case "ZS46": //MCC Activity
					sIcon = "sap-icon://activity-items";
					break;
				case "ZTINB": //business down
					sIcon = "sap-icon://quality-issue";
					break;
				case "ZTINP": //P1 incident 
					sIcon = "sap-icon://overlay";
					break;
				case "ZS01": //Global Escalation Case
					sIcon = "sap-icon://BusinessSuiteInAppSymbols/icon-gis-layer"; //sap-icon://SAP-icons-TNT/escalation-end-event
					break;
				}
				return sIcon;
			},
			formatRequestHeader: function (sDesc) { //sTransType, 
				var sTemp = sDesc; //+ " (" + sId.replace(/\b(0+)/gi, "") + ")";
				// var sID = " (" + sId.replace(/\b(0+)/gi, "") + ")";
				var oModelDevice = models.createDeviceModel();
				if (oModelDevice.getProperty("/isPhone")) {
					if (sTemp.length > 40) {
						// return sDesc.substr(0, 37 - sID.length) + "..." + sID;
						return sDesc.substr(0, 40) + "...";
					} else {
						return sTemp;
					}
				} else {
					if ($(window).width() < 320) {
						// return sDesc.substr(0, 37 - sID.length) + "..." + sID;
						return sDesc.substr(0, 40) + "...";
					} else {
						return sTemp;
					}
				}
			},
			formatAddBtnEnable: function (sCustnum) {
				if (sCustnum !== "") {
					return true;
				} else {
					return false;
				}
			},
			formatRequestType: function (sTransType, sId, sPriority, SNow_number) { //sTransType, 
				var sReturn = "";
				var sID = " (" + sId.replace(/\b(0+)/gi, "") + ")";
				switch (sTransType) {
				case "ZS31": //Escalation
					sReturn = "Global Escal. Req."; //+ sID;
					break;
				case "ZS46": //MCC Activity
					sReturn = "Activity"; // + sID;
					break;
				case "ZTINB": //business down
					sReturn = "Business Down"; // + sID;
					break;
				case "sn_customerservice_escalation": //SNOW escalation down
					sReturn = "ServiceNOW Escalation"; // + sID;
					break;
				case "ZTINP": //P1 incident 
					// Add by I319741:
					if (sPriority === "1") {
						sReturn = "P1 Incident"; // + sID;
					} else if ((sPriority === "3") && !SNow_number) { //BC incident-p2
						sReturn = "P2 Incident"; // + sID;
					} else if ((sPriority === "2") && SNow_number) { //SNow incident -p2
						sReturn = "P2 Incident"; // + sID;
					}
				}
				return sReturn;
			},
			formatRequestId: function (sId) {
				if (sId) {
					return sId.replace(/\b(0+)/gi, "");
				}
			},

			formatNotificationTime: function (oTime) { //20181129055619
				// var lang = this.getModel("language").getProperty("/browserLang");
				if (Object.prototype.toString.call(oTime) === "[object String]") {
					if (oTime.length === 14 && /^[0-9]+.?[0-9]*$/.test(oTime)) {
						var utcYear = oTime.substr(0, 4);
						var utcMonth = oTime.substr(4, 2);
						var utcDay = oTime.substr(6, 2);
						var utcHour = oTime.substr(8, 2);
						var utcMinute = oTime.substr(10, 2);
						var utcSecond = oTime.substr(12, 2);
						var localTime = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute, utcSecond));

						var localYear = localTime.getFullYear();
						var localMonth = localTime.getMonth() + 1;
						var localDay = localTime.getDate();
						var oMonth = this.getMonthDesc(localMonth);
						return oMonth + ' ' + localDay + ", " + localYear; //Dec 14,2018
						// }
					} else {
						return "";
					}
				} else {
					return "";
				}
			},
			formatTime1: function (oTime, bFlag) { //13122006101557
				if (Object.prototype.toString.call(oTime) === "[object String]") {
					if (oTime.length === 14 && /^[0-9]+.?[0-9]*$/.test(oTime)) {
						var utcYear = oTime.substr(4, 4);
						var utcMonth = oTime.substr(2, 2);
						var utcDay = oTime.substr(0, 2);
						var utcHour = oTime.substr(8, 2);
						var utcMinute = oTime.substr(10, 2);
						var utcSecond = oTime.substr(12, 2);
						var localTime = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute, utcSecond));
						if (bFlag) {
							return localTime;
						} else {
							return /*"Updated: " +*/ this.formatTimeLocal(localTime);
						}
					} else {
						return "";
					}
				} else {
					return "";
				}
			},
			formatTime2: function (oTime, bFlag) { //2017-03-02T09:47:57
				if (Object.prototype.toString.call(oTime) === "[object Date]") {
					if (bFlag) {
						return oTime;
					} else {
						return /*"Updated: " +*/ this.formatTimeLocal(oTime);
					}
				} else {
					return "";
				}
			},
			formatTime3: function (oTime, bFlag) { //20181129055619
				if (Object.prototype.toString.call(oTime) === "[object String]") {
					if (oTime.length === 14 && /^[0-9]+.?[0-9]*$/.test(oTime)) {
						var utcYear = oTime.substr(0, 4);
						var utcMonth = oTime.substr(4, 2);
						var utcDay = oTime.substr(6, 2);
						var utcHour = oTime.substr(8, 2);
						var utcMinute = oTime.substr(10, 2);
						var utcSecond = oTime.substr(12, 2);
						var localTime = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, utcHour, utcMinute, utcSecond));
						if (bFlag) {
							return localTime;
						} else {
							return /* "Updated: " + */ this.formatTimeLocal(localTime);
						}
					} else {
						return "";
					}
				} else {
					return "";
				}
			},
			formatTime4: function (oTime) { //transfer DateTime to  Dec 14,2018 THH:mm:ss
				if (Object.prototype.toString.call(oTime) === "[object Date]") {
					var sDate = this.formatTimeLocal(oTime);
					var sHour = oTime.getHours();
					var sMin = oTime.getMinutes();
					var sSecond = oTime.getSeconds();
					sHour = (sHour < 10) ? "0" + sHour.toString() : sHour.toString();
					sMin = (sMin < 10) ? "0" + sMin.toString() : sMin.toString();
					sSecond = (sSecond < 10) ? "0" + sSecond.toString() : sSecond.toString();
					var sTimeStamp = sDate + " T" + sHour + ":" + sMin + ":" + sSecond;
					return sTimeStamp;
				} else {
					return "";
				}

			},
			formatTimeLocal: function (localTime) {
				if (!localTime) {
					return "";
				}
				var localYear = localTime.getFullYear();
				var localMonth = localTime.getMonth() + 1;
				var localDay = localTime.getDate();
				var oMonth = this.getMonthDesc(localMonth);
				return oMonth + ' ' + localDay + ", " + localYear; //Dec 14,2018
				// }
			},
			formatTooltip: function (sAuth, sId) {
				if (sAuth) {
					return sId;
				} else {
					return this.getResourceBundle().getText("engageCaseTooltip");
				}
			},
			formatEscalation: function (sEsca) {
				var sText;
				switch (sEsca) {
				case "14":
					sText = "This is a Critical Incident";
					break;
				case "15":
					sText = "This is a Business Down incident";
					break;
				case "17":
					sText = "This is a Premium Engagement Critical incident";
					break;
				default:
					sText = "";
					break;
				}
				return sText;
			},
			formatNumString: function (sCssID) {
				var sFormatValue = "";
				if (sCssID !== "") {
					sFormatValue = sCssID.substr(0, 10) + " " + sCssID.substr(10, 10) + " " + sCssID.substr(20, 4);
				}
				return sFormatValue;
			},
			formatCssShortID: function (sCssID) {
				var sShortID = "";
				if (sCssID !== "") {
					var sMidID = sCssID.substr(10, 10).replace(/\b(0+)/gi, "");
					sShortID = sMidID + "/" + sCssID.substr(20, 4);
				}
				return sShortID;
			},
			getMonthDesc: function (sMonth) { //switch Month 1 to "Jun"
				var oMonth;
				switch (sMonth) {
				case 1:
					oMonth = "Jan";
					break;
				case 2:
					oMonth = "Feb";
					break;
				case 3:
					oMonth = "Mar";
					break;
				case 4:
					oMonth = "Apr";
					break;
				case 5:
					oMonth = "May";
					break;
				case 6:
					oMonth = "June";
					break;
				case 7:
					oMonth = "July";
					break;
				case 8:
					oMonth = "Aug";
					break;
				case 9:
					oMonth = "Sept";
					break;
				case 10:
					oMonth = "Oct";
					break;
				case 11:
					oMonth = "Nov";
					break;
				case 12:
					oMonth = "Dec";
					break;
				}
				return oMonth;
			},
			formatDate8Desc: function (sDate) { //"20191108" convert to "2019-Nov-8"
				var sDesc = "";
				if (!sDate) {
					return sDesc;
				}
				var sYear = sDate.substr(0, 4);
				var sMonth = sDate.substr(4, 2);
				var sDay = sDate.substr(6, 2);
				sDesc = sYear + "-" + this.getMonthDesc(parseInt(sMonth)) + "-" + sDay;
				return sDesc;
			},
			formatDateTime5: function (sInitDate) { //"2019-11-08 02:09:50" convert to "2019-Nov-8 T02:09:50"
				var sDesc = "";
				if (!sInitDate) {
					return sDesc;
				}
				var sDate = sInitDate.substr(0, 10).replace(/-/g, "");
				var sInitTime = sInitDate.substr(11, 8);
				var sYear = sDate.substr(0, 4);
				var sMonth = sDate.substr(4, 2);
				var sDay = sDate.substr(6, 2);
				sDesc = this.getMonthDesc(parseInt(sMonth)) + " " + sDay + ", " + sYear + " T" + sInitTime;
				return sDesc;
			},
			formatDateTime6: function (sInitDate) { //"2019-11-08 02:09:50" convert to "Nov 8, 2019"
				var sDesc = "";
				if (!sInitDate) {
					return sDesc;
				}
				var sDate = sInitDate.substr(0, 10).replace(/-/g, "");
				var sYear = sDate.substr(0, 4);
				var sMonth = sDate.substr(4, 2);
				var sDay = sDate.substr(6, 2);
				sDesc = this.getMonthDesc(parseInt(sMonth)) + " " + sDay + ", " + sYear;
				return sDesc;
			},
			formatDateTime7: function (sInitDate) { //"2019-11-08 02:09:50" convert to how many Milliseconds from 1970-01-01 00:00:00
				var sDateMilliSeond = 0;
				if (!sInitDate) {
					return sDateMilliSeond;
				}
				sDateMilliSeond = new Date(sInitDate.replace(/-/g, '/')).getTime();
				return sDateMilliSeond;
			},
			formatDateTime8: function (sInitDate) { //"25112019081602(2019-11-25 08:16:02)" convert to how many Milliseconds from 1970-01-01 00:00:00
				var sDateMilliSeond = 0;
				if (!sInitDate) {
					return sDateMilliSeond;
				}
				var utcYear = sInitDate.substr(4, 4);
				var utcMonth = sInitDate.substr(2, 2);
				var utcDay = sInitDate.substr(0, 2);
				var utcHour = sInitDate.substr(8, 2);
				var utcMinute = sInitDate.substr(10, 2);
				var utcSecond = sInitDate.substr(12, 2);
				var sDate = utcYear + "-" + utcMonth + "-" + utcDay + " " + utcHour + ":" + utcMinute + ":" + utcSecond;
				sDateMilliSeond = new Date(sDate.replace(/-/g, '/')).getTime();
				return sDateMilliSeond;
			},
			formatDateTime9: function (sInitDate) { //"/Date(1531727955000)/" convert to how many Milliseconds from 1970-01-01 00:00:00
				var sDateMilliSeond = 0;
				if (!sInitDate) {
					return sDateMilliSeond;
				}
				// var sYear = sInitDate.getFullYear();
				// var sMonth = sInitDate.getMonth() + 1;
				// var sDay = sInitDate.getDate();
				// var sHour = sInitDate.getHours();
				// var sMin = sInitDate.getMinutes();
				// var sSecond = sInitDate.getSeconds();
				// sMonth = (sMonth < 10) ? "0" + sMonth.toString() : sMonth.toString();
				// sDay = (sDay < 10) ? "0" + sDay.toString() : sDay.toString();
				// sHour = (sHour < 10) ? "0" + sHour.toString() : sHour.toString();
				// sMin = (sMin < 10) ? "0" + sMin.toString() : sMin.toString();
				// sSecond = (sSecond < 10) ? "0" + sSecond.toString() : sSecond.toString();
				// var sDate = sYear + "-" + sMonth + "-" + sDay + " " + sHour + ":" + sMin + ":" + sSecond;
				// sDateMilliSeond = new Date(sDate).getTime();
				return sInitDate.getTime();
			},
			formatDateTime10: function (sInitDate) { //"20191125081602(2019-11-25 08:16:02)" convert to how many Milliseconds from 1970-01-01 00:00:00
				var sDateMilliSeond = 0;
				if (!sInitDate) {
					return sDateMilliSeond;
				}
				var utcYear = sInitDate.substr(0, 4);
				var utcMonth = sInitDate.substr(4, 2);
				var utcDay = sInitDate.substr(6, 2);
				var utcHour = sInitDate.substr(8, 2);
				var utcMinute = sInitDate.substr(10, 2);
				var utcSecond = sInitDate.substr(12, 2);
				var sDate = utcYear + "-" + utcMonth + "-" + utcDay + " " + utcHour + ":" + utcMinute + ":" + utcSecond;
				sDateMilliSeond = new Date(sDate.replace(/-/g, '/')).getTime();
				return sDateMilliSeond;
			},
			formatDateTime11: function (sDateTime) { //"(2019-11-25 08:16:02)" convert to /Date(1531727955000)/
				var sValue = "";
				var sUtcDate = "";
				sDateTime = sDateTime.replace(/-/g, "/"); // iOS does not allow '-' --> replace by /
				if (sDateTime) {
					sValue = new Date(sDateTime);
					sUtcDate = new Date(Date.UTC(sValue.getUTCFullYear(), sValue.getMonth(), sValue.getDate(), sValue.getHours(), sValue.getMinutes()));
				}
				return sUtcDate;
			},
			// formatIncidentCatalog: function (sID) {
			// 	var sValue = sID.substr(0, 2);
			// 	var sCalalog = "BC";
			// 	if (sValue === "CS") {
			// 		sCalalog = "Snow";
			// 	}
			// 	var sCataDesc = "(" + sCalalog + ")";
			// 	return sCataDesc;
			// },
			priorityTxt: function (priorityCode) {
				var sText = "";
				switch (priorityCode) {
				case "1":
					sText = "Very High";
					break;
				case "3":
					sText = "High";
					break;
				case "5":
					sText = "Medium";
					break;
				case "9":
					sText = "Low";
					break;
				}
				return sText;
			},
			RequestReasonTxt: function (ReqReas1, ReqReas2, ReqReas3, ReqReas4, ReqReas5, ReqReas6, otherTxt) {
				var sTxt = "";
				if (ReqReas1) {
					sTxt = sTxt + "Overall processing time \n";
				}
				if (ReqReas2) {
					sTxt = sTxt + "Lack of response from SAP \n";
				}
				if (ReqReas3) {
					sTxt = sTxt + "No processor assigned \n";
				}
				if (ReqReas4) {
					sTxt = sTxt + "Critical issue with approaching due date \n";
				}
				if (ReqReas5) {
					sTxt = sTxt + "Communication challenge with processor \n";
				}
				if (ReqReas6) {
					sTxt = sTxt + "Other reason: " + otherTxt;
				}
				return sTxt;
			},
			TimeTransToAmPm: function (sTime) {
				var sTimeFormatted = "";
				if (!sTime) {
					return sTimeFormatted;
				}
				var sHour = parseInt(sTime.substr(0, 2));
				if (sHour < 12) {
					sTimeFormatted = sTime + " AM";
				} else if (sHour === 12) {
					sTimeFormatted = sTime + " PM";
				} else if (sHour >= 22) {
					sHour = sHour - 12;
					sTimeFormatted = sHour + sTime.substr(2, 3) + " PM";
				} else {
					sHour = sHour - 12;
					sTimeFormatted = "0" + sHour + sTime.substr(2, 3) + " PM";
				}
				return sTimeFormatted;
			},
			SnowCaseStatusTxt: function (state) {
				var statusTxt = "";
				switch (state) {
				case "1":
					statusTxt = "New";
					break;
				case "10":
					statusTxt = "In progress";
					break;
				case "18":
					statusTxt = "Awaiting Info";
					break;
				case "6":
					statusTxt = "Resolved";
					break;
				case "3":
					statusTxt = "Closed";
					break;
				}
				return statusTxt;
			},
			
			formatEnvironmentURL: function () {
			var currentUrl = window.location.href, 
				url = "";

			if (currentUrl.includes("kinkajou") || currentUrl.includes("sapit-home-test-004") || currentUrl.includes("sapitcloudt")) {
				//we are in test environment
					url = "https://test.itsm.services.sap/mccsos";
			} else if (currentUrl.includes("mallard") || currentUrl.includes("sapit-home-dev-004") || currentUrl.includes("port5000")) {
				//we are in dev environment
				url = "https://dev.itsm.services.sap/mccsos";
			} else if (currentUrl.includes("kestrel") || currentUrl.includes("sapit-home-prod-004")) {
				url = "https://itsm.services.sap/mccsos";
			}else {
				url = "https://itsm.services.sap/mccsos";	
			}
			return url;
		},
			
			SnowEscalationStatusTxt: function (state) {
				var statusTxt = "";
				switch (state) {
				case "100":
					statusTxt = "Requested";
					break;
				case "101":
					statusTxt = "Escalated";
					break;
				case "102":
					statusTxt = "Declined";
					break;
				case "103":
					statusTxt = "Closed";
					break;
				case "104":
					statusTxt = "De-escalation Requested";
					break;
				}
				return statusTxt;
			},
			SnowCasePriorityTxt: function (priority) {
				var PriorityTxt = "";
				switch (priority) {
				case "1":
					PriorityTxt = "Very High";
					break;
				case "2":
					PriorityTxt = "High";
					break;
				case "3":
					PriorityTxt = "Medium";
					break;
				case "4":
					PriorityTxt = "Low";
					break;
				}
				return PriorityTxt;
			},
			formatTimeOffset: function (sTimeZone) { //from timezone to get time offset:
				var oTimeZone = {
					"PST": "-8",
					"MST": "-7",
					"CST": "-6",
					"EST": "-5",
					"WET": "0",
					"CET": "1",
					"EET": "2",
					"UK": "0",
					"UTC": "0",
					"UTC+53": "5.5",
					"UTC+6": "6",
					"UTC+7": "7",
					"UTC+8": "8"
				};
				var sTimeoffset = oTimeZone[sTimeZone];
				return sTimeoffset;
			},
			formatDateFromUTC: function (sUTCDate, sTimeoffset) { //convert UTC date to specific time zone: yyyyMMddHHmmSS
				var sDateInit = sUTCDate.substr(0, 4) + "-" + sUTCDate.substr(4, 2) + "-" + sUTCDate.substr(6, 2) + " " + sUTCDate.substr(8, 2) + ":" +
					sUTCDate.substr(10, 2) + ":" + sUTCDate.substr(12, 2);
				var sNowDate = new Date(sDateInit.replace(/-/g, '/')).getTime();
				var offset = parseInt(sTimeoffset) * 60 * 60 * 1000;
				var sNewDate = new Date(sNowDate + offset);
				var sYear = sNewDate.getFullYear();
				var sMonth = sNewDate.getMonth() + 1;
				var sDate = sNewDate.getDate();
				var sHour = sNewDate.getHours();
				var sMin = sNewDate.getMinutes();
				var sSecond = sNewDate.getSeconds();
				var DateString = sYear + this.formatLength2(sMonth) + this.formatLength2(sDate) + this.formatLength2(sHour) + this.formatLength2(sMin) +
					this.formatLength2(sSecond);
				return DateString;

			},
			formatLength2: function (sNum) {
				var sValue = "";
				if (!sNum || sNum === 0) {
					sValue = "00";
				} else if (sNum && sNum < 10) {
					sValue = "0" + sNum;
				} else {
					sValue = sNum.toString();
				}
				return sValue;
			},
			formatDateToUTC: function (DateString, sTimeoffset) { //convert current selected date to UTC time zone
				var sOffset = 0;
				sTimeoffset = parseInt(sTimeoffset);
				if (sTimeoffset > 0) {
					sOffset = 0 - sTimeoffset;
				} else if (sTimeoffset < 0) {
					sOffset = Math.abs(sTimeoffset);
				}
				var sUTCDateString = this.formatDateFromUTC(DateString, sOffset);
				return sUTCDateString;
			},
			formatContractDes: function (sContractNo) {
				var sDesc = "";
				switch (sContractNo) {
				case "06ebc2841be9b3009307dceacd4bcb97":
					sDesc = "ES";
					break;
				case "06ebc2841be9b3009307dceacd4bcb99":
					sDesc = "PSLE-SEC";
					break;
				case "0aebc2841be9b3009307dceacd4bcb9a":
					sDesc = "CPC";
					break;
				case "0eebc2841be9b3009307dceacd4bcb9b":
					sDesc = "PSLA";
					break;
				case "0eebc2841be9b3009307dceacd4bcba9":
					sDesc = "SL";
					break;
				case "42ebc2841be9b3009307dceacd4bcb9c":
					sDesc = "MP";
					break;
				case "42ebc2841be9b3009307dceacd4bcbaa":
					sDesc = "MA4";
					break;
				case "46ebc2841be9b3009307dceacd4bcb98":
					sDesc = "STD";
					break;
				case "4aebc2841be9b3009307dceacd4bcb99":
					sDesc = "ES-SEC";
					break;
				case "4eebc2841be9b3009307dceacd4bcb9a":
					sDesc = "TSLDI";
					break;
				case "4eebc2841be9b3009307dceacd4bcba8":
					sDesc = "MA";
					break;
				case "82ebc2841be9b3009307dceacd4bcb9b":
					sDesc = "ORSL";
					break;
				case "82ebc2841be9b3009307dceacd4bcba9":
					sDesc = "AE";
					break;
				case "86ebc2841be9b3009307dceacd4bcbaa":
					sDesc = "xMA4";
					break;
				case "8aebc2841be9b3009307dceacd4bcb98":
					sDesc = "PSLE";
					break;
				case "8eebc2841be9b3009307dceacd4bcb99":
					sDesc = "CES";
					break;
				case "c2ebc2841be9b3009307dceacd4bcb9a":
					sDesc = "CPremium";
					break;
				case "c6ebc2841be9b3009307dceacd4bcb9b":
					sDesc = "PC";
					break;
				case "c6ebc2841be9b3009307dceacd4bcba9":
					sDesc = "SLA";
					break;
				case "ceebc2841be9b3009307dceacd4bcb98":
					sDesc = "SEC";
					break;
				}
				return sDesc;
			},
			formatDateToDays: function (sDate) { //convert a data to how many hours after 1970-01-01 00:00:00
				var sValue = 0;
				if (!sDate) {
					return sValue;
				}
				var sYear = parseInt(sDate.substr(0, 4));
				var sMonth = parseInt(sDate.substr(5, 2)) - 1;
				var sDay = parseInt(sDate.substr(8, 2));
				var sHour = parseInt(sDate.substr(11, 2));
				var sMins = parseInt(sDate.substr(14, 2));
				var sSecond = parseInt(sDate.substr(17, 2));
				sValue = Date.UTC(sYear, sMonth, sDay, sHour, sMins, sSecond) / 86400000;
				return sValue;
			},
			formatName: function (firstName, lastName) {
				var sName = "";
				if (firstName && lastName) {
					sName = firstName + " " + lastName;
				}
				return sName;
			},

			formatTableHighlight: function (ID, type, date) {
				var state = "None";
				if (ID) {
					var hours = Math.abs(new Date() - new Date(date.substring(0, date.indexOf(" T")))) / 36e5;
					if (hours < 48) {
						state = "Warning";
					}
					return state;
				} else {
					return state;
				}
			},
			getCimActionStatus: function (status) {
				var sStatusDesc = "";
				if (status === "-10") {
					sStatusDesc = "Awaiting Requester";
				} else if (status === "-20") {
					sStatusDesc = "Awaiting Incident";
				} else if (status === "-30") {
					sStatusDesc = "Awaiting Problem";
				} else if (status === "-40") {
					sStatusDesc = "Awaiting Change";
				} else if (status === "-50") {
					sStatusDesc = "In Progress by partner";
				} else if (status === "-55") {
					sStatusDesc = "In Progress by BCP";
				} else if (status === "-60") {
					sStatusDesc = "Awaiting requester by partner";
				} else if (status === "-70") {
					sStatusDesc = "Awaiting Partner";
				} else if (status === "-80") {
					sStatusDesc = "Awaiting Service Request";
				} else if (status === "-90") {
					sStatusDesc = "Pending release / hotfix";
				} else if (status === "-100") {
					sStatusDesc = "Pending Permanent Fix";
				} else if (status === "-110") {
					sStatusDesc = "Cancelled";
				} else if (status === "-120") {
					sStatusDesc = "Duplicate";
				} else if (status === "-130") {
					sStatusDesc = "Solution confirmed";
				} else if (status === "-140") {
					sStatusDesc = "Auto closure";
				}
				return sStatusDesc;
			},
			SnowColumnVisible: function (results) {
				var visible = false;
				if (results) {
					results.forEach(function (item) {
						if (item.SNow_number) {
							visible = true;
						}
					});
				}
				return visible;
			},

			formatStatusSort: function (status) {
				// Convert  status for sorting
				switch (status) {
				case "1": //New
					return 1;
					break;
				case "E0010": //New
					return 1;
					break;
				case "18": //Awaiting Info
					return 2;
					break;
				case "100": //Requested
					return 3;
					break;
				case "E0012": //Responsible Action
					return 4;
					break;
				case "10": //In progress
					return 5;
					break;
				case "E0019": //In Process
					return 6;
					break;
				case "E0011": //In Process Backoffice
					return 7;
					break;
				case "E0018": //"In Process SAC"
					return 8;
					break;
				case "E0021": //"In Process IEM"
					return 9;
					break;
				case "E0022": //"In Process CIC"
					return 10;
					break;
				case "E0023": //"In Process COM"
					return 11;
					break;
				case "E0024": //"In Process PS"
					return 12;
					break;
				case "E0025": //"In Process IMS"
					return 13;
					break;
				case "104": //"De-escalation Requested"
					return 14;
					break;
				case "101": //"Escalated"
					return 15;
					break;
				case "102": //"Declined"
					return 16;
					break;
				case "6": //"Resolved"
					return 17;
					break;
				case "E0013": //"Confirmed"
					return 18;
					break;
				case "E0014": // "Closed"
					return 19;
					break;
				case "3": //"Closed"
					return 20;
					break;
				case "103": //"Closed"
					return 21;
					break;
				default:
					return 40;
					break;
				}

			},
			formatTextType: function (textType) {
				if (textType) {
					switch (textType) {
					case "work_notes":
						return "work notes";
						break;
					case "u_customer_comments":
						return "customer comments";
						break;
					case "u_provider_info":
						return "provider info";
						break;
					default:
						return textType;
						break;
					}
				} else {
					return "";
				}
			},
			/**
			 * returns profile image url
			 * @param {string} sUserId  
			 * @returns {string} 
			 */
			formatProfileImage: function (sUserId) {
				//"https://fiorilaunchpad.sap.com/sap/fiori/mccsos/" +
				return sap.support.fsc2.AppUrl +
					"sap/ui5/1/resources/sapit/sapitapi/user-info/" +
					sUserId +
					"/profile-picture?size=ORIGINAL";
			},
			/**
			 * formats tooltip for the requests tile on the dashboard
			 * @param {Boolean} bLoadComplete 
			 * @param {Number} reqsChanged 
			 * @param {Number} myReqs 
			 * @returns {String}
			 */
			formatReqTtip: function (bLoadComplete, reqsChanged, myReqs) {
				var sPluralChanged = reqsChanged === 1 ? "" : "s";
				var sPluralmyReqs = myReqs === 1 ? "" : "s";
				var sResult = bLoadComplete ? reqsChanged + " request" + sPluralChanged + " updated in last 48 hours, " +
					myReqs + " request" + sPluralmyReqs + " in total" : "Loading Requests";
				return sResult;
			},
			// formatSNowNum:function(sShortID,SNow_number){
			// 	var sValue = sShortID;
			// 	if(SNow_number){
			// 		sValue = sShortID + " (" + SNow_number + ")";
			// 	}
			// 	return sValue;
			// }
			// formattEscalation:function(sEscNo){
			// 	var sEscDesc="";
			// 	if (sEscNo === "15") {
			// 	  sEscDesc = "Business Down";
			// 	} 
			// 	return sEscDesc;
			// }

			formatEscalationExpectedAction: function (sExpectedAction) {
				var sResult = "";
				if (sExpectedAction) {
					if (sExpectedAction.includes("b14da5cddb3ed4103da8366af4961917")) {
						sResult += "Raise priority,";
					}
					if (sExpectedAction.includes("bb4d29cddb3ed4103da8366af4961971")) {
						sResult += "Speed up,";
					}
					if (sExpectedAction.includes("70bcad0ddb3ed4103da8366af4961975")) {
						sResult += "Assign processor";
					}
					if (sExpectedAction.includes("7eda18681becc950d9c921fbbb4bcb64")) {
						sResult += "Handover to APJ";
					}
					if (sExpectedAction.includes("bd3ad8641becc950d9c921fbbb4bcb85")) {
						sResult += "Handover to EMEA";
					}
					if (sExpectedAction.includes("138a5ca41becc950d9c921fbbb4bcbf6")) {
						sResult += "Handover to NA";
					}
					if (sExpectedAction.includes("adba58681becc950d9c921fbbb4bcbb2")) {
						sResult += "Handover to LAC";
					}
				}
				return sResult;
			},

			/**
			 * formats tooltip for the requests tile on the dashboard
			 * @param {String} sType 
			 * @returns {String} 
			 */
			formatEscalationType: function (sType) {
				var sResult = "";
				if (!sType) return "";
				switch (sType) {
				case "0":
					sResult = "Technical Backoffice Engagement";
					break;
				case "2":
					sResult = "Critical Customer Management";
					break;
				case "3":
					sResult = "Critical Incident Management";
					break;
				}

				return sResult;
			},

			formatLogoSrc: function (imageType, value) {
				if (!imageType && !value) return "";
				return "data:" + imageType + ";base64," + value;
			},

			formatCCSPriorityText: function (formatter, priority) {
				var output = "";
				if (formatter === "snow") {
					switch (priority) {
					case "1":
						output = "Very High";
						break;
					case "2":
						output = "High";
						break;
					case "3":
						output = "Medium";
						break;
					case "4":
						output = "Low";
						break;
					}
				}
				if (formatter == "bcp") {
					switch (priority) {
					case "1":
						output = "Very High";
						break;
					case "3":
						output = "High";
						break;
					case "5":
						output = "Medium";
						break;
					case "9":
						output = "Low";
						break;
					}
				}
				return output;
			}

		};

	});