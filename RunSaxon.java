import java.io.*;

class RunSaxon {
	public static void main(String args[]) throws Exception {
		Process p = Runtime.getRuntime().exec(
				new String [] {"java",
					"-cp",
					"/Users/johncarlson/Downloads/www.web3d.org/x3d/tools/jar/saxon9B.jar",
					"net.sf.saxon.Transform",
					"-warnings:recover",
					"-o",
					args[1],
					args[0],
					"X3dToJson.xslt" });
			// -t  #timing -c # compiled
		p.waitFor();
	}
}
