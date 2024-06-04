const formElem = document.querySelector("form");

const DICT_PATH_STRAIGHT = "trees/straight_tree"
const DICT_PATH_REVERSE = "trees/reverse_tree"

var LOG_PREFIX = {}
var LOG_SUFFIX = {}


// Populate the base word input
addEventListener("DOMContentLoaded", (event) => {
    const curated_bases = ["Valley", "Creek", "Basin", "Den", "Hill", "Ridge", "Mere", "Borough"]
    const suggested_base = curated_bases[Math.floor(Math.random() * curated_bases.length)];

    const base_elem = document.getElementById("base");
    base_elem.setAttribute("placeholder", suggested_base)

    // "Den" with the overlap of 3 means full overlap
    if (suggested_base == "Den") {
        const drop_full_overlap = document.getElementById("drop_full_overlap");
        drop_full_overlap.checked = false; 
    }
});

// Handlebar.js section starts
Handlebars.registerHelper("nullable", function(val) {
    if(val === undefined || val === null || val == "") {
        return "<NA>";
    }
    return val;
});

Handlebars.registerHelper("skippable", function(val) {
    if(val === undefined || val === null || val == "") {
        return "0";
    }
    return val;
});


Handlebars.registerHelper("len", function(val) {
    return Object.keys(val).length;
});

Handlebars.registerHelper('nullable_float', function(num) {
    if (num !== undefined)
        return num.toFixed(2);
    else
        return "<NA>";
});

addEventListener("DOMContentLoaded", (event) => {
    const baseTemplate = document.getElementById("base_template").innerHTML;
    globalThis.baseCompile = Handlebars.compile(baseTemplate);
    globalThis.baseElem = document.getElementById("generated_title");
    globalThis.namesElem = document.getElementById("generated_names");

    const nameTemplate = document.getElementById("affix_template").innerHTML;
    globalThis.nameCompile = Handlebars.compile(nameTemplate);
});


async function display_base(base){
    const baseResult = globalThis.baseCompile(base);
    globalThis.baseElem.innerHTML = baseResult;
    globalThis.namesElem.classList.remove("disabled");
}

async function display_name(name, affix, display_path){
    const nameResult = globalThis.nameCompile({
        "name": name,
        "affix": affix
    });

    const nameElem = document.getElementById(display_path + "_destination")
    nameElem.style.fontVariant = "small-caps";
    nameElem.innerHTML += nameResult;
}

function display_stats(base, mode, log_obj) {
    if (Object.hasOwn(log_obj, "drop_freq_avg"))
        log_obj.drop_freq_avg = log_obj.drop_freq_avg / log_obj.infrequent
    if (Object.hasOwn(log_obj, "drop_length_avg"))
        log_obj.drop_length_avg = log_obj.drop_length_avg / log_obj.too_long
    

    log_obj.base = base;
    log_obj.mode = mode;

    const statsTemplate = document.getElementById("stats_template").innerHTML;
    const statsCompile = Handlebars.compile(statsTemplate);
    const statsResult = statsCompile(log_obj);

    const statsElem = document.getElementById("section_" + mode + "_stats");
    statsElem.innerHTML = statsResult;

    const no_names = !Object.hasOwn(log_obj, "generated_names");
    if (no_names)
        statsElem.innerHTML += `<p class="notice">No names were generated with "${base}" as ${mode}</p>`;
}

// Handlebar.js section ends



function flatten_tree(args, tree, letter_second_layer, letter_third_layer) {
    // The tree is structured as three nested dicts; The last one has a list as its value
    var candidates = [];

    if (args.depth == 1) {
        for (let second_layer_key in tree) {
            for (let third_layer_key in tree[second_layer_key]) {
                candidates = candidates.concat(tree[second_layer_key][third_layer_key]);
            }
        }
    } else if (args.depth == 2) {
        for (let i in tree[letter_third_layer]) {
            candidates = candidates.concat(tree[letter_third_layer][i]);
        }
    } else {
        candidates = tree[letter_second_layer][letter_third_layer];
    }

    if (typeof candidates === 'undefined')
        candidates = []

    return candidates;
}


function log_filtering(log_obj, cause_name, step=1) {
    if (Object.hasOwn(log_obj, cause_name)) {
        log_obj[cause_name] += step;
    } else {
        log_obj[cause_name] = step;
    }
}


function filter_candidates(args, candidates, log_obj) {
    function criteria(candidate) {
        const max_name_length = args.base.length + candidate[0].length - args.depth
        if( max_name_length > args.length ) {
            log_filtering(log_obj, "too_long"); 
            log_filtering(log_obj, "drop_length_avg", max_name_length); 
            return false; // too long
        }
        if( candidate[3] < args.freq ) {
            log_filtering(log_obj, "infrequent"); 
            log_filtering(log_obj, "drop_freq_avg", candidate[3]); 
            return false; // too infrequent
        } 
        if( ("drop_ipa" in args) && !candidate[1] ) {
            log_filtering(log_obj, "ipaless"); 
            return false;
        }
        if( ("drop_full_overlap" in args) && candidate[0].length <= args.depth ) {
            log_filtering(log_obj, "full_overlap"); 
            return false;
        }
        if( args.base == candidate[0].toLowerCase() )
            return false; // remove self

        log_filtering(log_obj, "generated_names"); 
        return true;
    }

    return candidates.filter(criteria);
}

