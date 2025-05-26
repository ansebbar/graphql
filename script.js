const urlAutotification = "https://learn.zone01oujda.ma/api/auth/signin";
const urlGraph = "https://learn.zone01oujda.ma//api/graphql-engine/v1/graphql";

let talentToken = null;
let infoUser;
let allTransactInfo;
let all2;
const credentials = {
    username: '',
    password: ''
};



function setupTabs() {
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('href');
            document.querySelector(tabId).classList.add('active');
        });
    });
    
    document.getElementById('logoutButton').addEventListener('click', () => {
        talentToken = null;
        localStorage.removeItem('talentToken');
        
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
        
        document.getElementById("username").value = '';
        document.getElementById("password").value = '';
    });
}

document.addEventListener("DOMContentLoaded", function() {
  const storedToken = localStorage.getItem('talentToken');
  
  if (storedToken) {
    document.body.classList.add('logged-in');
    talentToken = JSON.parse(storedToken);
    fetchUserData();
  } else {
    document.body.classList.remove('logged-in');
    setupLoginForm();
  }
  
  setupTabs();
});

function setupLoginForm() {
  document.getElementById("submitButton").addEventListener("click", function() {
    const passwordDIV = document.getElementById("password");
    const usernameDIV = document.getElementById("username");
    credentials.password = passwordDIV.value;
    credentials.username = usernameDIV.value;
    fetchTalentToken();
  });
}
function fetchTalentToken(){
    let login = async function () {
        const headers = new Headers();
        headers.append('Authorization', 'Basic ' + btoa(credentials.username + ':' + credentials.password));
        try {
          const response = await fetch(urlAutotification, {
            method: 'POST',
            headers: headers
          });
          const token = await response.json();
          if (response.ok) {
            talentToken = token;
            localStorage.setItem('talentToken', JSON.stringify(token));
            fetchUserData();
          } else {
            afficherError()
          }
        } catch (error) {
          console.error('Error:', error);
        }
    };
    login();
}

let timeout;
function afficherError(){
    clearTimeout(timeout);
    const error = document.getElementById("errorMessage");
    error.textContent="Error bad password or username"
    timeout = setTimeout(()=>{
        error.textContent=""
    },2000);
}

async function fetchUserData() {

    fetch(urlGraph, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${talentToken}`
        },
        body: JSON.stringify({
            query: `
        query {
            user {
                id
                login
                attrs
                totalUp
                totalDown
                transactions ( where: {eventId: {_eq: 41}}, order_by: {createdAt:asc}){
                amount
                eventId
                type
                createdAt
                }
            }
            transaction(
                where: {type: {_like: "skill_%"}},
                    order_by: [{type: asc}, { amount: desc }],
                    distinct_on: [type]
                ) {
                    amount
                    type
                    createdAt
                }
        }`
        })
    })
    .then(response => response.json())
    .then(data => {
        infoUser = data.data.user[0];
        // allTransactInfo = data.data.transaction;
        all2 = data.data.transaction;
        console.log("data fetched from api" ,all2, infoUser.transactions)
        createProfilPageUser();
    })
    .catch(error => {
        console.error('error something bad happened whithin fetching data:', error);
    });
}

async function createProfilPageUser() {
    if (infoUser) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        await welcomeMessage();
        
        setupTabs();
        
        TalentPersonalInfos(document.getElementById('profile'));
        xpsvg(document.getElementById('xp-graph'));
        // generateGraphBar(document.getElementById('audit-graph')); 
        createRatioRectangles(infoUser.totalUp,infoUser.totalDown,document.getElementById('audit-graph'));
        skillsvg(all2, document.getElementById('skills'));
    }
}
async function welcomeMessage() {
    const TalantName = infoUser.attrs.firstName;
    const welcomeMessage = document.getElementById("titrePage");
    welcomeMessage.textContent = `Hellow ${TalantName}`
}

function TalentPersonalInfos(container) {
    container.innerHTML = "";
    
    const ligne1 = document.createElement("div");
    ligne1.className = "infoUser";

    const list = document.createElement("ul");
    list.className = "infoUser";

    const ilist = document.createElement("h3");
    ilist.className = "infoUser";
    ilist.textContent = "Talent Information";

    if (infoUser.login) {
        const alist = document.createElement("li");
        alist.className = "infoUser";
        alist.textContent = `Username: ${infoUser.login}`;
        list.appendChild(alist);
    }
        
    if (infoUser.attrs.tel) {
        const blist = document.createElement("li");
        blist.className = "infoUser";
        blist.textContent = `Phone number: ${infoUser.attrs.tel}`;
        list.appendChild(blist);
    }

    if (infoUser.attrs.email) {
        const clist = document.createElement("li");
        clist.className = "infoUser";
        clist.textContent = `Mail: ${infoUser.attrs.email}`;
        list.appendChild(clist);
    }   
    
    if (infoUser.attrs.gender) {
        const dlist = document.createElement("li");
        dlist.className = "infoUser";
        dlist.textContent = `Gender: ${infoUser.attrs.gender}`;
        list.appendChild(dlist);    
    }
    
    if (infoUser.attrs.lastName && infoUser.attrs.firstName) {
        const elist = document.createElement("li");
        elist.className = "infoUser";
        elist.textContent = `FullName: ${infoUser.attrs.firstName} ${infoUser.attrs.lastName}`;
        list.appendChild(elist);
    }

    if (infoUser.attrs.attentes) {
        const flist = document.createElement("li");
        flist.className = "infoUser";
        flist.textContent = `Oh c'est mignon comme motivation: "${infoUser.attrs.attentes}"`;
        list.appendChild(flist);
    }

    const jlist = document.createElement("li");
    jlist.className = "infoUser";
    jlist.textContent = `Level: ${talentLevel()}`;
    list.appendChild(jlist);

    container.appendChild(ilist);
    container.appendChild(list);
}

