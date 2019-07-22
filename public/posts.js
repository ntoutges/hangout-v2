var $ = window.$;
console.log(window.navigator.userAgent);

$("#submit").click(function() { submitText($("#postContent").val()) });
$("#postContent").on("keydown", keyPressed);
$("#postContent").click(changeCaretPos);

var caretPos = 0;

function changeCaretPos(event) {
    setTimeout(function() {
        caretPos = document.getElementById("postContent").selectionStart;
    }, 10);
}

function keyPressed(event) { // save draft functionality [add this in soon [maybe]]
    if (event.ctrlKey) { // if control key pressed
        // find what word on... if any
        var sStart
        var sEnd
        if (sStart == sEnd) {
            
        }
        else {
            
        }
    }
    setTimeout(function() {
        if (event.keyCode == 39 || event.keyCode == 40) { // right or down
            caretPos = document.getElementById("postContent").selectionEnd;
        }
        else { // left/up/anything else
            caretPos = document.getElementById("postContent").selectionStart;
        }
    }, 10);
}

function submitText(text) {
    $.post("/postThePost", {
        text: text
    }, function(data, success) {
        if (data == "Good") {
            console.log("HERE")
        }
        else {

        }
    });
}
