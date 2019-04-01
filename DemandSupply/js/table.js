/*
 * Author:	Yun Fat Lam
 * Purpose:	Dynamically build HTML tables with a data-model as an interface.
 * Comment:	Simplified/light version of the Dynamic-Table model
 * 
 * */
function DynamicTable(id, html_table_id)
{
	this.id 				= id;
	this.html_table			= document.getElementById(html_table_id);
	this.columns 			= [];	// Header cell: holds... header-cell-object (with settings), pointer to HTML header-cell
	this.rows				= [];	// Cell: holds.... cell-object (with values, validation etc), pointer to HTML cell, pointer its header-cell column
	this.row_id				= 0;	//for new record ID
	
	this.parent_child_rows	= {}; //References between the parent and child rows (Key: parent Row-ID, Value: Collection of child Row-ID mapped to the Row-object).
	
	this.blank_columns		= []; //container to hold blank columns we created (when resource & cost table has in-sufficient date-field columns)
	
	this.last_header_css	= "table_header_last"; //css for last header
	this.first_header_css	= "table_header_first"; //css for first header
	this.delete_button_css	= "table_delete_row_button";//css for delete row button
	
	//delete table in-case not deleted yet
	this.html_table.innerHTML = "";
}

DynamicTable.prototype.addColumn = function addColumn(col_position, prefix_name, title, header_css, row_css, secondary_row_css, validation_type, default_validation_value, element_css, secondary_element_css)
{
	if(col_position == null) col_position = -1;
	var header = this.html_table.createTHead();
	
	// Get header row
	var header_row = null;
	if(header.rows[0] == undefined || header.rows[0] == null)	header_row = header.insertRow(0);
	else														header_row = header.rows[0];
	
	// Set up HTML cell
	var html_cell		= document.createElement("th");
	var tmp_header_cell = header_row.children[col_position];
	header_row.insertBefore(html_cell, (tmp_header_cell==undefined?null:tmp_header_cell));
	
	html_cell.id		= this.id + prefix_name;
	html_cell.className = header_css;// + " status_report_table_header";
	html_cell.innerHTML	= title;
	
	//==================== Setting up header HTML ==============================================
	// Apply the first/last header CSS, depending on position is first or last
	if(this.columns.length == 0 || col_position == 0) // first header position
	{
		html_cell.className += " "+this.first_header_css;
		html_cell.className += " "+this.last_header_css;
	}
	if(col_position==-1 || col_position >= this.columns.length) // last header position
	{
		//remove the 'last header' CSS from the previous header-cell
		if(this.columns.length > 0)
		{
			var prev_header 		= this.columns[this.columns.length-1];
			var prev_header_class 	= prev_header.html_cell.className;
			var last_pos			= prev_header_class.indexOf(this.last_header_css);
			if(last_pos != -1) //contains 'last header' CSS 
			{
				prev_header.html_cell.className = prev_header_class.substring(0, last_pos); //remove the 'last header' CSS 
			}
		}
		
		//append 'last header' CSS
		html_cell.className += " "+this.last_header_css;
	}
	
	//==================== Setting up the Column object ========================================
	// Set up the Column object
	var column_cell	= new Column(prefix_name, html_cell, validation_type, default_validation_value, row_css, secondary_row_css, element_css, secondary_element_css);
	
	if(col_position == -1)	this.columns.push(column_cell);
	else					this.columns.splice(col_position, 0, column_cell);
	
	//===================== Populate column for existing rows in table ============================
	for(var i=0; i<this.rows.length; i++)
	{
		var row = this.rows[i]; //row object
		var cell_id	= this.id + prefix_name + row.id;
		if(row.parent_row_id != null) //take secondary settings if it's a secondary settings
		{
			row_css				= secondary_row_css;
			element_css			= secondary_element_css;
		}
		this.addCellToRow(row, col_position, prefix_name, cell_id, validation_type, default_validation_value, row_css, default_validation_value, element_css);
	}
	
	
	return column_cell;
}


