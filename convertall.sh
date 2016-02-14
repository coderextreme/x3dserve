javac -cp saxon9B.jar RunSaxon.java

find examples/ -name '*.x3d' -type f -print0 | xargs -0 node convert.js
