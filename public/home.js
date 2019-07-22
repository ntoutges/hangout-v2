var $ = window.$;

var interval = 0;
var interval2 = 0;
var counter = 0;
var counter2 = 0;
var options = ["Saving", "Saving.", "Saving..", "Saving..."];
var original = $("#displayName").val();
var originalDesc = $("#shortDescText").val();
var showing = 0;
var options4 = ["Everyone will see ", "Only friends will see ", "Everyone will see "];
var key = { "settings": 0, "a": 1 };
var revKey = ["settings", "a"];
var pages = {
    settings: {
        darkMode: false,
        accountPrivacy: { // 0: everyone || 1: only friends || 2: no one
            viewingStatus: 0, // who can view your posts
            accountStatus: 0, // who can view your account
            actualUsername: 0, // who can see your username (nickname will be used instead)
            followingPrivacy: false // false: anyone can follow you without permission || true: people can only follow you with permission
        },
    }
};

$("#displayName").on("keydown", function() {
    if (event.ctrlKey && event.keyCode == 83) {
        event.preventDefault();
        save($("#displayName").val(), true);
    }
});
$("#shortDescText").on("keydown", function() {
    if (event.ctrlKey && event.keyCode == 83) {
        event.preventDefault();
        saveShortDesc(this, true);
    }
});
$("#shortDescText").on("input", function() {
    $("#letterCounter").text(170 - $("#shortDescText").val().length);
});
$("#useRealNameOpt").on("input", changeNamePermissions);
$("#privateAccount").on("input", changeAccount);
$("#postPrivacyOption").on("input", changePostPrivacy);
$("#theme").on("input", changeTheme);
$("#checkbox").on("input", changePrivacySettings);
$(".tabs").click(changeWhatIsShown);
$("#profilePicture").click(bringUpMessage);
$("#exitOut").click(takeAwayMessage);
$("#file").change(readURL);
$("#shortDescText").blur(function() { saveShortDesc(this) });
$("#displayName").on("input", changeFontSize);
$("#displayName").blur(function() {
    save($("#displayName").val());
});
$("#displayName").on("keydown", function() {
    if (event.keyCode == 13) {
        $("#displayName").trigger("blur");
    }
});
$("#img").on("load", centerImage);
centerImage();
getShortDesc();

function centerImage() {
    let height = $("#img").height();
    var width = $("#img").width();
    if (height < width) {
        let height = $("#img").css("height").replace("px", "");
        var whiteSpace = 250 - height;
        whiteSpace /= 2;
        $("#img").css("margin-top", whiteSpace + "px");
    }
    $("#img").css("display", "block");
}

function bringUpMessage() {
    $("#popUp").css("display", "block");
    setTimeout(function() {
        $("#popUp").css("opacity", "1");
        $("#messageBox").css("top", "200px");
    }, 100);
}

function takeAwayMessage() {
    $("#popUp").css("opacity", "0");
    $("#messageBox").css("top", "0px");
    setTimeout(function() {
        $("#popUp").css("display", "none");
        $("#previewImg").attr("src", "profileUploads/no-profile-picture.png");
        $("#file").val("");
    }, 1000);
}

function readURL() {
    if (this.files && this.files[0]) {
        var reader = new FileReader();
        reader.onload = function(info) {
            $("#previewImg").attr("src", info.target.result);
        };

        reader.readAsDataURL(this.files[0]);
    }
}
setTimeout(function() {
    changeFontSize(true); // for beginning statement
}, 500);
// y = 0.5x + 4 :: equation for font size to width
// x = 2y - 4
function changeFontSize() {
    changeNamePermissions(); // update name shown in box
    var val = $("#displayName").val();
    $("#textWidth").text(val);
    var width = $("#displayName").width();
    // find spaces
    var spaces = 0;
    for (var i = 0; i < val.length; i++) {
        if (val[i] == " ") {
            spaces++;
        }
    }
    var spacesAmountArr = val.split(" ");
    var spacesAmount = -1;
    for (var i = 0; i < spacesAmountArr.length; i++) {
        if (spacesAmountArr[i] != "") {
            spacesAmount++;
        }
    }
    var fontWidth = $("#textWidth").width() + (30 * 0.5 * (spaces - spacesAmount) + 4);
    if (fontWidth > width) {
        var newFontSize = (width / fontWidth) * 30;
        $("#displayName").css("font-size", newFontSize);
    }
    else {
        $("#displayName").css("font-size", "30px");
    }
}