DynamicTable.prototype.addRow = function addRow(row_id, row_position, parent_row_id, values)
{
	//set up the row parameters
	if(row_id == undefined || row_id == null)
	{
		this.row_id += 1;
		row_id 	= "NEW_"+this.row_id;
	}
	
	if(parent_row_id == undefined || parent_row_id == null)
		parent_row_id = null;
	
	//setup row position
	if(row_position == undefined || row_position == null)
		row_position = -1;
	
	//set up the HTML tbody
	if(this.html_table.tBodies.length == 0)
	{
		this.html_table.appendChild(document.createElement("tbody"));
	}
	
	//set up the HTML row
	var html_row	= this.html_table.getElementsByTagName('tbody')[0].insertRow(row_position);
	html_row.id		= this.id + row_id;
	
	//set up row object
	var row			= new Row(row_id, parent_row_id, html_row);
	
	//store parent-child row relation (if given)
	if(parent_row_id != null)
	{
		//set up parent container
		if(this.parent_child_rows[parent_row_id] == undefined) this.parent_child_rows[parent_row_id] = {};
		
		this.parent_child_rows[parent_row_id][row.id] = row;
	}
	
	//store row object
	if(row_position == -1) 	this.rows.push(row); //added to end of array
	else					this.rows.splice(row_position, 0, row); //insert a certain point
	
	//create column based on the headers
	for(var i=0; i<this.columns.length; i++)
	{
		//get header-cell object
		var column_cell 			= this.columns[i];
		var column_prefix_name		= column_cell.prefix_name;
		var cell_id					= this.id + column_cell.prefix_name + row_id;
		var cell_value				= values[column_prefix_name];
		var cell_validation 		= column_cell.validation_type;
		var cell_css				= column_cell.row_css;
		var validation_default_value= column_cell.default_validation_value;
		var ele_css					= column_cell.element_css;
		
		//settings must be applied for secondary-rows
		if(parent_row_id != null)
		{
			ele_css					= column_cell.secondary_element_css;
			cell_css				= column_cell.secondary_row_css;
		}
		
		this.addCellToRow(row, -1, column_prefix_name, cell_id, cell_validation, cell_value, cell_css, validation_default_value, ele_css);	
		
	} //End: for each column
	
	//create + append the HTML delete button
	var html_del = this.createDeleteButtonElement(this, row_id);
	html_row.cells[0].appendChild(html_del);
	
	//add it to the row object (so later on, you can access it)
	var del_cell = new Cell(html_del, "delete_");
	row.addCell("delete_",del_cell);
	
	return row;
}


DynamicTable.prototype.addCellToRow = function addCellToRow(row, position, column_prefix_name, cell_id, cell_validation_type, cell_value, cell_css, default_value, ele_css)
{
	//set up HTML-cell container
	var html_row			= row.html_row;
	var html_cell 			= html_row.insertCell(position);
	html_cell.className		= cell_css;
//	console.log("create element for "+this.id+"'s column: "+column_prefix_name)
	
	//set up the cell-object based upon the validation-type
	var cell_object = null;
	
	if(cell_validation_type == "textfield")
	{
		cell_object = this.setupTextFieldCell(column_prefix_name, html_cell, cell_id, ele_css, cell_value, default_value);
	}
	else if(cell_validation_type == "numberfield")
	{
		cell_object = this.createNumericFieldCell(column_prefix_name, html_cell, cell_id, ele_css, cell_value, default_value);
	}
	
	
	//store cell- object in row-object
	row.addCell(column_prefix_name, cell_object);
}

DynamicTable.prototype.getRow = function getRow(row_id)
{
	var result = null;
	for(var i=0; i < this.rows.length; i++)
	{
		if(this.rows[i].id==row_id){ result = this.rows[i]; break; }
	}
	return result;
}

DynamicTable.prototype.removeRow = function removeRow(row_id)
{
	for(var i=0; i < this.rows.length; i++)
	{
		var row = this.rows[i];
		
		if(row != null && (row.id == row_id) ) //found row && row not deleted yet
		{
			var index = row.html_row.rowIndex;//get index of that row in HTML table
			
			if(typeof(deletingRow) == "function") deletingRow(this.id, row_id); //anything to-do before deleting row
			
			//remove the HTML table row
			this.html_table.deleteRow(index);
			
			//remove any parents or child rows referencing this row
			this.removeParentChildReferences(this.rows[i]);
			
			//remove row object reference
			this.rows[i] 	= null;
			this.rows.splice(i, 1);
			
			if(typeof(deletedRow) == "function") deletedRow(this.id, row_id); //anything to-do after deleting row
			
			break;
		}
	}
}

//remove any parent-rows or child references
DynamicTable.prototype.removeParentChildReferences = function removeParentChildReferences(the_row)
{
	//Remove all the child rows referencing this row
	if(this.parent_child_rows[the_row.id] != undefined)
	{
		var child_rows = this.parent_child_rows[the_row.id];
		
		for(var child_row_id in child_rows)
		{
			this.removeRow(child_row_id);
		}
		
		//delete child-reference container
		delete this.parent_child_rows[the_row.id];
	}
	
	//Remove all parents referencing this row
	var delete_empty_parent_row = [];
	for(var parent_row_id in this.parent_child_rows)
	{
		if(this.parent_child_rows[parent_row_id][the_row.id] != undefined)
		{
			delete this.parent_child_rows[parent_row_id][the_row.id];
			
			//check if there are any child nodes under that parent row
			var has_child = false;
			for(var key in this.parent_child_rows[parent_row_id])
			{
				has_child = true;
				break;
			}
			if(has_child==false) delete_empty_parent_row.push(parent_row_id); //has no child elements: delete
		}
	}
	
	//delete all parent rows that do not have any child-nodes left
	for(var i=0; i < delete_empty_parent_row.length; i++)
	{
		delete this.parent_child_rows[delete_empty_parent_row[i]];
	}
}

