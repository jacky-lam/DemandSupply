<%@page contentType="text/html; charset=UTF-8" %>

<%@ page import="java.util.*" %>
<%@ page import="java.sql.*"%>
<%@ page import="java.util.Date"%>
<%@ page import="java.text.DateFormat"%>
<%@ page import="java.text.SimpleDateFormat"%>
<%@ page import="com.utils.Database" %>
<%@ page import="com.utils.Encryption" %>
<%@ page import="org.json.simple.*"%>

<%
/*
 * Author:	Yun Fat Lam
 * Purpose:	Getting project related data from the database into JSON format.
 * Comment: This is a medium for the AJAX call to the server. Can be replaced with alternative/suitable solutions.
 * 
 * */

Map<String, Object> result	= new HashMap<String, Object>();
Connection conn				= Database.getConnection();

if(conn != null)
{
	String request_data = request.getParameter("REQUEST_DATA");
	result.put("STATUS", "OK");
	
	//data was requested
	if(request_data != null)
	{
		try
		{	//find what data was requested
			if(request_data.equals("PROJECT_LIST"))
				result.put("RESPONSE",getProjectList(conn)); 
			else if(request_data.equals("PROJECT_CHART") && request.getParameter("PROJECT_ID")!=null)
				result.put("RESPONSE",getProjectChart(conn, request.getParameter("PROJECT_ID")));
		}
		catch(SQLException e)
		{
			result.put("STATUS", "ERROR");
			result.put("RESPONSE", "SQL error in requesting["+request_data+"]:"+e.getMessage());
			System.out.println("ERROR Get_Project.jsp = SQL error in requesting["+request_data+"]:"+e);
		}
	}
	
	//close connection
	conn.close();
}
else
{
	result.put("STATUS", "ERROR");
	result.put("RESPONSE", "Failed to setup connection:"+Database.getErrorMessage());
}
%>
<%=JSONValue.toJSONString(result)%>

<%!

//get list of projects id and name
private HashMap<String, Object> getProjectList(Connection conn) throws SQLException
{
	HashMap<String, Object> result	= new HashMap<String, Object>(); // collection of projects
	PreparedStatement pstmt			= conn.prepareStatement("SELECT ID, Project_Name FROM projects");
	ResultSet rst					= pstmt.executeQuery();
	while(rst.next())
	{
		String id		= Encryption.encryptString(rst.getString("ID"));
		String name		= rst.getString("Project_Name");
		
		Map<String, Object> project	= new HashMap<String, Object>();
		project.put("ID", id);
		project.put("Project_Name", name);
		result.put(id, project);
	}
	rst.close();
	pstmt.close();
	
	return result;
}

//get all meta-data needed for project chart page
private HashMap<String, Object> getProjectChart(Connection conn, String project_id) throws SQLException
{
	HashMap<String, Object> result	= new HashMap<String, Object>(); //project meta-data
	SimpleDateFormat date_format	= new SimpleDateFormat("dd-MMM-yyyy");
	
	//get project meta-data
	PreparedStatement pstmt			= conn.prepareStatement("SELECT ID, Project_Name, Start_Date, End_Date FROM projects WHERE ID=?");
	pstmt.setString(1, project_id);
	ResultSet rst					= pstmt.executeQuery();
	if(rst.next())
	{
		String id		= Encryption.encryptString(rst.getString("ID"));
		String name		= rst.getString("Project_Name");
		Date start_date	= rst.getDate("Start_Date");
		Date end_date	= rst.getDate("End_Date");
		
		result.put("ID", id);
		result.put("Project_Name", name);
		result.put("Start_Date", (start_date == null ? null : date_format.format(start_date)));
		result.put("End_Date", (end_date == null ? null : date_format.format(end_date)));
		result.put("Start_Weekday", "MONDAY");
		
	}
	//close connector
	rst.close();
	pstmt.close();
	
	//get demand meta-data
	result.put("Demands", getProjectDemandSupply(conn, project_id));
	
	return result;
}

