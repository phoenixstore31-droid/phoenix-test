window.copyPayment = async function(button){

const card = button.closest(".payment-card");

const bank =
card.querySelector(".bank").innerText.trim();

const rows =
card.querySelectorAll(".row");

let text = bank + "\n\n";

rows.forEach(row=>{

const title =
row.querySelector("span").innerText.trim();

const value =
row.querySelector("b").innerText.trim();

text += title + "\n";
text += value + "\n\n";

});

try{

await navigator.clipboard.writeText(text);

const old =
button.innerHTML;

button.innerHTML = "✅";

button.classList.add("copied");

setTimeout(()=>{

button.innerHTML = old;

button.classList.remove("copied");

},1500);

}catch(err){

alert("Copy Failed");

}

}