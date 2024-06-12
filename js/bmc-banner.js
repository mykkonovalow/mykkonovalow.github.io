// insert the banner
addEventListener("DOMContentLoaded", (event) => {
    const bmc_elem = document.getElementById("buymeacoffee");
    if(!bmc_elem)
        return;
    
    fetch("/img/bmc-button.html")
    .then((res) => res.text())
    .then((text)=> {
            bmc_elem.innerHTML = text;
        })
    .catch((e) => console.error(e));
});