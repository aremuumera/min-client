const sc = require("states-cities-db");

const countries = sc.getCountries();
console.log("Total countries:", countries.length);
console.log("First country:", countries[0]);

const foundNG = countries.find(({ iso }) => iso === "NG");
const foundNGA = countries.find(({ iso }) => iso === "NGA");

console.log("NG found:", foundNG);
console.log("NGA found:", foundNGA);
