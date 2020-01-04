const fs = require('fs')
const path = require('path')
const Config = require('../config/config.json')
const loki = require('lokijs');

const TronWeb = require('tronweb');
const tronWeb = new TronWeb({fullHost: Config.fullNode, privateKey: Config.privateKey});
const abi = require('../config/curvy.json')
const curvyAddress = Config.curvyAddress;

let db = new loki('./db/data.db', {
  autoload: true,
  autoloadCallback : databaseInitialize,
  autosave: true,
  autosaveInterval: 4000
});

let purchaseTotal = 0;
let players;
const botStartTime = new Date();
let lastTimer = 0;
let currentTimer = 43200;

//Configs
const TICKET_OWNERSHIP_GLITCH_TARGET = 10000000000;
const REFRESH_INTERVAL = 30000;
const PURCHASE_DISPLAY_INTERVAL = 600000;
const WATCH_TIMER_INTERVAL = 20000;
const DBG_MARCH_INTERVAL = 45000;


// implement the autoloadback referenced in loki constructor
function databaseInitialize() {
  if (!db.getCollection("players")) {

  }
  runProgramLogic();
}

// example method with any bootstrap logic to run after database initialized
function runProgramLogic() {
  var entryCount = db.getCollection("players").count();
  players = db.getCollection("players");
  console.log("number of players in database : " + entryCount);
}

//event collection
//proper bot would likely catalog all events and identify patterns and
//accounts which are profitable
//const eventCollection = db.collection("eventCollection");

async function purchaseDisplay() {
  console.log(timestamp() + ' WITNESSED_TRX_PURCHASE_VALUE ' + purchaseTotal)
}
setInterval(purchaseDisplay, PURCHASE_DISPLAY_INTERVAL);


/* ### REFRESH TIMERS */
async function watchTimer() {

  try {
    const contract = await tronWeb.contract().at(curvyAddress)
    const trx = await contract.currentRoundData().call();
    const now = new Date();
    const secondsSinceEpoch = Math.round(now.getTime() / 1000);
    const timerEnds = trx.endsAt.toNumber();
    let offset = timerEnds - secondsSinceEpoch;
    /* bail on these timer offset results */
    if(timerEnds === 43200 || timerEnds === 0) {return;}

    lastTimer = await currentTimer;
    currentTimer = await offset;
//    console.log(secondsSinceEpoch + ' WATCH_TIMER ' + offset)
//    console.log(secondsSinceEpoch + ' LAST_TIMER ' + lastTimer)
//    console.log(secondsSinceEpoch + ' CURRENT_TIMER ' + currentTimer)

    if(glitchCount !== trx.bombFuseCounter.toNumber()) {
      glitchCount = trx.bombFuseCounter.toNumber();
      console.log(secondsSinceEpoch + ' GLITCH_OCCURED ' + currentTimer)
      actOnGlitch();
    }

    const myPosition = await contract.positionOf(Config.myAddress,1).call();
    console.log(secondsSinceEpoch + ' ACCOUNT_LIST_POSITION ' + myPosition.toNumber())

    /* under 30 seconds & not on list, bid */
    if(+myPosition.toNumber() > 100 && offset < 30) {
      console.log('we gonna bid here son')
      const sendTicketBuy = await contract.buyTickets('0x414e4452455759414e4700000000000000000000000000000000000000000000').send({
        callValue: 25000000,
        from: Config.myAddress
        });
       const exitmsg = `kill signal - board list buy - ${sendTicketBuy}`
       setTimeout(exitBot, 1000, exitmsg);
    }



    if(currentTimer > lastTimer) {
    //  console.log(secondsSinceEpoch + ' TIMER_INCREASED ' + currentTimer)
    }

    /* timer went down */
    if(currentTimer < lastTimer) {
  //    console.log(secondsSinceEpoch + ' TIMER_DECREASED ' + currentTimer)

      /* last timer above glitch threshhold */
      if(lastTimer > 39600) {
  //      console.log(secondsSinceEpoch + ' PREVIOUS_TIMER_ABOVE_GLITCH ' + lastTimer)

        /* currentTimer below glitch threshhold */
      }
    }


  }
  catch(e) {
  //  console.log(e)
  }

}
setInterval(watchTimer, WATCH_TIMER_INTERVAL);


let glitchCount;

async function initTimer() {

  try {
    const contract = await tronWeb.contract().at(curvyAddress)
    const trx = await contract.currentRoundData().call();

    glitchCount = trx.bombFuseCounter.toNumber();
  }
  catch(e) {
  //  console.log(e)
  }
}
initTimer()


