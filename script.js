const SHEET_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv";
let data=[];
fetch(SHEET_URL).then(r=>r.text()).then(t=>console.log('tsv loaded'));