function talentLevel(){

    let level;

    for (let i = 0; i < infoUser.transactions.length-1; i++){
        if (infoUser.transactions[i].type === "level"){
            level = infoUser.transactions[i].amount
            // console.log(level, "level")
        }
    }

    return level
}


function getxparrays(){
    // console.log(infoUser.transactions, "transactions")
    let obj = {}
    let array = [];
    let array2 = [];
    for(let i = 0; i < infoUser.transactions.length-1; i++){
        if (infoUser.transactions[i].type ==="xp"){
            array.push(Number(infoUser.transactions[i].amount));  //array.push(Number(infoUser.transactions[i].amount)/1000)
            array2.push(infoUser.transactions[i].createdAt);
        }
    }
    obj.xp = array;
    obj.crat = array2;
    return obj
}

function getDayDifference(date1, date2) {
    const time1 = new Date(date1).getTime();
    const time2 = new Date(date2).getTime();
    
    const diffInMs = Math.abs(time2 - time1);
    
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  }

function xpsvg(container) {
    container.innerHTML = "";
    
    const xpAlltransact = document.createElement("div");
    xpAlltransact.className = "graphDiv";

    const XPprogression = document.createElement("h1");
    XPprogression.className = "infoUser";
    XPprogression.textContent = "XP Progression";
    const xpdate = getxparrays();
    const maxAmount = Math.max(...xpdate.xp);
    const minAmount = Math.min(...xpdate.xp);
    let sommeOfAllValues = xpdate.xp.reduce((acc, curr) => acc + curr, 0);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("viewBox","0 0 840 420")
    svg.setAttribute("height", "420");
    
    svg.style.boxShadow = "3px 2px 4px 3px steelblue";
    const lol = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    lol.setAttribute("points","8,35 12,30 16,35 8,35 12,30 12,400 800,400 795,396 795,404 800,400");
    lol.setAttribute("stroke","green");
    lol.setAttribute("stroke-width","3");
    lol.setAttribute("fill", "none");

    const dstart = new Date(xpdate.crat[0]).toISOString().split('T')[0];
    const dend = new Date().toISOString().split('T')[0];

    const dtstart = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const dtend = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const start = document.createElementNS("http://www.w3.org/2000/svg", "text");
    start.setAttribute("x","1");
    dtstart.setAttribute("x","8");
    dtend.setAttribute("x","790");
    start.setAttribute("y","400");
    dtstart.setAttribute("y","410");
    dtend.setAttribute("y","410");
    start.setAttribute("fill", "white");
    dtstart.setAttribute("fill", "white");
    dtend.setAttribute("fill","white");
    dtstart.textContent = dstart;
    dtstart.setAttribute("font-size","10px");
    dtend.setAttribute("font-size","10px");
    dtend.textContent = dend;
    start.textContent = "0";
    start.setAttribute("font-size","10px");
    svg.appendChild(start);
    svg.appendChild(dtstart);
    svg.appendChild(dtend);

    const sum = xpdate.xp.reduce((acc, curr) => acc + curr, 0);
    const average = sum / xpdate.xp.length;
    const roundedAverage = Math.round(average);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", 600);
    // text.setAttribute("y", 95); 
    text.setAttribute("fill", "white");
    text.textContent = `Total XP : ${sommeOfAllValues/1000}kb`;

    const text2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text2.setAttribute("x", 70); 
    text2.setAttribute("y", 40); 
    text2.setAttribute("fill", "white"); 
    text2.textContent = `Transactions: ${xpdate.xp.length} , Low Transaction: ${minAmount/1000}KB , Big Transaction ---> ${maxAmount/1000}Kb , Transaction average: ${roundedAverage/1000}KB`;
    svg.appendChild(text);

    svg.appendChild(text2);

    const diff = getDayDifference(dstart,dend);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    let amountValue = 0;
    let x = 0;
    let len = xpdate.xp.length;

    const points = xpdate.xp.map((value, index) => {

        amountValue = amountValue + value;
        if (index > 0){
        x += 800 /diff * getDayDifference(new Date(xpdate.crat[index - 1]).toISOString().split('T')[0],new Date(xpdate.crat[index]).toISOString().split('T')[0]);
        }else {
            x = 12;
        }  
        const y = 400 - (amountValue / sommeOfAllValues) * 250;
        if (index == 0) {
            return `${12},${400} ${x},${y}`;
        }else if (index == xpdate.xp.length - 1){
            text.setAttribute("y", y - 10);
            return `${x},${400 - ((amountValue - value) / sommeOfAllValues) * 250} ${x},${y} ${x + 800/diff * getDayDifference(new Date(xpdate.crat[index]).toISOString().split('T')[0],dend)},${y}`;
        } 
        return `${x},${400 - ((amountValue - value) / sommeOfAllValues) * 250} ${x},${y}`;
    }).join(" ");

    line.setAttribute("points", points);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "blue"); 
    line.setAttribute("stroke-width", 2); 

    svg.appendChild(line);
    svg.appendChild(lol);
    xpAlltransact.appendChild(XPprogression);
    xpAlltransact.appendChild(svg);
    container.appendChild(xpAlltransact);
}