//get all demand & supply meta-data for a project
private HashMap<String, Object> getProjectDemandSupply(Connection conn, String project_id) throws SQLException
{
	HashMap<String, Object> result	= new HashMap<String, Object>();
	SimpleDateFormat date_format	= new SimpleDateFormat("dd-MMM-yyyy");
	
	PreparedStatement pstmt	= conn.prepareStatement("SELECT d.ID demand_id, d.Demand_Label, c.ID demand_cell_id, c.Cell_Date, c.Cell_Value"
												+ " FROM demands d LEFT JOIN demand_cells c ON d.ID=c.Demand_ID"
												+ " WHERE d.Project_ID=?");
	pstmt.setString(1, project_id);
	ResultSet rst = pstmt.executeQuery();
	while(rst.next()) //for each demand record (row & cell)
	{
		String demand_id = rst.getString("demand_id");
		HashMap<String, Object> a_demand = (HashMap<String, Object>) result.get(demand_id);
		
		if(a_demand == null) //first time encounter demand: setup container
		{
			//setup container
			a_demand = new HashMap<String, Object>();
			a_demand.put("LABEL_", rst.getString("Demand_Label"));
			a_demand.put("Cells", new HashMap());		//cell date-value container
			a_demand.put("Supplies", new HashMap());	//container for supplies
			
			//insert container
			result.put(demand_id, a_demand);
		}
		
		//store cell value for date
		Date a_date		= rst.getDate("Cell_Date");
		double a_value	= rst.getDouble("Cell_Value");
		if(a_date != null)	((HashMap<String, Object>)a_demand.get("Cells")).put(date_format.format(a_date)+"_", a_value);
	}
	//close connector
	rst.close();
	pstmt.close();
	
	//get the supply for the demands returned
	if(result.size() > 0) result = populateDemandSupplies(conn, result);
	
	return result;
}

//populate the supplies meta-data for the demands given
private HashMap<String, Object> populateDemandSupplies(Connection conn, HashMap<String, Object> demands) throws SQLException
{
	//get the list of demand ids
	Set<String> demand_id_set	= demands.keySet();
	String[] demand_ids			= demand_id_set.toArray(new String[demand_id_set.size()]);
	String demand_id_string		= "";
	for(int i=0; i < demand_ids.length; i++) demand_id_string += (demand_id_string.equals("")? "":",") + demand_ids[i];
	
	//populate the supplies
	HashMap<String, Object> result	= demands;
	SimpleDateFormat date_format	= new SimpleDateFormat("dd-MMM-yyyy");
	
	if(!demand_id_string.equals("")) //exist demands
	{
		PreparedStatement pstmt	= conn.prepareStatement("SELECT s.Demand_ID, s.ID supply_id, s.Supply_Label, c.ID supply_cell_id, c.Cell_Date, c.Cell_Value"
													+ " FROM supplies s LEFT JOIN supply_cells c ON s.ID=c.Supply_ID"
													+ " WHERE s.Demand_ID IN ("+demand_id_string+")");
		ResultSet rst = pstmt.executeQuery();
		while(rst.next()) //for each demand record (row & cell)
		{
			String demand_id = rst.getString("Demand_ID");
			String supply_id = "S"+rst.getString("supply_id");
			
			HashMap<String, Object> a_demand = (HashMap<String, Object>) result.get(demand_id);  //should never be null
			HashMap<String, Object> a_supply = (HashMap<String, Object>) ((HashMap<String, Object>) a_demand.get("Supplies")).get(supply_id);
			if(a_supply == null) //first time encounter supply: setup container
			{
				//setup container
				a_supply = new HashMap<String, Object>();
				a_supply.put("LABEL_", rst.getString("Supply_Label"));
				a_supply.put("Cells", new HashMap()); //cell date-value container
				
				//insert container
				((HashMap<String, Object>) a_demand.get("Supplies")).put(supply_id, a_supply);
			}
			
			//store cell value for date
			Date a_date		= rst.getDate("Cell_Date");
			double a_value	= rst.getDouble("Cell_Value");
			if(a_date != null)	((HashMap<String, Object>)a_supply.get("Cells")).put(date_format.format(a_date)+"_", a_value);
		}
		
		//close connector
		rst.close();
		pstmt.close();
	}
	return result;
}
%>