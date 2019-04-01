/*
 * Author:	Yun Fat Lam
 * Purpose:	Exporting HTML table into excel.
 * Comment: Put HTML into the Excel, which triggers excel safety-mode. But can still be opened
 * 
 * */
var uri = 'data:application/vnd.ms-excel;base64,'
	, tmplWorkbookXML = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
	+ '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Author>Axel Richter</Author><Created>{created}</Created></DocumentProperties>'
	+ '<Styles>'
		+ '<Style ss:ID="Currency"><NumberFormat ss:Format="Currency"></NumberFormat></Style>'
		+ '<Style ss:ID="Date"><NumberFormat ss:Format="Medium Date"></NumberFormat></Style>'
		+ '<STYLE_XML></STYLE_XML>'
	+ '</Styles>' 
	+ '{worksheets}</Workbook>'
	, tmplWorksheetXML = '<Worksheet ss:Name="{nameWS}"><Table>{rows}</Table></Worksheet>'
	, tmplCellXML = '<Cell{attributeStyleID}{attributeFormula}{styleID}><Data ss:Type="{nameType}">{data}</Data></Cell>'
	, base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) }
	, format = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }) };

var style_xml = "";
function addColorStyle(a_hex_background_color, a_hex_font_color)
{
	if(a_hex_background_color == null || a_hex_background_color == undefined)a_hex_background_color	= "#FFFFFF";
	if(a_hex_font_color == null || a_hex_font_color == undefined)			 a_hex_font_color		= "#606060";
	
	
	var style_id = "s_"+a_hex_background_color.replace('#','')+"_"+a_hex_font_color.replace('#','');
	
	if(style_xml.indexOf(style_id) == -1) //style not been added yet
	{
		var pattern		= 'Solid';
		var a_style_xml	= '<Style ss:ID="'+style_id+'"><ss:Font ss:Color="'+a_hex_font_color+'"/>'
						+ '<Interior ss:Color="'+a_hex_background_color+'" ss:Pattern="'+pattern+'"/></Style>';
		style_xml += a_style_xml;
	}
	
	return style_id;
}

var tablesToExcel = (function()
{
	return function(tables, wsnames, wbname, appname)
	{
		var ctx				= "";
		var workbookXML		= "";
		var worksheetsXML	= "";
		var rowsXML			= "";
		
		for (var i = 0; i < tables.length; i++) //for each table
		{
			var html_table = tables[i];
			
			if(!html_table.nodeType)
			{
				html_table = document.getElementById(html_table);
			}
			
			//build header
			var header_body = html_table.getElementsByTagName('thead')[0];
			for (var j = 0; j < header_body.rows.length; j++)
			{
				var html_row = header_body.rows[j];
				
				rowsXML += '<Row>';
				for(var k = 0; k < html_row.cells.length; k++)
				{
					var dataType = html_row.cells[k].getAttribute("data-type");
					var dataStyle = html_row.cells[k].getAttribute("data-style");
//					var dataValue = html_row.cells[k].getAttribute("data-value");
					var dataValue = getDisplayValueFromTD(html_row.cells[k]);
					
					var dataFormula = html_row.cells[k].getAttribute("data-formula");
					dataFormula = (dataFormula)?dataFormula:(appname=='Calc' && dataType=='DateTime')?dataValue:null;
					
					//get background-colour of td
					var backgroundColor = rgbToHex(window.getComputedStyle(html_row.cells[k],null).backgroundColor);
					backgroundColor = backgroundColor.toUpperCase();
					
					//get font-colour of 
					var fontColor = rgbToHex(window.getComputedStyle(html_row.cells[k],null).color);
					fontColor = fontColor.toUpperCase();
					
					var style_id = addColorStyle(backgroundColor, fontColor); //define new colour to excel
					
					ctx = {	attributeStyleID: (dataStyle=='Currency' || dataStyle=='Date')?' ss:StyleID="'+dataStyle+'"':''
							, nameType: (dataType=='Number' || dataType=='DateTime' || dataType=='Boolean' || dataType=='Error')?dataType:'String'
							, data: (dataFormula)?'':dataValue
							, attributeFormula: (dataFormula)?' ss:Formula="'+dataFormula+'"':''
							, styleID: (style_id)?' ss:StyleID="'+style_id+'"':''
							};
					
					rowsXML += format(tmplCellXML, ctx);
				}
				rowsXML += '</Row>';
			}
			
			//build body
			var html_body = html_table.getElementsByTagName('tbody')[0];
			for (var j = 0; j < html_body.rows.length; j++)
			{
				var html_row = html_body.rows[j];
				
				rowsXML += '<Row>';
				for(var k = 0; k < html_row.cells.length; k++)
				{
					var dataType = html_row.cells[k].getAttribute("data-type");
					var dataStyle = html_row.cells[k].getAttribute("data-style");
//					var dataValue = html_row.cells[k].getAttribute("data-value");
					var dataValue = getDisplayValueFromTD(html_row.cells[k]);
					
					var dataFormula = html_row.cells[k].getAttribute("data-formula");
					dataFormula = (dataFormula)?dataFormula:(appname=='Calc' && dataType=='DateTime')?dataValue:null;
					
					var input_element = html_row.cells[k].getElementsByTagName("input")[0];
					
					var backgroundColor = rgbToHex(window.getComputedStyle(input_element,null).backgroundColor);
					backgroundColor = backgroundColor.toUpperCase();
					
					var fontColor = rgbToHex(window.getComputedStyle(input_element,null).color);
					fontColor = fontColor.toUpperCase();
					
					var style_id = addColorStyle(backgroundColor, fontColor); //define new colour to excel
					
					ctx = {	attributeStyleID: (dataStyle=='Currency' || dataStyle=='Date')?' ss:StyleID="'+dataStyle+'"':''
							, nameType: (dataType=='Number' || dataType=='DateTime' || dataType=='Boolean' || dataType=='Error')?dataType:'String'
							, data: (dataFormula)?'':dataValue
							, attributeFormula: (dataFormula)?' ss:Formula="'+dataFormula+'"':''
							, styleID: (style_id)?' ss:StyleID="'+style_id+'"':''
							};
					
					rowsXML += format(tmplCellXML, ctx);
				}
				rowsXML += '</Row>';
	        }
			
	        ctx = {rows: rowsXML, nameWS: wsnames[i] || 'Sheet' + i};
			worksheetsXML += format(tmplWorksheetXML, ctx);
			rowsXML = "";
	        
		} //END: for each table
		
		//setup the customised label
		tmplWorkbookXML = tmplWorkbookXML.replace("<STYLE_XML></STYLE_XML>", style_xml);
		
		ctx = {created: (new Date()).getTime(), worksheets: worksheetsXML};
		workbookXML = format(tmplWorkbookXML, ctx);
		
		var xls_file_name = wbname;
		browserExportFile(workbookXML, xls_file_name);
		
	}//END: return function
}
)();