function createRatioRectangles(positive, negative,container) {
    let per;
    let done = false;
    if (positive > negative) {
        per = negative /positive; 
        done = true;
    }else if (positive == negative){
        per = 1;
    }else {
        per = positive / negative;
    }
    
    container.innerHTML = `
    <svg width="100%" height="500" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
    <text x="150" y="20" text-anchor="middle" 
            font-family="Arial" font-size="16" 
            font-weight="bold" fill="white">Audits Ratio</text>
    <text x="90" y="45" text-anchor="middle" 
            font-family="Arial" font-size="12" fill="white">done ${Math.round((positive / 1000000)*100) / 100}Mb</text>
      <rect x="20" y="50" 
            width="${done != true ? 200 * per : 200 }" height="20" 
            fill="${done == true ? "#4caf50":"#f44336"}" rx="4"/>
      <!-- Negative Ratio -->
    <text x="90" y="95" text-anchor="middle" 
            font-family="Arial" font-size="12" fill="white">received ${Math.round((negative/1000000) * 100) / 100}Mb</text>
      <rect x="20" y="100" 
            width="${done == true ? 200 * per : 200 }" height="20" 
            fill="${done != true ? "#4caf50":"#f44336"}" rx="4"/>
    </svg>
    `;
  }


function skillsvg(data, container) {
    container.innerHTML = "";
    
    const skillInfo = document.createElement("div");
    skillInfo.className = "graphDiv";
    skillInfo.textContent = `Your skills : `;
    container.appendChild(skillInfo);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("viewBox" , "0 0 800 400");
    svg.setAttribute("height", "400");

    const width = 800;
    const height = parseInt(svg.getAttribute("height"));
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    console.log(centerX,centerY,radius,width);

    data.forEach((value, index) => {
        const angle = (Math.PI * 2 * index) / data.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", centerX);
        line.setAttribute("y1", centerY);
        line.setAttribute("x2", x);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "rgba(255, 255, 255, 0.5)");
        line.setAttribute("stroke-width", 2);
        line.setAttribute("opacity","0.5");
        svg.appendChild(line);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        if (x < centerX)
            label.setAttribute("x", x - 50);
        else
            label.setAttribute("x", x + 50);
        label.setAttribute("y", y);
        label.setAttribute("fill", "white");
        label.setAttribute("font-size", "14px");
        label.setAttribute("text-anchor", "middle"); 
        label.setAttribute("alignment-baseline", "middle"); 
        label.textContent = `${data[index].type} : ${data[index].amount}`; 
        // console.log(data[index].type)
        svg.appendChild(label);
    });

    const polyPoints = data.map((value, index) => {
        const angle = (Math.PI * 2 * index) / data.length;
        const x = centerX + (radius * value.amount) / 100 * Math.cos(angle);
        const y = centerY + (radius * value.amount) / 100 * Math.sin(angle);
        return `${x},${y}`;
    });
    
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", polyPoints.join(" "));
    polygon.setAttribute("fill", "rgba(255, 0, 0, 0.5)");
    svg.appendChild(polygon);

    container.appendChild(svg);
}
