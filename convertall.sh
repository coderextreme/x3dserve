javac -cp /Users/johncarlson/Downloads/www.web3d.org/x3d/tools/jar/saxon9B.jar RunSaxon.java

find examples/ -name '*.x3d' -type f -print0 | xargs -0 node convert.js