function make_name(left, right, overlap, name_decorator) {
    left_part = left.substring(0, left.length-overlap);
    shared_part = right.substring(0, overlap);
    right_part = right.substring(overlap, right.length);

    new_name = left_part + name_decorator(shared_part) + right_part;
    return new_name.charAt(0).toUpperCase() + new_name.slice(1);
}

function make_prefixal_name(base, affix_text, overlap, name_decorator) {
    return make_name(base, affix_text, overlap, name_decorator);
}

function make_suffixal_name(base, affix_text, overlap, name_decorator) {
    return make_name(affix_text, base, overlap, name_decorator);
}

function name_decorator_dot(str) {
    decorated = ""
    
    for (let i = 0; i < str.length; i++) {
        decorated += '<span class="dot-over-letter">' + str[i] + '</span>';
    }

    return decorated;
}

function name_decorator_overline(str) {
    decorated = '<span style="text-decoration: overline">' + str + "</span>"

    return decorated;
}

function name_decorator_underline(str) {
    decorated = '<span style="text-decoration: underline">' + str + "</span>"

    return decorated;
}

function name_decorator_bold(str) {
    decorated = '<b>' + str + "</b>"

    return decorated;
}

function name_decorator_background(str) {
    decorated = '<span style="background-color: red">' + str + "</span>"

    return decorated;
}

function construct_names(args, candidates, name_maker, mode){
    let name_decorator = name_decorator_dot;
    if (args.decorator == "overline")
        name_decorator = name_decorator_overline;
    else if (args.decorator == "underline")
        name_decorator = name_decorator_underline;
    else if (args.decorator == "bold")
        name_decorator = name_decorator_bold;


    for (var i = 0; i < candidates.length; i++) {
        affix = candidates[i];
        new_name = name_maker(args.base.toLowerCase(), affix[0].toLowerCase(), args.depth, name_decorator);
        use_small_caps = args.decorator == "dot";

        display_name(new_name, affix, mode, use_small_caps);
    }
}

function generate_names(args, tree, letter_second_layer, letter_third_layer, name_maker, mode, log_obj) {
    const unfiltered_candidates = flatten_tree(args, tree, letter_second_layer, letter_third_layer);
    
    if( unfiltered_candidates.length > 0) {
        const filtered_candidates = filter_candidates(args, unfiltered_candidates, log_obj);
        construct_names(args, filtered_candidates, name_maker, mode);
    }
    
    display_stats(args.base, mode, log_obj);
}


async function generate_prefixal_names(args) {
    const base = args.base;
    const last_letter = base.charAt(base.length - 1)
    const prelast_letter = base.charAt(base.length - 2)
    const preprelast_letter = base.charAt(base.length - 3)

    var dict_letter = preprelast_letter;
    if (args.depth == 2)
        dict_letter = prelast_letter
    else if (args.depth == 1)
        dict_letter = last_letter
    const path = `${DICT_PATH_STRAIGHT}/${dict_letter}.json`;
    
    await fetch(path)
        .then(response => response.json())
        .then(tree => generate_names(args, tree, prelast_letter, last_letter, make_prefixal_name, "prefix", LOG_PREFIX))
}


async function generate_suffixal_names(args, first_letter, second_letter, third_letter) {
    var dict_letter = third_letter;
    if (args.depth == 2)
        dict_letter = second_letter
    else if (args.depth == 1)
        dict_letter = first_letter
    const path = `${DICT_PATH_REVERSE}/${dict_letter}.json`;

    await fetch(path)
        .then(response => response.json())
        .then(tree => generate_names(args, tree, second_letter, first_letter, make_suffixal_name, "suffix", LOG_SUFFIX))
}

function fetch_base(base_text, base_candidates) {
    for (const word of base_candidates) {
        if (base_text === word[0])
            return word;
    }
    
    word_not_found = [base_text, "-", "?", "NA", [""]];
    return word_not_found;
}


const MODE_PREFIX = "prefix";
const MODE_SUFFIX = "suffix";

function collapsible_names_generator(args, full_straight_tree, first_letter, second_letter, third_letter) {
    // fetch our base from the tree
    base = fetch_base(args.base, full_straight_tree[second_letter][third_letter]);
    display_base(base);    

    if (args.mode != MODE_SUFFIX) { // use base as prefix
        generate_prefixal_names(args);
    } 
    if (args.mode != MODE_PREFIX) { // use base as suffix
        generate_suffixal_names(args, first_letter, second_letter, third_letter);
    }
}


function reset_generation(){
    document.getElementById("generated_names").classList.add("disabled");

    const prefixElem = document.getElementById("prefix_destination");
    prefixElem.innerHTML = "";
    const suffixElem = document.getElementById("suffix_destination");
    suffixElem.innerHTML = "";

    LOG_PREFIX = {};
    LOG_SUFFIX = {};
}


function start_name_generation() {
    reset_generation();

    const names_section = document.getElementById("generated_names");
    names_section.scrollIntoView({
        block: "center",
        inline: "nearest"
    });


    const args = Object.fromEntries(new FormData(document.querySelector('form')).entries());
    if (args.base == "") {
        base_input_elem = document.getElementById("base");
        args.base = base_input_elem.getAttribute("placeholder");
    }
    args.base = args.base.toLowerCase();
    args.base = args.base.trim();


    const first_letter = args.base.charAt(0);
    const second_letter = args.base.charAt(1);
    const third_letter = args.base.charAt(2);
    const path = `${DICT_PATH_STRAIGHT}/${first_letter}.json`;
    fetch(path)
        .then(response => response.json())
        .then(tree_straight => collapsible_names_generator(args, tree_straight, first_letter, second_letter, third_letter))
}