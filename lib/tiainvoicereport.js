var getGroupReport = require('shangrila-myroutilities');
//var numtowords=require('./spellamount');

function groupedListByName(items, options) {

    getGroupReport.groupingOpts.groupFields = ["ac_type"];
    getGroupReport.groupingOpts.valueFields = [{
        field: "landing_amount",
        groupType: "sum"
    }, {
        field: "add_ded",
        groupType: "sum"
    }, {
        field: "service_security_charge",
        groupType: "sum"
    }, {
        field: "navigate_amount",
        groupType: "sum"
    }, {
        field: "parking_amount",
        groupType: "sum"
    }, {
        field: "total_amount",
        groupType: "sum"
    }, {
        field: "total_amount_in_npr",
        groupType: "sum"
    }];
	getGroupReport.groupingOpts.showGroupTypeLabel = false;
	var a = getGroupReport.getGroupReportFinalData(items, options);
	return a;
}

//Get Gross total Field 
function getGrossTotal(grossTotObj, grandTotalAndSubtotal) {
	var v = 0,
		gfLen = groupFieldArr.length,
		vlen = valueFieldArr.length;
	var grosstotObj = grossTotObj.__revenueGrossTotal = grossTotObj.__revenueGrossTotal || {};
	grosstotObj[groupFieldArr[gfLen - 1]] = 'Gross Total';
	grossTotObj.__revenueGrossTotal.total_class = "sub-total";
	grossTotObj.__revenueGrossTotal.isTotalPart = "Y";
	for (v = 0; v < vlen; v++) {
		grosstotObj[valueFieldArr[v].field] = grosstotObj[valueFieldArr[v].field] || 0;
		var grTot = grandTotalAndSubtotal.__grouping[valueFieldArr[v].groupType][valueFieldArr[v].field];
		grosstotObj[valueFieldArr[v].field] = parseFloat(grTot).toFixed(2);
	}
}

//Gget Vat total Field 
function getVatTotal(vatObj, grossTotal) {
	var v = 0,
		gfLen = groupFieldArr.length,
		vlen = valueFieldArr.length;
	var vatobj = vatObj.__revenueVAT = vatObj.__revenueVAT || {};
	vatobj[groupFieldArr[gfLen - 1]] = '13% VAT';
	vatObj.__revenueVAT.total_class = "sub-total";
	vatObj.__revenueVAT.isTotalPart = "Y";
	for (v = 0; v < vlen; v++) {
		vatobj[valueFieldArr[v].field] = vatobj[valueFieldArr[v].field] || 0;
		var totAmt = grossTotal.__revenueGrossTotal[valueFieldArr[v].field];
		var vatAmt = parseFloat(totAmt * 0.13).toFixed(2);
		vatobj[valueFieldArr[v].field] = vatAmt;
	}
}

//Gget Vat total Field 
function getGrandTotal(grandTotobj, grossTotal, vatTotal) {
	var v = 0,
		gfLen = groupFieldArr.length,
		vlen = valueFieldArr.length;

	var grandTotObj = grandTotobj.__revenueGrandTotal = grandTotobj.__revenueGrandTotal || {};
	grandTotObj[groupFieldArr[gfLen - 1]] = groupingOpts.grandTotalLabel;
	grandTotobj.__revenueGrandTotal.total_class = "grand-total";
	grandTotobj.__revenueGrandTotal.isTotalPart = "Y";
	for (v = 0; v < vlen; v++) {
		var totAmt = grossTotal.__revenueGrossTotal[valueFieldArr[v].field] || 0;
		var vatAmt = vatTotal.__revenueVAT[valueFieldArr[v].field];

		grandTotObj[valueFieldArr[v].field] = grandTotObj[valueFieldArr[v].field] || 0;
		var grandTotAmt = parseFloat(totAmt) + parseFloat(vatAmt);
		grandTotObj[valueFieldArr[v].field] = parseFloat(grandTotAmt).toFixed(2);
	}
}