/* txMarch() which finds players the bot has missed
 * checks contract, position, or txs
 * to find new addresses, it should run every X seconds
 * careful with the timer on this
 * this can flood trongrid and make bot useless, you really need a private
 * node for this, wont add code to avoid confusion/problems
 */
 let DBGCNT = Config.DBG;
 async function txMarch() {

   const contract = await tronWeb.contract().at(curvyAddress)
   const searchAddress = await contract.DBG(Config.DBG,1).call();
   DBGCNT++;
   Config.DBG = DBGCNT;


   let player = players.find({_id:searchAddress})

   if(player.length === 0) {
     addToPlayerCollection(searchAddress)
   }

   if(player.length > 0) {
     /* player exists*/
   }

   let configUpdateStream = fs.createWriteStream("./config/config.json", {flags:'w'});
   configUpdateStream.write(JSON.stringify(Config));
   configUpdateStream.end()
 }

 setInterval(txMarch, DBG_MARCH_INTERVAL);

 /* searchPlayerCollectionForProfitableTargets()
  * timer which arbitrates data in database, searches/finds +ev upgradeTicket options
  * it should run every 60 seconds
  */

 async function searchPlayerCollectionForProfitableTargets() {
   const breakeven = .01
   let total = 0.0;
   let result = players.find({ minedValueUSD: { $gt: breakeven }, automaticallyUpgrade: {$eq: true}  })
   if(result.length > 0) {
    //  console.log('# Searched local database for profitable targets...')
    //  console.log('#########################################################')
    //  console.log('# Account                                    Redeem_Value')
      //total = total + item.minedValueUSD.toFixed(4);
     //console.log(result)
      result.forEach(item => {
    //      console.log('# ' + item.address + ' $' + item.minedValueUSD.toFixed(3))
          total = total + +item.minedValueUSD.toFixed(4);
      });

    //   console.log('#########################################################')
   }
    console.log(timestamp() + ' STALKED_VALUE_10 ' + total.toFixed(3))
 }
//debug setTimeout(searchPlayerCollectionForProfitableTargets,5000)
 setInterval(searchPlayerCollectionForProfitableTargets, 60000);

/* refreshPlayers() timer updates players status
 * get player from playerCollection based on lastCheck
 * run every 60 seconds
 * running a local Tron node would allow you to be more aggressive with
 * player refresh data
 */

async function refreshPlayers() {

  /* 30 mins */
  const timeOffset = timestamp() - 1800
  /* 2 hrs */
  //const timeOffset = timestamp() - 7600

  let playerDepth = players.chain().find({ lastCheck: { $lt: timeOffset } }).limit(5).data()


  if(playerDepth.length > 0) {
    let playerDepthTotal = players.find({ lastCheck: { $lt: timeOffset } })
    console.log(timestamp() + ' REFRESH_PLAYER_DEPTH ' + playerDepthTotal.length)
    playerDepth.forEach(async item => {
        let updateplayer = await updatePlayerData(item)
  //      console.log(secondsSinceEpoch + ' REFRESH_PLAYER ' + item._id)
    });
      //console.log(secondsSinceEpoch + ' REFRESH_PLAYER ' + playerDepth[0]._id)
  }

}
/* run refresh once a minute  */
setInterval(refreshPlayers, REFRESH_INTERVAL);


/* updatePlayerData(item) updates player based on existing data
 * this is a fairly heavy handed function, takes incoming player
 * gets address from item, calls Just.GAme methods on Tron
 * updates localdb with new data
 */

async function updatePlayerData(item) {

  const address = item.address;

  const contract = await tronWeb.contract().at(curvyAddress)
  const metaData = await contract.playerMetadataOf(address).call();
  await sleep(300)
  const playersData = await contract.Players(address).call();
  await sleep(300)
  const dividendsOf = await contract.dividendsOf(1,address,false).call();
  await sleep(300)

  const estimatedTotal = playersData.squadEarnings.toNumber() + playersData.dividendEarnings.toNumber() + playersData.winnerEarnings.toNumber() + dividendsOf.toNumber()

  const value = estimatedTotal * .000001;
  const valueIfMined= value * .01;
  const minedValueUSD = valueIfMined * .013;
  const accountValueUSD = value * .013;


  item['automaticallyUpgrade'] = `${playersData.automaticallyUpgrade}`
  item['estimatedTotal'] = `${estimatedTotal}`
  item['minedValueUSD'] = `${minedValueUSD}`
  item['dividendsOf'] = `${dividendsOf.toNumber()}`
  item['dividendEarnings'] = `${playersData.dividendEarnings.toNumber()}`
  item['lastInteraction'] = `${playersData.lastInteraction.toNumber()}`
  item['winnerEarnings'] = `${playersData.winnerEarnings.toNumber()}`
  item['squadEarnings'] = `${playersData.squadEarnings.toNumber()}`
  item['virtualDividends'] = `${metaData.virtualDividends.toNumber()}`
  item['virtualWinnings'] = `${metaData.virtualWinnings.toNumber()}`
  item['virtualLeaderBonus'] = `${metaData.virtualLeaderBonus.toNumber()}`
  item['ticketsOwned'] = `${metaData.ticketsOwned.toNumber()}`
  item['myPosition'] = `${metaData.myPosition.toNumber()}`
  item['backing'] = `$${metaData.backing.toNumber()}`
  item['lastCheck'] = timestamp()


  if(item['minedValueUSD'] > 1 && item['automaticallyUpgrade'] === true) {
    upgradeTickets(address,'UPDATED')
  }

  try {
    let result = await players.update(item)
    return item
  }
  catch(e) {
  //  console.log(item)
  //  console.log(e)
  }
}


