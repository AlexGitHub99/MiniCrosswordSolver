$(document).ready(function() {
    //wait for login screen to pop up
    setTimeout(start, 500);
});

function start() {
    if($(".xwd__modal--subtle-button").length) {
        //dismiss button if not logged in
        $(".xwd__modal--subtle-button").click();
    } else {
        //play button if logged in
        $(".pz-moment__button").click();
    }

    //create crossword map
    let crossword = []; //crossword[y][x]
    let cells = $(".xwd__cell");
    //get height and width of crossword
    let h = Math.floor(cells.last().children(".xwd__cell--nested").attr("y")/100)+1;
    let w = cells.length/h;
    for(let x = 0; x < h; x++) {
        crossword.push([]);
    }
    cells.each(function (index) {
        if($(this).children(".xwd__cell--block").length > 0) {
            crossword[Math.floor(index/w)].push("X");
        } else if($(this).children("text[text-anchor='start']").length > 0) {
            crossword[Math.floor(index/w)].push($(this).children("text[text-anchor='start']").text());
        } else {
            crossword[Math.floor(index/w)].push(" ");
        }
    });
    
    //creates array of number / clue pairs
    var downClues = [];
    $(".xwd__clue-list--title:contains('Down')").siblings().children(".xwd__clue--li").each(function() {
        downClues.push($(this).children().map(function() { return $(this).text() }).get());
    });
    var acrossClues = [];
    $(".xwd__clue-list--title:contains('Across')").siblings().children(".xwd__clue--li").each(function() {
        acrossClues.push($(this).children().map(function() { return $(this).text() }).get());
    });

    //calculate and append length of clue answer to each clue
    //downClues
    downClues.forEach(function(value) {
        let clueNum = value[0];
        //find clue position in crossword
        let cluePos = getCluePos(crossword, clueNum); //[x,y]

        //find length
        let len = 0;
        let y = cluePos[1];
        while(y < crossword.length && crossword[y][cluePos[0]] != "X") {
            len++;
            y++;
        }
        //append length
        value.push(len);
    });
    //acrossClues
    acrossClues.forEach(function(value) {
        let clueNum = value[0];
        //find clue position in crossword
        let cluePos = getCluePos(crossword, clueNum); //[x,y]

        //find length
        let len = 0;
        let x = cluePos[0];
        while(x < crossword[0].length && crossword[cluePos[1]][x] != "X") {
            len++;
            x++;
        }
        //append length
        value.push(len);
    });
    
    //combine clue information into single string to pass to AI
    //Format:
    //
    //Across:
    //1. clue text (x letters)
    //...
    //Down:
    //...
    let clueInfo = "<p>Across:</p>\n";
    clueInfo += jQuery.map(acrossClues, function(n) { 
        return "<p>"+n[0]+". (" +n[2]+" letters) "+n[1]+"</p>"
    }).join("\n");
    clueInfo += "\n<p>Down:</p>\n"
    clueInfo += jQuery.map(downClues, function(n) { 
        return "<p>"+n[0]+". (" +n[2]+" letters) "+n[1]+"</p>"
    }).join("\n");
    console.log(clueInfo);

    //make request to gemeni AI and insert answer into html above crossword
    var content = {"contents": [{"role": "user", "parts": [{"text": clueInfo}] }], "systemInstruction": {"parts": [{"text": "You are a bot that gives answers to crossword clues. Many clues will be given to you at a time. Respond with each answer in all caps, in the same format and order given to you."}]}};
    var token = ""; //fill in
    $.ajax({
        url : 'https://us-west1-aiplatform.googleapis.com/v1/projects/crossword-428823/locations/us-west1/publishers/google/models/gemini-1.5-flash-001:generateContent',
        type : 'POST',
        data : JSON.stringify(content),
        dataType : 'json',
        contentType : 'application/json; charset=UTF-8', 
        headers : {'Authorization': 'Bearer ' + token},
        crossDomain : true,
        success : function(data) {              
            console.log('Data: ' + JSON.stringify(data));
            $(".xwd__details--container").append((data.candidates[0].content.parts[0].text));
        },
        error : function(request, error)
        {
            console.log("Request: " + JSON.stringify(request));
            console.log("Error: " + error);
        }
    })
}

function getCluePos(crossword, clueNum) {
    for(let y = 0; y < crossword.length; y++) {
        for(let x = 0; x < crossword[0].length; x++) {
            if(crossword[y][x] == clueNum) {
                return [x,y];
            }
        }
    }
}