function getGetailsPart(data, totalObj, detailsObj) {
	var gfLen = groupFieldArr.length,
		gf = 0;
	var vfLen = valueFieldArr.length,
		vf = 0;

	for (var a = 0; a < data.length; a++) {
		//out = out + options.fn(data[a]);
		detailsObj.push(data[a]);
		if (groupingOpts.showSubTotal) {
			nxt = a + 1;
			for (gf = gfLen - 1; gf >= 0; gf--) {
				//NOTE : don't use === here, eg. data[nxt] == null
				if (isEmpty(data[nxt]) ||
					data[nxt][groupFieldArr[gf]] != data[a][groupFieldArr[gf]]) {
					var dt = {
						total_class: "sub-total"
					};
					var tmp = totalObj;
					for (var g = 0; g <= gf; g++) {
						tmp = tmp[data[a][groupFieldArr[g]]];
					}
					var lbl = "";
					lbl = data[a][groupFieldArr[gf]];
					for (var t = (gf - 1); t >= 0; t--) {
						lbl = data[a][groupFieldArr[t]] + " > " + lbl;
					}
					dt[groupFieldArr[gfLen - 1]] = groupingOpts.subTotalLabel + "(" + lbl + ")";
					for (var v = 0; v < vfLen; v++) {
						var val = tmp.__grouping[valueFieldArr[v].groupType][valueFieldArr[v].field];
						dt[[valueFieldArr[v].field]] = parseFloat(val).toFixed(2); //tmp.__grouping[[valueFieldArr[v].field]];
					}
					detailsObj.push(dt);
				}
			}
		}
	}

}


function prepareTiaReceipt(data, options) {
	finalData = [];
	var detailsObj = [];
	var revenueDetails = [];
	var grossTotObj = {};
	var vatObj = {};
	var grandTotObj = {};
	finalData = groupedListByName(data, options);

	var detailsData = finalData[0];
	var grandTotalAndSubtotal = finalData[1];

	//Get Gross Total
	getGrossTotal(grossTotObj, grandTotalAndSubtotal);

	//Get VAT Total
	getVatTotal(vatObj, grossTotObj);

	//Get GrandTotal
	getGrandTotal(grandTotObj, grossTotObj, vatObj);

	//Get Details with subtotal
	getGetailsPart(detailsData, grandTotalAndSubtotal, detailsObj);

	pushToNamedArray(revenueDetails, "__revenueDetails", detailsObj);


   // grandTotObj.__revenueGrandTotal._grandTotalWords ="One lath and fifty thousand only.";
   var vfLen = valueFieldArr.length;
   var gtAmountNpr=grandTotObj.__revenueGrandTotal[valueFieldArr[vfLen-1].field];
   var gtAmountUsd=grandTotObj.__revenueGrandTotal[valueFieldArr[vfLen-2].field];

    grandTotObj.__revenueGrandTotal._grandTotalWordsNpr =getGroupReport.getnumberInWords(gtAmountNpr);
    grandTotObj.__revenueGrandTotal._grandTotalWordsDlr =getGroupReport.getdollarInWords(gtAmountUsd);
	    grandTotObj.__revenueGrandTotal._grandTotalNpr =gtAmountNpr;
    grandTotObj.__revenueGrandTotal._grandTotalDlr =gtAmountUsd;


	var finalRecord = [revenueDetails, grossTotObj, vatObj, grandTotObj];

	return finalRecord;
}

function getFinalReport(data, options) {
	var revData = prepareTiaReceipt(data, options);

	var mydata = {
		revenuedatas: (revData[0])[0].__revenueDetails, // getInvoiceReport(revenueData.revenueDetails, {})
		revenueGrossTotal: revData[1].__revenueGrossTotal,
		revenueVat: revData[2].__revenueVAT,
		revenueGrandTotal: revData[3].__revenueGrandTotal
	};
	return mydata;

}

function pushToNamedArray(ary, name, val) {
	var obj = {};
	obj[name] = val;
	ary.push(obj);
}

function isArray(obj) {
	if (obj.constructor == Array)
		return true;
	return false;
}

function isEmpty(x) {
	for (var i in x) {
		return false;
	}
	return true;
}

module.exports.getFinalReport = getFinalReport;