//=======================================================================================================
//======================== Dependent data model classes =================================================
/* *
 * Column
 * - Holds all the information needed to set up the incoming rows
 * - Pointer to HTML header cell <td>
 * */
function Column(prefix_name, html_cell, validation_type, default_validation_value, row_css, secondary_row_css, element_css, secondary_element_css)
{
	this.prefix_name 					= prefix_name;
	this.html_cell 						= html_cell;
	this.validation_type 				= validation_type;
	this.default_validation_value		= default_validation_value;
	this.row_css						= row_css;
	this.element_css					= element_css;
	
	this.secondary_row_css				= secondary_row_css;
	this.secondary_element_css			= secondary_element_css;
}

/* *
 * Rows
 * - Place holder for collection of cell objects
 * - Pointer to HTML row <tr>
 * */
function Row(id, parent_row_id, html_row) 
{
	this.id 			= id;
	this.parent_row_id	= parent_row_id;
	this.cells 			= {}; //collection of cell-object
	this.html_row		= html_row;
}
Row.prototype.addCell = function addCell(column_name, cell)
{
	this.cells[column_name] = cell;
}
Row.prototype.getCell = function getCell(column_name)
{
	var result = this.cells[column_name];
	if(result == undefined)	return null;
	else					return result;
}

/* Place holder to point to HTML object && other important parameters */
function Cell(html_cell, column_name) 
{
	this.html_cell 	= html_cell;	//pointer to HTML object (input, select, text-area, span)
	this.column_name= column_name; 	//id of the column this cell is under
}


//=========================================================================================================
//======================== create element for table functions =============================================
/* *
 * 
 * Factory functions
 * 
 * */
DynamicTable.prototype.createDeleteButtonElement = function createDeleteButtonElement(table_object, row_id)
{
	var element 		= document.createElement("div");
	element.className 	= this.delete_button_css;
	
	//append date click function
	element.addEventListener("click", function(){ table_object.removeRow(row_id); }, false);
	
	return element;
}

DynamicTable.prototype.setupTextFieldCell = function setupTextFieldCell(column_prefix_name, html_cell, id, className, value, default_value)
{
	var cell_object	= null;
	
	if(value == "" || value == null || value == undefined) value = default_value;
	
	//setup input element
	var element			= document.createElement("input");
	element.id			= id;
	element.name		= id;
	element.className 	= className;
	element.value		= value;
	
	element.addEventListener('focus',function(){clearPopulatedInputText(element, default_value); },false);
	element.addEventListener('blur',function(){repopulateInputText(element, default_value); },false);
	
	//append input element to html_cell
	html_cell.appendChild(element);
	
	//create cell object
	cell_object = new Cell(element, column_prefix_name);
	
	return cell_object
}
DynamicTable.prototype.createNumericFieldCell = function createNumericFieldCell(column_prefix_name, html_cell, id, className, value, default_value)
{
	var cell_object = null;
	
	if(value == null || value == "" || value == undefined)
		value = default_value;
	
	//setup input element
	var element		 	= document.createElement("input");
	element.id			= id;
	element.name		= id;
	element.className 	= className;
	element.value		= value;
	element.setAttribute("type", "number");
	element.max 		= 999999999;
	element.min 		= -999999999;
	
	try//make 2 d.p. incase it's recurring
	{
		var tmp_value = Number(element.value+"");
		tmp_value = Math.round(tmp_value * 100) / 100;
		element.value = tmp_value;
	}catch(err){}
	
	//allow decimal numbers (default only allows integers)
	element.setAttribute("step", "any"); //any means allow all floats + integers, but also inc + decr in integers 
	
	//append number listener
	element.addEventListener("focus", function(){ setEndPosition(element);}, false);
	element.addEventListener("blur", function(){ repopulateInputText(element, 0);}, false);
	element.addEventListener("change", function(){ validateNumber(element, element.max, element.min);}, false);
	
	//append input element
	html_cell.appendChild(element);
	
	//create cell object
	cell_object = new Cell(element, column_prefix_name);
	
	return cell_object;
}

//listener function: set first cursor to be end of box
function setEndPosition(input)
{
	var text = input.value + "";
	var last_pos = text.length;
	
	if(text != "0") //not empty
	{
		setTimeout(function() //Chrome browser issue: for chrome, you need to wrap in timer (fine for other browsers)
		{
			try
			{
				input.focus();
				input.setSelectionRange(last_pos, last_pos);
			}
			catch(er)
			{
				try
				{
					var range = input.createTextRange();
					range.collapse(true);
					range.moveEnd('character', last_pos);
					range.moveStart('character', last_pos);
					range.select();
				}
				catch(er2)
				{
//					console.log("failed set-pos")
				}
			}
		}, 0);
	}
	else //empty; clear text on-click
	{
		input.value = "";
	}
}