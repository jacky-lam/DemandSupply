package com.utils;

import java.sql.*;
import javax.sql.*;
import javax.naming.*;

public final class Database {
	
	private static String error = "";
	
	public static Connection getConnection()
	{
		Connection result = null;
		try
		{
			Context ctx		= new InitialContext();
			DataSource ds	= (DataSource)ctx.lookup("java:comp/env/jdbc/DS_CTX");
			result			= ds.getConnection();
		}
		catch(Exception e)
		{
			System.out.println("Failed to setup connection (Database.getConnection):"+e);
			error = e+"";
		}
		return result;
	}
	
	public static String getErrorMessage(){return error;}
}