var playing = false;

function save(name, reassure) {
    if ((original != name || reassure) && !playing) {
        playing = true;
        original = name;
        showSaved("Saving...");
        $.post("/changeDisplayName", {
            name: name
        }, function(data, success) {
            hideSaved("Saved");
        });
    }
}

function showSaved(save) {
    $("#showSaved").text(save);
    $("#showSaved").css("left", "0px");
    interval = setInterval(function() {
        $("#showSaved").text(options[counter % 4]);
        counter++;
    }, 150);
}

function hideSaved(save) {
    setTimeout(function() {
        clearInterval(interval);
        $("#showSaved").text(save);
        setTimeout(function() {
            $("#showSaved").css("left", "250px");
            setTimeout(function() {
                $("#showSaved").css("opacity", "0");
                $("#showSaved").css("left", "-260px");
                setTimeout(function() {
                    counter = 0;
                    playing = false;
                    $("#showSaved").css("opacity", "0.85");
                }, 500);
            }, 500);
        }, 1000);
    }, 1000);
}

var playingShort = false;

function saveShortDesc(thisOne, reassure) {
    if ((originalDesc != $("#shortDescText").val() || reassure) && !playingShort) {
        playingShort = true;
        originalDesc = $("#shortDescText").val();
        showSavingShort();
        var text = $(thisOne).val();
        if (text.length > 170) {
            text = text.substring(0, 170);
        }
        text = text.split(/\n/g || []);
        $.post("/saveShortDesc", {
            desc: text
        }, function(data, success) {
            if (data == "bad") {
                showErrorShort();
            }
            else {
                showSavedShort();
            }
        });
    }
}

function showSavingShort() {
    $("#savedShortDesc").css("background-color", "lightgreen");
    interval2 = setInterval(function() {
        $("#savedShortDesc").text(options[counter2 % 4]);
        counter2++;
    }, 150);
    $("#savedShortDesc").css("top", "-38px");
}

function showSavedShort() {
    setTimeout(function() {
        clearInterval(interval2);
        $("#savedShortDesc").text("Saved");
        setTimeout(function() {
            $("#savedShortDesc").css("top", "0px");
            playingShort = false;
        }, 700);
    }, 1000);
}

function showErrorShort() {
    setTimeout(function() {
        clearInterval(interval2);
        $("#savedShortDesc").text("There was an error");
        $("#savedShortDesc").css("background-color", "red");
        setTimeout(function() {
            playingShort = false;
            $("#savedShortDesc").css("top", "0px");
        }, 1500);
    }, 1000);
}

function getShortDesc() {
    $.get("/shortDesc", {}, function(data, success) {
        var str = "";
        if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                str += data[i];
                if (data[i + 1] != null) {
                    str += "\n";
                }
            }
        }
        else {
            str = data;
        }
        $("#shortDescText").val(str);
        $("#letterCounter").text(170 - $("#shortDescText").val().length);
    });
}

window.onbeforeunload = function() {
    if (original != $("#displayName").val()) {
        $.post("/changeDisplayName", {
            name: $("#displayName").val()
        });
    }
    if (originalDesc != $("#shortDescText").val()) {
        $.post("/saveShortDesc", {
            desc: $("#shortDescText").val()
        });
    }
};

function changeWhatIsShown() {
    makePage($(this).attr("id"));
    var id = $(this).attr("id");
    $("#" + revKey[showing]).css("backgroundColor", "darkgrey");
    $(this).css("backgroundColor", "white");
    showing = key[id];
}

var options2 = ["Anyone can follow you", "Approval necessary for others to follow you"];
var options3 = ["Anyone can see your ", "Only friends can see your ", "Nobody can see your "];

