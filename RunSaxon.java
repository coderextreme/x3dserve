class RunSaxon {
	public static void main(String args[]) {
		for (int a = 0; a < args.length; a++) {
			try {
				System.err.println(args[a]);
				net.sf.saxon.Transform.main(new String[] {
							"-warnings:recover",
							"-o",
							args[a].substring(0, args[a].lastIndexOf("."))+".json2",
							args[a],
							"X3dToJson.xslt" });
				// -t  #timing -c # compiled
			} catch (Exception e) {
				System.err.println(e.getMessage());
			}
		}
	}
}
