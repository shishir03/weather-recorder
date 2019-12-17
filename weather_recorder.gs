function recordData() {
    var spreadsheet = SpreadsheetApp.getActive();
    var sheet = spreadsheet.getSheetByName("Raw Data");
    sheet.activate();
    
    var temps = [];
    var pressure = [];
    var rh = [];
    var solarRadiation = [];
    
    var json = loadData();
    for(var i = 0; i < json.length; i++) {
        temps.push(roundToOnePlace((5.0/9)*(json[i].tempf-32)));
        pressure.push(roundToOnePlace(1013.25*(json[i].baromrelin/29.92)));
        rh.push(json[i].humidity);
        solarRadiation.push(json[i].solarradiation);
    }
    
    var maxTemp = max(temps);
    var minTemp = min(temps);
    var meanTemp = roundToOnePlace((maxTemp + minTemp) / 2);
    var maxPress = max(pressure);
    var minPress = min(pressure);
    var meanPress = roundToOnePlace((maxPress + minPress) / 2);
    var maxRH = max(rh);
    var minRH = min(rh);
    var dailyPrecip = roundToOnePlace(json[0].dailyrainin * 25.4);
    
    var x = firstEmptyRow(sheet, "B") + 1;
    
    var tempRange = sheet.getRange(x, 2, 1, 3);
    var temps = [[maxTemp, meanTemp, minTemp]];
    tempRange.setValues(temps);
    
    var precipRange = sheet.getRange("J" + x);
    var precipArray = [[dailyPrecip]];
    precipRange.setValues(precipArray);
    
    var sunshineHours = 0;
    for(var i = 0; i < solarRadiation.length; i++) {
        if(solarRadiation[i] >= 120) sunshineHours += 1.0/12;
    }
    
    var everythingElse = sheet.getRange("L" + x + ":Q" + x);
    var allOtherThings = [[roundToOnePlace(sunshineHours), maxPress, meanPress, minPress, maxRH, minRH]];
    everythingElse.setValues(allOtherThings);
}

function recordWaterYearData() {
    var spreadsheet = SpreadsheetApp.getActive();
    var sheet = spreadsheet.getSheetByName("Recorded Water Years");
    sheet.activate();
    
    var json = loadData();
    var x = firstEmptyRow(sheet, "M") + 1;
    var y = firstEmptyColumn(sheet, x) + 1;
    
    var thisMonth = sheet.getRange(numberToLetter(y) + x);
    var monthlyPrecip = [[json[0].monthlyrainin]];
    thisMonth.setValues(monthlyPrecip);
}

function setFormulas() {
    var spreadsheet = SpreadsheetApp.getActive();
    var sheet = spreadsheet.getSheetByName("Raw Data");
    sheet.activate();
    
    var y = firstEmptyRow(sheet, "Z") + 1;
    var month = sheet.getDataRange().getValues()[y][25];
    var monthYear = month.split("/");
    var monthNumber = parseInt(monthYear[0], 10);
    
    var row = 1;
    while(row < firstEmptyRow(sheet, "A")) {
        var s = sheet.getDataRange.getValues()[row][0];
        var mmddyyyy = s.split("-");
        if(mmddyyyy[0] == monthYear[0] && mmddyyyy[2] == monthYear[1]) break;
    }
    
    var monthLength = 31;
    if(monthNumber == 2) {
        if(isLeapYear(parseInt(monthYear[1], 10))) monthLength = 29;
        else monthLength = 28;
    }
    else if(monthNumber == 4 || monthNumber == 6 || monthNumber == 9 || monthNumber == 11) monthLength = 30;
    
    sheet.getRange("Z" + y).setFormula("=round(average(B" + row + ":B" + row + monthLength - 1 + "), 1)");
    sheet.getRange("AA" + y).setFormula("=round(average(D" + row + ":D" + row + monthLength - 1 + "), 1)");
    sheet.getRange("AB" + y).setFormula("=round(average(C" + row + ":C" + row + monthLength - 1 + "), 1)");
    sheet.getRange("AD" + y).setFormula("=ab16-ac16");
    sheet.getRange("AE" + y).setFormula("=max(B" + row + ":B" + row + monthLength - 1 + ")");
    sheet.getRange("AF" + y).setFormula("=min(D" + row + ":D" + row + monthLength - 1 + ")");
    sheet.getRange("AG" + y).setFormula("=round(average(M" + row + ":O" + row + monthLength - 1 + "), 1)");
    sheet.getRange("AH" + y).setFormula("=round(average(P" + row + ":Q" + row + monthLength - 1 + "))");
    sheet.getRange("AI" + y).setFormula("=sum(L" + row + ":L" + row + monthLength - 1 + ")");
    sheet.getRange("AJ" + y).setFormula("=sum(J" + row + ":J" + row + monthLength - 1 + ")");
}

