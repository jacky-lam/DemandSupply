var server_webapp_url = "http://localhost:8081/DemandSupply";

/*
 * Author:	Yun Fat Lam
 * Purpose:	Generic functions that can be used across other web-apps.
 * Comment: Need to define the web-app URL on the server (server_webapp_url)
 * 
 * */
function CreateAjaxCall(path, params, callbackfunction, method, synctype)
{
	if(synctype==undefined) synctype=true;

	var ajaxRequest;
	if (window.XMLHttpRequest)// code for IE7+, Firefox, Chrome, Opera, Safari
	{
		ajaxRequest = new XMLHttpRequest();
	}
	else// code for IE6, IE5
	{
		ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	ajaxRequest.onreadystatechange=callbackfunction;
	var paramList="";
	
	for(var key in params) 
	{
		if(params.hasOwnProperty(key) && params[key]!=undefined) 
		{
			paramList+=key+"="+params[key]+"&";
		}
	}
	ajaxRequest.open(method,path,synctype);
	ajaxRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	ajaxRequest.send(paramList);
}

function validateNumber(input, maximum_figure, minimum_figure)
{
	var result = false;
	
	var text = input.value+"";
	
	if(text.match(/^[0-9\.-]+$/))
	{
		//remove any leading with zeros
		if(text.indexOf("0") ==0)
		{
			while(text.indexOf("0")==0)
				text = text.substring(1);
			
			input.value = text;
		}
		
		if(text=="") input.value = 0;
		
		result = true;
	}
	else
	{
		input.value = 0; //set number back to 0
		result = false;
	}
	
	//Check reached limit
	if(result && ((maximum_figure != undefined && maximum_figure != null) || (minimum_figure != undefined && minimum_figure != null)))
	{
		if(maximum_figure != undefined && maximum_figure != null)
		{
			if(Number(text) > maximum_figure)
			{
				input.value = maximum_figure;
			}
		}
		if(minimum_figure != undefined && minimum_figure != null)
		{
			if(Number(text) < minimum_figure)
			{
				input.value = minimum_figure;
			}
		}
	}
	
	return result;
}


//validate date string
function validateDate(text)
{
	var result = false;
	
	var month_arrays = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	
	if(text != null)
	{
		//check the three input fields (DD-MMM-YYYY)
		var date_params = text.split("-");
		if(date_params.length == 3)
		{
			//Year and Day is numeric integer && Month is found from array above
			if( date_params[0].match(/^[0-9]+$/) && date_params[2].match(/^[0-9]+$/) && (month_arrays.indexOf(date_params[1]) != -1) )
			{
				//day is valid numbers
				var day = Number(date_params[0]);
				if(day >= 1 && day <= 31)
				{
					result = true;
				}
			}
		}
	}
	
	return result;
}

function dateCompare(date1, date2)
{
	var result = null;
	if(validateDate(date1) && validateDate(date2))
	{
		var month_arrays = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		
		var date1_param = date1.split("-");
		var date2_param = date2.split("-");
		
		//Compare years
		var date1_year 	= Number(date1_param[2]);
		var date2_year	= Number(date2_param[2]);
		if( date1_year > date2_year ) //date1 is after date2
		{
			result = 1;
		}
		else if( date1_year < date2_year ) //date1 is before date2
		{
			result = -1;
		}
		else //date1 same year as date2
		{
			//Compare month
			var date1_mon = month_arrays.indexOf(date1_param[1]);
			var date2_mon = month_arrays.indexOf(date2_param[1]);
			
			if(date1_mon > date2_mon) //date1's month is after date2
			{
				result = 1;
			}
			else if(date1_mon < date2_mon) //date1's month is before date2
			{
				result = -1;
			}
			else //date1 same year&month as date2
			{
				//Compare day
				var date1_day = Number(date1_param[0]);
				var date2_day = Number(date2_param[0]);
				
				if(date1_day > date2_day) //date1's day is after date2
				{
					result = 1;
				}
				else if(date1_day < date2_day) //date1's day is before date2
				{
					result = -1;
				}
				else //date1 same year&month&day as date2
				{
					result = 0;
				}
			}
		}
	}
	
	return result;
}

//Convert the string-date to date-object
function convertStringToDate(date, symbol_split)
{
	if(symbol_split == undefined || symbol_split == null)
	{
		symbol_split = "-";
	}
		
	var result = null;
	if(validateDate(date))
	{
		var month_arrays = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; //Standard JS arra
		
		var date_param 	= date.split(symbol_split);
		var date_year 	= date_param[2];
		var date_month_s= date_param[1];
		var date_day 	= date_param[0];
		
		result = new Date(date_month_s+" "+date_day+", "+date_year+" 00:00:00");
	}
	
	return result;
}

//convert date object to string (11-Jan-2014)
function convertDateToString(date_oo, symbol_split)
{
	var result = "";
	
	if(symbol_split == undefined || symbol_split == null)
	{
		symbol_split = "-";
	}
	
	var month_arrays = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	
	//get each unit value from date object
	var day 	= date_oo.getDate() + "";
	var month 	= month_arrays[date_oo.getMonth()] + "";
	var year 	= date_oo.getFullYear() + "";
	
	//add 0 infront if less than two digits
	if(day.length < 2)
		day	= "0"+day;
	if(month.length < 2)
		month	= "0"+month;
	
	//combine the date value
	result = day + symbol_split + month + symbol_split + year;
	
	return result;
}

function clearPopulatedInputText(input_object, orginalText)
{
	if(input_object.tagName.toUpperCase() == "DIV" || input_object.tagName.toUpperCase() == "SPAN")
	{
		if(input_object.innerHTML==orginalText)
		{
			input_object.innerHTML = "";
		}
	}
	else
	{
		if(input_object.value==orginalText)
		{
			input_object.value = "";
		}
	}
}

//This is used in alot of places, for onblur/off-focus input box
function repopulateInputText(input_object, orginalText)
{
	if(input_object.tagName.toUpperCase() == "DIV" || input_object.tagName.toUpperCase() == "SPAN")
	{
		if(input_object.innerHTML=="")
		{
			input_object.innerHTML = orginalText;
		}
	}
	else
	{
		if(input_object.value=="")
		{
			input_object.value = orginalText;
		}
	}
}