function getDisplayValueFromTD(td_cell)
{
	var result = "";
	
	var tag_name = td_cell.tagName.toUpperCase();
	if(tag_name=="SELECT")
	{
		result = td_cell.options[td_cell.selectedIndex].text;
	}
	else if(tag_name=="INPUT" || tag_name=="TEXTAREA")
	{
		result = td_cell.value;
	}
	else if(tag_name=="SPAN")
	{
		result = td_cell.innerHTML;
	}
	else
	{
		if(td_cell.children.length > 0) //has more children
		{
			for(var i=0; i < td_cell.children.length; i++)
			{
				var an_element = td_cell.children[i]; //it only takes in the first
				result += getDisplayValueFromTD(an_element);
			}
		}
		else
		{
			result = td_cell.innerHTML;
		}
	}
	return result;
}

function browserExportFile(body_content, file_name)
{
	
	
	var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE "); 
    var newWindow = null;
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer
    {
  	  //quickly build an iframe
  	var export_excel_iframe = document.getElementById('export_excel_iframe');
  	if(export_excel_iframe == null)
  	{
  		var iframe = document.createElement("iframe");
  		iframe.style.display = "none";
  		iframe.id = "export_excel_iframe";
  		document.body.appendChild(iframe);
  	}
  	
    	var export_excel_iframe = document.getElementById('export_excel_iframe').contentWindow;
    	export_excel_iframe.document.open("txt/html","replace");
    	export_excel_iframe.document.write(body_content);
    	export_excel_iframe.document.close();
    	export_excel_iframe.focus(); 
		
    	newWindow = export_excel_iframe.document.execCommand("SaveAs",true,"IE_"+file_name);
    	 return (newWindow);
    }
    else                 //other browser not tested on IE 11
    {
//    	newWindow = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(workbookXML));
    	
    		var link = document.createElement("A");
	      link.href = uri + base64(body_content);
	      link.download = file_name;
	      link.target = '_blank';
	      document.body.appendChild(link);
	      link.click();
	      document.body.removeChild(link);
    }
}

function rgbToHex(rgb){
 rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
 return (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}