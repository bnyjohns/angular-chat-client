var scrolled = false;
function updateScroll(){
    if(!scrolled){
        var element = document.getElementById("msgContent");
        element.scrollTop = element.scrollHeight;
    }
}

$("#msgContent").on('scroll', function(){
    scrolled=true;
});