/* sleep(ms) to make trongrid hate us less
 * whatevs
 */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ### ACTIONS AND LOGIC */

/*
 * The most straight forward way to mine will be to stalk/monitor players with
 * high dividend balances. Track the user, then if they send an event to toggle
 * upgrade to true. Immediately upgrade ticket purchase.
 *
 * The other method would be to track balances of users. If users have a high
 * number of tickets owned. Players can infer from purchases which accounts will
 * be profitable to upgrade.
 */
async function upgradeTickets(address, reason) {

  console.log(timestamp() + ' BID_UPGRADE_TICKET_PLAYER_' + reason + ' ' + address)
  if(Config.shouldUpgradeTickets) {
    try {
      const contract = await tronWeb.contract().at(curvyAddress)
      const upgradeTickets = await contract.upgradeTickets(address).send({from: Config.myAddress });
    }
    catch(e) {
      console.log('ERROR UPGRADING TICKETS - WTF')
    //  console.log(e)
    }

  }
  let item = `{address: address}`
  updatePlayerData(item)
}

/* exit(1) will not force a restart on nodemon */
async function exitBot(msg) {
  console.log('exit now ' + msg)
  process.exit(1)
}

async function actOnGlitch() {
  console.log('todo fix act on glitch')
  let result = players.find({ ticketsOwned: { $gt: TICKET_OWNERSHIP_GLITCH_TARGET }, automaticallyUpgrade: {$eq: true} })
  if(result.length > 0) {

    result.forEach(item => {
        upgradeTickets(address,'GLITCH')
    });

     setTimeout(exitBot, 60000, 'kill signal - glitch');
  }

}


async function actOnPlayerUpgrade(address,toggleResult,player) {

  if(player === null) {
    addToPlayerCollection(address)
  }
  else {
    if(toggleResult) {
      console.log(timestamp() + ' TOGGLE_TRUE_LOGIC ' + address)
      if(player.minedValueUSD > 1) {
        upgradeTickets(address,'UPGRADE1')
        updatePlayerData(player)
      }
    }
    if(!toggleResult) {
      updatePlayerData(player)
      console.log(timestamp() + ' TOGGLE_FALSE_LOGIC ' + address)
      console.log("toggle is now false")
    }
  }
}



async function actOnPlayerPurchase(address,player) {
  if(player === null) {
    addToPlayerCollection(address)
  }
  else {
    console.log(timestamp() + ' PURCHASE_EVENT_LOGIC ' + address)
  }
}

async function actOnSquadEvent(address, player) {
  if(player === null) {
    addToPlayerCollection(address)
  }
  else {
    console.log(timestamp() + ' SQUAD_EVENT_LOGIC ' + address)
  }
}

async function actOnTicketRedeemEvent(address, player) {
  if(player === null) {
    addToPlayerCollection(address)
  }
  else {
    console.log(timestamp() + ' REDEEM_EVENT_LOGIC ' + address)
  }
}

async function actOnRewardsWithdrawnEvent(address, player) {
  if(player === null) {
    addToPlayerCollection(address)
  }
  else {
    console.log(timestamp() + ' WITHDRAW_EVENT_LOGIC ' + address)
  }
}

/* generatePlayerData(address) creates player based on address
 * this is a fairly heavy handed function, takes incoming player address
 * calls Just.GAme methods on Tron, then returns player
 */

