var $ = window.$;

$("#submit").click(createAccount);
$("#eye").click(changeInputType);
$(".inputs").on("keydown", checkIfEnter);

var toggle = true;

function checkIfEnter(event) {
    if (event.keyCode == 13) {
        createAccount();
    }
}


function createAccount() {
    var username = $("#username").val();
    var password = $("#password").val();
    $.post("/createAccount", {
        username: username,
        password: password
    }, function(data, success) {
        if (data == "home") {
            window.location.href = "/home";
        }
        else {
            $("#warning").text(data);
        }
    });
}

function changeInputType() {
    console.log(toggle)
    if (toggle) {
        $(this).attr("src", "whiteeyecon.png");
        $("#password").attr("type", "letter")
    }
    else {
        $("#password").attr("type", "password")
        $(this).attr("src", "eyecon.png");
    }
    toggle = !toggle;
}
