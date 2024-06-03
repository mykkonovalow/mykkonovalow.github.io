document.addEventListener("DOMContentLoaded", function(e) {
    init_collapsibles();
}); 

function init_collapsibles() {
    var coll = document.getElementsByClassName("collapsible");
    var i;

    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight){
                content.style.maxHeight = null;
                content.classList.toggle("active");
            } else {
                content.classList.toggle("active");
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}