async function generatePlayerData(address) {
  const now = new Date();
  const secondsSinceEpoch = Math.round(now.getTime() / 1000);

  const contract = await tronWeb.contract().at(curvyAddress)
  const metaData = await contract.playerMetadataOf(address).call();
  const playersData = await contract.Players(address).call();
  const dividendsOf = await contract.dividendsOf(1,address,false).call();

  const estimatedTotal = playersData.squadEarnings.toNumber() + playersData.dividendEarnings.toNumber() + playersData.winnerEarnings.toNumber() + dividendsOf.toNumber()
  const value = estimatedTotal * .000001;
  const valueIfMined= value * .01;
  const minedValueUSD = valueIfMined * .014;
  const accountValueUSD = value * .014;


  const playerData = `
{ "position": 0,
"_id": "${address}",
"address": "${address}",
"automaticallyUpgrade": ${playersData.automaticallyUpgrade},
"estimatedTotal": ${estimatedTotal},
"minedValueUSD": ${minedValueUSD},
"dividendsOf": ${dividendsOf.toNumber()},
"dividendEarnings": ${playersData.dividendEarnings.toNumber()},
"lastInteraction": ${playersData.lastInteraction.toNumber()},
"winnerEarnings": ${playersData.winnerEarnings.toNumber()},
"squadEarnings": ${playersData.squadEarnings.toNumber()},
"virtualDividends": ${metaData.virtualDividends.toNumber()},
"virtualWinnings": ${metaData.virtualWinnings.toNumber()},
"virtualLeaderBonus": ${metaData.virtualLeaderBonus.toNumber()},
"ticketsOwned": ${metaData.ticketsOwned.toNumber()},
"myPosition": ${metaData.myPosition.toNumber()},
"backing": ${metaData.backing.toNumber()},
"lastCheck": ${secondsSinceEpoch}
}`

return playerData;

}

/* addToPlayerCollection(address)
 * adds new address/player to local db
 */

async function addToPlayerCollection(address) {

  console.log(timestamp() + ' ADD_PLAYER ' + address)
  const playerData = await generatePlayerData(address);
  const player = JSON.parse(playerData)

  if(player.minedValueUSD > 5 && player.automaticallyUpgrade === true) {

    upgradeTickets(address,'PLAYERADDED')
  }
  players.insert(JSON.parse(playerData))
}

/* ### Event Monitor */

function timestamp() {
  const now = new Date();
  const secondsSinceEpoch = Math.round(now.getTime() / 1000);
  return secondsSinceEpoch
}


/* monitorCurvy()
 * installs trx event monitors for Just.Game contract
 */

async function monitorCurvy() {

  console.log('#########################################################')
  console.log('# Beginning Just.Game monitors')
  console.log('#########################################################')

  const contract = await tronWeb.contract().at(curvyAddress)

  let watchToggle = await contract.autoUpgradeToggled().watch({filters: {}}, (err, res) => {
    /* ignore error spam */
    //if(err) {console.log(err)}
    if(res) {
      const searchAddress = res.result.account;
      const toggleResult = res.result.enabled;
      let result = players.findOne({ "_id": searchAddress });
      actOnPlayerUpgrade(searchAddress, toggleResult, result)
    }
  })

  let watchPurchase = await contract.ticketPurchase().watch({filters: {}}, (err, res) => {
    /* ignore error spam */
    //if(err) {console.log(err)}
    if(res) {
      const searchAddress = res.result.account
      const fundsSpend = +res.result.fundsSpent
      purchaseTotal = purchaseTotal + fundsSpend;
      let result = players.findOne({ "_id": searchAddress });
      actOnPlayerPurchase(searchAddress,result)
    }

  })

  let watchSquad = await contract.gainedSquadMember().watch({filters: {}}, (err, res) => {
    /* ignore error spam */
    //if(err) {console.log(err)}
    if(res) {
      const searchAddress = res.result.account
      let result = players.findOne({ "_id": searchAddress });
      actOnSquadEvent(searchAddress,result)
    }
  })

  let ticketRedeem = await contract.ticketRedeem().watch({filters: {}}, (err, res) => {
    /* ignore error spam */
    //if(err) {console.log(err)}
    if(res) {
      const searchAddress = res.result.account
      let result = players.findOne({ "_id": searchAddress });
      actOnTicketRedeemEvent(searchAddress, result)
    }

  })

  let rewardsWithdrawn = await contract.rewardsWithdrawn().watch({filters: {}}, (err, res) => {
    /* ignore error spam */
    //if(err) {console.log(err)}
    if(res) {
      const searchAddress = res.result.account
      let result = players.findOne({ "_id": searchAddress });
      actOnRewardsWithdrawnEvent(searchAddress, result)
    }

  })

}

setTimeout(monitorCurvy, 10000)
