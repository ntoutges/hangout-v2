module.exports = {
    replaceSpaces: function replaceSpaces(str) {
        var lastChar = "";
        for (var i = 0; i < str.length; i++) {
            if (lastChar == " " && str[i] == " ") {
                str = str.substring(0, i) + "&nbsp" + str.substring(i + 1, str.length);
                i += 4;
                lastChar = "a";
            }
            else {
                lastChar = str[i];
            }
        }
        return str;
    },
    renameEnter: function renameEnter(str) {
        while (str.split("\n").length >= 2) {
            str = str.replace("\n", "<br>");
        }
        return str;
    }
};
