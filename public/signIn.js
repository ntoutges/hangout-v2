var $ = window.$;

$("#submit").click(verify);
$("#eye").click(changeInputType);
$(".inputs").keydown(checkIfEnter);
$("#password").on("input", showEye);

var toggle = true;

function checkIfEnter(event) {
    if (event.keyCode == 13) {
        verify();
    }
}

function verify() {
    var username = $("#username").val();
    var password = $("#password").val();
    $.post("/signIn", {
        username: username,
        password: password
    }, function(data, success) {
        if (data == "home") {
            window.location.replace("/home");
        }
        else {
            $("#warning").text(data);
        }
    });
}

function showEye() {
    if ($(this).val() == "") {
        $("#eye").css("display", "none")
        toggle = false;
        changeInputType();
    }
    else {
        $("#eye").css("display", "block")
    }
}

function changeInputType() {
    if (toggle) {
        $("#eye").attr("src", "whiteeyecon.png");
        $("#password").attr("type", "letter");
    }
    else {
        $("#eye").attr("src", "eyecon.png");
        $("#password").attr("type", "password");
    }
    toggle = !toggle;
}