function changePrivacySettings() {
    var checked = $(this).prop("checked");
    $("#descFollowing").text(options2[checked - 0]);
    pages.settings.accountPrivacy.followingPrivacy = checked;
    updateOptions();
}

var colors = {
    Day: {
        "#body": { "background-color": "white" },
        "#displayName": { "background-color": "white", "color": "black" },
        "#profilePicture": { "background-color": "white" },
        "#shortDescText": { "background-color": "white", "color": "black" },
        "#letterCounter": { "background-color": "white", "color": "black" },
        "::-webkit-scrollbar-thumb:hover": { "background": "darkgrey" },
        "::-webkit-scrollbar-thumb": { "background": "#888888" },
        "#linkHolder": { "background-color": "dodgerblue" },
        "select": { "background-color": "white", "color": "black" },
        "#content": { "border-color": "black" },
        ".changeColor": { "color": "black" },
        ".borderColor": { "background-color": "black" },
        ".accountPrivacy": { "border-color": "black" },
        "::-webkit-scrollbar-track": { "background": "white" }
    },
    Night: {
        "#body": { "background-color": "#202020" },
        "#displayName": { "background-color": "#ffffff1c", "color": "lightblue" },
        "#profilePicture": { "background-color": "black" },
        "#shortDescText": { "background-color": "#ffffff1c", "color": "lightblue" },
        "#letterCounter": { "background-color": "#3a3a3a", "color": "lightblue" },
        "::-webkit-scrollbar-thumb:hover": { "background": "darkgrey" },
        "::-webkit-scrollbar-thumb": { "background": "#888888" },
        "#linkHolder": { "background-color": "darkblue" },
        "select": { "background-color": "#202020", "color": "white" },
        "#content": { "border-color": "white" },
        ".changeColor": { "color": "white" },
        ".borderColor": { "background-color": "white" },
        ".accountPrivacy": { "border-color": "white" },
        "::-webkit-scrollbar-track": { "background": "black" }
    }
};

changeTheme();

function changeTheme() {
    // change option
    var theme = $("#theme").val();
    if (theme == "Day") {
        pages.settings.darkMode = false;
    }
    else {
        pages.settings.darkMode = true;
    }
    updateOptions();

    //change the actual theme
    for (var id in colors[theme]) {
        for (var property in colors[theme][id]) {
            $(id).css(property, colors[theme][id][property]);
        }
    }
}


function changePostPrivacy() {
    var privacySetting = $("#postPrivacyOption").val();
    $("#descViewing").text(options3[privacySetting] + "posts");
    pages.settings.accountPrivacy.viewingStatus = privacySetting;
    updateOptions();
}

function changeAccount() {
    var accountViewSetting = $("#privateAccount").val();
    $("#descAccount").text(options3[accountViewSetting] + "account");
    pages.settings.accountPrivacy.accountStatus = accountViewSetting;
    updateOptions();
}

changeNamePermissions(); // will run on start up to fill out empty box
function changeNamePermissions() {
    var nameSetting = $("#useRealNameOpt").val();
    var name = [$("#displayName").attr("actualname"), ""];
    var nickname = $("#displayName").val();
    if (nameSetting == 1) {
        name = [name[0], " [" + nickname + "]"];
    }
    else if (nameSetting == 2) {
        name = [nickname, ""];
    }
    $("#descName").text(options4[nameSetting]);
    $("#descNameBr").text(name[0]);
    $("#descNameBr2").text(name[1]);
    if ($(this).attr("id")) {
        pages.settings.accountPrivacy.actualUsername = nameSetting;
        updateOptions();
    }
}

function updateOptions() {
    $.post("/options", {
        options: pages.settings
    }, function(data, success) {

    });
}
var lastElmnt = "settingsCont";

function makePage(thisOne) {
    if (lastElmnt) {
        $("#" + lastElmnt).css("display", "none");
    }
    $("#" + thisOne + "Cont").css("display", "block");
    lastElmnt = thisOne + "Cont";
}