function setYearlyFormulas() {
   if((new Date()).getMonth() == 1) {
      var spreadsheet = SpreadsheetApp.getActive();
      var sheet = spreadsheet.getSheetByName("Raw Data");
      sheet.activate();
      
      var x = firstEmptyRow(sheet, "AM") + 1;
      var year = sheet.getRange("AL" + x).getValue();
      
      var row = 1;
      while(row < firstEmptyRow(sheet, "A")) {
          var s = sheet.getDataRange.getValues()[row][0];
          var mmddyyyy = s.split("-");
          if(mmddyyyy[2] == year) break;
      }
      
      var yearLength = 365;
      if(isLeapYear(parseInt(year, 10))) yearLength = 366;
      
      sheet.getRange("AM" + y).setFormula("=round(average(B" + row + ":B" + row + yearLength - 1 + "), 1)");
      sheet.getRange("AO" + y).setFormula("=round(average(D" + row + ":D" + row + yearLength - 1 + "), 1)");
      sheet.getRange("AN" + y).setFormula("=round(average(C" + row + ":C" + row + yearLength - 1 + "), 1)");
      sheet.getRange("AR" + y).setFormula("=max(B" + row + ":B" + row + yearLength - 1 + ")");
      sheet.getRange("AS" + y).setFormula("=min(D" + row + ":D" + row + yearLength - 1 + ")");
      sheet.getRange("AQ" + y).setFormula("=sum(L" + row + ":L" + row + yearLength - 1 + ")");
      sheet.getRange("AP" + y).setFormula("=sum(J" + row + ":J" + row + yearLength - 1 + ")");
   }
}

function loadData() {
    var response = UrlFetchApp.fetch(
    "https://api.ambientweather.net/v1/devices/84:F3:EB:67:9C:8F?apiKey=ae6adf691961484cad033bf3b9c6d6fcc7fcd509e19145e1a4f2c18d057e4de9&applicationKey=0bdd59132b424e0c832a53c1f6c0960e46eb59f9a7704afd8821f4692b2c9a54", 
    {'muteHttpExceptions': true});
    
    var json = JSON.parse(response.getContentText());
    return json;
}

function numberToLetter(num) {
    return String.fromCharCode(96 + num);
}

function max(array) {
    var max = array[0];
    for(var i = 0; i < array.length; i++) {
        if(max < array[i]) max = array[i];
    }
    
    return max;
}

function min(array) {
    var min = array[0];
    for(var i = 0; i < array.length; i++) {
        if(min > array[i]) min = array[i];
    }
    
    return min;
}

function roundToOnePlace(num) {
    return Math.round(num*10)/10;
}

function firstEmptyRow(sheet, column) {
    var values = sheet.getRange(column + ":" + column).getValues();
    var i = 1;
    while(values[i][0] != "") i++;
    return i;
}

function firstEmptyColumn(sheet, row) {
    var values = sheet.getRange("A" + row + ":N" + row).getValues();
    var i = 1;
    while(values[0][i] != "") i++;
    return i;
}

function isLeapYear(year) {
    return (year % 400 == 0 || year % 100 != 0) && year % 4 == 0;
}
