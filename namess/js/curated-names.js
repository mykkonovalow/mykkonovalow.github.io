// Populate the naming tables
addEventListener("DOMContentLoaded", (event) => {
    const tableElem = document.getElementById("table_template").innerHTML;
    const tableCompile = Handlebars.compile(tableElem);
    tableElem.innerHTML = ""; // clean up Handlebars from the page
    
    for (const tableName of ["names2", "names3", "names1"]) {
        path = `/namess/curated_names/${tableName}.tsv`;
        fetch(path)
            .then(response => response.text())
            .then(tsv => populate_table(tableName, tsv, tableCompile));
    }

})

function populate_table(tableName, tsv, template) {
    var data = []
    const lines = tsv.split('\n');
    for (var i=0; i<lines.length; i++) {
        const word = lines[i].split('\t');
        data[i] = word;
    }

    console.log(tableName);
    console.log(data);
    const tableContent = template(data);
    console.log(tableContent);
    const destinationElem = document.getElementById(tableName);
    destinationElem.innerHTML += tableContent;    
}