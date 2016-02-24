javac -cp saxon9B.jar RunSaxon.java

find examples/ -name '*.x3d' -type f -print0 | xargs -P 3 -0 node convert.js
